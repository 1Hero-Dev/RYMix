/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Merchant & Branch Domain
 * Implements Recommendation #17 (Merchant Branch Architecture)
 */

import { MerchantBranch, StoreHours, FulfillmentType } from '../types';

export interface MerchantEntity {
  id: string;
  brandName: string;
  legalBusinessNumber?: string;
  contactEmail: string;
  contactPhone: string;
  primaryCategory: string;
  branches: MerchantBranch[];
  createdAt: string;
}

const DEFAULT_HOURS: StoreHours[] = [
  { dayOfWeek: 'Lundi', openTime: '08:30', closeTime: '23:00', isClosed: false },
  { dayOfWeek: 'Mardi', openTime: '08:30', closeTime: '23:00', isClosed: false },
  { dayOfWeek: 'Mercredi', openTime: '08:30', closeTime: '23:00', isClosed: false },
  { dayOfWeek: 'Jeudi', openTime: '08:30', closeTime: '23:30', isClosed: false },
  { dayOfWeek: 'Vendredi', openTime: '15:00', closeTime: '23:30', isClosed: false },
  { dayOfWeek: 'Samedi', openTime: '08:30', closeTime: '23:00', isClosed: false },
  { dayOfWeek: 'Dimanche', openTime: '08:30', closeTime: '23:00', isClosed: false },
];

/**
 * Seed branches for Ahmed Rachedi ecosystem
 */
export const SEED_MERCHANT_BRANCHES: MerchantBranch[] = [
  {
    id: 'branch-romana-centre',
    merchantId: 'merchant-romana',
    branchName: 'Pizzeria Romana - Centre-Ville',
    address: 'Rue Principale Ahmed Rachedi, face à la Mairie',
    phone: '0555 12 34 56',
    commune: 'Ahmed Rachedi',
    serviceZoneId: 'ZONE-AR-CENTRE',
    lat: 36.4678,
    lng: 6.2891,
    isOpen: true,
    openingHours: DEFAULT_HOURS,
    deliveryRadiusMeters: 4500,
    prepTimeMinutes: 20,
    fulfillmentType: 'FOOD_PREPARATION',
  },
  {
    id: 'branch-romana-nord',
    merchantId: 'merchant-romana',
    branchName: 'Pizzeria Romana - Sortie Nord Mila',
    address: 'Route Nationale 79, Ahmed Rachedi Nord',
    phone: '0555 98 76 54',
    commune: 'Ahmed Rachedi',
    serviceZoneId: 'ZONE-AR-NORTH',
    lat: 36.4745,
    lng: 6.2952,
    isOpen: true,
    openingHours: DEFAULT_HOURS,
    deliveryRadiusMeters: 6000,
    prepTimeMinutes: 25,
    fulfillmentType: 'FOOD_PREPARATION',
  },
  {
    id: 'branch-baraka-superette',
    merchantId: 'merchant-baraka',
    branchName: 'Superette El Baraka - Express Market',
    address: 'Boulevard du 1er Novembre, Ahmed Rachedi',
    phone: '0661 44 22 11',
    commune: 'Ahmed Rachedi',
    serviceZoneId: 'ZONE-AR-CENTRE',
    lat: 36.4662,
    lng: 6.2875,
    isOpen: true,
    openingHours: DEFAULT_HOURS,
    deliveryRadiusMeters: 5000,
    prepTimeMinutes: 15,
    fulfillmentType: 'SHOPPING_PICKING',
  },
];

/**
 * Find suitable branch based on customer coordinates
 */
export function findNearestBranch(
  branches: MerchantBranch[],
  customerLat: number,
  customerLng: number
): MerchantBranch | null {
  const openBranches = branches.filter((b) => b.isOpen);
  if (openBranches.length === 0) return branches[0] || null;

  let nearest = openBranches[0];
  let minDistance = calculateEuclideanDistanceMeters(customerLat, customerLng, nearest.lat, nearest.lng);

  for (let i = 1; i < openBranches.length; i++) {
    const dist = calculateEuclideanDistanceMeters(
      customerLat,
      customerLng,
      openBranches[i].lat,
      openBranches[i].lng
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearest = openBranches[i];
    }
  }

  return nearest;
}

function calculateEuclideanDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
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
