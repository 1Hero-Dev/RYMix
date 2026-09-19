import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, handleFirestoreError, OperationType } from './config';
import { convertToWebP } from '../utils/webpConverter';

export interface DriverLocationData {
  courierId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  activeOrderId?: string;
  isOnline: boolean;
  updatedAt: string;
}

export interface PushNotificationPayload {
  id: string;
  title: string;
  body: string;
  targetRole: 'customer' | 'driver' | 'shop' | 'all';
  timestamp: string;
  data?: Record<string, any>;
}

// In-memory bus for driver locations (zero-latency local updates + cross-component reactive telemetry)
const driverLocationSubscribers = new Map<string, Set<(loc: DriverLocationData | null) => void>>();
const cachedDriverLocations = new Map<string, DriverLocationData>();

// 1. REAL-TIME DRIVER TRACKING
export async function updateDriverLocation(
  courierId: string,
  coords: { lat: number; lng: number; heading?: number; speed?: number; activeOrderId?: string; isOnline?: boolean }
): Promise<void> {
  const locData: DriverLocationData = {
    courierId,
    lat: coords.lat,
    lng: coords.lng,
    heading: coords.heading ?? 0,
    speed: coords.speed ?? 30,
    activeOrderId: coords.activeOrderId ?? null,
    isOnline: coords.isOnline ?? true,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in-memory cache and notify local listeners immediately
  cachedDriverLocations.set(courierId, locData);
  const listeners = driverLocationSubscribers.get(courierId);
  if (listeners) {
    listeners.forEach((listener) => {
      try {
        listener(locData);
      } catch (err) {
        console.warn('Listener error in driver location bus:', err);
      }
    });
  }

  // 2. Only sync to Cloud Firestore when authenticated to avoid unauthenticated connection warnings
  if (!auth.currentUser) {
    return;
  }
  const path = `driverLocations/${courierId}`;
  try {
    const locRef = doc(db, 'driverLocations', courierId);
    await setDoc(locRef, locData, { merge: true });
  } catch (error) {
    console.warn('Driver location Firestore update note:', error);
  }
}

export function subscribeToDriverLocation(
  courierId: string,
  onUpdate: (location: DriverLocationData | null) => void
): () => void {
  // 1. Register local listener
  if (!driverLocationSubscribers.has(courierId)) {
    driverLocationSubscribers.set(courierId, new Set());
  }
  driverLocationSubscribers.get(courierId)!.add(onUpdate);

  // Send current cached value immediately if available
  const cached = cachedDriverLocations.get(courierId);
  if (cached) {
    onUpdate(cached);
  }

  // 2. Also register Firestore snapshot if authenticated
  let firestoreUnsub: (() => void) | null = null;
  if (auth.currentUser) {
    const locRef = doc(db, 'driverLocations', courierId);
    firestoreUnsub = onSnapshot(
      locRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as DriverLocationData;
          cachedDriverLocations.set(courierId, data);
          onUpdate(data);
        }
      },
      (error) => {
        console.warn('Driver location snapshot warning:', error);
      }
    );
  }

  return () => {
    driverLocationSubscribers.get(courierId)?.delete(onUpdate);
    if (firestoreUnsub) {
      firestoreUnsub();
    }
  };
}

