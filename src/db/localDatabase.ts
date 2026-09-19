import {
  CustomerFidelityProfile,
  FidelityTransaction,
  LoyaltyVoucher,
  MerchantReview,
  CourierReview,
  PurchasingHistoryRecord,
  FidelityTier,
  Order,
} from '../types';
import { DEFAULT_ADDRESS, MOCK_STORES } from '../data/mockData';

// Storage Keys
const KEY_FIDELITY = 'rym_db_fidelity_profile_v1';
const KEY_MERCHANT_REVIEWS = 'rym_db_merchant_reviews_v1';
const KEY_COURIER_REVIEWS = 'rym_db_courier_reviews_v1';
const KEY_PURCHASING_HISTORY = 'rym_db_purchasing_history_v1';

// Custom Event for Live React Component Updates
export const DATABASE_UPDATED_EVENT = 'rym_local_database_updated';

function notifyDatabaseUpdate(detail?: { table: string; action: string }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATABASE_UPDATED_EVENT, { detail }));
  }
}

// Helper for safe localStorage reading
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[LocalDatabase] Error reading key "${key}":`, err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[LocalDatabase] Error writing key "${key}":`, err);
  }
}

// ==========================================================
// 1. SEED DATA GENERATION (Authentic to Ahmed Rachedi)
// ==========================================================
const INITIAL_FIDELITY_PROFILE: CustomerFidelityProfile = {
  userId: 'user-amine-43',
  userName: 'Amine Benali',
  phone: '+213 550 12 34 56',
  wilaya: 'Ahmed Rachedi',
  pointsBalance: 850,
  lifetimeEarned: 1450,
  lifetimeSpent: 600,
  tier: 'GOLD',
  pointsMultiplier: 1.25, // Gold tier gives +25% bonus points on every order in Ahmed Rachedi
  vouchers: [
    {
      id: 'vouch-1',
      code: 'RACHEDI-GOLD-200',
      title: 'Bon Réduction Terroir Ahmed Rachedi',
      discountDZD: 200,
      pointsCost: 200,
      minSpendDZD: 1000,
      isUsed: false,
      expiresAt: '2026-10-31',
    },
    {
      id: 'vouch-2',
      code: 'BENI-HAROUN-300',
      title: 'Remise Spéciale Beni Haroun',
      discountDZD: 300,
      pointsCost: 300,
      minSpendDZD: 1500,
      isUsed: false,
      expiresAt: '2026-11-15',
    },
    {
      id: 'vouch-3',
      code: 'EXPRESS-RACHEDI-100',
      title: 'Livraison Offerte Cité El Bassatine',
      discountDZD: 100,
      pointsCost: 100,
      minSpendDZD: 800,
      isUsed: true,
      expiresAt: '2026-09-01',
    },
  ],
  transactions: [
    {
      id: 'txn-1',
      type: 'BONUS_WELCOME',
      points: 200,
      description: 'Cadeau de bienvenue Club VIP Ahmed Rachedi',
      timestamp: 'Il y a 14 jours',
    },
    {
      id: 'txn-2',
      orderId: 'order-4289',
      orderNumber: '#HB-4289',
      type: 'EARN',
      points: 100,
      amountDZD: 1000,
      description: 'Commande Pâtisserie La Citadelle d\'Ahmed Rachedi',
      timestamp: 'Hier à 16:30',
    },
    {
      id: 'txn-3',
      orderId: 'order-4301',
      orderNumber: '#HB-4301',
      type: 'EARN',
      points: 85,
      amountDZD: 850,
      description: 'Achat Supérette Marché Ahmed Rachedi',
      timestamp: "Aujourd'hui à 10:15",
    },
    {
      id: 'txn-4',
      type: 'BONUS_REVIEW',
      points: 50,
      description: 'Avis vérifié déposé sur le coursier Walid M.',
      timestamp: 'Il y a 2 jours',
    },
  ],
};

