/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Fulfillment Domain - Food Preparation vs Shopping Picking
 * Implements Recommendation #4 (Explicit Food & Shopping Fulfillment Model)
 */

import {
  FulfillmentType,
  OrderFulfillmentRecord,
  ShoppingItemDetail,
  ShoppingItemPickStatus,
  ShoppingItemSubstitution,
  CartItem,
} from '../types';

/**
 * Determine fulfillment model by store category
 */
export function determineFulfillmentType(categoryOrType: string): FulfillmentType {
  const cat = categoryOrType.toLowerCase();
  if (
    cat.includes('superette') ||
    cat.includes('courses') ||
    cat.includes('epicerie') ||
    cat.includes('market') ||
    cat.includes('boucherie') ||
    cat.includes('primeur')
  ) {
    return 'SHOPPING_PICKING';
  }
  return 'FOOD_PREPARATION';
}

/**
 * Initialize a new fulfillment record from cart items
 */
export function createOrderFulfillmentRecord(
  orderId: string,
  storeId: string,
  category: string,
  cartItems: CartItem[],
  estimatedPrepMinutes: number = 20
): OrderFulfillmentRecord {
  const fulfillmentType = determineFulfillmentType(category);

  const items: ShoppingItemDetail[] = cartItems.map((ci) => ({
    itemId: ci.menuItemId,
    name: ci.name,
    requestedQty: ci.quantity,
    pickedQty: fulfillmentType === 'FOOD_PREPARATION' ? ci.quantity : 0,
    priceDZD: ci.basePrice,
    status: fulfillmentType === 'FOOD_PREPARATION' ? 'PICKED' : 'REQUESTED',
  }));

  return {
    orderId,
    storeId,
    type: fulfillmentType,
    status: 'QUEUED',
    items,
    prepTimeMinutes: estimatedPrepMinutes,
    startedAt: undefined,
    completedAt: undefined,
    pickerOrChefName: fulfillmentType === 'FOOD_PREPARATION' ? 'Chef Cuisine' : 'Préparateur Magasin',
    packagingDone: false,
  };
}

/**
 * Transition fulfillment status (QUEUED -> IN_PROGRESS -> COMPLETED)
 */
export function startFulfillment(record: OrderFulfillmentRecord, agentName?: string): OrderFulfillmentRecord {
  return {
    ...record,
    status: 'IN_PROGRESS',
    startedAt: new Date().toISOString(),
    pickerOrChefName: agentName || record.pickerOrChefName,
  };
}

/**
 * Update picking status for a shopping item (courses / superette)
 */
export function updateItemPickStatus(
  record: OrderFulfillmentRecord,
  itemId: string,
  newStatus: ShoppingItemPickStatus,
  pickedQty?: number,
  notes?: string
): OrderFulfillmentRecord {
  const updatedItems = record.items.map((item) => {
    if (item.itemId === itemId) {
      return {
        ...item,
        status: newStatus,
        pickedQty: pickedQty !== undefined ? pickedQty : newStatus === 'PICKED' ? item.requestedQty : 0,
        pickerNotes: notes !== undefined ? notes : item.pickerNotes,
      };
    }
    return item;
  });

  const allDone = updatedItems.every((it) => it.status === 'PICKED' || it.status === 'SUBSTITUTED' || it.status === 'UNAVAILABLE');

  return {
    ...record,
    items: updatedItems,
    status: allDone ? 'COMPLETED' : 'IN_PROGRESS',
  };
}

/**
 * Apply substitution for an out-of-stock shopping item
 */
export function applyItemSubstitution(
  record: OrderFulfillmentRecord,
  itemId: string,
  substitution: ShoppingItemSubstitution,
  notes?: string
): OrderFulfillmentRecord {
  const updatedItems = record.items.map((item) => {
    if (item.itemId === itemId) {
      return {
        ...item,
        status: 'SUBSTITUTED' as ShoppingItemPickStatus,
        substitution,
        pickerNotes: notes || `Remplacé par ${substitution.replacementName} (Écart: ${substitution.priceDeltaDZD} DZD)`,
      };
    }
    return item;
  });

  return {
    ...record,
    items: updatedItems,
  };
}

/**
 * Complete and seal packaging
 */
export function completeFulfillment(
  record: OrderFulfillmentRecord,
  notes?: string
): OrderFulfillmentRecord {
  return {
    ...record,
    status: 'COMPLETED',
    packagingDone: true,
    completedAt: new Date().toISOString(),
    exceptionReason: notes,
  };
}
