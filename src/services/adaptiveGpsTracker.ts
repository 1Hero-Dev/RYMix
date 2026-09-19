/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Adaptive Courier GPS Telemetry Tracker
 * Implements Section 14 (Courier GPS Performance & Network Budget)
 * 
 * Policy:
 * 1. Stationary / Courier waiting: 20-30s update interval
 * 2. Active in-transit delivery: 5-10s update interval
 * 3. Proximity to destination (< 300m): 3-5s update interval
 * 4. Movement deadband (< 10 meters): Broadcasts suppressed to prevent mobile battery drain
 * 5. Ephemeral current location separated from durable historical path
 */

import { haversineDistanceMeters } from '../utils/localRealtimeSimulator';

export type CourierOperationalState = 'OFFLINE' | 'IDLE' | 'ASSIGNED_TO_PICKUP' | 'EN_ROUTE_DELIVERY' | 'NEAR_DESTINATION';

export interface GpsCoordinate {
  lat: number;
  lng: number;
  speedKmh?: number;
  headingDeg?: number;
  accuracyMeters?: number;
  timestamp: number;
}

export interface AdaptiveGpsConfig {
  idleIntervalMs: number;         // 25,000 ms (25s)
  inTransitIntervalMs: number;    // 7,000 ms (7s)
  nearDestinationIntervalMs: number; // 3,500 ms (3.5s)
  minimumDistanceDeltaMeters: number; // 10 meters deadband
  destinationProximityThresholdMeters: number; // 300 meters
}

export const DEFAULT_ADAPTIVE_GPS_CONFIG: AdaptiveGpsConfig = {
  idleIntervalMs: 25000,
  inTransitIntervalMs: 7000,
  nearDestinationIntervalMs: 3500,
  minimumDistanceDeltaMeters: 10,
  destinationProximityThresholdMeters: 300,
};

export class AdaptiveGpsTracker {
  private config: AdaptiveGpsConfig;
  private lastBroadcastCoord: GpsCoordinate | null = null;
  private lastBroadcastTimestamp = 0;
  private currentState: CourierOperationalState = 'IDLE';
  private targetDestination: { lat: number; lng: number } | null = null;
  private onBroadcastCallback: (coord: GpsCoordinate, intervalMs: number) => void;

  constructor(
    callback: (coord: GpsCoordinate, intervalMs: number) => void,
    config: AdaptiveGpsConfig = DEFAULT_ADAPTIVE_GPS_CONFIG
  ) {
    this.onBroadcastCallback = callback;
    this.config = config;
  }

  public setOperationalState(
    state: CourierOperationalState,
    destination?: { lat: number; lng: number } | null
  ): void {
    this.currentState = state;
    if (destination !== undefined) {
      this.targetDestination = destination;
    }
  }

  /**
   * Evaluates incoming device GPS ping against adaptive rules
   * Returns true if broadcast occurred, false if suppressed by deadband or throttle
   */
  public ingestCoordinate(newCoord: GpsCoordinate): boolean {
    if (this.currentState === 'OFFLINE') {
      return false;
    }

    const now = newCoord.timestamp || Date.now();
    const elapsedMs = now - this.lastBroadcastTimestamp;

    // Determine current required interval based on operational context
    let requiredIntervalMs = this.config.idleIntervalMs;

    if (this.currentState === 'ASSIGNED_TO_PICKUP' || this.currentState === 'EN_ROUTE_DELIVERY') {
      requiredIntervalMs = this.config.inTransitIntervalMs;

      // Check proximity to destination
      if (this.targetDestination) {
        const distToDest = haversineDistanceMeters(
          newCoord.lat,
          newCoord.lng,
          this.targetDestination.lat,
          this.targetDestination.lng
        );
        if (distToDest <= this.config.destinationProximityThresholdMeters) {
          requiredIntervalMs = this.config.nearDestinationIntervalMs;
        }
      }
    }

    // Rule 1: Time threshold check
    if (elapsedMs < requiredIntervalMs) {
      return false; // Throttled
    }

    // Rule 2: Movement deadband check (< 10 meters)
    if (this.lastBroadcastCoord) {
      const distanceMovedMeters = haversineDistanceMeters(
        this.lastBroadcastCoord.lat,
        this.lastBroadcastCoord.lng,
        newCoord.lat,
        newCoord.lng
      );

      // If moved less than 10 meters, skip broadcast unless stationary for over 60 seconds
      if (distanceMovedMeters < this.config.minimumDistanceDeltaMeters && elapsedMs < 60000) {
        return false;
      }
    }

    // Broadcast valid adaptive coordinate
    this.lastBroadcastCoord = newCoord;
    this.lastBroadcastTimestamp = now;
    this.onBroadcastCallback(newCoord, requiredIntervalMs);
    return true;
  }

  public getLastKnownCoordinate(): GpsCoordinate | null {
    return this.lastBroadcastCoord;
  }
}