const INITIAL_MERCHANT_REVIEWS: MerchantReview[] = [
  {
    id: 'rev-m-1',
    storeId: 'store-beniharoun',
    storeName: 'Restaurant Beni Haroun - Poissons & Grillades',
    orderId: 'order-4308',
    orderNumber: '#HB-4308',
    customerId: 'user-amine-43',
    customerName: 'Amine Benali',
    customerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuN2_w-EBNtEXJguBVUeD5bfr4lhFYP9v-b1VFSGROFgx6RXqoF5GL9ooQUB3VjQoQ4Vf6aJyJvt4-UM1Zq1temtjmArdLxFCleb3mp8EFzcpHJsuMXGOHdLa6fuol7ilUBCci6mfacs12VyQWsAZNHp0pkoYUGqyZNTkYh30tf011opO1qtvgoPeMkIhM_eGtTVj7ra-ec0R_7Fy9TD3CWRApTQszxxQXb5hf_wx7SD5qVWzZs1OO',
    overallRating: 5,
    criteria: {
      foodTaste: 5,
      packaging: 5,
      speed: 4,
      portionSize: 5,
    },
    comment: 'Chawarma d’une fraîcheur remarquable, viande marinée très tendre et portions très généreuses. Recommandé à 100% à Ahmed Rachedi !',
    tags: ['Chaud & Frais', 'Portion Généreuse', '100% Viande Locale', 'Emballage Soigné'],
    merchantReply: {
      text: 'Chokran jazilan khoya Amine ! Au plaisir de vous régaler à nouveau à El Bassatine.',
      repliedAt: 'Il y a 3 heures',
    },
    createdAt: 'Hier à 19:40',
    verifiedPurchase: true,
  },
  {
    id: 'rev-m-2',
    storeId: 'store-patisserie',
    storeName: 'Pâtisserie & Salon La Citadelle d\'Ahmed Rachedi',
    orderId: 'order-4289',
    orderNumber: '#HB-4289',
    customerId: 'user-amine-43',
    customerName: 'Amine Benali',
    overallRating: 5,
    criteria: {
      foodTaste: 5,
      packaging: 5,
      speed: 5,
      portionSize: 4,
    },
    comment: 'Baklawa et Makroudh au miel de pure tradition d\'Ahmed Rachedi. Boîte très soignée.',
    tags: ['Emballage Soigné', 'Cuisine Authentique'],
    createdAt: 'Hier à 17:15',
    verifiedPurchase: true,
  },
  {
    id: 'rev-m-3',
    storeId: 'store-supermarket',
    storeName: 'Marché Ahmed Rachedi - Supérette 24h',
    orderId: 'order-4301',
    orderNumber: '#HB-4301',
    customerId: 'user-karim-43',
    customerName: 'Karim D.',
    overallRating: 4,
    criteria: {
      foodTaste: 4,
      packaging: 4,
      speed: 5,
      portionSize: 5,
    },
    comment: 'Lait de Chelghoum Laïd frais et huile d’olive reçus impeccablement emballés.',
    tags: ['Produits Frais', 'Rapide'],
    createdAt: "Aujourd'hui à 11:00",
    verifiedPurchase: true,
  },
];

const INITIAL_COURIER_REVIEWS: CourierReview[] = [
  {
    id: 'rev-c-1',
    courierId: 'courier-walid-43',
    courierName: 'Walid M.',
    orderId: 'order-4301',
    orderNumber: '#HB-4301',
    customerId: 'user-amine-43',
    customerName: 'Amine Benali',
    customerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuN2_w-EBNtEXJguBVUeD5bfr4lhFYP9v-b1VFSGROFgx6RXqoF5GL9ooQUB3VjQoQ4Vf6aJyJvt4-UM1Zq1temtjmArdLxFCleb3mp8EFzcpHJsuMXGOHdLa6fuol7ilUBCci6mfacs12VyQWsAZNHp0pkoYUGqyZNTkYh30tf011opO1qtvgoPeMkIhM_eGtTVj7ra-ec0R_7Fy9TD3CWRApTQszxxQXb5hf_wx7SD5qVWzZs1OO',
    rating: 5,
    criteria: {
      punctuality: 5,
      politeness: 5,
      routeRespect: 5,
      foodHandling: 5,
    },
    complimentTags: ['Ponctuel', 'Souriant & Poli', 'Respecte le code routier', 'Sac thermique propre'],
    tipAmountDZD: 100,
    feedbackNote: 'Livreur d’une grande gentillesse, arrivé en avance avec la commande bien chaude !',
    createdAt: "Aujourd'hui à 10:45",
  },
  {
    id: 'rev-c-2',
    courierId: 'courier-walid-43',
    courierName: 'Walid M.',
    orderId: 'order-4289',
    orderNumber: '#HB-4289',
    customerId: 'user-sara-43',
    customerName: 'Sara K.',
    rating: 5,
    criteria: {
      punctuality: 5,
      politeness: 5,
      routeRespect: 5,
      foodHandling: 5,
    },
    complimentTags: ['Ponctuel', 'Respecte le code routier'],
    tipAmountDZD: 50,
    feedbackNote: 'Conduite très sécurisée dans la descente d\'El Bassatine. Merci Walid !',
    createdAt: 'Hier à 17:00',
  },
];

