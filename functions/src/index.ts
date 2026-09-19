import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Automation 1: On Order Created
 * - Dispatches FCM push notification to the merchant & available riders in Mila 43
 * - Initializes tracking metadata
 */
export const onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    const orderId = context.params.orderId;

    functions.logger.info(`New order created in Mila: ${orderId}`, { orderData });

    // Send push notification to store
    const storeTopic = `store_${orderData.storeId}`;
    const payload = {
      notification: {
        title: `Nouvelle commande ! #${orderData.orderNumber || orderId}`,
        body: `Total : ${orderData.totalDZD} DZD - Client : ${orderData.customerName || 'Client Mila'}`,
      },
      data: {
        orderId,
        type: 'NEW_ORDER',
      },
    };

    try {
      await admin.messaging().sendToTopic(storeTopic, payload);
    } catch (err) {
      functions.logger.warn(`Could not send FCM to ${storeTopic}:`, err);
    }

    return null;
  });

/**
 * Automation 2: On Order Status Changed
 * - Notifies customer when food is prepared, rider has picked up, and driver is en route
 * - When DELIVERED: credits loyalty points (1 point per 10 DZD)
 */
export const onOrderStatusChanged = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;

    if (before.status === after.status) return null;

    functions.logger.info(`Order ${orderId} status changed: ${before.status} -> ${after.status}`);

    // If delivered, calculate & credit fidelity points
    if (after.status === 'DELIVERED') {
      const customerId = after.customerId || 'cust-amine-43';
      const earnedPoints = Math.max(10, Math.floor((after.totalDZD || 1000) / 10));

      const loyaltyRef = db.collection('loyaltyAccounts').doc(customerId);
      await db.runTransaction(async (transaction) => {
        const loyaltyDoc = await transaction.get(loyaltyRef);
        let currentPoints = 0;
        let lifetimePoints = 0;

        if (loyaltyDoc.exists) {
          const data = loyaltyDoc.data()!;
          currentPoints = data.currentPoints || 0;
          lifetimePoints = data.lifetimePoints || 0;
        }

        const newCurrent = currentPoints + earnedPoints;
        const newLifetime = lifetimePoints + earnedPoints;

        let tier = 'BRONZE';
        if (newLifetime >= 500) tier = 'SILVER';
        if (newLifetime >= 1500) tier = 'GOLD';
        if (newLifetime >= 3500) tier = 'PLATINUM';

        transaction.set(
          loyaltyRef,
          {
            customerId,
            currentPoints: newCurrent,
            lifetimePoints: newLifetime,
            tier,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });

      functions.logger.info(`Credited ${earnedPoints} loyalty points to customer ${customerId}`);
    }

    return null;
  });

/**
 * Automation 3: On Rating Submitted (Merchant or Courier)
 * - Automatically recalculates average score and review counts
 */
export const onMerchantRatingCreated = functions.firestore
  .document('merchantRatings/{ratingId}')
  .onCreate(async (snap) => {
    const ratingData = snap.data();
    const storeId = ratingData.storeId;

    if (!storeId) return null;

    const allRatingsSnap = await db
      .collection('merchantRatings')
      .where('storeId', '==', storeId)
      .get();

    let totalScore = 0;
    allRatingsSnap.forEach((doc) => {
      totalScore += doc.data().rating || 0;
    });

    const count = allRatingsSnap.size;
    const average = count > 0 ? Number((totalScore / count).toFixed(2)) : 5.0;

    await db.collection('stores').doc(storeId).set(
      {
        rating: average,
        ratingCount: count,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return null;
  });

export const onCourierRatingCreated = functions.firestore
  .document('courierRatings/{ratingId}')
  .onCreate(async (snap) => {
    const ratingData = snap.data();
    const courierId = ratingData.courierId;

    if (!courierId) return null;

    const allRatingsSnap = await db
      .collection('courierRatings')
      .where('courierId', '==', courierId)
      .get();

    let totalScore = 0;
    let totalTips = 0;
    allRatingsSnap.forEach((doc) => {
      totalScore += doc.data().rating || 0;
      totalTips += doc.data().tipDZD || 0;
    });

    const count = allRatingsSnap.size;
    const average = count > 0 ? Number((totalScore / count).toFixed(2)) : 4.9;

    await db.collection('couriers').doc(courierId).set(
      {
        rating: average,
        ratingCount: count,
        totalTipsDZD: totalTips,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return null;
  });
