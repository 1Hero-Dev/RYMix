/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Feature Flags System
 * Controls progressive rollout and runtime activation of V2 capabilities.
 * Allows instant rollback to V1 core behavior if required.
 */

export interface V2FeatureFlags {
  advanced_dispatch: boolean;
  batch_delivery: boolean;
  dynamic_pricing: boolean;
  promotions_engine: boolean;
  loyalty_program: boolean;
  scheduled_orders: boolean;
  advanced_search: boolean;
  recommendations: boolean;
  operational_intelligence: boolean;
  multi_zone: boolean;
}

export const DEFAULT_V2_FEATURE_FLAGS: V2FeatureFlags = {
  advanced_dispatch: true,
  batch_delivery: true,
  dynamic_pricing: true,
  promotions_engine: true,
  loyalty_program: true,
  scheduled_orders: true,
  advanced_search: true,
  recommendations: true,
  operational_intelligence: true,
  multi_zone: true,
};

export class FeatureFlagManager {
  private static flags: V2FeatureFlags = { ...DEFAULT_V2_FEATURE_FLAGS };

  public static getFlags(): V2FeatureFlags {
    return { ...this.flags };
  }

  public static isEnabled(flagName: keyof V2FeatureFlags): boolean {
    return !!this.flags[flagName];
  }

  public static setFlag(flagName: keyof V2FeatureFlags, enabled: boolean): void {
    this.flags[flagName] = enabled;
  }

  public static setAllFlags(newFlags: Partial<V2FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
  }

  public static resetToDefault(): void {
    this.flags = { ...DEFAULT_V2_FEATURE_FLAGS };
  }
}