const INITIAL_PURCHASING_HISTORY: PurchasingHistoryRecord[] = [
  {
    id: 'order-4301',
    orderNumber: '#HB-4301',
    receiptNumber: 'REC-RACHEDI-2026-4301',
    userId: 'user-amine-43',
    storeId: 'store-supermarket',
    storeName: 'Marché Ahmed Rachedi - Supérette 24h & Terroir',
    storeCategory: 'Alimentation Générale & Terroir',
    storeImageUrl: MOCK_STORES[1].imageUrl,
    items: [
      {
        menuItemId: 'gro-1',
        storeId: 'store-supermarket',
        storeName: 'Marché Ahmed Rachedi',
        name: "Huile d'Olive Vierge Extra d'Ahmed Rachedi (1L)",
        basePrice: 600,
        quantity: 1,
        imageUrl: MOCK_STORES[1].items[0].imageUrl,
        options: [],
      },
      {
        menuItemId: 'gro-2',
        storeId: 'store-supermarket',
        storeName: 'Marché Ahmed Rachedi',
        name: 'Lait Frais Pasteurisé Local',
        basePrice: 180,
        quantity: 2,
        imageUrl: MOCK_STORES[1].items[1].imageUrl,
        options: [],
      },
    ],
    subtotal: 780,
    deliveryFee: 100,
    packagingFee: 20,
    discount: 50,
    voucherCodeUsed: 'RACHEDI-EXPRESS-50',
    pointsEarned: 85,
    pointsRedeemed: 0,
    total: 850,
    currency: 'DZD',
    paymentMethod: 'COD',
    paymentStatus: 'COLLECTED',
    deliveryAddress: DEFAULT_ADDRESS,
    courierId: 'courier-walid-43',
    courierName: 'Walid M.',
    courierPhone: '+213 551 22 33 44',
    orderedAt: "Aujourd'hui à 10:15",
    deliveredAt: "Aujourd'hui à 10:45",
    isRatedMerchant: true,
    isRatedCourier: true,
  },
  {
    id: 'order-4289',
    orderNumber: '#HB-4289',
    receiptNumber: 'REC-RACHEDI-2026-4289',
    userId: 'user-amine-43',
    storeId: 'store-patisserie',
    storeName: 'Pâtisserie & Salon La Citadelle d\'Ahmed Rachedi',
    storeCategory: 'Pâtisseries Traditionnelles & Thés',
    storeImageUrl: MOCK_STORES[2].imageUrl,
    items: [
      {
        menuItemId: 'pat-1',
        storeId: 'store-patisserie',
        storeName: 'La Citadelle d\'Ahmed Rachedi',
        name: 'Boîte Assortiment Makroudh & Baklawa (6 pcs)',
        basePrice: 850,
        quantity: 1,
        imageUrl: MOCK_STORES[2].items[0].imageUrl,
        options: [],
      },
    ],
    subtotal: 850,
    deliveryFee: 110,
    packagingFee: 40,
    discount: 0,
    pointsEarned: 100,
    pointsRedeemed: 0,
    total: 1000,
    currency: 'DZD',
    paymentMethod: 'COD',
    paymentStatus: 'COLLECTED',
    deliveryAddress: DEFAULT_ADDRESS,
    courierId: 'courier-walid-43',
    courierName: 'Walid M.',
    courierPhone: '+213 551 22 33 44',
    orderedAt: 'Hier à 16:30',
    deliveredAt: 'Hier à 17:02',
    isRatedMerchant: true,
    isRatedCourier: true,
  },
];

