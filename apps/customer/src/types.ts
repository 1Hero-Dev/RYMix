export type Persona = 'customer' | 'courier' | 'merchant';

export type CustomerTab = 'home' | 'discovery' | 'orders' | 'messages' | 'profile';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';

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
  imageUrl: string;
  logoUrl?: string;
  tags: string[];
  notice?: string;
  commune: string;
  address: string;
  landmark: string;
  phone: string;
  menuCategories: string[];
  items: MenuItem[];
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
  landmark: string; // Crucial for Algerian deliveries: "Près de la Grande Mosquée"
  phone: string;
  recipientName: string;
  deliveryNotes?: string;
}

export interface Order {
  id: string;
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
  total: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime: string;
  paymentMethod: 'COD'; // Cash On Delivery
  paymentStatus: 'UNPAID' | 'COLLECTED';
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierAvatar?: string;
  courierRating?: number;
  courierVehicle?: string;
  deliveryAddress: DeliveryAddress;
  deliveryNotes?: string;
  cutleryOption: boolean; // Eco friendly
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
