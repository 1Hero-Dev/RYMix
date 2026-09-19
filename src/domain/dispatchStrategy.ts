/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dispatch Strategy Pattern & Extension Interface
 * V1 Implementation: Simple Nearest Courier Strategy
 * V2 Ready Extensions: ScoredCourierStrategy, BatchDispatchStrategy, RouteOptimizedStrategy
 */

import { AvailableDeliveryPoolOrder, DeliveryAddress } from '../types';
import { FeatureFlagManager } from './featureFlags';
import { ScoredCourierStrategy } from './scoredCourierStrategy';

export interface CourierCandidateProfile {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  vehicle: string;
  isOnline: boolean;
  lat: number;
  lng: number;
  currentActiveDeliveries: number;
  distanceToStoreMeters: number;
  directionPenalty?: number;
}

export interface DispatchEvaluationResult {
  courierId: string;
  courierName: string;
  distanceMeters: number;
  score: number;
  isEligible: boolean;
  rejectionReason?: string;
  estimatedArrivalMin: number;
}

export interface DispatchStrategy {
  readonly strategyName: string;
  evaluateCouriers(
    order: { id: string; storeLat: number; storeLng: number; dropoffAddress: DeliveryAddress },
    candidates: CourierCandidateProfile[],
    maxRadiusMeters: number
  ): DispatchEvaluationResult[];
}

/**
 * V1 Core Implementation: Simple Nearest Available Courier Strategy
 * - Strictly 1 order -> 1 courier assignment
 * - Bounded within launch operational perimeter (e.g. 2000m for Ahmed Rachedi)
 * - Prioritizes closest online courier with capacity (< 2 active deliveries)
 */
export class SimpleNearestCourierStrategy implements DispatchStrategy {
  readonly strategyName = 'SIMPLE_NEAREST_COURIER_V1';

  evaluateCouriers(
    order: { id: string; storeLat: number; storeLng: number; dropoffAddress: DeliveryAddress },
    candidates: CourierCandidateProfile[],
    maxRadiusMeters: number = 2000
  ): DispatchEvaluationResult[] {
    return candidates
      .map((courier) => {
        // Eligibility criteria
        if (!courier.isOnline) {
          return {
            courierId: courier.id,
            courierName: courier.name,
            distanceMeters: courier.distanceToStoreMeters,
            score: Infinity,
            isEligible: false,
            rejectionReason: 'Livreur hors-ligne',
            estimatedArrivalMin: 99,
          };
        }

        if (courier.currentActiveDeliveries >= 2) {
          return {
            courierId: courier.id,
            courierName: courier.name,
            distanceMeters: courier.distanceToStoreMeters,
            score: Infinity,
            isEligible: false,
            rejectionReason: 'Capacité maximale atteinte (2 courses)',
            estimatedArrivalMin: 99,
          };
        }

        if (courier.distanceToStoreMeters > maxRadiusMeters) {
          return {
            courierId: courier.id,
            courierName: courier.name,
            distanceMeters: courier.distanceToStoreMeters,
            score: Infinity,
            isEligible: false,
            rejectionReason: `Hors périmètre de lancement (${Math.round(courier.distanceToStoreMeters)}m > ${maxRadiusMeters}m)`,
            estimatedArrivalMin: 99,
          };
        }

        // Distance-based scoring for V1: lower distance is better
        const score = Math.round(courier.distanceToStoreMeters + courier.currentActiveDeliveries * 300);
        const estimatedArrivalMin = Math.max(3, Math.ceil(courier.distanceToStoreMeters / 250));

        return {
          courierId: courier.id,
          courierName: courier.name,
          distanceMeters: courier.distanceToStoreMeters,
          score,
          isEligible: true,
          estimatedArrivalMin,
        };
      })
      .sort((a, b) => a.score - b.score);
  }
}

/**
 * Factory for dispatch strategies
 * Allows V2 strategies to be swapped without modifying call sites
 */
export class DispatchStrategyRegistry {
  private static v1Strategy: DispatchStrategy = new SimpleNearestCourierStrategy();
  private static v2Strategy: DispatchStrategy = new ScoredCourierStrategy();
  private static customStrategy: DispatchStrategy | null = null;

  public static getStrategy(): DispatchStrategy {
    if (this.customStrategy) {
      return this.customStrategy;
    }
    if (FeatureFlagManager.isEnabled('advanced_dispatch')) {
      return this.v2Strategy;
    }
    return this.v1Strategy;
  }

  public static setStrategy(strategy: DispatchStrategy): void {
    this.customStrategy = strategy;
  }
}

/* =========================================================================
 * V2 EXTENSION POINTS (Interfaces for future modular enhancement)
 * ========================================================================= */

/**
 * V2: Advanced Multi-Factor Scored Courier Strategy
 */
export interface ScoredCourierStrategyConfig {
  distanceWeight: number;
  ratingWeight: number;
  historicalAcceptanceWeight: number;
  vehicleTypeBonus: Record<string, number>;
}

/**
 * V2: Multi-Order Batching Strategy
 */
export interface BatchDispatchStrategyConfig {
  maxBatchSize: number;
  maxDetourDistanceMeters: number;
  maxPreparationTimeGapMin: number;
}