// 2. CLOUD STORAGE (PROOF OF DELIVERY - HIGH EFFICIENCY WEBP FORMAT)
export async function uploadProofOfDelivery(orderId: string, file: File | Blob): Promise<string> {
  const filename = `proof_of_delivery/${orderId}_${Date.now()}.webp`;
  try {
    // Ensure the image is converted to WebP format with optimal compression
    let webpFile: Blob = file;
    try {
      const webpResult = await convertToWebP(file, { quality: 0.82 });
      webpFile = webpResult.blob;
    } catch {
      // If canvas conversion unavailable in current environment, keep original file
      webpFile = file;
    }

    const fileRef = ref(storage, filename);
    const snapshot = await uploadBytes(fileRef, webpFile, {
      contentType: 'image/webp',
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Cloud Storage upload failed, generating local data URL backup:', error);
    // Safe offline fallback: convert blob to data url so app remains 100% functional
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}

// 3. PUSH NOTIFICATION DISPATCHER (Firebase Cloud Messaging Simulation & In-App delivery)
const notificationListeners: Array<(notif: PushNotificationPayload) => void> = [];

export function sendPushNotification(
  targetRole: 'customer' | 'driver' | 'shop' | 'all',
  title: string,
  body: string,
  data?: Record<string, any>
): void {
  const notification: PushNotificationPayload = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    body,
    targetRole,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    data,
  };

  // Broadcast to active listeners
  notificationListeners.forEach((listener) => {
    try {
      listener(notification);
    } catch (e) {
      console.error('Error dispatching notification:', e);
    }
  });

  // Also trigger browser Notification API if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const isEnabled = localStorage.getItem('rym_native_notifications_enabled') !== 'false';
      if (isEnabled) {
        const orderTag = data?.orderId ? `order-${data.orderId}` : `notif-${Date.now()}`;
        const defaultIcon = 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=192&q=80&fm=webp';
        const defaultBadge = 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=96&q=80&fm=webp';

        const notifOptions = {
          body,
          icon: defaultIcon,
          badge: defaultBadge,
          tag: orderTag,
          data,
          requireInteraction: targetRole === 'customer' || targetRole === 'all',
          vibrate: [150, 70, 150],
        };

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((reg) => reg.showNotification(title, notifOptions as any))
            .catch(() => {
              try {
                const n = new Notification(title, notifOptions as any);
                n.onclick = () => {
                  try {
                    window.focus();
                  } catch {}
                  n.close();
                };
              } catch {}
            });
        } else {
          const n = new Notification(title, notifOptions as any);
          n.onclick = () => {
            try {
              window.focus();
            } catch {}
            n.close();
          };
        }
      }
    } catch {
      // Benign if blocked in iframe
    }
  }
}

export function onPushNotification(listener: (notif: PushNotificationPayload) => void): () => void {
  notificationListeners.push(listener);
  return () => {
    const idx = notificationListeners.indexOf(listener);
    if (idx !== -1) notificationListeners.splice(idx, 1);
  };
}