// ==========================================================
// 2. FIDELITY DATABASE REPOSITORY
// ==========================================================
export const fidelityDB = {
  getProfile(): CustomerFidelityProfile {
    return loadFromStorage<CustomerFidelityProfile>(KEY_FIDELITY, INITIAL_FIDELITY_PROFILE);
  },

  updateProfile(updated: CustomerFidelityProfile): void {
    saveToStorage(KEY_FIDELITY, updated);
    notifyDatabaseUpdate({ table: 'fidelity', action: 'update' });
  },

  // Calculate points to earn: 1 point per 10 DZD spent * tier multiplier
  calculatePointsForAmount(amountDZD: number, tier: FidelityTier): number {
    const base = Math.floor(amountDZD / 10);
    const multiplier = tier === 'VIP_BARAKA' ? 2.0 : tier === 'GOLD' ? 1.25 : tier === 'SILVER' ? 1.1 : 1.0;
    return Math.round(base * multiplier);
  },

  earnPoints(params: {
    orderId?: string;
    orderNumber?: string;
    amountDZD: number;
    description: string;
  }): { pointsEarned: number; newBalance: number } {
    const profile = this.getProfile();
    const pointsEarned = this.calculatePointsForAmount(params.amountDZD, profile.tier);

    const newTxn: FidelityTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      type: 'EARN',
      points: pointsEarned,
      amountDZD: params.amountDZD,
      description: params.description,
      timestamp: 'À l’instant',
    };

    const newBalance = profile.pointsBalance + pointsEarned;
    const newLifetime = profile.lifetimeEarned + pointsEarned;

    // Evaluate tier advancement
    let nextTier: FidelityTier = profile.tier;
    let nextMultiplier = profile.pointsMultiplier;
    if (newLifetime >= 2500) {
      nextTier = 'VIP_BARAKA';
      nextMultiplier = 2.0;
    } else if (newLifetime >= 1000) {
      nextTier = 'GOLD';
      nextMultiplier = 1.25;
    } else if (newLifetime >= 500) {
      nextTier = 'SILVER';
      nextMultiplier = 1.1;
    }

    const updatedProfile: CustomerFidelityProfile = {
      ...profile,
      pointsBalance: newBalance,
      lifetimeEarned: newLifetime,
      tier: nextTier,
      pointsMultiplier: nextMultiplier,
      transactions: [newTxn, ...profile.transactions],
    };

    this.updateProfile(updatedProfile);
    return { pointsEarned, newBalance };
  },

  addBonusPoints(points: number, reason: string): { newBalance: number } {
    const profile = this.getProfile();
    const newTxn: FidelityTransaction = {
      id: `txn-bonus-${Date.now()}`,
      type: 'BONUS_REVIEW',
      points,
      description: reason,
      timestamp: 'À l’instant',
    };

    const updated: CustomerFidelityProfile = {
      ...profile,
      pointsBalance: profile.pointsBalance + points,
      lifetimeEarned: profile.lifetimeEarned + points,
      transactions: [newTxn, ...profile.transactions],
    };

    this.updateProfile(updated);
    return { newBalance: updated.pointsBalance };
  },

  redeemVoucher(voucherId: string): boolean {
    const profile = this.getProfile();
    const voucherIndex = profile.vouchers.findIndex((v) => v.id === voucherId);
    if (voucherIndex === -1) return false;

    const voucher = profile.vouchers[voucherIndex];
    if (voucher.isUsed) return false;

    profile.vouchers[voucherIndex].isUsed = true;
    this.updateProfile(profile);
    return true;
  },

  createVoucherFromPoints(voucherDef: {
    title: string;
    discountDZD: number;
    pointsCost: number;
    minSpendDZD: number;
  }): { success: boolean; voucher?: LoyaltyVoucher; message: string } {
    const profile = this.getProfile();
    if (profile.pointsBalance < voucherDef.pointsCost) {
      return { success: false, message: 'Solde de points insuffisant.' };
    }

    const newVoucher: LoyaltyVoucher = {
      id: `vouch-${Date.now()}`,
      code: `MILA-${voucherDef.discountDZD}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      title: voucherDef.title,
      discountDZD: voucherDef.discountDZD,
      pointsCost: voucherDef.pointsCost,
      minSpendDZD: voucherDef.minSpendDZD,
      isUsed: false,
      expiresAt: '2026-12-31',
    };

    const newTxn: FidelityTransaction = {
      id: `txn-burn-${Date.now()}`,
      type: 'REDEEM',
      points: -voucherDef.pointsCost,
      amountDZD: voucherDef.discountDZD,
      description: `Échange contre ${newVoucher.title} (${voucherDef.discountDZD} DZD)`,
      timestamp: 'À l’instant',
    };

    const updated: CustomerFidelityProfile = {
      ...profile,
      pointsBalance: profile.pointsBalance - voucherDef.pointsCost,
      lifetimeSpent: profile.lifetimeSpent + voucherDef.pointsCost,
      vouchers: [newVoucher, ...profile.vouchers],
      transactions: [newTxn, ...profile.transactions],
    };

    this.updateProfile(updated);
    return { success: true, voucher: newVoucher, message: 'Bon d’achat généré avec succès !' };
  },
};

// ==========================================================
// 3. MERCHANT RATINGS DATABASE REPOSITORY
// ==========================================================
export const merchantRatingsDB = {
  getAllReviews(): MerchantReview[] {
    return loadFromStorage<MerchantReview[]>(KEY_MERCHANT_REVIEWS, INITIAL_MERCHANT_REVIEWS);
  },

  getReviewsForStore(storeId: string): MerchantReview[] {
    return this.getAllReviews().filter((r) => r.storeId === storeId);
  },

  addReview(review: Omit<MerchantReview, 'id' | 'createdAt'>): MerchantReview {
    const all = this.getAllReviews();
    const newReview: MerchantReview = {
      ...review,
      id: `rev-m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: 'À l’instant',
    };

    saveToStorage(KEY_MERCHANT_REVIEWS, [newReview, ...all]);
    notifyDatabaseUpdate({ table: 'merchant_reviews', action: 'insert' });

    // Automatically mark the order as merchant rated in purchasing history
    purchasingHistoryDB.markRated(review.orderId, { merchant: true });

    // Award loyalty points bonus for feedback (+50 pts)
    fidelityDB.addBonusPoints(
      50,
      `Avis vérifié sur ${review.storeName} (${newReview.overallRating}★)`
    );

    return newReview;
  },

  getStoreStats(storeId: string): {
    averageRating: number;
    reviewCount: number;
    criteriaAverages: { foodTaste: number; packaging: number; speed: number; portionSize: number };
    topTags: { tag: string; count: number }[];
  } {
    const reviews = this.getReviewsForStore(storeId);
    if (reviews.length === 0) {
      return {
        averageRating: 4.8,
        reviewCount: 0,
        criteriaAverages: { foodTaste: 4.9, packaging: 4.8, speed: 4.7, portionSize: 4.9 },
        topTags: [],
      };
    }

    const total = reviews.reduce((sum, r) => sum + r.overallRating, 0);
    const avg = Number((total / reviews.length).toFixed(1));

    const criteriaTotals = reviews.reduce(
      (acc, r) => ({
        foodTaste: acc.foodTaste + r.criteria.foodTaste,
        packaging: acc.packaging + r.criteria.packaging,
        speed: acc.speed + r.criteria.speed,
        portionSize: acc.portionSize + r.criteria.portionSize,
      }),
      { foodTaste: 0, packaging: 0, speed: 0, portionSize: 0 }
    );

    const tagCounts: Record<string, number> = {};
    reviews.forEach((r) =>
      r.tags.forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      })
    );

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return {
      averageRating: avg,
      reviewCount: reviews.length,
      criteriaAverages: {
        foodTaste: Number((criteriaTotals.foodTaste / reviews.length).toFixed(1)),
        packaging: Number((criteriaTotals.packaging / reviews.length).toFixed(1)),
        speed: Number((criteriaTotals.speed / reviews.length).toFixed(1)),
        portionSize: Number((criteriaTotals.portionSize / reviews.length).toFixed(1)),
      },
      topTags,
    };
  },
};

