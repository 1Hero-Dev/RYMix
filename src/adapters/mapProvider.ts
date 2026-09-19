/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Map Provider Abstraction Layer
 * V1: Leaflet / OpenStreetMap / CartoDB (Zero-key client-side rendering)
 * V2 Ready: Google Maps Platform / Mapbox Distance Matrix & Geocoding
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteGeometry {
  coordinates: [number, number][];
  distanceMeters: number;
  estimatedDurationSeconds: number;
}

export interface MapProvider {
  readonly providerName: string;
  calculateDistance(origin: LatLng, destination: LatLng): number;
  getRoute(origin: LatLng, destination: LatLng): Promise<RouteGeometry>;
  formatAddress(lat: number, lng: number): Promise<string>;
}

/**
 * V1 Leaflet & Haversine Map Provider
 * Self-contained, lightweight, zero external billed API dependency.
 */
export class LeafletOsmMapProvider implements MapProvider {
  readonly providerName = 'LEAFLET_OSM_V1';

  calculateDistance(origin: LatLng, destination: LatLng): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (origin.lat * Math.PI) / 180;
    const phi2 = (destination.lat * Math.PI) / 180;
    const deltaPhi = ((destination.lat - origin.lat) * Math.PI) / 180;
    const deltaLambda = ((destination.lng - origin.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  async getRoute(origin: LatLng, destination: LatLng): Promise<RouteGeometry> {
    const distanceMeters = this.calculateDistance(origin, destination);
    // V1 linear route estimation for Ahmed Rachedi central street grid
    const intermediateLat = (origin.lat + destination.lat) / 2 + 0.0003;
    const intermediateLng = (origin.lng + destination.lng) / 2 - 0.0002;

    return {
      coordinates: [
        [origin.lat, origin.lng],
        [intermediateLat, intermediateLng],
        [destination.lat, destination.lng],
      ],
      distanceMeters,
      estimatedDurationSeconds: Math.round(distanceMeters / 6.5), // ~23 km/h scooter speed
    };
  }

  async formatAddress(lat: number, lng: number): Promise<string> {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)} (Ahmed Rachedi, Mila)`;
  }
}

export class MapServiceRegistry {
  private static activeProvider: MapProvider = new LeafletOsmMapProvider();

  public static getProvider(): MapProvider {
    return this.activeProvider;
  }

  public static setProvider(provider: MapProvider): void {
    this.activeProvider = provider;
  }
}

/* =========================================================================
 * V2 EXTENSION POINTS (Google Maps Platform / Mapbox)
 * ========================================================================= */

export interface GoogleMapsConfig {
  apiKey: string;
  region: string; // 'dz'
  language: string; // 'fr' or 'ar'
}
