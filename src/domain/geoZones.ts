/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Geographic & Service Zone Domain
 * Implements Recommendation #18 (Formal Geo & Delivery Zone Architecture)
 */

import { ServiceZoneDefinition } from '../types';

export const AHMED_RACHEDI_SERVICE_ZONES: ServiceZoneDefinition[] = [
  {
    id: 'zone-ar-centre',
    code: 'ZONE-AR-CENTRE',
    name: 'Ahmed Rachedi Centre Urbain',
    commune: 'Ahmed Rachedi',
    centerLat: 36.467,
    centerLng: 6.288,
    maxRadiusMeters: 3000,
    baseDeliveryFeeDZD: 150,
    perKmFeeDZD: 25,
    minOrderDZD: 400,
    surgeMultiplier: 1.0,
    isActive: true,
    description: 'Zone principale à forte densité (Mairie, Marché, Mosquée Al-Ansar, Cité 100 logts).',
  },
  {
    id: 'zone-ar-north',
    code: 'ZONE-AR-NORTH',
    name: 'Ahmed Rachedi Périphérie Nord',
    commune: 'Ahmed Rachedi',
    centerLat: 36.478,
    centerLng: 6.294,
    maxRadiusMeters: 5500,
    baseDeliveryFeeDZD: 200,
    perKmFeeDZD: 30,
    minOrderDZD: 600,
    surgeMultiplier: 1.0,
    isActive: true,
    description: 'Zone résidentielle nord et axe routier vers Mila.',
  },
  {
    id: 'zone-mila-corridor',
    code: 'ZONE-MILA-LINK',
    name: 'Corridor Express Ahmed Rachedi - Mila',
    commune: 'Mila',
    centerLat: 36.450,
    centerLng: 6.264,
    maxRadiusMeters: 9000,
    baseDeliveryFeeDZD: 300,
    perKmFeeDZD: 35,
    minOrderDZD: 1000,
    surgeMultiplier: 1.15,
    isActive: true,
    description: 'Liaison intercommunale pour livraisons express volumineuses.',
  },
];

/**
 * Identify matching zone by coordinates
 */
export function resolveServiceZone(lat: number, lng: number): ServiceZoneDefinition {
  for (const zone of AHMED_RACHEDI_SERVICE_ZONES) {
    const dist = calculateDistanceMeters(lat, lng, zone.centerLat, zone.centerLng);
    if (dist <= zone.maxRadiusMeters) {
      return zone;
    }
  }
  // Fallback to primary zone
  return AHMED_RACHEDI_SERVICE_ZONES[0];
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
