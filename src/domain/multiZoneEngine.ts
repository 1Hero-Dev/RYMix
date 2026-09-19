/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Multi-Zone & Multi-City Readiness Engine
 * Implements Sections 29 & 30 (Multi-Zone Delivery & Multi-City Scoping)
 * Enables geographic scaling across Wilaya 43 (Mila) without schema changes.
 */

export interface MunicipalDeliveryZone {
  zoneId: string;
  communeCode: string;
  communeName: string;
  wilayaCode: string;
  wilayaName: string;
  baseDeliveryFeeDZD: number;
  freeDeliveryThresholdDZD: number;
  maxServiceRadiusMeters: number;
  isActive: boolean;
  centerLat: number;
  centerLng: number;
}

export const SUPPORTED_DELIVERY_ZONES: MunicipalDeliveryZone[] = [
  {
    zoneId: 'dz-43-ahmed-rachedi-centre',
    communeCode: '4301',
    communeName: 'Ahmed Rachedi',
    wilayaCode: '43',
    wilayaName: 'Mila',
    baseDeliveryFeeDZD: 100,
    freeDeliveryThresholdDZD: 2500,
    maxServiceRadiusMeters: 3000,
    isActive: true,
    centerLat: 36.4528,
    centerLng: 6.2652,
  },
  {
    zoneId: 'dz-43-mila-centre',
    communeCode: '4302',
    communeName: 'Mila Ville',
    wilayaCode: '43',
    wilayaName: 'Mila',
    baseDeliveryFeeDZD: 150,
    freeDeliveryThresholdDZD: 3000,
    maxServiceRadiusMeters: 6000,
    isActive: true,
    centerLat: 36.4503,
    centerLng: 6.2644,
  },
  {
    zoneId: 'dz-43-grarem-gouga',
    communeCode: '4303',
    communeName: 'Grarem Gouga',
    wilayaCode: '43',
    wilayaName: 'Mila',
    baseDeliveryFeeDZD: 180,
    freeDeliveryThresholdDZD: 3500,
    maxServiceRadiusMeters: 5000,
    isActive: false, // Planned for future expansion
    centerLat: 36.5258,
    centerLng: 6.3267,
  },
];

export class MultiZoneEngine {
  /**
   * Resolves delivery zone from commune name
   */
  public static resolveZone(communeName: string): MunicipalDeliveryZone {
    const normalized = communeName.toLowerCase().trim();
    const found = SUPPORTED_DELIVERY_ZONES.find(
      (z) => z.communeName.toLowerCase() === normalized || z.communeCode === normalized
    );

    // Default to Ahmed Rachedi primary zone if unmatched
    return found || SUPPORTED_DELIVERY_ZONES[0];
  }

  /**
   * Lists all currently active operating zones
   */
  public static getActiveZones(): MunicipalDeliveryZone[] {
    return SUPPORTED_DELIVERY_ZONES.filter((z) => z.isActive);
  }
}
