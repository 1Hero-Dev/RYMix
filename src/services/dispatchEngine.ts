/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dispatch Engine - Modular Assignment, Batching & Routing
 * Implements Recommendation #6 (Courier Dispatch Separation) & #7 (Go/Backend Boundary)
 */

import { CourierCandidate, Order, BatchRouteStop, TrafficConditionLevel } from '../types';
import { calculateDistanceMeters } from './courierBatchDeliveryService';

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
 * 1. Courier Eligibility Evaluator
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
 * 2. Assignment Engine - Multi-criteria scoring
 * Higher score = best match.
 * Factors: Proximity (50%), Active load (25%), Rating (15%), Vehicle suitability (10%)
 */
export function scoreAndRankCouriers(
  candidates: CourierCandidate[],
  pickupLat: number,
  pickupLng: number
): DispatchAssignmentResult {
  const ranked = candidates
    .map((courier) => {
      // Proximity score (0 - 50 points): 0m = 50 pts, 3000m = 0 pts
      const distScore = Math.max(0, 50 - (courier.distanceMeters / 3000) * 50);

      // Load score (0 - 25 points): 0 orders = 25 pts, 1 = 15 pts, 2 = 5 pts, 3+ = 0 pts
      const loadScore = Math.max(0, 25 - courier.activeOrders * 10);

      // Rating score (0 - 15 points): 5.0 = 15 pts, 4.0 = 10 pts
      const ratingScore = Math.max(0, (courier.rating / 5.0) * 15);

      // Vehicle bonus: Moto/Scooter gets 10 pts in urban Ahmed Rachedi, Vélo gets 6 pts
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
 * 3. Batch Optimizer - Identify compatible orders for multi-drop routes
 */
export function findBatchableOrders(
  primaryOrder: Order,
  otherPendingOrders: Order[],
  maxClusterRadiusMeters: number = 1800
): Order[] {
  const storeLat = primaryOrder.delivery?.pickup.lat ?? 36.4678;
  const storeLng = primaryOrder.delivery?.pickup.lng ?? 6.2891;

  return otherPendingOrders.filter((candidate) => {
    if (candidate.id === primaryOrder.id) return false;
    if (candidate.status !== 'READY' && candidate.status !== 'PREPARING') return false;

    // Check store proximity (pickup cluster)
    const candStoreLat = candidate.delivery?.pickup.lat ?? 36.4678;
    const candStoreLng = candidate.delivery?.pickup.lng ?? 6.2891;
    const pickupDist = calculateDistanceMeters(storeLat, storeLng, candStoreLat, candStoreLng);

    if (pickupDist > 1200) return false; // Stores must be close

    // Check dropoff proximity
    const primaryDropLat = primaryOrder.deliveryAddress.lat ?? 36.467;
    const primaryDropLng = primaryOrder.deliveryAddress.lng ?? 6.288;
    const candDropLat = candidate.deliveryAddress.lat ?? 36.467;
    const candDropLng = candidate.deliveryAddress.lng ?? 6.288;

    const dropDist = calculateDistanceMeters(primaryDropLat, primaryDropLng, candDropLat, candDropLng);
    return dropDist <= maxClusterRadiusMeters;
  });
}

/**
 * 4. Route Planner & Sequence Generator
 */
export function planOptimalSequence(
  courierLat: number,
  courierLng: number,
  pickups: { id: string; name: string; lat: number; lng: number }[],
  dropoffs: { id: string; name: string; lat: number; lng: number }[]
): { sequence: { type: 'PICKUP' | 'DROPOFF'; id: string; name: string; lat: number; lng: number }[]; totalDistanceMeters: number } {
  // All pickups must precede their respective dropoffs
  const sequence: { type: 'PICKUP' | 'DROPOFF'; id: string; name: string; lat: number; lng: number }[] = [];
  let totalDistance = 0;
  let currentLat = courierLat;
  let currentLng = courierLng;

  // Add pickups sorted by proximity to courier
  const remainingPickups = [...pickups].sort(
    (a, b) =>
      calculateDistanceMeters(currentLat, currentLng, a.lat, a.lng) -
      calculateDistanceMeters(currentLat, currentLng, b.lat, b.lng)
  );

  for (const p of remainingPickups) {
    totalDistance += calculateDistanceMeters(currentLat, currentLng, p.lat, p.lng);
    currentLat = p.lat;
    currentLng = p.lng;
    sequence.push({ type: 'PICKUP', ...p });
  }

  // Add dropoffs sorted by proximity from final pickup
  const remainingDropoffs = [...dropoffs].sort(
    (a, b) =>
      calculateDistanceMeters(currentLat, currentLng, a.lat, a.lng) -
      calculateDistanceMeters(currentLat, currentLng, b.lat, b.lng)
  );

  for (const d of remainingDropoffs) {
    totalDistance += calculateDistanceMeters(currentLat, currentLng, d.lat, d.lng);
    currentLat = d.lat;
    currentLng = d.lng;
    sequence.push({ type: 'DROPOFF', ...d });
  }

  return { sequence, totalDistanceMeters: totalDistance };
}

/**
 * 5. Reassignment Engine - When a courier rejects or times out
 */
export function handleCourierReassignment(
  orderId: string,
  failedCourierId: string,
  candidates: CourierCandidate[],
  pickupLat: number,
  pickupLng: number
): DispatchAssignmentResult {
  // Filter out the failed courier
  const eligibleCandidates = candidates.filter((c) => c.courierId !== failedCourierId);
  return scoreAndRankCouriers(eligibleCandidates, pickupLat, pickupLng);
}
