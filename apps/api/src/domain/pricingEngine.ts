/**
 * Pricing Engine Domain — Server-Authoritative Computation
 * 
 * Phase 1 (V5 fix): Prices are looked up from the database catalog,
 * NOT taken from client-supplied values.
 * 
 * Relocated from src/domain/pricingEngine.ts
 */

import type { PrismaClient } from '@prisma/client';

export interface PricingInput {
  items: { menuItemId: string; quantity: number }[];
  storeId: string;
  distanceMeters?: number;
  voucherCode?: string;
  redeemedFidelityPoints?: number;
  customTipDZD?: number;
  zoneId?: string;
}

export interface PricingConfig {
  baseDeliveryFeeDZD: number;
  freeDeliveryThresholdDZD: number;
  smallOrderThresholdDZD: number;
  smallOrderFeeDZD: number;
  packagingFeeDZD: number;
  platformServiceFeeDZD: number;
  perKmRateDZD: number;
  merchantCommissionRate: number;
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
  /** Snapshotted unit prices from the catalog, for order item records */
  itemSnapshots: { menuItemId: string; catalogPrice: number; quantity: number; name: string }[];
}

/**
 * Server-authoritative price calculation.
 * 
 * V5 FIX: Fetches item prices from the MenuItem table via Prisma.
 * Client-supplied prices are completely ignored.
 */
export async function calculateAuthoritativePrice(
  prisma: PrismaClient,
  input: PricingInput,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
  surgeMultiplier: number = 1.0
): Promise<AuthoritativePriceBreakdown> {
  // V5 FIX: Fetch authoritative prices from the database catalog
  const menuItemIds = input.items.map(i => i.menuItemId);
  const catalogItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      storeId: input.storeId,
      status: 'AVAILABLE',
    },
  });

  // Validate all items exist in the catalog
  const catalogMap = new Map(catalogItems.map(item => [item.id, item]));
  const itemSnapshots: AuthoritativePriceBreakdown['itemSnapshots'] = [];

  for (const requestedItem of input.items) {
    const catalogItem = catalogMap.get(requestedItem.menuItemId);
    if (!catalogItem) {
      throw new Error(
        `Menu item '${requestedItem.menuItemId}' not found in store '${input.storeId}' or is unavailable`
      );
    }
    itemSnapshots.push({
      menuItemId: catalogItem.id,
      catalogPrice: catalogItem.price,
      quantity: requestedItem.quantity,
      name: catalogItem.name,
    });
  }

  // Calculate subtotal from CATALOG prices (not client prices)
  const itemsSubtotalDZD = itemSnapshots.reduce(
    (sum, item) => sum + item.catalogPrice * item.quantity,
    0
  );

  const distanceMeters = input.distanceMeters ?? 1200;
  const distanceKm = Math.max(0.5, Number((distanceMeters / 1000).toFixed(2)));

  // Delivery fee logic
  let baseDeliveryFeeDZD = config.baseDeliveryFeeDZD;
  let distanceFeeDZD = Math.round(distanceKm * config.perKmRateDZD);

  if (itemsSubtotalDZD >= config.freeDeliveryThresholdDZD && distanceKm <= 2.5) {
    baseDeliveryFeeDZD = 0;
    distanceFeeDZD = 0;
  }

  const deliveryFeeDZD = Math.round((baseDeliveryFeeDZD + distanceFeeDZD) * surgeMultiplier);

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

  // Fidelity Points deduction
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

  // Merchant settlement payout
  const merchantCommissionDZD = Math.round(itemsSubtotalDZD * config.merchantCommissionRate);
  const merchantPayoutDZD = Math.max(0, itemsSubtotalDZD - merchantCommissionDZD);

  // Courier earnings
  const courierEarningsDZD = Math.round(
    config.courierBasePayDZD + distanceKm * config.courierPerKmPayDZD + (input.customTipDZD || 0)
  );

  // Platform net revenue
  const platformNetRevenueDZD = finalCustomerTotalDZD - merchantPayoutDZD - courierEarningsDZD;

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
    itemSnapshots,
  };
}
