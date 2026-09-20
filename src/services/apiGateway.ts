/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * @deprecated Phase 1 Migration:
 * This in-browser API Gateway simulation is DEPRECATED.
 * All domain operations (pricing, orders, lifecycle, loyalty) have been relocated
 * to the authoritative Fastify backend (`apps/api`) to resolve architectural findings:
 * - V1: Backend logic in browser -> relocated to apps/api
 * - V2: Client-side RBAC -> server-side Firebase Admin token verification
 * - V5: Client-side pricing -> database catalog lookup in apps/api/src/routes/orders.ts
 * - V6: Ephemeral in-memory store -> PostgreSQL via Prisma
 * 
 * Use `src/services/apiClient.ts` for all server communication.
 *
 * SECURITY: nothing in this file is a security control. It runs in the user's
 * browser, so any check here can be edited or bypassed by the person using the
 * app. It exists only to keep local demos and offline UI development working.
 * Authorization decisions belong to `apps/api` and the Firestore rules.
 */

import {
  Order,
  OrderStatus,
  CartItem,
  DeliveryAddress,
  Store,
  AvailableDeliveryPoolOrder,
  DomainEventType,
  AuthoritativePriceBreakdown,
} from '../types';
import { orderApplicationService, CreateOrderParams } from './orderApplicationService';
import { calculateAuthoritativePrice } from '../domain/pricingEngine';
import { adminService } from './adminService';
import { outboxEventBus } from '../events/outboxEventBus';
import { PaymentServiceRegistry, PaymentTransactionResult } from '../adapters/paymentProvider';
import { ActorRole } from '../domain/orderLifecycle';
import { syncOrderToFirestore } from '../firebase/firebaseServices';

export interface UserSession {
  userId: string;
  name: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'COURIER' | 'ADMIN';
  token: string;
  storeId?: string; // For merchants
}

export interface QuoteCartRequest {
  items: CartItem[];
  storeId: string;
  deliveryAddress: DeliveryAddress;
  voucherCode?: string;
  redeemedFidelityPoints?: number;
}

export interface CheckoutSubmissionRequest {
  items: CartItem[];
  storeId: string;
  storeName: string;
  storeCategory?: string;
  storeImageUrl?: string;
  deliveryAddress: DeliveryAddress;
  deliveryNotes?: string;
  cutleryOption?: boolean;
  voucherCode?: string;
  paymentMethod: 'COD' | 'CIB_EDAHABIA';
  idempotencyKey?: string;
}

export interface CheckoutSubmissionResponse {
  success: boolean;
  order?: Order;
  paymentTransaction?: PaymentTransactionResult;
  error?: string;
}

export interface DeliveryJobOffer {
  offerId: string;
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  restaurantAddress: string;
  customerName: string;
  destinationAddress: string;
  distanceKm: number;
  totalAmountDZD: number;
  courierFeeDZD: number;
  itemCount: number;
  estimatedPreparationMin: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: number;
}

/**
 * In-memory server-side active state caches (mirrors database records in PostgreSQL)
 */
class ApiGateway {
  private activeOrders: Map<string, Order> = new Map();
  private deliveryOffers: Map<string, DeliveryJobOffer> = new Map();
  private courierListeners: Set<(offers: DeliveryJobOffer[]) => void> = new Set();
  private orderListeners: Map<string, Set<(order: Order) => void>> = new Map();

  constructor() {
    this.bootstrapSubscribers();
  }

  /**
   * Initializes internal bus subscribers connecting order events to dispatch & notifications
   */
  private bootstrapSubscribers(): void {
    // Listen to all order status updates to fan out to realtime listeners (H5)
    outboxEventBus.subscribe('*', (event) => {
      if (event.aggregateType === 'ORDER' && event.payload?.orderId) {
        const orderId = event.payload.orderId;
        const listeners = this.orderListeners.get(orderId);
        const order = this.activeOrders.get(orderId);
        if (listeners && order) {
          listeners.forEach((listener) => listener(order));
        }
      }
    });

    // H4: When order is ready or placed, dispatch automatically generates a job offer for couriers
    outboxEventBus.subscribe('order.placed', (event) => {
      const payload = event.payload;
      if (payload?.orderId) {
        this.generateDispatchOffer(payload.orderId);
      }
    });
  }

