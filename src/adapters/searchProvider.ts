/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Search Provider Abstraction Layer
 * V1: Tokenized Diacritic-Insensitive Local Catalog Filter
 * V2 Ready: Algolia / MeiliSearch / PostgreSQL Full-Text Search / AI Recommendations
 */

import { Store } from '../types';

export interface SearchProvider {
  readonly providerName: string;
  searchStores(stores: Store[], query: string, categoryFilter?: string): Store[];
}

export class LocalNormalizedSearchProvider implements SearchProvider {
  readonly providerName = 'LOCAL_NORMALIZED_V1';

  searchStores(stores: Store[], query: string, categoryFilter?: string): Store[] {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const q = normalize(query);

    return stores.filter((s) => {
      if (categoryFilter && categoryFilter !== 'all' && s.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;

      const matchName = normalize(s.name).includes(q);
      const matchCategory = normalize(s.category).includes(q);
      const matchTags = s.tags?.some((t) => normalize(t).includes(q)) ?? false;
      const matchItems = s.items?.some((it) => normalize(it.name).includes(q)) ?? false;

      return matchName || matchCategory || matchTags || matchItems;
    });
  }
}

export class SearchServiceRegistry {
  private static activeProvider: SearchProvider = new LocalNormalizedSearchProvider();

  public static getProvider(): SearchProvider {
    return this.activeProvider;
  }

  public static setProvider(provider: SearchProvider): void {
    this.activeProvider = provider;
  }
}
