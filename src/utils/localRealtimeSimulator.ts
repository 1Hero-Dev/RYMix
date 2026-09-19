/**
 * Local Real-time Dispatch Hub & Database Connection Configurations
 *
 * Configured for local development with fallback simulators.
 * Real PostgreSQL and remote Go WebSocket URLs will be plugged into these variables later.
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface SystemEnvironmentConfig {
  databaseUrl: string;
  realtimeDispatchUrl: string;
  realtimeWsUrl: string;
  isUsingLocalFallback: boolean;
  wilayaCode: string;
  wilayaName: string;
  launchRadiusMeters: number;
}

// Local development URLs (placeholders ready to be swapped for production URLs)
export const DEFAULT_DEV_DATABASE_URL =
  'postgresql://mila_admin:secret@localhost:5432/mila_delivery_db?schema=public';

export const DEFAULT_DEV_REALTIME_HTTP_URL = 'http://localhost:8080';
export const DEFAULT_DEV_REALTIME_WS_URL = 'ws://localhost:8080/ws';

export interface LocalCourierTelemetryPing {
  courierId: string;
  name: string;
  vehicle: string;
  phone: string;
  lat: number;
  lng: number;
  speedKmh: number;
  headingDeg: number;
  activeOrders: number;
  rating: number;
  lastPingTimestamp: number;
  freshness: 'LIVE' | 'UPDATING' | 'STALE' | 'OFFLINE';
  distanceToMilaCenterMeters: number;
  eligible2KmRadius: boolean;
}

export interface LocalDispatchCandidateEvaluation {
  courier: LocalCourierTelemetryPing;
  distanceToStoreMeters: number;
  score: number;
  isEligibleWithin2Km: boolean;
  recommendationReason: string;
}

// Fixed Ahmed Rachedi Centre Landmark GPS reference
export const MILA_CENTER_GPS = {
  lat: 36.4503,
  lng: 6.2649,
  name: 'Ahmed Rachedi Centre-Ville',
};

/**
 * Calculates Haversine distance in meters between two coordinates
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Local in-memory Realtime Dispatch Engine simulator
 * Matches the Go 1.23 sync.RWMutex implementation for local development
 */
class LocalRealtimeDispatchService {
  private databaseUrl: string;
  private realtimeDispatchUrl: string;
  private couriers: Map<string, LocalCourierTelemetryPing> = new Map();
  private listeners: Set<(couriers: LocalCourierTelemetryPing[]) => void> = new Set();
  private configListeners: Set<(config: { databaseUrl: string; realtimeDispatchUrl: string }) => void> = new Set();
  private timer: any = null;
  private unsubscribeConfig: (() => void) | null = null;

  constructor() {
    // Load configured or fallback development URLs
    this.databaseUrl =
      (typeof process !== 'undefined' && process.env?.DATABASE_URL) ||
      DEFAULT_DEV_DATABASE_URL;

    this.realtimeDispatchUrl =
      (typeof process !== 'undefined' && process.env?.REALTIME_DISPATCH_URL) ||
      DEFAULT_DEV_REALTIME_HTTP_URL;

    this.initFirebaseConfigSubscription();
    this.initializeLocalFleet();
    this.startTelemetryLoop();
  }

