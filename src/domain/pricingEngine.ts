/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Pricing Engine Domain - Server-Authoritative Computation
 * Implements Recommendation #5 (Authoritative Pricing Domain)
 */

import { PricingEngineInput, AuthoritativePriceBreakdown } from '../types';

export interface PricingConfig {
  baseDeliveryFeeDZD: number;
  freeDeliveryThresholdDZD: number;
  smallOrderThresholdDZD: number;
  smallOrderFeeDZD: number;
  packagingFeeDZD: number;
  platformServiceFeeDZD: number;
  perKmRateDZD: number;
  merchantCommissionRate: number; // e.g. 0.00 for launch promo in Ahmed Rachedi
  courierBasePayDZD: number;
  courierPerKmPayDZD: number;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  baseDeliveryFeeDZD: 150,
  freeDeliveryThresholdDZD: 2500,
  smallOrderThresholdDZD: 500,
  smallOrderFeeDZD: 50,
  packagingFeeDZD: 50,
  platformServiceFeeDZD: 40,
  perKmRateDZD: 30,
  merchantCommissionRate: 0.00, // 0% Launch promotion in Ahmed Rachedi
  courierBasePayDZD: 120,
  courierPerKmPayDZD: 25,
};

/**
 * Calculates authoritative breakdown for an order cart.
 */
export function calculateAuthoritativePrice(
  input: PricingEngineInput,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
  surgeMultiplier: number = 1.0
): AuthoritativePriceBreakdown {
  const itemsSubtotalDZD = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const distanceMeters = input.distanceMeters ?? 1200; // default 1.2km within Ahmed Rachedi central zone
  const distanceKm = Math.max(0.5, Number((distanceMeters / 1000).toFixed(2)));

  // Delivery fee logic
  let baseDeliveryFeeDZD = config.baseDeliveryFeeDZD;
  let distanceFeeDZD = Math.round(distanceKm * config.perKmRateDZD);

  if (itemsSubtotalDZD >= config.freeDeliveryThresholdDZD && distanceKm <= 2.5) {
    baseDeliveryFeeDZD = 0;
    distanceFeeDZD = 0;
  }

  let deliveryFeeDZD = Math.round((baseDeliveryFeeDZD + distanceFeeDZD) * surgeMultiplier);

  // Small order surcharge
  const smallOrderFeeDZD =
    itemsSubtotalDZD > 0 && itemsSubtotalDZD < config.smallOrderThresholdDZD
      ? config.smallOrderFeeDZD
      : 0;

  // Packaging & Service fees
  const packagingFeeDZD = itemsSubtotalDZD > 0 ? config.packagingFeeDZD : 0;
  const platformServiceFeeDZD = itemsSubtotalDZD > 0 ? config.platformServiceFeeDZD : 0;

  // Gross total before discounts
  const grossTotalDZD =
    itemsSubtotalDZD + deliveryFeeDZD + smallOrderFeeDZD + packagingFeeDZD + platformServiceFeeDZD;

  // Voucher / Promotion calculation
  let voucherDeductionDZD = 0;
  if (input.voucherCode) {
    const code = input.voucherCode.trim().toUpperCase();
    if (code === 'BIENVENUE' || code === 'AR2026') {
      voucherDeductionDZD = Math.min(200, itemsSubtotalDZD);
    } else if (code === 'LIVRAISON_GRATUITE') {
      voucherDeductionDZD = deliveryFeeDZD;
    } else if (code === 'RAMADAN' || code === 'PROMO50') {
      voucherDeductionDZD = Math.min(300, Math.round(itemsSubtotalDZD * 0.15));
    }
  }

  // Fidelity Points deduction (e.g. 100 pts = 50 DZD)
  const redeemedPoints = input.redeemedFidelityPoints || 0;
  const fidelityDeductionDZD = Math.min(
    Math.floor(redeemedPoints * 0.5),
    Math.max(0, itemsSubtotalDZD - voucherDeductionDZD)
  );

  const totalDiscountDZD = voucherDeductionDZD + fidelityDeductionDZD;

  const finalCustomerTotalDZD = Math.max(
    0,
    grossTotalDZD - totalDiscountDZD + (input.customTipDZD || 0)
  );

  // Merchant settlement payout: subtotal minus platform commission
  const merchantCommissionDZD = Math.round(itemsSubtotalDZD * config.merchantCommissionRate);
  const merchantPayoutDZD = Math.max(0, itemsSubtotalDZD - merchantCommissionDZD);

  // Courier earnings: base compensation + distance pay + delivery fee portion
  const courierEarningsDZD = Math.round(
    config.courierBasePayDZD + distanceKm * config.courierPerKmPayDZD + (input.customTipDZD || 0)
  );

  // Platform net revenue
  const platformNetRevenueDZD =
    finalCustomerTotalDZD - merchantPayoutDZD - courierEarningsDZD;

  const signature = `SIG-${itemsSubtotalDZD}-${finalCustomerTotalDZD}-${Date.now().toString(36)}`;

  return {
    itemsSubtotalDZD,
    deliveryFeeDZD,
    baseDeliveryFeeDZD,
    distanceFeeDZD,
    smallOrderFeeDZD,
    packagingFeeDZD,
    platformServiceFeeDZD,
    surgeMultiplier,
    grossTotalDZD,
    discountDZD: totalDiscountDZD,
    voucherDeductionDZD,
    fidelityDeductionDZD,
    finalCustomerTotalDZD,
    merchantPayoutDZD,
    courierEarningsDZD,
    platformNetRevenueDZD,
    zoneCode: input.zoneId || 'ZONE-AR-CENTRE',
    zoneName: 'Ahmed Rachedi Centre-Ville',
    distanceKm,
    calculatedAt: new Date().toISOString(),
    signature,
  };
}
