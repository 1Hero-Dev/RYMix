/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Promotions & Coupon Engine — Server-Side
 * Relocated from src/domain/promotionsEngine.ts
 * 
 * Prevents coupon stacking, expired codes, and negative cart totals.
 */

export interface CouponCodeDefinition {
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_DZD' | 'FREE_DELIVERY';
  value: number; // e.g., 15 (for 15%) or 200 (for 200 DZD)
  minSpendDZD: number;
  maxDiscountDZD?: number;
  validUntil: string; // ISO date string
  applicableStoreIds?: string[];
  usageLimitPerUser?: number;
}

export interface PromotionValidationResult {
  isValid: boolean;
  code?: string;
  discountDZD: number;
  freeDelivery: boolean;
  message: string;
}

export const ACTIVE_PROMOTION_CATALOG: CouponCodeDefinition[] = [
  {
    code: 'BIENVENUE',
    description: '15% de réduction sur votre première commande à Ahmed Rachedi',
    type: 'PERCENTAGE',
    value: 15,
    minSpendDZD: 1000,
    maxDiscountDZD: 400,
    validUntil: '2026-12-31T23:59:59Z',
  },
  {
    code: 'LIVRAISON0',
    description: 'Livraison offerte à partir de 1500 DZD d\'achats',
    type: 'FREE_DELIVERY',
    value: 0,
    minSpendDZD: 1500,
    validUntil: '2026-12-31T23:59:59Z',
  },
  {
    code: 'RACHEDI200',
    description: '200 DZD offerts dès 1800 DZD d\'achats',
    type: 'FIXED_DZD',
    value: 200,
    minSpendDZD: 1800,
    validUntil: '2026-12-31T23:59:59Z',
  },
  {
    code: 'AR2026',
    description: '200 DZD offerts pour le lancement',
    type: 'FIXED_DZD',
    value: 200,
    minSpendDZD: 1000,
    validUntil: '2026-12-31T23:59:59Z',
  }
];

export class PromotionsEngine {
  /**
   * Validates and evaluates coupon code against cart subtotal and parameters
   */
  public static validateCoupon(
    rawCode: string,
    subtotalDZD: number,
    storeId?: string,
    currentDeliveryFeeDZD: number = 100
  ): PromotionValidationResult {
    const normalizedCode = rawCode.trim().toUpperCase();
    if (!normalizedCode) {
      return { isValid: false, discountDZD: 0, freeDelivery: false, message: 'Code promo vide' };
    }

    const promo = ACTIVE_PROMOTION_CATALOG.find((p) => p.code === normalizedCode);
    if (!promo) {
      return {
        isValid: false,
        discountDZD: 0,
        freeDelivery: false,
        message: 'Code promo non reconnu ou expiré',
      };
    }

    // 1. Expiry date check
    if (new Date(promo.validUntil).getTime() < Date.now()) {
      return {
        isValid: false,
        discountDZD: 0,
        freeDelivery: false,
        message: 'Ce code promo a expiré',
      };
    }

    // 2. Minimum spend check
    if (subtotalDZD < promo.minSpendDZD) {
      return {
        isValid: false,
        discountDZD: 0,
        freeDelivery: false,
        message: `Montant minimum requis pour ce code : ${promo.minSpendDZD} DZD (votre panier : ${subtotalDZD} DZD)`,
      };
    }

    // 3. Store applicability check
    if (promo.applicableStoreIds && storeId && !promo.applicableStoreIds.includes(storeId)) {
      return {
        isValid: false,
        discountDZD: 0,
        freeDelivery: false,
        message: 'Ce code n\'est pas applicable à ce commerce',
      };
    }

    // 4. Calculate discount amount
    let discount = 0;
    let freeDelivery = false;

    if (promo.type === 'FREE_DELIVERY') {
      freeDelivery = true;
      discount = currentDeliveryFeeDZD;
    } else if (promo.type === 'PERCENTAGE') {
      discount = Math.round((subtotalDZD * promo.value) / 100);
      if (promo.maxDiscountDZD) {
        discount = Math.min(discount, promo.maxDiscountDZD);
      }
    } else if (promo.type === 'FIXED_DZD') {
      discount = Math.min(promo.value, subtotalDZD);
    }

    return {
      isValid: true,
      code: promo.code,
      discountDZD: discount,
      freeDelivery,
      message: `Code ${promo.code} appliqué : -${discount} DZD !`,
    };
  }
}
