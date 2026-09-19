import { Store, Order, AvailableDeliveryPoolOrder, ChatMessage } from '../types';
import { HOMEPAGE_ESSENTIAL_STORES, HOMEPAGE_ACTIVE_ORDER } from '../data/essentialHomeData';

let fullDataCache: {
  MOCK_STORES: Store[];
  MOCK_COURIER_POOL: AvailableDeliveryPoolOrder[];
  INITIAL_CHAT_MESSAGES: ChatMessage[];
  MOCK_PAST_ORDERS: Order[];
  INITIAL_ACTIVE_ORDER: Order;
} | null = null;

async function loadFullMockData() {
  if (!fullDataCache) {
    const data = await import('../data/mockData');
    fullDataCache = {
      MOCK_STORES: data.MOCK_STORES,
      MOCK_COURIER_POOL: data.MOCK_COURIER_POOL,
      INITIAL_CHAT_MESSAGES: data.INITIAL_CHAT_MESSAGES,
      MOCK_PAST_ORDERS: data.MOCK_PAST_ORDERS,
      INITIAL_ACTIVE_ORDER: data.INITIAL_ACTIVE_ORDER,
    };
  }
  return fullDataCache;
}

/**
 * Dynamically fetches full store data with all menu categories, items, and customization options.
 * Keeps customer homepage bundle lightweight.
 */
export async function getFullStore(storeId: string): Promise<Store> {
  const cache = await loadFullMockData();
  const found = cache.MOCK_STORES.find((s) => s.id === storeId);
  if (found) return found;
  return HOMEPAGE_ESSENTIAL_STORES.find((s) => s.id === storeId) || HOMEPAGE_ESSENTIAL_STORES[0];
}

export async function getAllFullStores(): Promise<Store[]> {
  const cache = await loadFullMockData();
  return cache.MOCK_STORES;
}

export async function getCourierPool(): Promise<AvailableDeliveryPoolOrder[]> {
  const cache = await loadFullMockData();
  return cache.MOCK_COURIER_POOL;
}

export async function getPastOrders(): Promise<Order[]> {
  const cache = await loadFullMockData();
  return cache.MOCK_PAST_ORDERS;
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const cache = await loadFullMockData();
  return cache.INITIAL_CHAT_MESSAGES;
}

export async function getFullActiveOrder(): Promise<Order> {
  const cache = await loadFullMockData();
  return cache.INITIAL_ACTIVE_ORDER;
}
