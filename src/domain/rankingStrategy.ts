/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Discovery & Store Ranking Strategy
 * Implements Sections 20, 21 & 22 (Advanced Search & Ranking Strategy)
 * Explainable multi-factor scoring for store feeds.
 */

import { Store } from '../types';

export interface StoreRankingResult {
  store: Store;
  score: number;
  factors: {
    isOpenScore: number;
    ratingScore: number;
    speedScore: number;
    promoBoost: number;
    distanceScore: number;
  };
}

export class DiscoveryRankingStrategy {
  /**
   * Ranks stores based on operational quality, delivery speed, and customer ratings
   */
  public static rankStores(stores: Store[], userLocation?: { lat: number; lng: number }): StoreRankingResult[] {
    return stores
      .map((store) => {
        // Factor 1: Open status (Massive penalty if closed)
        const isOpen = store.isOpen !== false;
        const isOpenScore = isOpen ? 100 : -500;

        // Factor 2: Customer Rating (0 to 50 points)
        const ratingScore = Math.round((store.rating || 4.5) * 10);

        // Factor 3: Delivery Speed (Faster delivery gets up to 40 points)
        const minTime = store.deliveryTimeMin || 25;
        const speedScore = Math.max(5, Math.round(50 - minTime));

        // Factor 4: Active Promotions (+20 points)
        const hasPromo = !!store.promotion;
        const promoBoost = hasPromo ? 20 : 0;

        // Factor 5: Distance (If user location available)
        const distanceScore = 30; // default baseline

        const totalScore = isOpenScore + ratingScore + speedScore + promoBoost + distanceScore;

        return {
          store,
          score: totalScore,
          factors: {
            isOpenScore,
            ratingScore,
            speedScore,
            promoBoost,
            distanceScore,
          },
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
