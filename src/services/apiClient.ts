/**
 * API Client — Typed HTTP Client for Server Communication
 * 
 * Phase 1: Replaces all direct imports of apiGateway, pricingEngine,
 * orderApplicationService, etc. All business logic now flows through
 * the Fastify API server.
 * 
 * Uses Firebase Auth ID tokens for authentication (V2 fix).
 */

import { getAuth } from 'firebase/auth';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Authenticated fetch wrapper — automatically attaches the Firebase ID token.
 */
async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  let token: string | null = null;

  if (currentUser) {
    try {
      token = await currentUser.getIdToken();
    } catch {
      // User might not be signed in yet
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  return response;
}

/**
 * Generic response handler — parses JSON and throws on HTTP errors.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data as T;
}

// =========================================================================
// Pricing
// =========================================================================

export interface PriceQuoteRequest {
  items: { menuItemId: string; quantity: number }[];
  storeId: string;
  distanceMeters?: number;
  voucherCode?: string;
  redeemedFidelityPoints?: number;
}

export interface PriceQuoteResponse {
  itemsSubtotalDZD: number;
  deliveryFeeDZD: number;
  packagingFeeDZD: number;
  platformServiceFeeDZD: number;
  smallOrderFeeDZD: number;
  discountDZD: number;
  finalTotalDZD: number;
  distanceKm: number;
  signature: string;
  calculatedAt: string;
}

// =========================================================================
// Orders
// =========================================================================

export interface CreateOrderRequest {
  storeId: string;
  items: { menuItemId: string; quantity: number }[];
  deliveryAddress: {
    wilaya?: string;
    commune?: string;
    street?: string;
    landmark?: string;
    phone?: string;
    lat?: number;
    lng?: number;
    building?: string;
    floor?: string;
  };
  deliveryNotes?: string;
  voucherCode?: string;
  redeemedFidelityPoints?: number;
  idempotencyKey?: string;
}

export interface CreateOrderResponse {
  order: any;
  pricing: {
    itemsSubtotalDZD: number;
    deliveryFeeDZD: number;
    discountDZD: number;
    finalTotalDZD: number;
    signature: string;
  };
  isDuplicateReplay?: boolean;
}

export interface TransitionResponse {
  success: boolean;
  order: any;
  error?: string;
}

export interface CancelResponse {
  success: boolean;
  order: any;
  message: string;
  error?: string;
}

// =========================================================================
// API Client
// =========================================================================

export const apiClient = {
  /**
   * Get a server-authoritative price quote for a cart.
   */
  quotePrice: async (request: PriceQuoteRequest): Promise<PriceQuoteResponse> => {
    const response = await authFetch('/pricing/quote', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return handleResponse<PriceQuoteResponse>(response);
  },

  /**
   * Submit an order with server-authoritative pricing.
   */
  submitOrder: async (request: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await authFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return handleResponse<CreateOrderResponse>(response);
  },

  /**
   * Get all orders for the authenticated user.
   */
  getMyOrders: async (): Promise<any[]> => {
    const response = await authFetch('/orders/mine');
    return handleResponse<any[]>(response);
  },

  /**
   * Get a single order by ID.
   */
  getOrder: async (orderId: string): Promise<any> => {
    const response = await authFetch(`/orders/${orderId}`);
    return handleResponse<any>(response);
  },

  /**
   * Transition an order to a new status (role-guarded on the server).
   */
  transitionOrder: async (orderId: string, status: string, note?: string): Promise<TransitionResponse> => {
    const response = await authFetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
    return handleResponse<TransitionResponse>(response);
  },

  /**
   * Cancel an order (lifecycle-aware, server-validated).
   */
  cancelOrder: async (orderId: string, reason?: string): Promise<CancelResponse> => {
    const response = await authFetch(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return handleResponse<CancelResponse>(response);
  },

  /**
   * Get list of stores.
   */
  getStores: async (): Promise<any[]> => {
    const response = await authFetch('/stores');
    return handleResponse<any[]>(response);
  },

  /**
   * Get store catalog.
   */
  getStoreCatalog: async (storeId: string): Promise<any[]> => {
    const response = await authFetch(`/stores/${storeId}/catalog`);
    return handleResponse<any[]>(response);
  },

  /**
   * Get loyalty account and balance.
   */
  getLoyaltyAccount: async (): Promise<any> => {
    const response = await authFetch('/loyalty/me');
    return handleResponse<any>(response);
  },
};
