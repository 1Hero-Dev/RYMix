/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Adaptive ETA Calculation Service
 * Implements Section 12 (ETA Engine)
 * Combines distance, kitchen preparation status, route sequence, and courier telemetry.
 */

import { Order, OrderStatus } from '../types';
import { haversineDistanceMeters } from '../utils/localRealtimeSimulator';

export interface EtaCalculationInput {
  order: Order;
  courierLocation?: { lat: number; lng: number };
  storeLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
}

export interface EtaResult {
  estimatedMinutes: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  breakdown: {
    prepRemainingMinutes: number;
    transitToStoreMinutes: number;
    transitToCustomerMinutes: number;
    handoffMinutes: number;
  };
}

export class ETAService {
  private static lastCalculationCache: Map<string, { eta: EtaResult; timestamp: number; lastLat: number; lastLng: number }> = new Map();

  /**
   * Calculates adaptive ETA with caching to prevent excessive CPU recalculations
   */
  public static calculateOrderETA(input: EtaCalculationInput): EtaResult {
    const { order, courierLocation, storeLocation, dropoffLocation } = input;
    const cacheKey = order.id;
    const now = Date.now();

    const cached = this.lastCalculationCache.get(cacheKey);
    if (cached) {
      const timeElapsedSec = (now - cached.timestamp) / 1000;
      // If within 20s and courier hasn't moved > 40m, reuse cached ETA minus elapsed time
      if (timeElapsedSec < 20 && courierLocation) {
        const movedMeters = haversineDistanceMeters(
          cached.lastLat,
          cached.lastLng,
          courierLocation.lat,
          courierLocation.lng
        );
        if (movedMeters < 40) {
          const decayedMin = Math.max(2, Math.round(cached.eta.estimatedMinutes - timeElapsedSec / 60));
          return {
            ...cached.eta,
            estimatedMinutes: decayedMin,
          };
        }
      }
    }

    // Step 1: Calculate Kitchen Preparation Remaining Time
    let prepRemainingMinutes = 0;
    if (order.status === 'PENDING') {
      prepRemainingMinutes = 20;
    } else if (order.status === 'CONFIRMED') {
      prepRemainingMinutes = 15;
    } else if (order.status === 'PREPARING') {
      prepRemainingMinutes = 8;
    } else {
      prepRemainingMinutes = 0; // Ready or already with courier
    }

    // Step 2: Transit Time
    let transitToStoreMinutes = 0;
    let transitToCustomerMinutes = 0;
    const handoffMinutes = 2; // Handover buffer at door

    if (courierLocation) {
      if (['ASSIGNED', 'PREPARING', 'READY'].includes(order.status)) {
        const distToStore = haversineDistanceMeters(
          courierLocation.lat,
          courierLocation.lng,
          storeLocation.lat,
          storeLocation.lng
        );
        transitToStoreMinutes = Math.max(2, Math.ceil(distToStore / 350));
      }

      const distStoreToCustomer = haversineDistanceMeters(
        order.status === 'DELIVERING' ? courierLocation.lat : storeLocation.lat,
        order.status === 'DELIVERING' ? courierLocation.lng : storeLocation.lng,
        dropoffLocation.lat,
        dropoffLocation.lng
      );
      transitToCustomerMinutes = Math.max(3, Math.ceil(distStoreToCustomer / 350));
    } else {
      // Default estimation when courier is not yet assigned
      transitToCustomerMinutes = 12;
      transitToStoreMinutes = 5;
    }

    let totalMinutes = 0;
    if (order.status === 'DELIVERING') {
      totalMinutes = transitToCustomerMinutes + handoffMinutes;
    } else if (order.status === 'PICKED_UP') {
      totalMinutes = transitToCustomerMinutes + handoffMinutes;
    } else {
      totalMinutes = Math.max(prepRemainingMinutes, transitToStoreMinutes) + transitToCustomerMinutes + handoffMinutes;
    }

    const result: EtaResult = {
      estimatedMinutes: Math.max(3, totalMinutes),
      confidence: courierLocation ? 'HIGH' : 'MEDIUM',
      breakdown: {
        prepRemainingMinutes,
        transitToStoreMinutes,
        transitToCustomerMinutes,
        handoffMinutes,
      },
    };

    if (courierLocation) {
      this.lastCalculationCache.set(cacheKey, {
        eta: result,
        timestamp: now,
        lastLat: courierLocation.lat,
        lastLng: courierLocation.lng,
      });
    }

    return result;
  }
}
