/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Delivery Policy & Fulfillment Rules (TypeScript Domain)
 * 
 * ARCHITECTURAL OWNERSHIP PRINCIPLE:
 * - Algorithmic Courier Dispatch, Candidate Ranking, Assignment, and Route Sequencing
 *   are strictly owned by the Go Realtime Service (`services/realtime-dispatch/dispatch`).
 * - This file contains server/domain business policies, eligibility constraints,
 *   and fulfillment validation rules for orders and couriers.
 */

import { CourierCandidate, Order, BatchRouteStop, TrafficConditionLevel } from '../types';
import { calculateDistanceMeters } from '../services/courierBatchDeliveryService';

export interface CourierEligibilityRule {
  isOnline: boolean;
  activeOrdersCount: number;
  maxConcurrentOrders: number;
  batteryPercent?: number;
  distanceToPickupMeters: number;
  maxRadiusMeters: number;
}

export interface DispatchAssignmentResult {
  assignedCourier: CourierCandidate | null;
  score: number;
  candidatesRanked: { courier: CourierCandidate; score: number; reason: string }[];
  evaluatedAt: string;
}

/**
 * Courier Eligibility Business Policy:
 * Validates maximum active order load, radius boundaries, and vehicle suitability.
 */
export function evaluateCourierEligibility(
  courier: CourierCandidate,
  pickupLat: number,
  pickupLng: number,
  courierLat: number,
  courierLng: number,
  maxRadiusMeters: number = 4000
): { eligible: boolean; distanceMeters: number; rejectionReason?: string } {
  const distanceMeters = calculateDistanceMeters(courierLat, courierLng, pickupLat, pickupLng);

  if (courier.activeOrders >= 3) {
    return { eligible: false, distanceMeters, rejectionReason: 'Capacité maximale atteinte (3 commandes simultanées)' };
  }

  if (distanceMeters > maxRadiusMeters) {
    return {
      eligible: false,
      distanceMeters,
      rejectionReason: `Trop éloigné (${(distanceMeters / 1000).toFixed(1)} km > ${(maxRadiusMeters / 1000).toFixed(1)} km max)`,
    };
  }

  return { eligible: true, distanceMeters };
}

/**
 * Policy Scoring Evaluator:
 * Business weighting policy for courier suitability.
 */
export function scoreAndRankCouriers(
  candidates: CourierCandidate[],
  pickupLat: number,
  pickupLng: number
): DispatchAssignmentResult {
  const ranked = candidates
    .map((courier) => {
      const distScore = Math.max(0, 50 - (courier.distanceMeters / 3000) * 50);
      const loadScore = Math.max(0, 25 - courier.activeOrders * 10);
      const ratingScore = Math.max(0, (courier.rating / 5.0) * 15);
      const vehicleBonus = courier.vehicle.toLowerCase().includes('moto') ? 10 : 6;
      const totalScore = Math.round(distScore + loadScore + ratingScore + vehicleBonus);

      return {
        courier,
        score: totalScore,
        reason: `${distScore.toFixed(0)}pts dist (${courier.distanceMeters}m) + ${loadScore}pts charge + ${ratingScore.toFixed(0)}pts note`,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    assignedCourier: ranked[0]?.courier || null,
    score: ranked[0]?.score || 0,
    candidatesRanked: ranked,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Batch Compatibility Policy:
 * Enforces business rules for combining orders into a delivery bundle.
 */
export function evaluateBatchCompatibility(
  orderA: Order,
  orderB: Order,
  trafficLevel: TrafficConditionLevel = 'FLUID'
): { compatible: boolean; reason: string; estimatedPickupDiffMinutes: number } {
  if (orderA.storeId !== orderB.storeId) {
    return {
      compatible: false,
      reason: 'Magasins de collecte différents',
      estimatedPickupDiffMinutes: 999,
    };
  }

  const prepA = orderA.preparationTimeMinutes || 15;
  const prepB = orderB.preparationTimeMinutes || 15;
  const diffMinutes = Math.abs(prepA - prepB);

  const maxAllowedDiffMinutes = (trafficLevel === 'HEAVY' || trafficLevel === 'CONGESTED') ? 12 : 8;

  if (diffMinutes > maxAllowedDiffMinutes) {
    return {
      compatible: false,
      reason: `Écart de cuisson excessif (${diffMinutes} min > ${maxAllowedDiffMinutes} min max autorisées)`,
      estimatedPickupDiffMinutes: diffMinutes,
    };
  }

  return {
    compatible: true,
    reason: `Collecte synchronisée au même établissement (${diffMinutes} min d'écart)`,
    estimatedPickupDiffMinutes: diffMinutes,
  };
}

/**
 * Route Sequence Validation Policy:
 * Validates stop sequence feasibility.
 */
export function reorderRouteStopsByPolicy(stops: BatchRouteStop[]): BatchRouteStop[] {
  const pickups = stops.filter((s) => s.type === 'PICKUP');
  const dropoffs = stops.filter((s) => s.type === 'DROPOFF');

  const ordered = [...pickups, ...dropoffs];
  return ordered.map((s, idx) => ({ ...s, sequenceNumber: idx + 1 }));
}
