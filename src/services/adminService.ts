import {
  Store,
  MenuItem,
  Order,
  OrderStatus,
  DynamicPromoCode,
  PlatformOperationalSettings,
  AdminManualOrderInput,
  DeliveryAddress,
  CartItem,
} from '../types';
import { MOCK_STORES } from '../data/mockData';
import { HOMEPAGE_ESSENTIAL_STORES } from '../data/essentialHomeData';
import { fidelityDB } from '../db/localDatabase';
import { UserProfile, UserRole } from '../firebase/AuthContext';
import { db, auth } from '../firebase/config';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import {
  localDispatchEngine,
  LocalCourierTelemetryPing,
  getLocalTelemetrySnapshot,
  MILA_CENTER_GPS,
  haversineDistanceMeters,
} from '../utils/localRealtimeSimulator';
import { sendPushNotification } from '../firebase/firebaseServices';

// Storage Keys
const KEY_ADMIN_STORES = 'rym_admin_managed_stores_v1';
const KEY_ADMIN_PROMOS = 'rym_admin_dynamic_promos_v1';
const KEY_ADMIN_SETTINGS = 'rym_admin_platform_settings_v1';
const KEY_ADMIN_USERS = 'rym_admin_user_directory_v1';

export const ADMIN_UPDATED_EVENT = 'rym_admin_state_updated';

function emitAdminUpdate(domain: string, payload?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADMIN_UPDATED_EVENT, { detail: { domain, payload } }));
  }
}

// Initial Promo Codes Seed
const INITIAL_PROMO_CODES: DynamicPromoCode[] = [
  {
    id: 'promo-rachedi',
    code: 'RACHEDI',
    title: 'Offre Lancement Ahmed Rachedi',
    discountType: 'fixed',
    discountDZD: 150,
    minOrderDZD: 1000,
    isActive: true,
    usageCount: 142,
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'promo-bienvenue',
    code: 'BIENVENUE',
    title: 'Cadeau de Bienvenue Nouveaux Clients',
    discountType: 'fixed',
    discountDZD: 100,
    minOrderDZD: 700,
    isActive: true,
    usageCount: 88,
    createdAt: '2026-09-05T00:00:00Z',
  },
  {
    id: 'promo-baraka',
    code: 'BARAKA',
    title: 'Livraison Offerte Club Baraka',
    discountType: 'free_delivery',
    minOrderDZD: 800,
    isActive: true,
    usageCount: 65,
    createdAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'promo-fidelite',
    code: 'FIDELITE50',
    title: 'Avantage Fidélité VIP',
    discountType: 'fixed',
    discountDZD: 50,
    minOrderDZD: 500,
    isActive: true,
    usageCount: 210,
    createdAt: '2026-09-12T00:00:00Z',
  },
  {
    id: 'promo-ramadan',
    code: 'RAMADAN',
    title: 'Pack Iftar & Soirées Gourmandes',
    discountType: 'fixed',
    discountDZD: 200,
    minOrderDZD: 1500,
    isActive: false,
    usageCount: 0,
    createdAt: '2026-09-14T00:00:00Z',
  },
];

// Initial Platform Operational Settings Seed
const INITIAL_SETTINGS: PlatformOperationalSettings = {
  launchRadiusMeters: 2000,
  maxDeliveryRadiusKm: 2.0,
  baseDeliveryFeeDZD: 150,
  freeDeliveryThresholdDZD: 1200,
  packagingFeeDZD: 50,
  surgeMultiplier: 1.0,
  maintenanceMode: false,
  announcementBanner: 'Plateforme 100% active sur Ahmed Rachedi : livraisons express en 25 min.',
  announcementBannerText: 'Plateforme 100% active sur Ahmed Rachedi : livraisons express en 25 min.',
  updatedAt: new Date().toISOString(),
};

