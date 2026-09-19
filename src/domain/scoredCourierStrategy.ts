/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Advanced Scored Courier Dispatch Strategy
 * Provides multi-factor, explainable ranking for candidate couriers.
 */

import {
  DispatchStrategy,
  CourierCandidateProfile,
  DispatchEvaluationResult,
} from './dispatchStrategy';
import { DeliveryAddress } from '../types';

export interface ScoredCourierWeights {
  distanceWeight: number; // Penalty per 100m
  workloadWeight: number; // Penalty per active order
  ratingBonusWeight: number; // Bonus per rating point above 4.0
  vehicleBonus: Record<string, number>;
}

export const DEFAULT_DISPATCH_WEIGHTS: ScoredCourierWeights = {
  distanceWeight: 15,
  workloadWeight: 350,
  ratingBonusWeight: 100,
  vehicleBonus: {
    scooter: 50,
    moto: 60,
    velo: 10,
    voiture: 30,
  },
};

export class ScoredCourierStrategy implements DispatchStrategy {
  readonly strategyName = 'SCORED_COURIER_V2';
  private weights: ScoredCourierWeights;

  constructor(weights: ScoredCourierWeights = DEFAULT_DISPATCH_WEIGHTS) {
    this.weights = weights;
  }

  evaluateCouriers(
    order: { id: string; storeLat: number; storeLng: number; dropoffAddress: DeliveryAddress },
    candidates: CourierCandidateProfile[],
    maxRadiusMeters: number = 3000
  ): DispatchEvaluationResult[] {
    return candidates
      .map((courier) => {
        // 1. Hard Eligibility Filter
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

        if (courier.currentActiveDeliveries >= 3) {
          return {
            courierId: courier.id,
            courierName: courier.name,
            distanceMeters: courier.distanceToStoreMeters,
            score: Infinity,
            isEligible: false,
            rejectionReason: 'Capacité maximale atteinte (3 courses en cours)',
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
            rejectionReason: `Hors rayon d'action (${Math.round(courier.distanceToStoreMeters)}m > ${maxRadiusMeters}m)`,
            estimatedArrivalMin: 99,
          };
        }

        // 2. Multi-factor Scoring (lower score = higher priority)
        // Distance penalty
        const distancePenalty = (courier.distanceToStoreMeters / 100) * this.weights.distanceWeight;

        // Workload penalty
        const workloadPenalty = courier.currentActiveDeliveries * this.weights.workloadWeight;

        // Rating bonus (reduces penalty score)
        const ratingAboveBase = Math.max(0, courier.rating - 4.0);
        const ratingBonus = ratingAboveBase * this.weights.ratingBonusWeight;

        // Vehicle bonus
        const normalizedVehicle = courier.vehicle?.toLowerCase().trim() || 'scooter';
        const vehicleBonus = this.weights.vehicleBonus[normalizedVehicle] || 20;

        // Direction penalty if moving away
        const directionPenalty = courier.directionPenalty || 0;

        const totalScore = Math.max(
          10,
          Math.round(distancePenalty + workloadPenalty + directionPenalty - ratingBonus - vehicleBonus)
        );

        // ETA estimate (approx 20 km/h in city traffic)
        const estimatedArrivalMin = Math.max(3, Math.ceil(courier.distanceToStoreMeters / 300));

        return {
          courierId: courier.id,
          courierName: courier.name,
          distanceMeters: Math.round(courier.distanceToStoreMeters),
          score: totalScore,
          isEligible: true,
          estimatedArrivalMin,
        };
      })
      .sort((a, b) => a.score - b.score);
  }
}
