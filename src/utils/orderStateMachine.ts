import {
  OrderStatus,
  OrderStatusHistoryEntry,
  Order,
  CartItem,
  DeliveryAddress,
  Delivery,
} from '../types';
import { outboxEventBus } from '../events/outboxEventBus';
import { validateOrderTransition, ActorRole } from '../domain/orderLifecycle';

/**
 * Strict Order State Machine Transition Matrix
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'PREPARING', 'PICKED_UP', 'DELIVERING', 'ARRIVED', 'DELIVERED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'READY', 'PICKED_UP', 'DELIVERING', 'ARRIVED', 'DELIVERED', 'CANCELLED'],
  PREPARING: ['READY', 'PICKED_UP', 'DELIVERING', 'ARRIVED', 'DELIVERED', 'CANCELLED'],
  READY: ['ASSIGNED', 'PICKED_UP', 'DELIVERING', 'ARRIVED', 'DELIVERED', 'CANCELLED'],
  ASSIGNED: ['PICKED_UP', 'DELIVERING', 'ARRIVED', 'DELIVERED', 'CANCELLED'],
  PICKED_UP: ['DELIVERING', 'ARRIVED', 'DELIVERED', 'CANCELLED'],
  DELIVERING: ['ARRIVED', 'CUSTOMER_CONFIRMED', 'DELIVERED', 'CANCELLED'],
  ARRIVED: ['CUSTOMER_CONFIRMED', 'DELIVERED', 'CANCELLED'],
  CUSTOMER_CONFIRMED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Natural sequential milestone order
 */
export const MILESTONE_ORDER: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'PICKED_UP',
  'DELIVERING',
  'ARRIVED',
  'CUSTOMER_CONFIRMED',
  'DELIVERED',
];

/**
 * Helper to get natural sequence next status for simulation or quick-advance
 */
export function getNextSimulatedStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case 'PENDING':
      return 'CONFIRMED';
    case 'CONFIRMED':
      return 'PREPARING';
    case 'PREPARING':
      return 'READY';
    case 'READY':
      return 'PICKED_UP';
    case 'ASSIGNED':
      return 'PICKED_UP';
    case 'PICKED_UP':
      return 'DELIVERING';
    case 'DELIVERING':
      return 'ARRIVED';
    case 'ARRIVED':
      return 'CUSTOMER_CONFIRMED';
    case 'CUSTOMER_CONFIRMED':
      return 'DELIVERED';
    default:
      return null;
  }
}

/**
 * Validate whether a transition is logically and legally allowed.
 */
