export type Persona = 'customer' | 'courier' | 'merchant' | 'admin';
export type { UserRole, UserProfile } from './firebase/AuthContext';

export type CustomerTab = 'home' | 'discovery' | 'orders' | 'messages' | 'profile';
export type CourierTab = 'missions' | 'batch' | 'active' | 'messages' | 'earnings' | 'profile';
export type MerchantTab = 'orders' | 'menu' | 'messages' | 'analytics' | 'store';
export type AdminTab =
  | 'dispatch'
  | 'orders'
  | 'stores'
  | 'fleet'
  | 'users'
  | 'promos'
  | 'settlement'
  | 'settings'
  | 'architecture';

export interface DynamicPromoCode {
  id: string;
  code: string;
  title: string;
  discountType: 'fixed' | 'percentage' | 'free_delivery';
  discountDZD?: number;
  percentage?: number;
  minOrderDZD: number;
  isActive: boolean;
  usageCount: number;
  expiresAt?: string;
  createdAt: string;
}

export interface PlatformOperationalSettings {
  launchRadiusMeters: number;
  maxDeliveryRadiusKm: number;
  baseDeliveryFeeDZD: number;
  freeDeliveryThresholdDZD: number;
  packagingFeeDZD: number;
  surgeMultiplier: number;
  maintenanceMode: boolean;
  announcementBanner: string;
  announcementBannerText: string;
  updatedAt: string;
}

export interface AdminManualOrderInput {
  customerName: string;
  customerPhone: string;
  commune: string;
  street: string;
  landmark: string;
  storeId: string;
  items: { menuItemId: string; name: string; price: number; quantity: number }[];
  deliveryFee: number;
  notes?: string;
}

export interface StoreHours {
  dayOfWeek: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
  openTime: string; // e.g. "11:00"
  closeTime: string; // e.g. "23:30"
  isClosed: boolean;
  specialNote?: string;
}

export interface DeliveryFeeRule {
  zoneName: string;
  commune: string;
  baseFeeDZD: number;
  perKmFeeDZD: number;
  freeTierMinDZD: number;
  maxRadiusMeters: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'ARRIVED'
  | 'CUSTOMER_CONFIRMED'
  | 'DELIVERED'
  | 'CANCELLED';

export type DeliveryStatus =
  | 'UNASSIGNED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'ARRIVED_STORE'
  | 'PICKED_UP'
  | 'EN_ROUTE'
  | 'NEARBY'
  | 'ARRIVED_CUSTOMER'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type StoreOperatingStatus = 'OPEN' | 'BUSY' | 'PAUSED' | 'CLOSED';
export type NetworkQuality = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export interface OrderStatusHistoryEntry {
  id: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  timestamp: string;
  actorRole: 'CUSTOMER' | 'MERCHANT' | 'COURIER' | 'SYSTEM';
  actorName: string;
  note?: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  priceDelta: number; // in DZD
}

export interface MenuItemOptionGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number; // in DZD
  originalPrice?: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  badge?: string;
  salesCount?: string;
  praiseRate?: string;
  optionGroups?: MenuItemOptionGroup[];
}

export interface StorePromotion {
  id: string;
  type: 'min_spend_discount' | 'free_delivery' | 'percentage';
  discountDZD?: number;
  minSubtotalDZD: number;
  percentage?: number;
  badgeLabel: string;
  description?: string;
}

export interface Store {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: string;
  deliveryTimeMin: number;
  distanceKm: number;
  deliveryFee: number; // in DZD
  minOrder: number; // in DZD
  isOpen: boolean;
  operatingStatus?: StoreOperatingStatus;
  prepTimeMinutes?: number;
  imageUrl: string;
  logoUrl?: string;
  tags: string[];
  notice?: string;
  commune: string;
  address: string;
  landmark: string;
  phone: string;
  lat?: number;
  lng?: number;
  menuCategories: string[];
  items: MenuItem[];
  promotion?: StorePromotion;
}

export interface CartItemOptionSelected {
  groupName: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  menuItemId: string;
  storeId: string;
  storeName: string;
  name: string;
  basePrice: number;
  quantity: number;
  imageUrl: string;
  options: CartItemOptionSelected[];
  chefRemark?: string;
  // Price Snapshots (immutable purchase audit)
  productNameSnapshot?: string;
  unitPriceSnapshot?: number;
  optionsSnapshot?: CartItemOptionSelected[];
  subtotalSnapshot?: number;
}