  /**
   * UI affordance check for the local simulation only.
   *
   * This is NOT authorization: the caller supplies its own role, so it answers
   * "which controls should this demo screen show?", never "is this allowed?".
   * Real enforcement happens server-side in apps/api against a verified token.
   */
  public authorize(session: UserSession, requiredRoles: ('CUSTOMER' | 'MERCHANT' | 'COURIER' | 'ADMIN')[]): boolean {
    if (!session) return false;
    return requiredRoles.includes(session.role);
  }

  /* =========================================================================
   * 1. PRICING & QUOTATION SERVICE (C5: Server-Authoritative)
   * ========================================================================= */

  public quoteCartPrice(request: QuoteCartRequest): AuthoritativePriceBreakdown {
    const isPeripheral =
      request.deliveryAddress.commune?.toLowerCase().includes('senoussi') ||
      request.deliveryAddress.commune?.toLowerCase().includes('oued endja');
    const distanceMeters = isPeripheral ? 2600 : 1450;

    return calculateAuthoritativePrice({
      items: request.items.map((i) => ({ menuItemId: i.menuItemId, price: i.basePrice, quantity: i.quantity })),
      storeId: request.storeId,
      distanceMeters,
      voucherCode: request.voucherCode,
      redeemedFidelityPoints: request.redeemedFidelityPoints,
    });
  }

  /* =========================================================================
   * 2. CHECKOUT & PAYMENT ORCHESTRATION (C4 & C5: Server-Side Execution)
   * ========================================================================= */

  public async submitCheckout(
    session: UserSession,
    request: CheckoutSubmissionRequest
  ): Promise<CheckoutSubmissionResponse> {
    // 1. RBAC Check
    if (!this.authorize(session, ['CUSTOMER', 'ADMIN'])) {
      return { success: false, error: 'Accès refusé : rôle client ou administrateur requis.' };
    }

    // 2. Platform Maintenance check
    if (adminService.getSettings().maintenanceMode) {
      return { success: false, error: 'Service momentanément indisponible : maintenance active.' };
    }

    // 3. Authoritative Pricing Verification
    const pricing = this.quoteCartPrice({
      items: request.items,
      storeId: request.storeId,
      deliveryAddress: request.deliveryAddress,
      voucherCode: request.voucherCode,
    });

    // 4. Server Payment Orchestration (C4)
    const paymentProvider = PaymentServiceRegistry.getProvider();
    const paymentIntent = await paymentProvider.initiatePayment(
      `ord-intent-${Date.now()}`,
      pricing.finalCustomerTotalDZD
    );

    // 5. Authoritative Order Creation via OrderApplicationService
    const createResult = orderApplicationService.createOrder({
      idempotencyKey: request.idempotencyKey,
      storeId: request.storeId,
      storeName: request.storeName,
      storeCategory: request.storeCategory || 'Livraison Express',
      storeImageUrl: request.storeImageUrl || '',
      items: request.items,
      deliveryAddress: request.deliveryAddress,
      deliveryNotes: request.deliveryNotes,
      voucherCode: request.voucherCode,
      cutleryOption: request.cutleryOption,
      actorId: session.userId,
      actorName: session.name,
    });

    const order = createResult.order;
    this.activeOrders.set(order.id, order);

    // Asynchronous read-only server projection (Recommendation N2: server-written read-only mirror)
    syncOrderToFirestore(order).catch(() => {});

    return {
      success: true,
      order,
      paymentTransaction: paymentIntent,
    };
  }

  /* =========================================================================
   * 3. ORDER LIFECYCLE & STATE MACHINE ACTIONS (C6, C1, C2, C3)
   * ========================================================================= */

  public getOrderById(orderId: string): Order | undefined {
    return this.activeOrders.get(orderId);
  }

  public registerActiveOrder(order: Order): void {
    this.activeOrders.set(order.id, order);
  }