export function canTransitionOrder(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Executes a state transition with audit trail logging
 */
export function transitionOrder(
  order: Order,
  toStatus: OrderStatus,
  actor: { role: 'CUSTOMER' | 'MERCHANT' | 'COURIER' | 'SYSTEM'; name: string },
  note?: string
): Order {
  if (!canTransitionOrder(order.status, toStatus)) {
    console.warn(`[StateMachine Error] Cannot transition order ${order.orderNumber} from ${order.status} to ${toStatus}`);
    return order;
  }

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const historyEntry: OrderStatusHistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fromStatus: order.status,
    toStatus,
    timestamp: nowTime,
    actorRole: actor.role,
    actorName: actor.name,
    note: note || `Statut mis à jour: ${toStatus}`,
  };

  const targetIdx = MILESTONE_ORDER.indexOf(toStatus);

  // Ensure base timeline contains ARRIVED and CUSTOMER_CONFIRMED steps if transitioning to or past them
  let baseTimeline = [...order.statusTimeline];
  const hasArrivedStep = baseTimeline.some((s) => s.status === 'ARRIVED');
  if (!hasArrivedStep && (toStatus === 'ARRIVED' || toStatus === 'CUSTOMER_CONFIRMED' || toStatus === 'DELIVERED')) {
    const deliveredIdx = baseTimeline.findIndex((s) => s.status === 'DELIVERED');
    const arrivedStep = {
      status: 'ARRIVED' as OrderStatus,
      label: 'Arrivé sur place',
      timestamp: toStatus === 'ARRIVED' ? nowTime : 'En attente',
      completed: toStatus === 'CUSTOMER_CONFIRMED' || toStatus === 'DELIVERED',
      current: toStatus === 'ARRIVED',
    };
    if (deliveredIdx >= 0) {
      baseTimeline.splice(deliveredIdx, 0, arrivedStep);
    } else {
      baseTimeline.push(arrivedStep);
    }
  }

  const hasCustomerConfirmedStep = baseTimeline.some((s) => s.status === 'CUSTOMER_CONFIRMED');
  if (!hasCustomerConfirmedStep && (toStatus === 'CUSTOMER_CONFIRMED' || toStatus === 'DELIVERED')) {
    const deliveredIdx = baseTimeline.findIndex((s) => s.status === 'DELIVERED');
    const confirmStep = {
      status: 'CUSTOMER_CONFIRMED' as OrderStatus,
      label: 'Confirmation client',
      timestamp: toStatus === 'CUSTOMER_CONFIRMED' ? nowTime : 'En attente',
      completed: toStatus === 'DELIVERED',
      current: toStatus === 'CUSTOMER_CONFIRMED',
    };
    if (deliveredIdx >= 0) {
      baseTimeline.splice(deliveredIdx, 0, confirmStep);
    } else {
      baseTimeline.push(confirmStep);
    }
  }

  const updatedTimeline = baseTimeline.map((step) => {
    const stepIdx = MILESTONE_ORDER.indexOf(step.status);

    if (toStatus === 'DELIVERED') {
      return {
        ...step,
        completed: true,
        current: step.status === 'DELIVERED',
        timestamp: step.timestamp === 'En attente' ? nowTime : step.timestamp,
      };
    }

    if (stepIdx < targetIdx) {
      return {
        ...step,
        completed: true,
        current: false,
        timestamp: step.timestamp === 'En attente' ? nowTime : step.timestamp,
      };
    }

    if (stepIdx === targetIdx) {
      return {
        ...step,
        completed: false,
        current: true,
        timestamp: nowTime,
      };
    }

    return {
      ...step,
      completed: false,
      current: false,
      timestamp: 'En attente',
    };
  });

  // If transition to DELIVERED, set payment status to COLLECTED for COD
  const updatedPaymentStatus = toStatus === 'DELIVERED' ? 'COLLECTED' : order.paymentStatus;

  // Update Delivery object if attached
  let updatedDelivery: Delivery | undefined = order.delivery;
  if (updatedDelivery) {
    if (toStatus === 'PICKED_UP') {
      updatedDelivery = {
        ...updatedDelivery,
        status: 'PICKED_UP',
        pickedUpAt: nowTime,
      };
    } else if (toStatus === 'DELIVERING') {
      updatedDelivery = {
        ...updatedDelivery,
        status: 'EN_ROUTE',
      };
    } else if (toStatus === 'ARRIVED') {
      updatedDelivery = {
        ...updatedDelivery,
        status: 'ARRIVED_CUSTOMER',
      };
    } else if (toStatus === 'DELIVERED') {
      updatedDelivery = {
        ...updatedDelivery,
        status: 'DELIVERED',
        deliveredAt: nowTime,
      };
    }
  }

  // Atomically record domain event into the Outbox (Recommendation #15)
  try {
    outboxEventBus.recordOutboxEvent(
      toStatus === 'DELIVERED'
        ? 'order.delivered'
        : toStatus === 'CANCELLED'
        ? 'order.cancelled'
        : 'order.accepted',
      order.id,
      'ORDER',
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        previousStatus: order.status,
        newStatus: toStatus,
        note: note || `Statut mis à jour: ${toStatus}`,
      },
      {
        role: actor.role as any,
        id: `actor-${actor.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: actor.name,
      }
    );
  } catch (e) {
    console.error('Outbox event recording error:', e);
  }

  return {
    ...order,
    status: toStatus,
    paymentStatus: updatedPaymentStatus,
    statusHistory: [...(order.statusHistory || []), historyEntry],
    statusTimeline: updatedTimeline,
    delivery: updatedDelivery,
  };
}

/**
 * Server-authoritative delivery fee calculation for Ahmed Rachedi & Wilaya 43 (Mila)
 */
export function calculateServerAuthoritativeFee(
  subtotal: number,
  address: DeliveryAddress
): { deliveryFee: number; packagingFee: number; discount: number; finalTotal: number } {
  const packagingFee = 50; // Packaging isotherme de qualité

  // Distance / Zone estimation:
  // Ahmed Rachedi Centre / Cité / Mairie: 100 DZD
  // Standard: 150 DZD
  // Zones périphériques (Oued Endja / Senoussi / Grarem): 200 DZD
  let baseDeliveryFee = 150;
  const communeLower = address.commune.toLowerCase();
  const landmarkLower = address.landmark.toLowerCase();

  if (
    communeLower.includes('ahmed rachedi') ||
    communeLower.includes('centre') ||
    landmarkLower.includes('centre') ||
    landmarkLower.includes('mairie') ||
    landmarkLower.includes('mosquée')
  ) {
    baseDeliveryFee = 100;
  } else if (
    communeLower.includes('senoussi') ||
    communeLower.includes('oued endja') ||
    communeLower.includes('grarem')
  ) {
    baseDeliveryFee = 200;
  }

  // Free delivery promotional discount for orders >= 1200 DZD in Mila
  let discount = 0;
  if (subtotal >= 1200) {
    discount = baseDeliveryFee; // Offert !
  }

  const finalTotal = Math.max(0, subtotal + baseDeliveryFee + packagingFee - discount);

  return {
    deliveryFee: baseDeliveryFee,
    packagingFee,
    discount,
    finalTotal,
  };
}

/**
 * Creates immutable price & product snapshots for historical order safety
 */
export function createOrderItemSnapshots(cartItems: CartItem[]): CartItem[] {
  return cartItems.map((item) => ({
    ...item,
    productNameSnapshot: item.name,
    unitPriceSnapshot: item.basePrice,
    optionsSnapshot: JSON.parse(JSON.stringify(item.options)),
    subtotalSnapshot: item.basePrice * item.quantity,
  }));
}

/**
 * Generates an Idempotency Key to prevent double-charging or double order creation
 */
export function generateIdempotencyKey(customerId: string): string {
  return `idemp_${customerId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Deterministic Courier Dispatch Algorithm:
 * Evaluates candidate couriers for an order in Mila
 */
export interface CourierCandidate {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  vehicle: string;
  isOnline: boolean;
  distanceToStoreMeters: number;
  currentActiveDeliveries: number;
  directionPenalty: number;
}

export const LAUNCH_MAX_RADIUS_METERS = 2000; // Strict ~2.0 km launch perimeter for Mila (Wilaya 43)

/**
 * Checks if a destination in Mila falls within the 2.0 km launch perimeter
 */
export function checkMilaOperatingRadius(distanceMeters: number): {
  isWithinRadius: boolean;
  distanceKm: number;
  maxRadiusKm: number;
  label: string;
} {
  const isWithinRadius = distanceMeters <= LAUNCH_MAX_RADIUS_METERS;
  const distanceKm = Number((distanceMeters / 1000).toFixed(2));
  return {
    isWithinRadius,
    distanceKm,
    maxRadiusKm: 2.0,
    label: isWithinRadius
      ? `${distanceKm} km (Zone de lancement Mila Centre < 2,0 km)`
      : `${distanceKm} km (Hors zone de lancement : limité à 2,0 km)`,
  };
}

export function rankCouriersForDispatch(
  candidates: CourierCandidate[],
  maxRadiusMeters: number = LAUNCH_MAX_RADIUS_METERS
): { courier: CourierCandidate; score: number }[] {
  return candidates
    .filter((c) => c.isOnline && c.distanceToStoreMeters <= maxRadiusMeters && c.currentActiveDeliveries < 3)
    .map((courier) => {
      // Deterministic scoring formula:
      // Lower score = better candidate
      const distanceScore = courier.distanceToStoreMeters;
      const activeOrderPenalty = courier.currentActiveDeliveries * 450;
      const ratingBonus = (5.0 - courier.rating) * 200;
      const totalScore = Math.round(distanceScore + activeOrderPenalty + courier.directionPenalty + ratingBonus);

      return {
        courier,
        score: totalScore,
      };
    })
    .sort((a, b) => a.score - b.score);
}