// Initial User Directory Seed (authentic for Ahmed Rachedi)
const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'admin-boudehous-root',
    email: 'boudehous.charafeddine@gmail.com',
    displayName: 'Charafeddine Boudehous',
    role: 'admin',
    phone: '+213 555 00 11 22',
    wilaya: 'Ahmed Rachedi',
    commune: 'Centre-Ville',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-09-15T12:00:00Z',
  },
  {
    uid: 'cust-amine-43',
    email: 'amine.client@mila43.dz',
    displayName: 'Amine Benali',
    role: 'customer',
    phone: '+213 550 12 34 56',
    wilaya: 'Ahmed Rachedi',
    commune: 'Cité El Bassatine',
    createdAt: '2026-08-15T14:30:00Z',
    updatedAt: '2026-09-14T09:00:00Z',
  },
  {
    uid: 'driver-mourad-1',
    email: 'mourad.coursier@mila43.dz',
    displayName: 'Mourad Khelifi',
    role: 'driver',
    phone: '+213 551 23 45 67',
    wilaya: 'Ahmed Rachedi',
    commune: 'Boulevard 1er Novembre',
    createdAt: '2026-08-20T08:15:00Z',
    updatedAt: '2026-09-15T11:20:00Z',
  },
  {
    uid: 'shop-beniharoun-mgr',
    email: 'contact@restaurant-beniharoun.dz',
    displayName: 'Gérant Restaurant Beni Haroun',
    role: 'shop',
    phone: '+213 31 55 44 33',
    wilaya: 'Ahmed Rachedi',
    commune: 'Ahmed Rachedi Centre',
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-09-13T16:45:00Z',
  },
  {
    uid: 'driver-walid-2',
    email: 'walid.coursier@mila43.dz',
    displayName: 'Walid Mansouri',
    role: 'driver',
    phone: '+213 552 34 56 78',
    wilaya: 'Ahmed Rachedi',
    commune: 'Quartier El Moughrass',
    createdAt: '2026-08-22T09:00:00Z',
    updatedAt: '2026-09-15T07:30:00Z',
  },
  {
    uid: 'cust-karima-43',
    email: 'karima.client@mila43.dz',
    displayName: 'Karima Boudiaf',
    role: 'customer',
    phone: '+213 559 87 65 43',
    wilaya: 'Ahmed Rachedi',
    commune: 'Cité des Martyrs',
    createdAt: '2026-09-02T16:00:00Z',
    updatedAt: '2026-09-12T18:00:00Z',
  },
];

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[adminService] Error writing ${key}:`, err);
  }
}

export const adminService = {
  // =========================================================================
  // 1. STORES & RESTAURANTS MANAGEMENT
  // =========================================================================
  getStores(): Store[] {
    return readLocal<Store[]>(KEY_ADMIN_STORES, MOCK_STORES);
  },

  saveStores(stores: Store[]): void {
    writeLocal(KEY_ADMIN_STORES, stores);
    emitAdminUpdate('stores', stores);
  },

  addStore(data: {
    name: string;
    category: string;
    phone: string;
    address: string;
    landmark: string;
    deliveryFee: number;
    minOrder: number;
    prepTimeMinutes?: number;
    imageUrl?: string;
  }): Store {
    const stores = this.getStores();
    const id = `store-custom-${Date.now().toString(36)}`;
    const newStore: Store = {
      id,
      name: data.name.trim(),
      category: data.category.trim(),
      rating: 5.0,
      reviewCount: '1',
      deliveryTimeMin: data.prepTimeMinutes ? data.prepTimeMinutes + 10 : 25,
      distanceKm: 0.8,
      deliveryFee: data.deliveryFee,
      minOrder: data.minOrder,
      isOpen: true,
      prepTimeMinutes: data.prepTimeMinutes || 20,
      imageUrl:
        data.imageUrl ||
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      tags: [data.category, 'Ahmed Rachedi', 'Nouveau'],
      commune: 'Ahmed Rachedi',
      address: data.address.trim(),
      landmark: data.landmark.trim(),
      phone: data.phone.trim(),
      lat: MILA_CENTER_GPS.lat + (Math.random() - 0.5) * 0.005,
      lng: MILA_CENTER_GPS.lng + (Math.random() - 0.5) * 0.005,
      menuCategories: ['Plats Principaux', 'Boissons & Desserts'],
      items: [
        {
          id: `item-${Date.now()}-1`,
          storeId: id,
          name: `Plat Signature ${data.name}`,
          description: 'Préparation fraîche du chef avec ingrédients locaux.',
          price: 650,
          category: 'Plats Principaux',
          imageUrl:
            'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
          isAvailable: true,
          badge: 'Nouveau',
        },
      ],
    };

    const updated = [newStore, ...stores];
    this.saveStores(updated);

    // Sync to Firestore asynchronously
    try {
      setDoc(doc(db, 'stores', newStore.id), {
        id: newStore.id,
        name: newStore.name,
        category: newStore.category,
        phone: newStore.phone,
        address: newStore.address,
        landmark: newStore.landmark,
        isOpen: newStore.isOpen,
        deliveryFee: newStore.deliveryFee,
        minOrder: newStore.minOrder,
        prepTimeMinutes: newStore.prepTimeMinutes,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    } catch {}

    return newStore;
  },

  updateStore(storeId: string, updates: Partial<Store>): void {
    const stores = this.getStores();
    const updated = stores.map((s) => (s.id === storeId ? { ...s, ...updates } : s));
    this.saveStores(updated);

    // Sync partial update to Firestore
    try {
      setDoc(
        doc(db, 'stores', storeId),
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    } catch {}
  },

  toggleStoreOpen(storeId: string, isOpen: boolean): void {
    this.updateStore(storeId, { isOpen });
  },

  addMenuItem(
    storeId: string,
    itemData: {
      name: string;
      description: string;
      price: number;
      category: string;
      imageUrl?: string;
      isPopular?: boolean;
    }
  ): MenuItem {
    const stores = this.getStores();
    const store = stores.find((s) => s.id === storeId);
    const newItem: MenuItem = {
      id: `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      storeId,
      name: itemData.name.trim(),
      description: itemData.description.trim(),
      price: itemData.price,
      category: itemData.category.trim(),
      imageUrl:
        itemData.imageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      badge: itemData.isPopular ? 'Populaire' : undefined,
    };

    if (store) {
      const currentCategories = store.menuCategories.includes(itemData.category.trim())
        ? store.menuCategories
        : [...store.menuCategories, itemData.category.trim()];

      const updatedStore: Store = {
        ...store,
        menuCategories: currentCategories,
        items: [newItem, ...store.items],
      };
      this.saveStores(stores.map((s) => (s.id === storeId ? updatedStore : s)));
    }
    return newItem;
  },

  updateMenuItem(storeId: string, itemId: string, updates: Partial<MenuItem>): void {
    const stores = this.getStores();
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    const updatedItems = store.items.map((item) => {
      if (item.id === itemId) {
        const newPrice = updates.price ?? item.price;
        return {
          ...item,
          ...updates,
          price: newPrice,
        };
      }
      return item;
    });

    const updatedStore = { ...store, items: updatedItems };
    this.saveStores(stores.map((s) => (s.id === storeId ? updatedStore : s)));
  },

  toggleMenuItemStock(storeId: string, itemId: string, inStock: boolean): void {
    this.updateMenuItem(storeId, itemId, { isAvailable: inStock });
  },

  deleteMenuItem(storeId: string, itemId: string): void {
    const stores = this.getStores();
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    const updatedStore = {
      ...store,
      items: store.items.filter((item) => item.id !== itemId),
    };
    this.saveStores(stores.map((s) => (s.id === storeId ? updatedStore : s)));
  },

  // =========================================================================
  // 2. PROMOTIONS & DISCOUNT CODES ENGINE
  // =========================================================================
  getPromoCodes(): DynamicPromoCode[] {
    return readLocal<DynamicPromoCode[]>(KEY_ADMIN_PROMOS, INITIAL_PROMO_CODES);
  },

  savePromoCodes(promos: DynamicPromoCode[]): void {
    writeLocal(KEY_ADMIN_PROMOS, promos);
    emitAdminUpdate('promos', promos);
  },

  createPromoCode(data: {
    code: string;
    title: string;
    discountType: 'fixed' | 'percentage' | 'free_delivery';
    discountDZD?: number;
    percentage?: number;
    minOrderDZD: number;
    isActive?: boolean;
    expiresAt?: string;
  }): DynamicPromoCode {
    const promos = this.getPromoCodes();
    const cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, '');
    const newPromo: DynamicPromoCode = {
      id: `promo-${Date.now().toString(36)}`,
      code: cleanCode,
      title: data.title.trim(),
      discountType: data.discountType,
      discountDZD: data.discountDZD ?? (data.discountType === 'fixed' ? 100 : 0),
      percentage: data.percentage,
      minOrderDZD: data.minOrderDZD || 0,
      isActive: data.isActive !== false,
      usageCount: 0,
      expiresAt: data.expiresAt,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPromo, ...promos];
    this.savePromoCodes(updated);

    try {
      setDoc(doc(db, 'promoCodes', newPromo.id), newPromo).catch(() => {});
    } catch {}

    return newPromo;
  },

  addPromoCode(data: {
    code: string;
    title: string;
    discountType: 'fixed' | 'percentage' | 'free_delivery';
    discountDZD?: number;
    percentage?: number;
    minOrderDZD?: number;
    expiresAt?: string;
    isActive?: boolean;
  }): DynamicPromoCode {
    return this.createPromoCode(data);
  },

  togglePromoCode(promoId: string, isActive: boolean): void {
    const promos = this.getPromoCodes();
    const updated = promos.map((p) => (p.id === promoId ? { ...p, isActive } : p));
    this.savePromoCodes(updated);

    try {
      setDoc(doc(db, 'promoCodes', promoId), { isActive }, { merge: true }).catch(() => {});
    } catch {}
  },

  togglePromoActive(promoId: string, isActive: boolean): void {
    this.togglePromoCode(promoId, isActive);
  },

  deletePromoCode(promoId: string): void {
    const promos = this.getPromoCodes();
    const updated = promos.filter((p) => p.id !== promoId);
    this.savePromoCodes(updated);
  },

  validatePromoCode(
    inputCode: string,
    subtotal: number,
    deliveryFee: number = 150
  ): {
    valid: boolean;
    discountDZD: number;
    label: string;
    code: string;
    error?: string;
  } {
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      return { valid: false, discountDZD: 0, label: '', code: '', error: 'Code vide' };
    }

    const promos = this.getPromoCodes();
    const found = promos.find((p) => p.code === clean);

    if (!found) {
      return {
        valid: false,
        discountDZD: 0,
        label: '',
        code: clean,
        error: `Code "${clean}" non reconnu ou invalide à Ahmed Rachedi.`,
      };
    }

    if (!found.isActive) {
      return {
        valid: false,
        discountDZD: 0,
        label: '',
        code: clean,
        error: `Le code "${clean}" est actuellement désactivé.`,
      };
    }

    if (found.minOrderDZD > 0 && subtotal < found.minOrderDZD) {
      return {
        valid: false,
        discountDZD: 0,
        label: '',
        code: clean,
        error: `Le code ${clean} requiert un minimum de ${found.minOrderDZD.toLocaleString()} DZD d'achats (actuel: ${subtotal.toLocaleString()} DZD).`,
      };
    }

    let discount = 0;
    if (found.discountType === 'fixed') {
      discount = found.discountDZD || 0;
    } else if (found.discountType === 'percentage') {
      const pct = found.percentage || 10;
      discount = Math.round((subtotal * pct) / 100);
    } else if (found.discountType === 'free_delivery') {
      discount = deliveryFee;
    }

    // Ensure discount does not exceed subtotal
    discount = Math.min(discount, subtotal + deliveryFee);

    return {
      valid: true,
      discountDZD: discount,
      label: `${found.title} (-${discount.toLocaleString()} DZD)`,
      code: found.code,
    };
  },

  recordPromoRedemption(code: string): void {
    const promos = this.getPromoCodes();
    const clean = code.trim().toUpperCase();
    const updated = promos.map((p) =>
      p.code === clean ? { ...p, usageCount: (p.usageCount || 0) + 1 } : p
    );
    this.savePromoCodes(updated);
  },

  // =========================================================================
  // 3. FLEET & COURIERS MANAGEMENT
  // =========================================================================
  getCouriers(): LocalCourierTelemetryPing[] {
    return getLocalTelemetrySnapshot();
  },

  addCourier(data: {
    name: string;
    phone: string;
    vehicle: string;
    rating?: number;
  }): LocalCourierTelemetryPing {
    const newCourier: LocalCourierTelemetryPing = {
      courierId: `courier-new-${Date.now().toString(36)}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      vehicle: data.vehicle,
      lat: MILA_CENTER_GPS.lat + (Math.random() - 0.5) * 0.004,
      lng: MILA_CENTER_GPS.lng + (Math.random() - 0.5) * 0.004,
      speedKmh: 24,
      headingDeg: 90,
      activeOrders: 0,
      rating: data.rating || 4.9,
      lastPingTimestamp: Date.now(),
      freshness: 'LIVE',
      distanceToMilaCenterMeters: 450,
      eligible2KmRadius: true,
    };

    localDispatchEngine.registerNewCourier(newCourier);
    emitAdminUpdate('fleet', newCourier);
    return newCourier;
  },

  toggleCourierOnline(courierId: string, isOnline: boolean): void {
    localDispatchEngine.toggleCourierStatus(courierId, isOnline);
    emitAdminUpdate('fleet');
  },

  repositionCourier(courierId: string, lat: number, lng: number, speedKmh: number = 25): void {
    const dist = haversineDistanceMeters(lat, lng, MILA_CENTER_GPS.lat, MILA_CENTER_GPS.lng);
    localDispatchEngine.injectTelemetryPing(courierId, {
      lat,
      lng,
      speedKmh,
      distanceToMilaCenterMeters: dist,
      eligible2KmRadius: dist <= this.getSettings().launchRadiusMeters,
    });
    emitAdminUpdate('fleet');
  },

  // =========================================================================
  // 4. USERS & RBAC & FIDELITY MANAGEMENT
  // =========================================================================
  getUsers(): UserProfile[] {
    return readLocal<UserProfile[]>(KEY_ADMIN_USERS, INITIAL_USERS);
  },

  saveUsers(users: UserProfile[]): void {
    writeLocal(KEY_ADMIN_USERS, users);
    emitAdminUpdate('users', users);
  },

  updateUserRole(uid: string, newRole: UserRole): void {
    const users = this.getUsers();
    const updated = users.map((u) => (u.uid === uid ? { ...u, role: newRole, updatedAt: new Date().toISOString() } : u));
    this.saveUsers(updated);

    // Sync to Firestore
    try {
      setDoc(doc(db, 'users', uid), { role: newRole, updatedAt: new Date().toISOString() }, { merge: true }).catch(
        () => {}
      );
    } catch {}
  },

  createUser(data: {
    displayName: string;
    email: string;
    phone: string;
    role: UserRole;
    commune?: string;
  }): UserProfile {
    const users = this.getUsers();
    const uid = `user-created-${Date.now().toString(36)}`;
    const newUser: UserProfile = {
      uid,
      displayName: data.displayName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      role: data.role,
      wilaya: 'Ahmed Rachedi',
      commune: data.commune || 'Ahmed Rachedi Centre',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newUser, ...users];
    this.saveUsers(updated);

    try {
      setDoc(doc(db, 'users', uid), newUser).catch(() => {});
    } catch {}

    return newUser;
  },

  addUser(data: {
    displayName: string;
    email: string;
    phone: string;
    role: UserRole;
    commune?: string;
  }): UserProfile {
    return this.createUser(data);
  },

  adjustFidelityPoints(pointsDelta: number, reason: string): number {
    fidelityDB.addBonusPoints(pointsDelta, `[Admin] ${reason}`);
    emitAdminUpdate('users');
    return fidelityDB.getProfile().pointsBalance;
  },

  adjustUserPoints(pointsDelta: number, reason: string): number {
    return this.adjustFidelityPoints(pointsDelta, reason);
  },

  // =========================================================================
  // 5. PLATFORM OPERATIONAL SETTINGS & MAINTENANCE KILL SWITCH
  // =========================================================================
  getSettings(): PlatformOperationalSettings {
    return readLocal<PlatformOperationalSettings>(KEY_ADMIN_SETTINGS, INITIAL_SETTINGS);
  },

  saveSettings(settings: PlatformOperationalSettings): void {
    writeLocal(KEY_ADMIN_SETTINGS, settings);
    emitAdminUpdate('settings', settings);

    try {
      setDoc(doc(db, 'systemSettings', 'operational'), settings, { merge: true }).catch(() => {});
    } catch {}
  },

  updateSettings(updates: Partial<PlatformOperationalSettings>): PlatformOperationalSettings {
    const current = this.getSettings();
    const next: PlatformOperationalSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveSettings(next);
    return next;
  },

  toggleMaintenanceMode(enabled: boolean): void {
    this.updateSettings({ maintenanceMode: enabled });
  },

  // =========================================================================
  // 6. DIRECT MANUAL PHONE ORDER DISPATCH (FOR PHONE ORDERS)
  // =========================================================================
  createManualPhoneOrder(input: AdminManualOrderInput, availableStores?: Store[]): Order {
    const storesList = availableStores && availableStores.length > 0 ? availableStores : this.getStores();
    const store = storesList.find((s) => s.id === input.storeId) || storesList[0];
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNumber = `AR-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const orderId = `ord-manual-${Date.now().toString(36)}`;

    const deliveryAddress: DeliveryAddress = {
      id: `addr-phone-${Date.now()}`,
      label: 'Commande Directe Téléphone',
      wilaya: 'Ahmed Rachedi',
      commune: input.commune || 'Ahmed Rachedi Centre',
      street: input.street || 'Centre-Ville',
      building: 'Centre Commercial / Habitat',
      floor: 'RDC',
      landmark: input.landmark || 'Près de la Mairie',
      phone: input.customerPhone,
      recipientName: input.customerName,
      deliveryNotes: input.notes || 'Pris par le standard Admin/Dispatch.',
    };

    const cartItems: CartItem[] = input.items.map((item) => ({
      menuItemId: item.menuItemId,
      storeId: store.id,
      storeName: store.name,
      name: item.name,
      basePrice: item.price,
      price: item.price,
      quantity: item.quantity,
      imageUrl: store.imageUrl,
      options: [],
    }));

    const packagingFee = 50;
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'CONFIRMED',
      subtotal,
      deliveryFee: input.deliveryFee,
      packagingFee,
      discount: 0,
      total: subtotal + input.deliveryFee + packagingFee,
      items: cartItems,
      storeId: store.id,
      storeName: store.name,
      storeCategory: store.category,
      storeImageUrl: store.imageUrl,
      deliveryAddress,
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      estimatedDeliveryTime: '25 min',
      estimatedDeliveryTimeRange: '20–25 min',
      cutleryOption: false,
      statusTimeline: [
        {
          status: 'PENDING',
          label: 'Reçue',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
          current: false,
        },
        {
          status: 'CONFIRMED',
          label: 'Confirmée par Admin',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
          current: true,
        },
      ],
      idempotencyKey: `phone_admin_${orderId}`,
      statusHistory: [
        {
          id: `hist-${Date.now()}-1`,
          fromStatus: 'PENDING',
          toStatus: 'CONFIRMED',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actorRole: 'SYSTEM',
          actorName: 'Dispatch Central Ahmed Rachedi',
          note: 'Commande téléphonique saisie directement par l\'administrateur.',
        },
      ],
      delivery: {
        id: `deliv-${orderId}`,
        orderId,
        courierId: 'courier-walid',
        courierName: 'Walid M. (Assigné Central)',
        courierPhone: '+213 552 34 56 78',
        courierAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        courierVehicle: 'Moto 125cc',
        status: 'ACCEPTED',
        distanceMeters: 850,
        estimatedDurationMin: 18,
        feeSnapshot: input.deliveryFee,
        pickup: {
          storeId: store.id,
          storeName: store.name,
          address: store.address,
          landmark: store.landmark,
          phone: store.phone || '+213 550 00 00 00',
          lat: store.lat || MILA_CENTER_GPS.lat,
          lng: store.lng || MILA_CENTER_GPS.lng,
        },
        dropoff: {
          recipientName: input.customerName,
          phone: input.customerPhone,
          address: input.street || 'Ahmed Rachedi Centre',
          landmark: deliveryAddress.landmark,
          lat: MILA_CENTER_GPS.lat + 0.002,
          lng: MILA_CENTER_GPS.lng + 0.002,
        },
      },
    };

    emitAdminUpdate('orders', newOrder);
    return newOrder;
  },

  // =========================================================================
  // 7. NOTIFICATION BROADCAST & CLOUD EXPORT
  // =========================================================================
  broadcastNotification(
    targetRole: 'customer' | 'driver' | 'shop' | 'all',
    title: string,
    message: string
  ): void {
    sendPushNotification(targetRole, title, message, {
      sender: 'Admin Console Ahmed Rachedi',
      sentAt: new Date().toISOString(),
    });
  },

  broadcastAnnouncement(
    title: string,
    message: string,
    audience: 'ALL' | 'DRIVERS' | 'MERCHANTS'
  ): void {
    const roleMap: Record<string, 'customer' | 'driver' | 'shop' | 'all'> = {
      ALL: 'all',
      DRIVERS: 'driver',
      MERCHANTS: 'shop',
    };
    this.broadcastNotification(roleMap[audience] || 'all', title, message);
  },

  async syncAllToFirestore(): Promise<{ success: boolean; syncedAt: string; error?: string }> {
    try {
      const stores = this.getStores();
      const promos = this.getPromoCodes();
      const settings = this.getSettings();
      const users = this.getUsers();

      // Sync settings
      await setDoc(doc(db, 'systemSettings', 'operational'), settings, { merge: true });

      // Sync stores
      for (const store of stores) {
        await setDoc(doc(db, 'stores', store.id), store, { merge: true });
      }

      // Sync promos
      for (const promo of promos) {
        await setDoc(doc(db, 'promoCodes', promo.id), promo, { merge: true });
      }

      // Sync users
      for (const u of users) {
        await setDoc(doc(db, 'users', u.uid), u, { merge: true });
      }

      return {
        success: true,
        syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (err: any) {
      return {
        success: false,
        syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: err.message || 'Erreur de synchronisation Firestore',
      };
    }
  },

  exportFullAuditJSON(): string {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'RYM Super-App Ahmed Rachedi',
      adminUser: 'boudehous.charafeddine@gmail.com',
      settings: this.getSettings(),
      storesCount: this.getStores().length,
      promosCount: this.getPromoCodes().length,
      usersCount: this.getUsers().length,
      stores: this.getStores(),
      promotions: this.getPromoCodes(),
      users: this.getUsers(),
    };
    return JSON.stringify(payload, null, 2);
  },
};
