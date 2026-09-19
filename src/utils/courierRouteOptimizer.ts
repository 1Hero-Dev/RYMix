import { OptimizedRouteBundle } from '../types';

export interface GeoCoord {
  lat: number;
  lng: number;
}

/**
 * Great-circle haversine distance calculation in meters
 */
export function calculateDistanceMeters(
  from: GeoCoord | [number, number],
  to: GeoCoord | [number, number]
): number {
  const lat1 = Array.isArray(from) ? from[0] : from.lat;
  const lon1 = Array.isArray(from) ? from[1] : from.lng;
  const lat2 = Array.isArray(to) ? to[0] : to.lat;
  const lon2 = Array.isArray(to) ? to[1] : to.lng;

  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Pre-seeded pool of ready or preparing deliveries across Ahmed Rachedi
 */
export const MILA_READY_DELIVERIES_POOL: OptimizedRouteBundle[] = [
  {
    id: 'bundle-ar-89',
    orderId: 'order-ar-89',
    orderNumber: '#AR-89',
    storeId: 'store-supermarket',
    storeName: 'Marché Ahmed Rachedi - Terroir & Supérette',
    storeAddress: 'Rue Principale (CW 152), Ahmed Rachedi',
    storeDistanceMeters: 80,
    customerDestination: 'Cité El Bassatine, Bâtiment B2 (3ème étage)',
    customerLandmark: 'Face à la supérette Al-Baraka, Ahmed Rachedi',
    customerDistanceMeters: 110,
    corridorDetourMeters: 140,
    estimatedExtraMinutes: 2,
    bundleBonusPayoutDZD: 380,
    totalPayoutDZD: 380,
    matchScorePercent: 98,
    urgencyTag: 'Prête en boutique',
    itemsSummary: 'Panier fruits locaux d\'Ahmed Rachedi + Eau minérale 6×1.5L',
    reason: 'Destination dans le même groupe d’immeubles (110m). Aucun détour routier.',
    pickupLat: 36.39410,
    pickupLng: 6.13090,
    dropoffLat: 36.39180,
    dropoffLng: 6.12890,
  },
  {
    id: 'bundle-ar-94',
    orderId: 'order-ar-94',
    orderNumber: '#AR-94',
    storeId: 'store-beniharoun',
    storeName: 'Grillades & Resto Ahmed Rachedi',
    storeAddress: 'Rue Principale (CW 152), Centre-ville Ahmed Rachedi',
    storeDistanceMeters: 25,
    customerDestination: 'Cité El Bassatine, Bâtiment D1 (RDC)',
    customerLandmark: 'Entrée parking sud, Cité El Bassatine',
    customerDistanceMeters: 85,
    corridorDetourMeters: 90,
    estimatedExtraMinutes: 2,
    bundleBonusPayoutDZD: 350,
    totalPayoutDZD: 350,
    matchScorePercent: 99,
    urgencyTag: 'Même restaurant d’origine',
    itemsSummary: '1× Poisson grillé + Frites maison + Citronnade',
    reason: 'Enlèvement au même restaurant et livraison dans le bâtiment voisin.',
    pickupLat: 36.39485,
    pickupLng: 6.13162,
    dropoffLat: 36.39140,
    dropoffLng: 6.12860,
  },
  {
    id: 'bundle-ar-102',
    orderId: 'order-ar-102',
    orderNumber: '#AR-102',
    storeId: 'store-citadelle',
    storeName: 'Pâtisserie & Salon Ahmed Rachedi',
    storeAddress: 'Rue Principale, Ahmed Rachedi Centre',
    storeDistanceMeters: 220,
    customerDestination: 'Cité En-Nasr, Bâtiment 4',
    customerLandmark: 'À côté de l\'école primaire En-Nasr',
    customerDistanceMeters: 380,
    corridorDetourMeters: 280,
    estimatedExtraMinutes: 4,
    bundleBonusPayoutDZD: 420,
    totalPayoutDZD: 420,
    matchScorePercent: 91,
    urgencyTag: 'Prête à emporter',
    itemsSummary: 'Boîte Makroudh aux dattes + 4× Tartes aux fraises',
    reason: 'Sur le trajet retour direct vers le centre. Couvre le couloir En-Nasr.',
    pickupLat: 36.39510,
    pickupLng: 6.13220,
    dropoffLat: 36.39050,
    dropoffLng: 6.12750,
  },
];

/**
 * Finds deliveries in the ready pool whose dropoff destination is close to the courier's current destination,
 * minimizing detour and maximizing courier net earnings and delivery speed.
 */
export function findOptimizedNearbyDeliveries(
  courierDestination: GeoCoord | [number, number],
  courierCurrentPosition?: GeoCoord | [number, number],
  pool: OptimizedRouteBundle[] = MILA_READY_DELIVERIES_POOL
): OptimizedRouteBundle[] {
  const destLat = Array.isArray(courierDestination) ? courierDestination[0] : courierDestination.lat;
  const destLng = Array.isArray(courierDestination) ? courierDestination[1] : courierDestination.lng;

  return pool
    .map((candidate) => {
      const dropoffDist = calculateDistanceMeters(
        { lat: destLat, lng: destLng },
        { lat: candidate.dropoffLat, lng: candidate.dropoffLng }
      );

      let pickupDist = candidate.storeDistanceMeters;
      if (courierCurrentPosition) {
        const curLat = Array.isArray(courierCurrentPosition) ? courierCurrentPosition[0] : courierCurrentPosition.lat;
        const curLng = Array.isArray(courierCurrentPosition) ? courierCurrentPosition[1] : courierCurrentPosition.lng;
        pickupDist = calculateDistanceMeters(
          { lat: curLat, lng: curLng },
          { lat: candidate.pickupLat, lng: candidate.pickupLng }
        );
      }

      // Proximity score: closer destinations get higher scores (max 100%)
      const score = Math.max(70, Math.min(99, Math.round(100 - (dropoffDist / 600) * 25)));

      return {
        ...candidate,
        customerDistanceMeters: dropoffDist,
        storeDistanceMeters: pickupDist,
        matchScorePercent: score,
      };
    })
    .filter((candidate) => candidate.customerDistanceMeters <= 800) // Within 800 meters of the courier's destination
    .sort((a, b) => a.customerDistanceMeters - b.customerDistanceMeters);
}