// ==========================================================
// 4. COURIER RATINGS DATABASE REPOSITORY
// ==========================================================
export const courierRatingsDB = {
  getAllReviews(): CourierReview[] {
    return loadFromStorage<CourierReview[]>(KEY_COURIER_REVIEWS, INITIAL_COURIER_REVIEWS);
  },

  getReviewsForCourier(courierId: string): CourierReview[] {
    return this.getAllReviews().filter((r) => r.courierId === courierId);
  },

  addReview(review: Omit<CourierReview, 'id' | 'createdAt'>): CourierReview {
    const all = this.getAllReviews();
    const newReview: CourierReview = {
      ...review,
      id: `rev-c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: 'À l’instant',
    };

    saveToStorage(KEY_COURIER_REVIEWS, [newReview, ...all]);
    notifyDatabaseUpdate({ table: 'courier_reviews', action: 'insert' });

    // Mark courier as rated in purchasing history
    purchasingHistoryDB.markRated(review.orderId, { courier: true });

    // Award bonus fidelity points (+30 pts)
    fidelityDB.addBonusPoints(
      30,
      `Évaluation du livreur ${review.courierName} (${newReview.rating}★)`
    );

    return newReview;
  },

  getCourierStats(courierId: string): {
    averageRating: number;
    reviewCount: number;
    totalTipsDZD: number;
    criteriaAverages: { punctuality: number; politeness: number; routeRespect: number; foodHandling: number };
    topCompliments: { tag: string; count: number }[];
  } {
    const reviews = this.getReviewsForCourier(courierId);
    if (reviews.length === 0) {
      return {
        averageRating: 4.9,
        reviewCount: 0,
        totalTipsDZD: 0,
        criteriaAverages: { punctuality: 4.9, politeness: 5.0, routeRespect: 4.8, foodHandling: 4.9 },
        topCompliments: [],
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const totalTips = reviews.reduce((sum, r) => sum + (r.tipAmountDZD || 0), 0);

    const criteriaTotals = reviews.reduce(
      (acc, r) => ({
        punctuality: acc.punctuality + r.criteria.punctuality,
        politeness: acc.politeness + r.criteria.politeness,
        routeRespect: acc.routeRespect + r.criteria.routeRespect,
        foodHandling: acc.foodHandling + r.criteria.foodHandling,
      }),
      { punctuality: 0, politeness: 0, routeRespect: 0, foodHandling: 0 }
    );

    const tagCounts: Record<string, number> = {};
    reviews.forEach((r) =>
      r.complimentTags.forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      })
    );

    const topCompliments = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return {
      averageRating: Number((totalRating / reviews.length).toFixed(1)),
      reviewCount: reviews.length,
      totalTipsDZD: totalTips,
      criteriaAverages: {
        punctuality: Number((criteriaTotals.punctuality / reviews.length).toFixed(1)),
        politeness: Number((criteriaTotals.politeness / reviews.length).toFixed(1)),
        routeRespect: Number((criteriaTotals.routeRespect / reviews.length).toFixed(1)),
        foodHandling: Number((criteriaTotals.foodHandling / reviews.length).toFixed(1)),
      },
      topCompliments,
    };
  },
};

// ==========================================================
// 5. PURCHASING HISTORY & RECEIPTS DATABASE REPOSITORY
// ==========================================================
export const purchasingHistoryDB = {
  getAllRecords(): PurchasingHistoryRecord[] {
    return loadFromStorage<PurchasingHistoryRecord[]>(
      KEY_PURCHASING_HISTORY,
      INITIAL_PURCHASING_HISTORY
    );
  },

  getRecordById(orderId: string): PurchasingHistoryRecord | undefined {
    return this.getAllRecords().find((r) => r.id === orderId);
  },

  recordPurchaseFromOrder(
    order: Order,
    options?: {
      pointsEarned?: number;
      pointsRedeemed?: number;
      voucherCode?: string;
    }
  ): PurchasingHistoryRecord {
    const all = this.getAllRecords();

    // Check if already recorded
    const existingIndex = all.findIndex((r) => r.id === order.id);

    const pointsEarned =
      options?.pointsEarned ?? fidelityDB.calculatePointsForAmount(order.total, 'GOLD');

    const record: PurchasingHistoryRecord = {
      id: order.id,
      orderNumber: order.orderNumber,
      receiptNumber: `REC-MILA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: 'user-amine-43',
      storeId: order.storeId,
      storeName: order.storeName,
      storeCategory: order.storeCategory,
      storeImageUrl: order.storeImageUrl,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      packagingFee: order.packagingFee,
      discount: order.discount,
      voucherCodeUsed: options?.voucherCode,
      pointsEarned,
      pointsRedeemed: options?.pointsRedeemed ?? 0,
      total: order.total,
      currency: 'DZD',
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus === 'COLLECTED' ? 'COLLECTED' : 'PAID',
      deliveryAddress: order.deliveryAddress,
      courierId: order.courierId || 'courier-walid-43',
      courierName: order.courierName || 'Walid M.',
      courierPhone: order.courierPhone || '+213 551 22 33 44',
      orderedAt: order.createdAt,
      deliveredAt: "Aujourd'hui à l’instant",
      isRatedMerchant: false,
      isRatedCourier: false,
    };

    if (existingIndex >= 0) {
      all[existingIndex] = { ...all[existingIndex], ...record };
    } else {
      all.unshift(record);
    }

    saveToStorage(KEY_PURCHASING_HISTORY, all);
    notifyDatabaseUpdate({ table: 'purchasing_history', action: 'insert' });

    // Also earn fidelity points in the fidelity database!
    fidelityDB.earnPoints({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountDZD: order.total,
      description: `Commande ${order.storeName} (${order.orderNumber})`,
    });

    return record;
  },

  markRated(orderId: string, flags: { merchant?: boolean; courier?: boolean }): void {
    const all = this.getAllRecords();
    const idx = all.findIndex((r) => r.id === orderId);
    if (idx >= 0) {
      if (flags.merchant !== undefined) all[idx].isRatedMerchant = flags.merchant;
      if (flags.courier !== undefined) all[idx].isRatedCourier = flags.courier;
      saveToStorage(KEY_PURCHASING_HISTORY, all);
      notifyDatabaseUpdate({ table: 'purchasing_history', action: 'update' });
    }
  },
};