  public requestOrderTransition(
    session: UserSession,
    orderId: string,
    targetStatus: OrderStatus,
    note?: string
  ): { success: boolean; order?: Order; error?: string } {
    const order = this.activeOrders.get(orderId);
    if (!order) {
      return { success: false, error: 'Commande introuvable dans le registre autoritaire.' };
    }

    // RBAC validation according to target status
    const allowedRolesForStatus: Record<OrderStatus, ('CUSTOMER' | 'MERCHANT' | 'COURIER' | 'ADMIN')[]> = {
      PENDING: ['CUSTOMER', 'ADMIN'],
      CONFIRMED: ['MERCHANT', 'ADMIN'],
      PREPARING: ['MERCHANT', 'ADMIN'],
      READY: ['MERCHANT', 'ADMIN'],
      ASSIGNED: ['COURIER', 'ADMIN'],
      PICKED_UP: ['COURIER', 'ADMIN'],
      DELIVERING: ['COURIER', 'ADMIN'],
      ARRIVED: ['COURIER', 'ADMIN'],
      CUSTOMER_CONFIRMED: ['CUSTOMER', 'ADMIN'],
      DELIVERED: ['COURIER', 'ADMIN'],
      CANCELLED: ['CUSTOMER', 'MERCHANT', 'COURIER', 'ADMIN'],
    };

    const allowedRoles = allowedRolesForStatus[targetStatus] || ['ADMIN'];
    if (!this.authorize(session, allowedRoles)) {
      return {
        success: false,
        error: `Permission refusée : le rôle ${session.role} ne peut pas exécuter la transition vers ${targetStatus}.`,
      };
    }

    // Authoritative transition via domain state machine
    const actorRoleMap: Record<string, ActorRole> = {
      CUSTOMER: 'CUSTOMER',
      MERCHANT: 'MERCHANT',
      COURIER: 'COURIER',
      ADMIN: 'SYSTEM',
    };

    const result = orderApplicationService.transitionOrder(
      order,
      targetStatus,
      {
        role: actorRoleMap[session.role] || 'SYSTEM',
        id: session.userId,
        name: session.name,
      },
      note
    );

    if (result.success) {
      this.activeOrders.set(orderId, result.order);
      // Fan out update to realtime subscribers
      const listeners = this.orderListeners.get(orderId);
      if (listeners) {
        listeners.forEach((fn) => fn(result.order));
      }
      // Asynchronous read-only server projection (Recommendation N2)
      syncOrderToFirestore(result.order).catch(() => {});
    }

    return result;
  }

  /* =========================================================================
   * 4. MERCHANT SERVICES (C1: Order Intake, Accept, Reject, Preparation)
   * ========================================================================= */

  public getMerchantOrders(storeId: string): Order[] {
    return Array.from(this.activeOrders.values()).filter(
      (o) => o.storeId === storeId || storeId === 'ALL'
    );
  }

  public merchantAcceptOrder(session: UserSession, orderId: string): { success: boolean; order?: Order; error?: string } {
    return this.requestOrderTransition(session, orderId, 'CONFIRMED', 'Commande acceptée par le commerçant');
  }

  public merchantMarkPreparing(session: UserSession, orderId: string): { success: boolean; order?: Order; error?: string } {
    return this.requestOrderTransition(session, orderId, 'PREPARING', 'Commande en cours de préparation en cuisine');
  }

  public merchantMarkReady(session: UserSession, orderId: string): { success: boolean; order?: Order; error?: string } {
    const res = this.requestOrderTransition(session, orderId, 'READY', 'Commande prête pour retrait coursier');
    if (res.success) {
      // Trigger instant courier offer
      this.generateDispatchOffer(orderId);
    }
    return res;
  }

  /* =========================================================================
   * 5. COURIER & DISPATCH SERVICES (C2: Job Offers, Acceptance, Telemetry)
   * ========================================================================= */

