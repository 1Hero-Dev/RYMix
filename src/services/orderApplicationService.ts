/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Order Application Service - Authoritative Orchestrator
 * Implements Recommendation #2 (Single Authoritative Brain), #13 (Idempotency),
 * #14 (Transactional Boundaries), #15 (Outbox), & #16 (Separation of Order & Delivery)
 */

import {
  Order,
  OrderStatus,
  CartItem,
  DeliveryAddress,
  Delivery,
  OrderStatusHistoryEntry,
} from '../types';
import { calculateAuthoritativePrice } from '../domain/pricingEngine';
import { validateOrderTransition, evaluateCancellationPolicy, ActorRole } from '../domain/orderLifecycle';
import { createOrderFulfillmentRecord } from '../domain/fulfillment';
import { outboxEventBus } from '../events/outboxEventBus';

// In-memory idempotency cache to prevent duplicate order placements under poor cellular signal
const IDEMPOTENCY_CACHE: Map<string, { order: Order; cachedAt: number }> = new Map();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface CreateOrderParams {
  idempotencyKey?: string;
  storeId: string;
  storeName: string;
  storeCategory: string;
  storeImageUrl: string;
  items: CartItem[];
  deliveryAddress: DeliveryAddress;
  deliveryNotes?: string;
  voucherCode?: string;
  redeemedFidelityPoints?: number;
  cutleryOption?: boolean;
  actorId?: string;
  actorName?: string;
}