export interface DeliveryAddress {
  id: string;
  label: string; // 'Maison', 'Bureau', 'Autre'
  wilaya: string;
  commune: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  landmark: string; // Crucial for Algerian deliveries: "Près de la Mosquée Al-Ansar"
  entranceInstructions?: string; // "Interphone 2, porte beige"
  callPreference?: 'CALL_ON_ARRIVAL' | 'RING_BELL' | 'SMS_ONLY';
  phone: string;
  recipientName: string;
  deliveryNotes?: string;
  lat?: number;
  lng?: number;
}

export interface CourierLocationState {
  lat: number;
  lng: number;
  heading: number;
  speedKmh: number;
  accuracyMeters: number;
  lastUpdatedMs: number;
  freshness: 'LIVE' | 'UPDATING' | 'UNAVAILABLE';
  distanceToDestinationM?: number;
  isStationary: boolean;
}

export interface Delivery {
  id: string;
  orderId: string;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierAvatar?: string;
  courierRating?: number;
  courierVehicle?: string;
  status: DeliveryStatus;
  pickup: {
    storeId: string;
    storeName: string;
    address: string;
    landmark: string;
    phone: string;
    lat: number;
    lng: number;
  };
  dropoff: {
    recipientName: string;
    phone: string;
    address: string;
    landmark: string;
    building?: string;
    floor?: string;
    lat: number;
    lng: number;
  };
  feeSnapshot: number;
  distanceMeters: number;
  estimatedDurationMin: number;
  locationState?: CourierLocationState;
  dispatchedAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface Order {
  id: string;
  idempotencyKey?: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  storeCategory: string;
  storeImageUrl: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  voucherCode?: string;
  appliedPromotionDescription?: string;
  preparationTimeMinutes?: number;
  total: number;
  status: OrderStatus;
  statusHistory?: OrderStatusHistoryEntry[];
  createdAt: string;
  estimatedDeliveryTimeRange?: string; // e.g. "12–18 mins"
  estimatedDeliveryTime: string;
  paymentMethod: 'COD'; // Cash On Delivery
  paymentStatus: 'UNPAID' | 'COLLECTED' | 'PAID' | 'FAILED';
  delivery?: Delivery;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierAvatar?: string;
  courierRating?: number;
  courierVehicle?: string;
  deliveryAddress: DeliveryAddress;
  deliveryNotes?: string;
  cutleryOption: boolean; // Eco friendly
  isRated?: boolean;
  rating?: number;
  customerComment?: string;
  ratedAt?: string;
  statusTimeline: {
    status: OrderStatus;
    label: string;
    timestamp: string;
    completed: boolean;
    current: boolean;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'system' | 'courier' | 'customer';
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  badge?: string;
}

export interface AvailableDeliveryPoolOrder {
  id: string;
  orderNumber: string;
  storeName: string;
  storeAddress: string;
  storeDistance: string;
  customerDestination: string;
  customerDistance: string;
  customerLandmark: string;
  payoutFeeDZD: number;
  rushBonusDZD: number;
  itemsSummary: string;
  weightApprox: string;
  urgencyTag: string;
  deliveryDeadline: string;
  status: 'available' | 'claimed' | 'in_transit' | 'delivered';
}

export interface CourierCandidate {
  courierId: string;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  activeOrders: number;
  distanceMeters: number;
  score: number;
  isEligibleWithin2Km: boolean;
}

// ==========================================================
// CUSTOMER FIDELITY SYSTEM (Database Entities)
// ==========================================================
export type FidelityTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP_BARAKA';

export type FidelityTransactionType =
  | 'EARN'
  | 'REDEEM'
  | 'BONUS_WELCOME'
  | 'BONUS_REVIEW'
  | 'WILAYA_BOOST'
  | 'REFERRAL';

export interface FidelityTransaction {
  id: string;
  orderId?: string;
  orderNumber?: string;
  type: FidelityTransactionType;
  points: number; // positive for gain, negative for spend
  amountDZD?: number;
  description: string;
  timestamp: string;
}

export interface LoyaltyVoucher {
  id: string;
  code: string;
  title: string;
  discountDZD: number;
  pointsCost: number;
  minSpendDZD: number;
  isUsed: boolean;
  expiresAt: string;
}

export interface CustomerFidelityProfile {
  userId: string;
  userName: string;
  phone: string;
  wilaya: string;
  pointsBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  tier: FidelityTier;
  pointsMultiplier: number;
  vouchers: LoyaltyVoucher[];
  transactions: FidelityTransaction[];
}

// ==========================================================
// MERCHANT RATINGS & REVIEWS (Database Entities)
// ==========================================================
export interface MerchantReviewCriteria {
  foodTaste: number; // 1-5
  packaging: number; // 1-5
  speed: number; // 1-5
  portionSize: number; // 1-5
}

export interface MerchantReview {
  id: string;
  storeId: string;
  storeName: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  overallRating: number; // 1-5
  criteria: MerchantReviewCriteria;
  comment: string;
  tags: string[]; // e.g. 'Chaud & Frais', 'Portion Généreuse', 'Emballage Soigné'
  merchantReply?: {
    text: string;
    repliedAt: string;
  };
  createdAt: string;
  verifiedPurchase: boolean;
}

// ==========================================================
// COURIER RATINGS & FEEDBACK (Database Entities)
// ==========================================================
export interface CourierReviewCriteria {
  punctuality: number; // 1-5
  politeness: number; // 1-5
  routeRespect: number; // 1-5 (respect real roads)
  foodHandling: number; // 1-5
}

export interface CourierReview {
  id: string;
  courierId: string;
  courierName: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number; // 1-5
  criteria: CourierReviewCriteria;
  complimentTags: string[]; // e.g. 'Ponctuel', 'Souriant & Poli', 'Respect du code'
  tipAmountDZD: number; // Cash tip given in DZD
  feedbackNote?: string;
  createdAt: string;
}

// ==========================================================
// CUSTOMER PURCHASING HISTORY & RECEIPTS (Database Entities)
// ==========================================================
export interface PurchasingHistoryRecord {
  id: string;
  orderNumber: string;
  receiptNumber: string;
  userId: string;
  storeId: string;
  storeName: string;
  storeCategory: string;
  storeImageUrl: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  voucherCodeUsed?: string;
  pointsEarned: number;
  pointsRedeemed: number;
  total: number;
  currency: 'DZD';
  paymentMethod: 'COD' | 'BARIDIMOB' | 'EDAHABIA';
  paymentStatus: 'PAID' | 'COLLECTED';
  deliveryAddress: DeliveryAddress;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  orderedAt: string;
  deliveredAt: string;
  isRatedMerchant: boolean;
  isRatedCourier: boolean;
}

// ==========================================================
// DISH RATINGS (Individual Dish Reviews)
// ==========================================================
export interface DishRating {
  itemId: string;
  name: string;
  rating: number; // 1-5
  comment?: string;
  tag?: string; // e.g. "Très savoureux", "Bien assaisonné", "Chaud", "Portion généreuse"
  sentiment?: 'LOVE' | 'LIKE' | 'AVERAGE';
}

// ==========================================================
// COURIER ROUTE & DESTINATION PROXIMITY OPTIMIZATION
// ==========================================================
export interface OptimizedRouteBundle {
  id: string;
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeDistanceMeters: number;
  customerDestination: string;
  customerLandmark: string;
  customerDistanceMeters: number; // distance from courier's current dropoff point
  corridorDetourMeters: number; // additional road detour
  estimatedExtraMinutes: number;
  bundleBonusPayoutDZD: number; // additional net cash for courier
  totalPayoutDZD: number;
  matchScorePercent: number; // synergy score (e.g. 96%)
  urgencyTag: string;
  itemsSummary: string;
  reason: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

// ==========================================================
// BATCH DELIVERY SERVICE LAYER & MULTI-STOP ROUTE ENGINE
// ==========================================================
export type BatchStopType = 'PICKUP' | 'DROPOFF';
export type BatchStopStatus = 'PENDING' | 'CURRENT' | 'COMPLETED' | 'SKIPPED';

export interface BatchRouteStop {
  id: string;
  stopNumber: number;
  type: BatchStopType;
  orderId: string;
  orderNumber: string;
  targetName: string; // Merchant name or Customer name
  roleLabel: string; // e.g. "Enlèvement Resto" or "Livraison Client"
  address: string;
  landmark?: string;
  lat: number;
  lng: number;
  estimatedArrivalMin: number; // minutes from batch start
  status: BatchStopStatus;
  itemsSummary: string;
  itemCount: number;
  phone: string;
  cashToCollectDZD: number; // 0 for pickup, order total for COD dropoff
  specialInstructions?: string;
  proofPhotoUrl?: string;
  completedAt?: string;
}

export interface BatchDeliveryOrderCandidate {
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  pickupLat: number;
  pickupLng: number;
  customerName: string;
  customerPhone: string;
  customerDestination: string;
  customerLandmark: string;
  dropoffLat: number;
  dropoffLng: number;
  readyStatus: 'READY' | 'PREPARING';
  readyTimestamp: string; // ISO or HH:MM
  readyMinutesFromNow: number; // 0 = ready now, 5 = ready in 5 mins
  totalAmountDZD: number; // COD amount
  payoutFeeDZD: number; // courier individual delivery fee
  itemsSummary: string;
  itemCount: number;
  specialInstructions?: string;
}

export interface BatchDeliveryGroup {
  id: string;
  batchCode: string;
  neighborhood: string;
  status: 'AVAILABLE' | 'ACTIVE' | 'COMPLETED';
  orders: BatchDeliveryOrderCandidate[];
  stops: BatchRouteStop[];
  currentStopIndex: number;
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  distanceSavedMeters: number;
  timeSavedMinutes: number;
  maxRadiusBetweenDropoffsMeters: number;
  readyTimeSpreadMinutes: number;
  synergyScorePercent: number;
  baseEarningsDZD: number;
  batchBonusDZD: number;
  totalCourierPayoutDZD: number;
  totalCashToCollectDZD: number;
  totalCashCollectedDZD: number;
  co2SavedGrams: number;
  createdAt: string;
}

export interface BatchEngineConfig {
  maxDestinationRadiusMeters: number; // e.g. 600m
  maxReadyTimeDiffMinutes: number; // e.g. 10 min
  maxOrdersPerBatch: number; // 2 or 3
}

// ==========================================================
// DYNAMIC MULTI-STOP CUMULATIVE ETA & TRAFFIC OFFSET TYPES
// ==========================================================
export type TrafficConditionLevel = 'FLUID' | 'MODERATE' | 'HEAVY' | 'CONGESTED';

export interface TrafficOffsetConfig {
  level: TrafficConditionLevel;
  label: string;
  multiplier: number; // transit duration factor (e.g. 1.0, 1.25, 1.60)
  fixedDelaySecondsPerKm: number; // e.g. 0s, 45s, 90s, 150s
  description: string;
  badgeColor: string;
  reportedCorridor: string;
}

export interface StopCumulativeETA {
  stopId: string;
  stopNumber: number;
  type: BatchStopType;
  targetName: string;
  address: string;
  segmentDistanceMeters: number; // distance from prior stop
  cumulativeDistanceMeters: number; // total from courier to this stop
  baseTransitSeconds: number; // transit time without traffic
  trafficOffsetSeconds: number; // delay from traffic
  serviceBufferSeconds: number; // handoff / prep time
  totalSegmentSeconds: number;
  cumulativeDurationSeconds: number; // total time from now to arrival
  cumulativeDurationMinutes: number;
  estimatedArrivalClock: string; // e.g. "13:34"
  relativeMinutesFromNow: number; // e.g. 14
  status: BatchStopStatus;
}

export interface BatchCumulativeETAResult {
  stopsETA: StopCumulativeETA[];
  totalCumulativeDistanceMeters: number;
  totalCumulativeDurationMinutes: number;
  baseTransitMinutes: number;
  trafficOffsetMinutes: number;
  serviceBufferMinutes: number;
  remainingStopsCount: number;
  finalDeliveryClock: string;
  averageSpeedKmH: number;
  traffic: TrafficOffsetConfig;
  calculatedAt: string;
}

// =========================================================================
// ARCHITECTURAL DOMAIN EXTENSIONS (RECOMMENDATIONS IMPLEMENTATION)
// =========================================================================

// 1. Fulfillment Domain (Food Preparation vs. Shopping Picking)
export type FulfillmentType = 'FOOD_PREPARATION' | 'SHOPPING_PICKING';
export type ShoppingItemPickStatus = 'REQUESTED' | 'PICKED' | 'SUBSTITUTED' | 'UNAVAILABLE';

export interface ShoppingItemSubstitution {
  originalMenuItemId: string;
  originalName: string;
  originalPriceDZD: number;
  replacementMenuItemId: string;
  replacementName: string;
  replacementPriceDZD: number;
  priceDeltaDZD: number;
  customerApproved: boolean;
}

export interface ShoppingItemDetail {
  itemId: string;
  name: string;
  requestedQty: number;
  pickedQty: number;
  priceDZD: number;
  status: ShoppingItemPickStatus;
  substitution?: ShoppingItemSubstitution;
  pickerNotes?: string;
}

export interface OrderFulfillmentRecord {
  orderId: string;
  storeId: string;
  type: FulfillmentType;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXCEPTION';
  items: ShoppingItemDetail[];
  prepTimeMinutes: number;
  startedAt?: string;
  completedAt?: string;
  pickerOrChefName: string;
  packagingDone: boolean;
  exceptionReason?: string;
}

// 2. Merchant Branch Domain
export interface MerchantBranch {
  id: string;
  merchantId: string;
  branchName: string;
  address: string;
  phone: string;
  commune: string;
  serviceZoneId: string;
  lat: number;
  lng: number;
  isOpen: boolean;
  openingHours: StoreHours[];
  deliveryRadiusMeters: number;
  prepTimeMinutes: number;
  fulfillmentType: FulfillmentType;
}

// 3. Geo & Service Zones Domain
export interface ServiceZoneDefinition {
  id: string;
  code: string;
  name: string;
  commune: string;
  centerLat: number;
  centerLng: number;
  maxRadiusMeters: number;
  baseDeliveryFeeDZD: number;
  perKmFeeDZD: number;
  minOrderDZD: number;
  surgeMultiplier: number;
  isActive: boolean;
  description: string;
}

// 4. Server-Authoritative Pricing Engine Domain
export interface PricingEngineInput {
  items: { menuItemId: string; price: number; quantity: number }[];
  storeId: string;
  zoneId?: string;
  distanceMeters?: number;
  voucherCode?: string;
  redeemedFidelityPoints?: number;
  customTipDZD?: number;
}

export interface AuthoritativePriceBreakdown {
  itemsSubtotalDZD: number;
  deliveryFeeDZD: number;
  baseDeliveryFeeDZD: number;
  distanceFeeDZD: number;
  smallOrderFeeDZD: number;
  packagingFeeDZD: number;
  platformServiceFeeDZD: number;
  surgeMultiplier: number;
  grossTotalDZD: number;
  discountDZD: number;
  voucherDeductionDZD: number;
  fidelityDeductionDZD: number;
  finalCustomerTotalDZD: number;
  merchantPayoutDZD: number;
  courierEarningsDZD: number;
  platformNetRevenueDZD: number;
  zoneCode: string;
  zoneName: string;
  distanceKm: number;
  calculatedAt: string;
  signature: string;
}

// 5. Outbox & Domain Event Architecture
export type DomainEventType =
  | 'order.placed'
  | 'order.accepted'
  | 'order.preparing'
  | 'order.picking'
  | 'order.item_substituted'
  | 'order.ready'
  | 'courier.assigned'
  | 'courier.at_pickup'
  | 'order.picked_up'
  | 'courier.location_updated'
  | 'order.arriving'
  | 'order.delivered'
  | 'order.cancelled'
  | 'order.cancellation_requested'
  | 'payment.completed';

export interface DomainEvent<T = any> {
  id: string;
  type: DomainEventType;
  aggregateId: string;
  aggregateType: 'ORDER' | 'DELIVERY' | 'FULFILLMENT' | 'PAYMENT';
  timestamp: string;
  payload: T;
  actor: {
    role: 'CUSTOMER' | 'MERCHANT' | 'COURIER' | 'SYSTEM' | 'ADMIN';
    id: string;
    name: string;
  };
  metadata?: {
    idempotencyKey?: string;
    correlationId?: string;
    version?: number;
  };
}

export interface OutboxEventRecord {
  id: string;
  event: DomainEvent;
  createdAt: string;
  status: 'PENDING' | 'DISPATCHED' | 'FAILED';
  retryCount: number;
  dispatchedAt?: string;
  error?: string;
}