  private generateDispatchOffer(orderId: string): void {
    const order = this.activeOrders.get(orderId);
    if (!order) return;

    const offer: DeliveryJobOffer = {
      offerId: `offer-${order.id}-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantName: order.storeName,
      restaurantAddress: 'Place Centrale, Mila (43)',
      customerName: order.deliveryAddress.recipientName || 'Client Mila',
      destinationAddress: `${order.deliveryAddress.street}, ${order.deliveryAddress.commune}`,
      distanceKm: 1.2,
      totalAmountDZD: order.total,
      courierFeeDZD: 280,
      itemCount: order.items.length,
      estimatedPreparationMin: 10,
      status: 'PENDING',
      expiresAt: Date.now() + 60000, // 60s timeout
    };

    this.deliveryOffers.set(offer.offerId, offer);
    this.notifyCourierOfferSubscribers();
  }

  public getPendingDeliveryOffers(): DeliveryJobOffer[] {
    return Array.from(this.deliveryOffers.values()).filter(
      (o) => o.status === 'PENDING' && o.expiresAt > Date.now()
    );
  }

  public subscribeCourierOffers(callback: (offers: DeliveryJobOffer[]) => void): () => void {
    this.courierListeners.add(callback);
    callback(this.getPendingDeliveryOffers());
    return () => {
      this.courierListeners.delete(callback);
    };
  }

  private notifyCourierOfferSubscribers(): void {
    const offers = this.getPendingDeliveryOffers();
    this.courierListeners.forEach((listener) => listener(offers));
  }

  public courierAcceptOffer(
    session: UserSession,
    offerId: string
  ): { success: boolean; order?: Order; error?: string } {
    if (!this.authorize(session, ['COURIER', 'ADMIN'])) {
      return { success: false, error: 'Accès refusé : rôle coursier requis.' };
    }

    const offer = this.deliveryOffers.get(offerId);
    if (!offer || offer.status !== 'PENDING' || offer.expiresAt <= Date.now()) {
      return { success: false, error: 'Offre expirée ou déjà assignée à un autre coursier.' };
    }

    offer.status = 'ACCEPTED';
    this.deliveryOffers.delete(offerId);
    this.notifyCourierOfferSubscribers();

    // Assign courier to order
    const order = this.activeOrders.get(offer.orderId);
    if (order) {
      order.courierId = session.userId;
      order.courierName = session.name;
      order.courierPhone = '+213 550 88 99 00';
      if (order.delivery) {
        order.delivery.courierId = session.userId;
        order.delivery.courierName = session.name;
        order.delivery.status = 'ACCEPTED';
      }
      this.activeOrders.set(order.id, order);
    }

    return { success: true, order };
  }

  public courierDeclineOffer(
    session: UserSession,
    offerId: string
  ): { success: boolean; message?: string } {
    if (!this.authorize(session, ['COURIER', 'ADMIN'])) {
      return { success: false, message: 'Accès refusé : rôle coursier requis.' };
    }

    const offer = this.deliveryOffers.get(offerId);
    if (offer) {
      offer.status = 'DECLINED';
      this.deliveryOffers.delete(offerId);
      this.notifyCourierOfferSubscribers();
    }
    return { success: true, message: 'Offre déclinée avec succès.' };
  }

  public courierAdvanceStatus(
    session: UserSession,
    orderId: string,
    step: 'PICKED_UP' | 'DELIVERING' | 'ARRIVED' | 'DELIVERED',
    proofNote?: string
  ): { success: boolean; order?: Order; error?: string } {
    if (!this.authorize(session, ['COURIER', 'ADMIN'])) {
      return { success: false, error: 'Accès refusé : rôle coursier requis.' };
    }

    const note =
      step === 'DELIVERED'
        ? `Remise de la commande effectuée par le coursier. Preuve : ${proofNote || 'Signature client'}`
        : step === 'PICKED_UP'
        ? 'Commande retirée auprès du commerçant par le coursier'
        : step === 'ARRIVED'
        ? 'Le coursier est arrivé devant le domicile du client'
        : 'Coursier en cours de trajet de livraison';

    return this.requestOrderTransition(session, orderId, step, note);
  }

  /* =========================================================================
   * 6. MERCHANT INBOUND PUSH & CATALOGUE MANAGEMENT (N6, M6, C1)
   * ========================================================================= */

  private merchantListeners: Map<string, Set<(order: Order) => void>> = new Map();
  private catalogOverrides: Map<string, { isAvailable?: boolean; priceDZD?: number }> = new Map();

  public subscribeMerchantOrders(storeId: string, callback: (order: Order) => void): () => void {
    if (!this.merchantListeners.has(storeId)) {
      this.merchantListeners.set(storeId, new Set());
    }
    this.merchantListeners.get(storeId)!.add(callback);

    // Initial push of existing active orders for this store
    const storeOrders = this.getMerchantOrders(storeId);
    storeOrders.forEach((order) => callback(order));

    return () => {
      const set = this.merchantListeners.get(storeId);
      if (set) {
        set.delete(callback);
      }
    };
  }

  public updateStoreItemAvailability(
    session: UserSession,
    storeId: string,
    itemId: string,
    isAvailable: boolean
  ): { success: boolean; error?: string } {
    if (!this.authorize(session, ['MERCHANT', 'ADMIN'])) {
      return { success: false, error: 'Permission refusée : rôle commerçant requis.' };
    }
    const current = this.catalogOverrides.get(itemId) || {};
    this.catalogOverrides.set(itemId, { ...current, isAvailable });
    return { success: true };
  }

  public isItemAvailable(itemId: string, defaultAvailable: boolean = true): boolean {
    const override = this.catalogOverrides.get(itemId);
    return override?.isAvailable !== undefined ? override.isAvailable : defaultAvailable;
  }

  /* =========================================================================
   * 7. PAYMENT WEBHOOK & CONFIRMATION (C4, N3)
   * ========================================================================= */

  public async confirmPaymentWebhook(
    paymentIntentId: string,
    orderId: string,
    status: 'SUCCEEDED' | 'FAILED'
  ): Promise<{ success: boolean; order?: Order }> {
    const order = this.activeOrders.get(orderId);
    if (!order) return { success: false };

    if (status === 'SUCCEEDED') {
      order.paymentStatus = 'PAID';
      this.activeOrders.set(orderId, order);
      outboxEventBus.recordOutboxEvent(
        'payment.completed',
        orderId,
        'PAYMENT',
        { orderId, paymentIntentId, amountDZD: order.total },
        { role: 'SYSTEM', id: 'payments-service', name: 'Server Payment Webhook' }
      );
      return { success: true, order };
    } else {
      order.paymentStatus = 'FAILED';
      this.activeOrders.set(orderId, order);
      return { success: false, order };
    }
  }

  /* =========================================================================
   * 8. REALTIME ORDER TRACKING CHANNELS (H5, A2: Customer & Admin Fan-Out)
   * ========================================================================= */

  public subscribeToOrder(orderId: string, callback: (order: Order) => void): () => void {
    if (!this.orderListeners.has(orderId)) {
      this.orderListeners.set(orderId, new Set());
    }
    this.orderListeners.get(orderId)!.add(callback);

    const current = this.activeOrders.get(orderId);
    if (current) {
      callback(current);
    }

    return () => {
      const set = this.orderListeners.get(orderId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.orderListeners.delete(orderId);
        }
      }
    };
  }

  /* =========================================================================
   * 7. ADMIN OPERATIONS & AUDIT (C3)
   * ========================================================================= */

  public getAdminOverview(session: UserSession): {
    success: boolean;
    activeOrdersCount: number;
    pendingOffersCount: number;
    allOrders: Order[];
    error?: string;
  } {
    if (!this.authorize(session, ['ADMIN'])) {
      return {
        success: false,
        activeOrdersCount: 0,
        pendingOffersCount: 0,
        allOrders: [],
        error: 'Accès refusé : privilèges administrateur requis.',
      };
    }

    const all = Array.from(this.activeOrders.values());
    return {
      success: true,
      activeOrdersCount: all.filter((o) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length,
      pendingOffersCount: this.getPendingDeliveryOffers().length,
      allOrders: all,
    };
  }
}

/**
 * The local simulation is enabled outside production builds, or explicitly with
 * VITE_ALLOW_LOCAL_SIMULATION=true (e.g. for a staging demo).
 */
export function isSimulationEnabled(): boolean {
  const env = (import.meta as any).env;
  return !env?.PROD || env?.VITE_ALLOW_LOCAL_SIMULATION === 'true';
}

const simulatedGateway = new ApiGateway();

/**
 * In production the simulation must never fabricate offers or orders for real
 * users. Throwing at import time would take the whole app down (several views
 * import this module), so instead every call is refused when it is USED:
 * mutations throw, and subscriptions return an empty stream.
 */
export const apiGateway: typeof simulatedGateway = isSimulationEnabled()
  ? simulatedGateway
  : new Proxy(simulatedGateway, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') return value;
        const name = String(prop);
        if (name.startsWith('subscribe')) {
          return () => {
            console.error(`[apiGateway] ${name}() is a local simulation and is disabled in production.`);
            return () => {};
          };
        }
        return () => {
          throw new Error(
            `[apiGateway] ${name}() is a local simulation and is disabled in production. Use apiClient.`
          );
        };
      },
    });