export class OrderApplicationService {
  /**
   * Idempotent Order Creation with authoritative server pricing
   */
  public createOrder(params: CreateOrderParams): { order: Order; isDuplicateReplay: boolean } {
    const idempotencyKey = params.idempotencyKey || `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 1. Check Idempotency Cache (Recommendation #13)
    const cached = IDEMPOTENCY_CACHE.get(idempotencyKey);
    if (cached && Date.now() - cached.cachedAt < IDEMPOTENCY_TTL_MS) {
      return { order: cached.order, isDuplicateReplay: true };
    }

    // 2. Authoritative Domain Pricing (Recommendation #5)
    const priceBreakdown = calculateAuthoritativePrice({
      items: params.items.map((i) => ({ menuItemId: i.menuItemId, price: i.basePrice, quantity: i.quantity })),
      storeId: params.storeId,
      voucherCode: params.voucherCode,
      redeemedFidelityPoints: params.redeemedFidelityPoints,
    });

    const nowIso = new Date().toISOString();
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const orderNumber = `#AR-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Separate Operational Delivery Entity (Recommendation #16)
    const delivery: Delivery = {
      id: `deliv-${orderId}`,
      orderId,
      status: 'UNASSIGNED',
      pickup: {
        storeId: params.storeId,
        storeName: params.storeName,
        address: 'Rue Principale Ahmed Rachedi',
        landmark: 'Centre-Ville',
        phone: '0550 00 11 22',
        lat: 36.4678,
        lng: 6.2891,
      },
      dropoff: {
        recipientName: params.deliveryAddress.recipientName || 'Client Ahmed Rachedi',
        phone: params.deliveryAddress.phone,
        address: `${params.deliveryAddress.street}, ${params.deliveryAddress.building || ''}`,
        landmark: params.deliveryAddress.landmark,
        building: params.deliveryAddress.building,
        floor: params.deliveryAddress.floor,
        lat: params.deliveryAddress.lat || 36.467,
        lng: params.deliveryAddress.lng || 6.288,
      },
      feeSnapshot: priceBreakdown.deliveryFeeDZD,
      distanceMeters: Math.round(priceBreakdown.distanceKm * 1000),
      estimatedDurationMin: 18,
      dispatchedAt: nowIso,
    };

    const historyEntry: OrderStatusHistoryEntry = {
      id: `hist-${Date.now()}-init`,
      fromStatus: undefined,
      toStatus: 'PENDING',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actorRole: 'CUSTOMER',
      actorName: params.actorName || 'Client',
      note: 'Commande créée et transmise au commerce',
    };

    const initialOrder: Order = {
      id: orderId,
      idempotencyKey,
      orderNumber,
      storeId: params.storeId,
      storeName: params.storeName,
      storeCategory: params.storeCategory,
      storeImageUrl: params.storeImageUrl,
      items: params.items,
      subtotal: priceBreakdown.itemsSubtotalDZD,
      deliveryFee: priceBreakdown.deliveryFeeDZD,
      packagingFee: priceBreakdown.packagingFeeDZD,
      discount: priceBreakdown.discountDZD,
      voucherCode: params.voucherCode,
      total: priceBreakdown.finalCustomerTotalDZD,
      status: 'PENDING',
      statusHistory: [historyEntry],
      createdAt: nowIso,
      estimatedDeliveryTimeRange: '15–25 mins',
      estimatedDeliveryTime: new Date(Date.now() + 22 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      delivery,
      deliveryAddress: params.deliveryAddress,
      deliveryNotes: params.deliveryNotes,
      cutleryOption: !!params.cutleryOption,
      statusTimeline: [
        { status: 'PENDING', label: 'Envoyée', timestamp: 'À l\'instant', completed: true, current: true },
        { status: 'CONFIRMED', label: 'Confirmée', timestamp: '--:--', completed: false, current: false },
        { status: 'PREPARING', label: 'Préparation', timestamp: '--:--', completed: false, current: false },
        { status: 'PICKED_UP', label: 'Enlevée', timestamp: '--:--', completed: false, current: false },
        { status: 'DELIVERING', label: 'En route', timestamp: '--:--', completed: false, current: false },
        { status: 'ARRIVED', label: 'Arrivée', timestamp: '--:--', completed: false, current: false },
        { status: 'DELIVERED', label: 'Livrée', timestamp: '--:--', completed: false, current: false },
      ],
    };

    // 4. Initialize Fulfillment Record (Recommendation #4)
    createOrderFulfillmentRecord(orderId, params.storeId, params.storeCategory, params.items);

    // 5. Transactional Outbox Event (Recommendation #14 & #15)
    outboxEventBus.recordOutboxEvent(
      'order.placed',
      orderId,
      'ORDER',
      {
        orderId,
        orderNumber,
        storeId: params.storeId,
        subtotal: priceBreakdown.itemsSubtotalDZD,
        total: priceBreakdown.finalCustomerTotalDZD,
      },
      {
        role: 'CUSTOMER',
        id: params.actorId || 'cust-anon',
        name: params.actorName || 'Client',
      },
      { idempotencyKey }
    );

    // Cache result
    IDEMPOTENCY_CACHE.set(idempotencyKey, { order: initialOrder, cachedAt: Date.now() });

    return { order: initialOrder, isDuplicateReplay: false };
  }

  /**
   * Transition order status with strict lifecycle rules (Recommendation #3)
   */
  public transitionOrder(
    order: Order,
    targetStatus: OrderStatus,
    actor: { role: ActorRole; id: string; name: string },
    note?: string
  ): { success: boolean; order: Order; error?: string } {
    const validation = validateOrderTransition(order.status, targetStatus, actor.role);
    if (!validation.valid) {
      return { success: false, order, error: validation.reason };
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newHistoryEntry: OrderStatusHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromStatus: order.status,
      toStatus: targetStatus,
      timestamp: nowTime,
      actorRole: actor.role as any,
      actorName: actor.name,
      note: note || `Passage d'état: ${targetStatus}`,
    };

    // Update status timeline
    const updatedTimeline = order.statusTimeline.map((item) => {
      if (item.status === targetStatus) {
        return { ...item, completed: true, current: true, timestamp: nowTime };
      }
      if (item.current) {
        return { ...item, current: false, completed: true };
      }
      return item;
    });

    const updatedOrder: Order = {
      ...order,
      status: targetStatus,
      statusHistory: [...(order.statusHistory || []), newHistoryEntry],
      statusTimeline: updatedTimeline,
      paymentStatus: targetStatus === 'DELIVERED' ? 'COLLECTED' : order.paymentStatus,
    };

    // Update operational delivery status if present
    if (updatedOrder.delivery) {
      if (targetStatus === 'READY') {
        updatedOrder.delivery.status = 'ARRIVED_STORE';
      } else if (targetStatus === 'PICKED_UP') {
        updatedOrder.delivery.status = 'PICKED_UP';
        updatedOrder.delivery.pickedUpAt = new Date().toISOString();
      } else if (targetStatus === 'DELIVERING') {
        updatedOrder.delivery.status = 'EN_ROUTE';
      } else if (targetStatus === 'ARRIVED') {
        updatedOrder.delivery.status = 'ARRIVED_CUSTOMER';
      } else if (targetStatus === 'DELIVERED') {
        updatedOrder.delivery.status = 'DELIVERED';
        updatedOrder.delivery.deliveredAt = new Date().toISOString();
      } else if (targetStatus === 'CANCELLED') {
        updatedOrder.delivery.status = 'CANCELLED';
      }
    }

    // Record domain event in outbox
    outboxEventBus.recordOutboxEvent(
      targetStatus === 'DELIVERED'
        ? 'order.delivered'
        : targetStatus === 'CANCELLED'
        ? 'order.cancelled'
        : 'order.accepted',
      order.id,
      'ORDER',
      { orderId: order.id, previousStatus: order.status, nextStatus: targetStatus, note },
      actor
    );

    return { success: true, order: updatedOrder };
  }

  /**
   * Handles formal cancellation requests according to lifecycle rules
   */
  public requestCancellation(
    order: Order,
    requester: { role: ActorRole; id: string; name: string },
    reason: string
  ): { success: boolean; order: Order; message: string } {
    const policy = evaluateCancellationPolicy(order.status, requester.role);

    if (policy.allowedImmediately) {
      const transitionResult = this.transitionOrder(order, 'CANCELLED', requester, `Annulation: ${reason}`);
      return {
        success: true,
        order: transitionResult.order,
        message: 'Commande annulée avec succès.',
      };
    }

    // Record outbox event for cancellation request
    outboxEventBus.recordOutboxEvent(
      'order.cancellation_requested',
      order.id,
      'ORDER',
      { orderId: order.id, status: order.status, reason, requesterRole: requester.role },
      requester
    );

    return {
      success: false,
      order,
      message: policy.explanation,
    };
  }
}

export const orderApplicationService = new OrderApplicationService();
