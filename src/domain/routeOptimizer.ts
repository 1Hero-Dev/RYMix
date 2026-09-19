/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Route Optimizer
 * Implements Section 11 (Route Optimization)
 * Uses lightweight Nearest-Neighbor heuristic to order stops without heavy client CPU cost.
 */

import { haversineDistanceMeters } from '../utils/localRealtimeSimulator';

export interface RouteWaypoint {
  id: string;
  type: 'COURIER_START' | 'PICKUP' | 'DROPOFF';
  label: string;
  lat: number;
  lng: number;
  orderId?: string;
  priority?: number;
}

export interface OptimizedRouteResult {
  waypoints: RouteWaypoint[];
  totalDistanceMeters: number;
  estimatedTravelTimeMinutes: number;
}

export class RouteOptimizer {
  /**
   * Generates an optimal sequential path starting from the courier's location.
   * Pickups must precede dropoffs for the same orderId.
   */
  public static optimizeStops(
    courierLocation: { lat: number; lng: number },
    stops: RouteWaypoint[]
  ): OptimizedRouteResult {
    if (stops.length <= 1) {
      const dist = stops.length === 1
        ? haversineDistanceMeters(courierLocation.lat, courierLocation.lng, stops[0].lat, stops[0].lng)
        : 0;
      return {
        waypoints: stops,
        totalDistanceMeters: Math.round(dist),
        estimatedTravelTimeMinutes: Math.max(3, Math.ceil(dist / 350)),
      };
    }

    // Separate pickups and dropoffs
    const pickups = stops.filter((s) => s.type === 'PICKUP');
    const dropoffs = stops.filter((s) => s.type === 'DROPOFF');

    // Rule: All pickups first, then dropoffs in order of proximity to final pickup
    const ordered: RouteWaypoint[] = [];
    let currentPos = courierLocation;
    let totalDist = 0;

    // 1. Order pickups by proximity
    const remainingPickups = [...pickups];
    while (remainingPickups.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remainingPickups.length; i++) {
        const d = haversineDistanceMeters(currentPos.lat, currentPos.lng, remainingPickups[i].lat, remainingPickups[i].lng);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const nextStop = remainingPickups.splice(nearestIdx, 1)[0];
      ordered.push(nextStop);
      totalDist += minDistance;
      currentPos = { lat: nextStop.lat, lng: nextStop.lng };
    }

    // 2. Order dropoffs by proximity from last pickup
    const remainingDropoffs = [...dropoffs];
    while (remainingDropoffs.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remainingDropoffs.length; i++) {
        const d = haversineDistanceMeters(currentPos.lat, currentPos.lng, remainingDropoffs[i].lat, remainingDropoffs[i].lng);
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const nextStop = remainingDropoffs.splice(nearestIdx, 1)[0];
      ordered.push(nextStop);
      totalDist += minDistance;
      currentPos = { lat: nextStop.lat, lng: nextStop.lng };
    }

    // City scooter speed average ~22 km/h (approx 366 meters / minute)
    const travelTimeMinutes = Math.max(4, Math.ceil(totalDist / 350));

    return {
      waypoints: ordered,
      totalDistanceMeters: Math.round(totalDist),
      estimatedTravelTimeMinutes: travelTimeMinutes,
    };
  }
}
