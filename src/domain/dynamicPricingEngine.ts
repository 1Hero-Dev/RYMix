/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Dynamic Pricing Engine
 * Implements Section 13 (Dynamic Pricing & Reproducible Fee Breakdown)
 * Strictly server-authoritative, reproducible, and auditable.
 */

import { PricingEngineInput, AuthoritativePriceBreakdown } from '../types';
import { PricingStrategy } from './pricingStrategy';
import { calculateAuthoritativePrice, DEFAULT_PRICING_CONFIG, PricingConfig } from './pricingEngine';

export interface DynamicPricingModifiers {
  demandSurgeMultiplier?: number; // 1.0 = normal, 1.2 = high demand
  weatherSurchargeDZD?: number; // 0 normal, +50 DZD heavy rain/storm
  nightTimeSurchargeDZD?: number; // 0 normal, +50 DZD after 22:00
}

export class DynamicPricingEngine implements PricingStrategy {
  readonly strategyName = 'DYNAMIC_PRICING_V2';
  private config: PricingConfig;
  private modifiers: DynamicPricingModifiers;

  constructor(
    config: PricingConfig = DEFAULT_PRICING_CONFIG,
    modifiers: DynamicPricingModifiers = {}
  ) {
    this.config = config;
    this.modifiers = modifiers;
  }

  public setModifiers(modifiers: DynamicPricingModifiers): void {
    this.modifiers = { ...this.modifiers, ...modifiers };
  }

  public calculatePrice(input: PricingEngineInput): AuthoritativePriceBreakdown {
    const surge = this.modifiers.demandSurgeMultiplier || 1.0;
    const baseBreakdown = calculateAuthoritativePrice(input, this.config, surge);

    // Weather / late night additive surcharges
    const weatherFee = this.modifiers.weatherSurchargeDZD || 0;
    const nightFee = this.modifiers.nightTimeSurchargeDZD || 0;
    const additionalDeliveryFees = weatherFee + nightFee;

    // Apply fee adjustments to delivery fee if not already free delivery
    let adjustedDeliveryFee = baseBreakdown.deliveryFeeDZD;
    if (adjustedDeliveryFee > 0 && additionalDeliveryFees > 0) {
      adjustedDeliveryFee += additionalDeliveryFees;
    }

    const finalTotal =
      baseBreakdown.itemsSubtotalDZD -
      baseBreakdown.discountDZD +
      adjustedDeliveryFee +
      baseBreakdown.packagingFeeDZD +
      baseBreakdown.smallOrderFeeDZD +
      baseBreakdown.platformServiceFeeDZD;

    return {
      ...baseBreakdown,
      deliveryFeeDZD: adjustedDeliveryFee,
      finalCustomerTotalDZD: Math.max(0, finalTotal),
    };
  }
}
