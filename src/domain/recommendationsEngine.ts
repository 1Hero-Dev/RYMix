/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Recommendations & Customer Personalization Engine
 * Implements Sections 23, 24 & 25 (Recommendations, Favorites, and Safe Reorder)
 * 
 * Invariant:
 * Reordering never blindly copies old prices or unavailable items.
 * It validates current stock, store status, and fresh authoritative prices.
 */

import { Order, CartItem, Store } from '../types';

export interface ReorderValidationResult {
  canReorder: boolean;
  store: Store;
  validItems: CartItem[];
  outOfStockItemNames: string[];
  priceAdjusted: boolean;
  message: string;
}

export class RecommendationsEngine {
  private static FAVORITES_KEY = 'rym_customer_favorite_store_ids';

  /**
   * Retrieves favorite store IDs
   */
  public static getFavoriteStoreIds(): string[] {
    try {
      const data = localStorage.getItem(this.FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Toggles a store in customer favorites
   */
  public static toggleFavoriteStore(storeId: string): boolean {
    const favorites = this.getFavoriteStoreIds();
    const idx = favorites.indexOf(storeId);
    let isFav = false;

    if (idx >= 0) {
      favorites.splice(idx, 1);
      isFav = false;
    } else {
      favorites.push(storeId);
      isFav = true;
    }

    try {
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Fallback
    }

    return isFav;
  }

  /**
   * Safe Reorder Validation:
   * Checks current store catalog to ensure products still exist, are in stock,
   * and recalculates cart with current menu prices.
   */
  public static validateReorder(pastOrder: Order, currentStore: Store): ReorderValidationResult {
    if (!currentStore.isOpen) {
      return {
        canReorder: false,
        store: currentStore,
        validItems: [],
        outOfStockItemNames: [],
        priceAdjusted: false,
        message: `${currentStore.name} est actuellement fermé`,
      };
    }

    const validItems: CartItem[] = [];
    const outOfStockNames: string[] = [];
    let priceAdjusted = false;

    const availableItemsMap = new Map(currentStore.items.map((i) => [i.id, i]));

    for (const orderItem of pastOrder.items) {
      const liveItem = availableItemsMap.get(orderItem.menuItemId);

      if (!liveItem || liveItem.isAvailable === false) {
        outOfStockNames.push(orderItem.name);
        continue;
      }

      if (liveItem.price !== orderItem.basePrice) {
        priceAdjusted = true;
      }

      validItems.push({
        menuItemId: liveItem.id,
        storeId: currentStore.id,
        storeName: currentStore.name,
        name: liveItem.name,
        basePrice: liveItem.price,
        quantity: orderItem.quantity,
        imageUrl: liveItem.imageUrl,
        options: orderItem.options || [],
        chefRemark: orderItem.chefRemark,
      });
    }

    if (validItems.length === 0) {
      return {
        canReorder: false,
        store: currentStore,
        validItems: [],
        outOfStockItemNames: outOfStockNames,
        priceAdjusted,
        message: 'Les articles de cette commande ne sont plus disponibles',
      };
    }

    let message = 'Articles ajoutés au panier avec succès !';
    if (outOfStockNames.length > 0) {
      message = `${validItems.length} article(s) ajoutés (${outOfStockNames.join(', ')} indisponible(s))`;
    }

    return {
      canReorder: true,
      store: currentStore,
      validItems,
      outOfStockItemNames: outOfStockNames,
      priceAdjusted,
      message,
    };
  }
}
