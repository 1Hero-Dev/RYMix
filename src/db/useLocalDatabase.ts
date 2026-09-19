import { useState, useEffect, useCallback } from 'react';
import {
  fidelityDB,
  merchantRatingsDB,
  courierRatingsDB,
  purchasingHistoryDB,
  databaseAdmin,
  DATABASE_UPDATED_EVENT,
} from './localDatabase';
import {
  CustomerFidelityProfile,
  MerchantReview,
  CourierReview,
  PurchasingHistoryRecord,
} from '../types';

export function useLocalDatabase() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setVersion((v) => v + 1);
    };

    window.addEventListener(DATABASE_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(DATABASE_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const fidelityProfile: CustomerFidelityProfile = fidelityDB.getProfile();
  const merchantReviews: MerchantReview[] = merchantRatingsDB.getAllReviews();
  const courierReviews: CourierReview[] = courierRatingsDB.getAllReviews();
  const purchasingHistory: PurchasingHistoryRecord[] = purchasingHistoryDB.getAllRecords();
  const dbSummary = databaseAdmin.getSummary();

  const earnPoints = useCallback(
    (params: { orderId?: string; orderNumber?: string; amountDZD: number; description: string }) => {
      return fidelityDB.earnPoints(params);
    },
    []
  );

  const addBonusPoints = useCallback((points: number, reason: string) => {
    return fidelityDB.addBonusPoints(points, reason);
  }, []);

  const claimVoucher = useCallback(
    (def: { title: string; discountDZD: number; pointsCost: number; minSpendDZD: number }) => {
      return fidelityDB.createVoucherFromPoints(def);
    },
    []
  );

  const submitMerchantReview = useCallback(
    (review: Omit<MerchantReview, 'id' | 'createdAt'>) => {
      return merchantRatingsDB.addReview(review);
    },
    []
  );

  const submitCourierReview = useCallback(
    (review: Omit<CourierReview, 'id' | 'createdAt'>) => {
      return courierRatingsDB.addReview(review);
    },
    []
  );

  const resetToSeeds = useCallback(() => {
    databaseAdmin.resetToDefaultSeeds();
  }, []);

  return {
    version,
    fidelityProfile,
    merchantReviews,
    courierReviews,
    purchasingHistory,
    dbSummary,
    earnPoints,
    addBonusPoints,
    claimVoucher,
    submitMerchantReview,
    submitCourierReview,
    resetToSeeds,
  };
}