  private initFirebaseConfigSubscription() {
    try {
      const configRef = doc(db, 'systemConfig', 'dispatchConfig');
      this.unsubscribeConfig = onSnapshot(
        configRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            let changed = false;
            if (data.databaseUrl && data.databaseUrl !== this.databaseUrl) {
              this.databaseUrl = data.databaseUrl;
              changed = true;
            }
            if (data.realtimeDispatchUrl && data.realtimeDispatchUrl !== this.realtimeDispatchUrl) {
              this.realtimeDispatchUrl = data.realtimeDispatchUrl;
              changed = true;
            }
            if (changed) {
              this.notifyConfigListeners();
            }
          }
        },
        (error) => {
          console.warn('Firebase dispatchConfig real-time listener notice:', error);
        }
      );
    } catch (error) {
      console.warn('Failed to subscribe to realtime config from Firebase, using fallbacks:', error);
    }
  }

  public subscribeConfig(listener: (config: { databaseUrl: string; realtimeDispatchUrl: string }) => void): () => void {
    this.configListeners.add(listener);
    listener({ databaseUrl: this.databaseUrl, realtimeDispatchUrl: this.realtimeDispatchUrl });
    return () => {
      this.configListeners.delete(listener);
    };
  }

  private notifyConfigListeners() {
    const config = { databaseUrl: this.databaseUrl, realtimeDispatchUrl: this.realtimeDispatchUrl };
    for (const listener of this.configListeners) {
      try {
        listener(config);
      } catch (err) {
        console.error('Error in config listener:', err);
      }
    }
  }

  public async saveRemoteConfig(databaseUrl: string, realtimeDispatchUrl: string): Promise<boolean> {
    this.databaseUrl = databaseUrl;
    this.realtimeDispatchUrl = realtimeDispatchUrl;
    this.notifyConfigListeners();

    try {
      const configRef = doc(db, 'systemConfig', 'dispatchConfig');
      await setDoc(
        configRef,
        {
          databaseUrl,
          realtimeDispatchUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (error) {
      console.warn('Could not persist dispatchConfig to Firestore:', error);
      return false;
    }
  }

  public getDatabaseUrl(): string {
    return this.databaseUrl;
  }

  public setDatabaseUrl(url: string): void {
    this.databaseUrl = url;
    this.notifyConfigListeners();
  }

  public getRealtimeDispatchUrl(): string {
    return this.realtimeDispatchUrl;
  }

  public setRealtimeDispatchUrl(url: string): void {
    this.realtimeDispatchUrl = url;
    this.notifyConfigListeners();
  }

  private initializeLocalFleet() {
    const initialCouriers: Omit<LocalCourierTelemetryPing, 'distanceToMilaCenterMeters' | 'eligible2KmRadius' | 'freshness'>[] = [
      {
        courierId: 'courier-walid',
        name: 'Walid M.',
        vehicle: 'Scooter SYM Jet 14 (125cc)',
        phone: '+213 551 23 45 67',
        lat: 36.4520,
        lng: 6.2670,
        speedKmh: 24,
        headingDeg: 85,
        activeOrders: 0,
        rating: 4.95,
        lastPingTimestamp: Date.now() - 1500,
      },
      {
        courierId: 'courier-karim',
        name: 'Karim S.',
        vehicle: 'Peugeot Tweet 125',
        phone: '+213 558 99 11 22',
        lat: 36.4555,
        lng: 6.2690,
        speedKmh: 18,
        headingDeg: 190,
        activeOrders: 1,
        rating: 4.88,
        lastPingTimestamp: Date.now() - 3200,
      },
      {
        courierId: 'courier-nassim',
        name: 'Nassim B.',
        vehicle: 'Yamaha YBR 125',
        phone: '+213 662 44 55 66',
        lat: 36.4608,
        lng: 6.2735,
        speedKmh: 31,
        headingDeg: 45,
        activeOrders: 0,
        rating: 4.75,
        lastPingTimestamp: Date.now() - 6500,
      },
      {
        courierId: 'courier-farid',
        name: 'Farid K. (Périphérie)',
        vehicle: 'SYM Fiddle 125',
        phone: '+213 770 11 22 33',
        lat: 36.4735,
        lng: 6.2920, // > 2.0 km outside perimeter
        speedKmh: 0,
        headingDeg: 0,
        activeOrders: 0,
        rating: 4.90,
        lastPingTimestamp: Date.now() - 2500,
      },
    ];

    for (const item of initialCouriers) {
      const dist = haversineDistanceMeters(
        MILA_CENTER_GPS.lat,
        MILA_CENTER_GPS.lng,
        item.lat,
        item.lng
      );
      this.couriers.set(item.courierId, {
        ...item,
        distanceToMilaCenterMeters: dist,
        eligible2KmRadius: dist <= 2000,
        freshness: 'LIVE',
      });
    }
  }

  /**
   * Starts local 2.5-second in-memory telemetry simulation loop
   * Emulates live GPS updates coming from courier mobile units in Mila
   */
  private startTelemetryLoop() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const now = Date.now();
      for (const [id, c] of this.couriers.entries()) {
        // Slight natural micro-movement for active couriers
        const deltaLat = (Math.random() - 0.5) * 0.0004;
        const deltaLng = (Math.random() - 0.5) * 0.0004;
        const newLat = c.lat + deltaLat;
        const newLng = c.lng + deltaLng;
        const dist = haversineDistanceMeters(
          MILA_CENTER_GPS.lat,
          MILA_CENTER_GPS.lng,
          newLat,
          newLng
        );
        const ageSec = (now - c.lastPingTimestamp) / 1000;
        let freshness: LocalCourierTelemetryPing['freshness'] = 'LIVE';
        if (ageSec > 15) freshness = 'OFFLINE';
        else if (ageSec > 5) freshness = 'UPDATING';

        this.couriers.set(id, {
          ...c,
          lat: newLat,
          lng: newLng,
          lastPingTimestamp: now,
          distanceToMilaCenterMeters: dist,
          eligible2KmRadius: dist <= 2000,
          freshness: 'LIVE',
          speedKmh: Math.max(0, Math.min(45, Math.round(c.speedKmh + (Math.random() - 0.5) * 6))),
        });
      }

      this.notifyListeners();
    }, 2500);
  }

  public subscribe(listener: (couriers: LocalCourierTelemetryPing[]) => void) {
    this.listeners.add(listener);
    listener(this.getAllCouriers());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const list = this.getAllCouriers();
    for (const listener of this.listeners) {
      try {
        listener(list);
      } catch (err) {
        console.error('Error in courier telemetry listener:', err);
      }
    }
  }

  public getAllCouriers(): LocalCourierTelemetryPing[] {
    return Array.from(this.couriers.values());
  }

  /**
   * Deterministic Dispatch Algorithm (matches Go dispatcher.go)
   * Score = distanceMeters + (activeDeliveries * 450) + ((5.0 - rating) * 200)
   */
  public evaluateCandidates(
    storeLat: number,
    storeLng: number,
    maxRadiusMeters: number = 2000
  ): LocalDispatchCandidateEvaluation[] {
    const list = this.getAllCouriers();

    return list
      .map((courier) => {
        const distToStore = haversineDistanceMeters(storeLat, storeLng, courier.lat, courier.lng);
        const isEligibleWithin2Km = distToStore <= maxRadiusMeters && courier.activeOrders < 3;

        // Scoring: Lower is better
        const ratingPenalty = Math.max(0, (5.0 - courier.rating) * 200);
        const activePenalty = courier.activeOrders * 450;
        const score = Math.round(distToStore + activePenalty + ratingPenalty);

        let recommendationReason = '';
        if (!isEligibleWithin2Km) {
          recommendationReason = `Distance (${(distToStore / 1000).toFixed(1)} km) dépasse le rayon de lancement de 2,0 km`;
        } else if (courier.activeOrders === 0) {
          recommendationReason = `Disponible immédiatement (${distToStore} m du restaurant)`;
        } else {
          recommendationReason = `En livraison (${courier.activeOrders} active), proximité optimale (${distToStore} m)`;
        }

        return {
          courier,
          distanceToStoreMeters: distToStore,
          score,
          isEligibleWithin2Km,
          recommendationReason,
        };
      })
      .sort((a, b) => {
        // Eligible couriers always come first, sorted by score ascending
        if (a.isEligibleWithin2Km && !b.isEligibleWithin2Km) return -1;
        if (!a.isEligibleWithin2Km && b.isEligibleWithin2Km) return 1;
        return a.score - b.score;
      });
  }

  public registerNewCourier(courier: LocalCourierTelemetryPing): void {
    this.couriers.set(courier.courierId, courier);
    this.notifyListeners();
  }

  public toggleCourierStatus(courierId: string, isOnline: boolean): void {
    const c = this.couriers.get(courierId);
    if (c) {
      this.couriers.set(courierId, {
        ...c,
        freshness: isOnline ? 'LIVE' : 'OFFLINE',
        speedKmh: isOnline ? c.speedKmh : 0,
        lastPingTimestamp: Date.now(),
      });
      this.notifyListeners();
    }
  }

  public injectTelemetryPing(courierId: string, patch: Partial<LocalCourierTelemetryPing>): void {
    const c = this.couriers.get(courierId);
    if (c) {
      this.couriers.set(courierId, {
        ...c,
        ...patch,
        lastPingTimestamp: Date.now(),
      });
      this.notifyListeners();
    }
  }

  public getSystemDiagnostics(): SystemEnvironmentConfig {
    return {
      databaseUrl: this.databaseUrl,
      realtimeDispatchUrl: this.realtimeDispatchUrl,
      realtimeWsUrl: this.realtimeDispatchUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws',
      isUsingLocalFallback: true,
      wilayaCode: '43',
      wilayaName: 'Ahmed Rachedi',
      launchRadiusMeters: 2000,
    };
  }
}

// Singleton export
export const localRealtimeDispatchService = new LocalRealtimeDispatchService();
export const localDispatchEngine = localRealtimeDispatchService;

/**
 * Returns an instantaneous snapshot of simulated in-memory telemetry
 */
export function getLocalTelemetrySnapshot(): LocalCourierTelemetryPing[] {
  return localRealtimeDispatchService.getAllCouriers();
}