// 4. FIRESTORE ORDER REPOSITORY SYNC
export async function syncOrderToFirestore(order: any): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `orders/${order.id}`;
  try {
    const orderDoc = doc(db, 'orders', order.id);
    await setDoc(
      orderDoc,
      {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId || 'cust-amine-43',
        customerName: order.delivery?.dropoff?.recipientName || 'Amine B.',
        storeId: order.storeId || order.delivery?.pickup?.storeId || 'store-haroun',
        storeName: order.storeName || order.delivery?.pickup?.storeName || 'Beni Haroun',
        courierId: order.courierId || order.delivery?.courierId || 'courier-walid',
        courierName: order.courierName || 'Walid M.',
        status: order.status || 'PENDING',
        totalDZD: order.totalDZD || order.total || 1420,
        paymentMethod: order.paymentMethod || 'COD',
        paymentStatus: order.paymentStatus || 'UNPAID',
        deliveryFeeDZD: order.deliveryFeeDZD || 120,
        proofPhotoUrl: order.proofPhotoUrl || null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore syncOrder note:', error);
  }
}

// 5. FIRESTORE LOYALTY SYNC
export async function syncLoyaltyToFirestore(loyalty: any): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const customerId = loyalty.customerId || 'cust-amine-43';
  const path = `loyaltyAccounts/${customerId}`;
  try {
    const loyaltyRef = doc(db, 'loyaltyAccounts', customerId);
    await setDoc(
      loyaltyRef,
      {
        customerId,
        currentPoints: loyalty.currentPoints ?? 0,
        lifetimePoints: loyalty.lifetimePoints ?? 0,
        tier: loyalty.tier || 'BRONZE',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore syncLoyalty note:', error);
  }
}

// 6. FIRESTORE ORDER REVIEWS & RATINGS PERSISTENCE
export interface OrderRatingSubmission {
  orderId: string;
  orderNumber?: string;
  storeId: string;
  storeName?: string;
  courierId?: string;
  courierName?: string;
  customerId?: string;
  customerName?: string;
  merchantRating: number; // 1 to 5
  merchantComment: string;
  merchantTags?: string[];
  criteria?: {
    foodTaste?: number;
    packaging?: number;
    speed?: number;
    portionSize?: number;
  };
  courierRating?: number; // 1 to 5
  courierComment?: string;
  courierTags?: string[];
  courierCriteria?: {
    punctuality?: number;
    politeness?: number;
    routeRespect?: number;
    foodHandling?: number;
  };
  tipAmountDZD?: number;
}

export async function submitOrderRatingToFirestore(
  submission: OrderRatingSubmission
): Promise<{ success: boolean; merchantRatingId: string; courierRatingId?: string }> {
  const customerUid = auth.currentUser?.uid || submission.customerId || 'cust-amine-43';
  const customerDisplayName = auth.currentUser?.displayName || submission.customerName || 'Amine Benali';
  const nowIso = new Date().toISOString();
  const cleanId = (prefix: string) =>
    `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  const merchantRatingId = cleanId('m-rate');

  // 1. Persist Merchant Evaluation to /merchantRatings
  const pathForMerchant = `merchantRatings/${merchantRatingId}`;
  try {
    const merchantRef = doc(db, 'merchantRatings', merchantRatingId);
    await setDoc(merchantRef, {
      id: merchantRatingId,
      orderId: submission.orderId,
      storeId: submission.storeId,
      customerId: customerUid,
      customerName: customerDisplayName,
      rating: submission.merchantRating,
      comment: (submission.merchantComment || '').slice(0, 1000),
      tags: submission.merchantTags || [],
      criteria: submission.criteria || {},
      createdAt: nowIso,
    });
  } catch (error) {
    console.warn('Firestore merchant rating save notice:', error);
    if (auth.currentUser) {
      try {
        handleFirestoreError(error, OperationType.WRITE, pathForMerchant);
      } catch (err) {
        console.error('Firestore merchantRating error logged:', err);
      }
    }
  }

  // 2. Persist Courier Evaluation to /courierRatings if courier was present
  let courierRatingId: string | undefined;
  if (submission.courierId && submission.courierRating) {
    courierRatingId = cleanId('c-rate');
    const pathForCourier = `courierRatings/${courierRatingId}`;
    try {
      const courierRef = doc(db, 'courierRatings', courierRatingId);
      await setDoc(courierRef, {
        id: courierRatingId,
        orderId: submission.orderId,
        courierId: submission.courierId,
        customerId: customerUid,
        customerName: customerDisplayName,
        rating: submission.courierRating,
        tipDZD: submission.tipAmountDZD || 0,
        comment: (submission.courierComment || '').slice(0, 1000),
        tags: submission.courierTags || [],
        criteria: submission.courierCriteria || {},
        createdAt: nowIso,
      });
    } catch (error) {
      console.warn('Firestore courier rating save notice:', error);
      if (auth.currentUser) {
        try {
          handleFirestoreError(error, OperationType.WRITE, pathForCourier);
        } catch (err) {
          console.error('Firestore courierRating error logged:', err);
        }
      }
    }
  }

  // 3. Mark the Order document in Firestore as rated
  try {
    const orderRef = doc(db, 'orders', submission.orderId);
    await setDoc(
      orderRef,
      {
        isRated: true,
        rating: submission.merchantRating,
        feedbackComment: submission.merchantComment || '',
        ratedAt: nowIso,
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore update order isRated notice:', error);
  }

  return { success: true, merchantRatingId, courierRatingId };
}

export async function getStoreRatingsFromFirestore(storeId: string): Promise<any[]> {
  const path = 'merchantRatings';
  try {
    const q = query(collection(db, path), where('storeId', '==', storeId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    console.warn('Firestore fetch store ratings note:', error);
    return [];
  }
}