// ==========================================================
// 6. DATABASE ADMIN & METRICS INSPECTION
// ==========================================================
export const databaseAdmin = {
  getSummary(): {
    fidelityUsersCount: number;
    fidelityTotalPointsInCirculation: number;
    merchantReviewsCount: number;
    merchantAverageOverall: number;
    courierReviewsCount: number;
    courierAverageOverall: number;
    courierTotalTipsDZD: number;
    purchasingRecordsCount: number;
    totalRevenueDZD: number;
    storageBytesEstimate: number;
  } {
    const profile = fidelityDB.getProfile();
    const mReviews = merchantRatingsDB.getAllReviews();
    const cReviews = courierRatingsDB.getAllReviews();
    const pRecords = purchasingHistoryDB.getAllRecords();

    const mAvg =
      mReviews.length > 0
        ? Number((mReviews.reduce((acc, r) => acc + r.overallRating, 0) / mReviews.length).toFixed(1))
        : 5.0;

    const cAvg =
      cReviews.length > 0
        ? Number((cReviews.reduce((acc, r) => acc + r.rating, 0) / cReviews.length).toFixed(1))
        : 5.0;

    const cTips = cReviews.reduce((acc, r) => acc + (r.tipAmountDZD || 0), 0);
    const totalRev = pRecords.reduce((acc, r) => acc + r.total, 0);

    // Approximate storage size
    let bytes = 0;
    if (typeof window !== 'undefined') {
      [KEY_FIDELITY, KEY_MERCHANT_REVIEWS, KEY_COURIER_REVIEWS, KEY_PURCHASING_HISTORY].forEach(
        (k) => {
          const item = localStorage.getItem(k);
          if (item) bytes += item.length * 2; // UTF-16
        }
      );
    }

    return {
      fidelityUsersCount: 1,
      fidelityTotalPointsInCirculation: profile.pointsBalance,
      merchantReviewsCount: mReviews.length,
      merchantAverageOverall: mAvg,
      courierReviewsCount: cReviews.length,
      courierAverageOverall: cAvg,
      courierTotalTipsDZD: cTips,
      purchasingRecordsCount: pRecords.length,
      totalRevenueDZD: totalRev,
      storageBytesEstimate: bytes || 4800,
    };
  },

  exportDatabaseJSON(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      wilaya: 'Ahmed Rachedi',
      system: 'RYM Super-App Database Engine',
      tables: {
        fidelityProfile: fidelityDB.getProfile(),
        merchantReviews: merchantRatingsDB.getAllReviews(),
        courierReviews: courierRatingsDB.getAllReviews(),
        purchasingHistory: purchasingHistoryDB.getAllRecords(),
      },
    };
    return JSON.stringify(data, null, 2);
  },

  resetToDefaultSeeds(): void {
    saveToStorage(KEY_FIDELITY, INITIAL_FIDELITY_PROFILE);
    saveToStorage(KEY_MERCHANT_REVIEWS, INITIAL_MERCHANT_REVIEWS);
    saveToStorage(KEY_COURIER_REVIEWS, INITIAL_COURIER_REVIEWS);
    saveToStorage(KEY_PURCHASING_HISTORY, INITIAL_PURCHASING_HISTORY);
    notifyDatabaseUpdate({ table: 'all', action: 'reset' });
  },
};
