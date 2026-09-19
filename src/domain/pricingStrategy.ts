/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Pricing Strategy Pattern & Extension Interface
 * V1 Implementation: Standard Authoritative Pricing (Base + Distance + Zone + Free Delivery)
 * V2 Ready Extensions: DynamicPricingStrategy, SurgePricingStrategy, ScheduledOrderPricingStrategy
 */

import { PricingEngineInput, AuthoritativePriceBreakdown } from '../types';
import { calculateAuthoritativePrice, DEFAULT_PRICING_CONFIG, PricingConfig } from './pricingEngine';
import { FeatureFlagManager } from './featureFlags';
import { DynamicPricingEngine } from './dynamicPricingEngine';

export interface PricingStrategy {
  readonly strategyName: string;
  calculatePrice(input: PricingEngineInput): AuthoritativePriceBreakdown;
}

/**
 * V1 Standard Pricing Strategy
 * - Fixed base fee: 100 DZD in central Ahmed Rachedi, 150 standard, 200 peripheral
 * - Packaging fee: 50 DZD
 * - Free delivery threshold: orders >= 2500 DZD (or >= 1200 DZD during launch promotion)
 * - Strict server-side recalculation
 */
export class StandardAuthoritativePricingStrategy implements PricingStrategy {
  readonly strategyName = 'STANDARD_AUTHORITATIVE_V1';
  private config: PricingConfig;

  constructor(config: PricingConfig = DEFAULT_PRICING_CONFIG) {
    this.config = config;
  }

  calculatePrice(input: PricingEngineInput): AuthoritativePriceBreakdown {
    return calculateAuthoritativePrice(input, this.config, 1.0);
  }
}

/**
 * Strategy Registry for Pricing
 * Guarantees single-source-of-truth pricing calculation
 */
export class PricingStrategyRegistry {
  private static v1Strategy: PricingStrategy = new StandardAuthoritativePricingStrategy();
  private static v2Strategy: PricingStrategy = new DynamicPricingEngine();
  private static customStrategy: PricingStrategy | null = null;

  public static getStrategy(): PricingStrategy {
    if (this.customStrategy) {
      return this.customStrategy;
    }
    if (FeatureFlagManager.isEnabled('dynamic_pricing')) {
      return this.v2Strategy;
    }
    return this.v1Strategy;
  }

  public static setStrategy(strategy: PricingStrategy): void {
    this.customStrategy = strategy;
  }
}

/* =========================================================================
 * V2 EXTENSION POINTS (Interfaces for future modular enhancement)
 * ========================================================================= */

export interface DynamicPricingFactors {
  weatherCondition?: 'RAIN' | 'CLEAR' | 'HEATWAVE';
  demandSupplyRatio?: number; // Active orders vs. online couriers
  timeOfDayMultiplier?: number; // Late night surcharge
}

export interface PromotionRule {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_DELIVERY';
  discountValue: number;
  minSpendDZD: number;
  validUntil: string;
}
