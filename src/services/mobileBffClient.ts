/**
 * Mobile BFF Client
 * Tailored HTTP client for the Backend-for-Frontend layer (/api/bff/mobile)
 * 
 * Features:
 * - Aggregated mobile home feed (1 trip instead of 4 separate calls)
 * - Cellular bandwidth savings calculation
 * - ETag caching support (304 Not Modified)
 * - Single-trip mobile checkout
 * - Live order polling & telemetry stream
 */

export interface MobileHomeFeedResponse {
  status: string;
  bffVersion: string;
  timestamp: string;
  meta: {
    targetDevice: string;
    payloadOptimization: string;
    networkDataSavings: string;
    storesCount: number;
  };
  quickFilters: {
    id: string;
    label: string;
    labelAr: string;
    icon: string;
    count: number;
  }[];
  activeAnnouncement: {
    id: string;
    active: boolean;
    title: string;
    subtitle: string;
    badge: string;
  };
  featuredDeals: {
    id: string;
    title: string;
    storeName: string;
    originalPrice: number;
    dealPrice: number;
    discountPercent: string;
    badge: string;
    imageUrl: string;
  }[];
  stores: {
    id: string;
    name: string;
    category: string;
    rating: number;
    reviewCount: string;
    deliveryTimeMin: number;
    distanceKm: number;
    deliveryFee: number;
    minOrder: number;
    imageUrl: string;
    isOpen: boolean;
    badge: string | null;
    topItemsPreview: {
      id: string;
      name: string;
      price: number;
      formattedPrice: string;
      imageUrl: string;
      isAvailable: boolean;
    }[];
  }[];
  loyaltySummary: {
    pointsBalance: number;
    tier: string;
    nextTierPoints: number;
    discountValueDZD: number;
  };
}

export interface MobileQuoteRequest {
  items: { menuItemId: string; quantity: number; price?: number }[];
  storeId: string;
  distanceMeters?: number;
  voucherCode?: string;
  redeemedFidelityPoints?: number;
}

export interface MobileQuoteResponse {
  status: string;
  currency: string;
  breakdown: {
    itemsSubtotalDZD: number;
    deliveryFeeDZD: number;
    packagingFeeDZD: number;
    platformServiceFeeDZD: number;
    smallOrderFeeDZD: number;
    discountDZD: number;
    finalTotalDZD: number;
    distanceKm: number;
  };
  quoteSignature: string;
  calculatedAt: string;
  appliedVoucher: string | null;
  loyaltyPointsUsed: number;
  loyaltyPointsEarned: number;
}

export interface MobileCheckoutRequest {
  items: any[];
  storeId: string;
  storeName: string;
  deliveryAddress: any;
  paymentMethod: 'COD' | 'CIB_EDAHABIA';
  voucherCode?: string;
  redeemedFidelityPoints?: number;
  deliveryNotes?: string;
  cutleryOption?: boolean;
  idempotencyKey?: string;
}

export interface MobileCheckoutResponse {
  status: string;
  success: boolean;
  message: string;
  order: any;
}

export interface MobileLiveStatusResponse {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  statusLabelFr: string;
  statusLabelAr: string;
  stepIndex: number;
  totalSteps: number;
  progressPercent: number;
  etaMinutes: number;
  estimatedArrivalTime: string;
  courier: {
    name: string;
    phone: string;
    vehicle: string;
    currentCoordinates: {
      lat: number;
      lng: number;
      speedKmh: number;
      batteryPercent: number;
    };
  };
  store: {
    name: string;
    phone: string;
    address: string;
  };
  codAmountToPrepareDZD: number;
  canCancel: boolean;
  updatedAt: string;
}

export interface MobileBffMetricsResponse {
  status: string;
  layer: string;
  serverUptimeSeconds: number;
  metrics: {
    totalRequests: number;
    homeFeedRequests: number;
    quoteRequests: number;
    checkoutRequests: number;
    liveStatusRequests: number;
    cached304Responses: number;
    averageLatencyMs: number;
    totalBytesSentFormatted: string;
    estimatedBytesSavedFormatted: string;
    bandwidthSavingsRate: string;
    roundtripSavingsRatio: string;
  };
  endpoints: { method: string; path: string; desc: string }[];
  timestamp: string;
}

class MobileBffClient {
  private baseUrl = '/api/bff/mobile';
  private cachedHomeEtag: string | null = null;
  private cachedHomeFeed: MobileHomeFeedResponse | null = null;

  /**
   * Fetch consolidated mobile home feed with optional category filter and ETag caching
   */
  async getMobileHome(category: string = 'all'): Promise<{ data: MobileHomeFeedResponse; fromCache: boolean; latencyMs: number }> {
    const start = performance.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.cachedHomeEtag) {
      headers['If-None-Match'] = this.cachedHomeEtag;
    }

    try {
      const res = await fetch(`${this.baseUrl}/home?category=${encodeURIComponent(category)}`, {
        headers,
      });

      const latencyMs = Math.round(performance.now() - start);

      if (res.status === 304 && this.cachedHomeFeed) {
        return { data: this.cachedHomeFeed, fromCache: true, latencyMs };
      }

      if (!res.ok) {
        throw new Error(`BFF Home error: ${res.status}`);
      }

      const etag = res.headers.get('ETag');
      if (etag) {
        this.cachedHomeEtag = etag;
      }

      const data: MobileHomeFeedResponse = await res.json();
      this.cachedHomeFeed = data;

      return { data, fromCache: false, latencyMs };
    } catch (err) {
      console.warn('[MobileBFF] Fallback or error fetching home feed:', err);
      if (this.cachedHomeFeed) {
        return { data: this.cachedHomeFeed, fromCache: true, latencyMs: Math.round(performance.now() - start) };
      }
      throw err;
    }
  }

  /**
   * Get store and catalog shaped for mobile screens
   */
  async getMobileStore(storeId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/stores/${storeId}`);
    if (!res.ok) throw new Error(`BFF Store error: ${res.status}`);
    return await res.json();
  }

  /**
   * Get authoritative pricing quote tailored for mobile
   */
  async getMobileQuote(payload: MobileQuoteRequest): Promise<MobileQuoteResponse> {
    const res = await fetch(`${this.baseUrl}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`BFF Quote error: ${res.status}`);
    return await res.json();
  }

  /**
   * Submit single-trip mobile checkout
   */
  async submitMobileCheckout(payload: MobileCheckoutRequest): Promise<MobileCheckoutResponse> {
    const res = await fetch(`${this.baseUrl}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        idempotencyKey: payload.idempotencyKey || `mob-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      }),
    });
    if (!res.ok) throw new Error(`BFF Checkout error: ${res.status}`);
    return await res.json();
  }

  /**
   * Poll live order tracking snapshot
   */
  async getMobileLiveStatus(orderId: string): Promise<MobileLiveStatusResponse> {
    const res = await fetch(`${this.baseUrl}/orders/${orderId}/live-status`);
    if (!res.ok) throw new Error(`BFF Live Status error: ${res.status}`);
    return await res.json();
  }

  /**
   * Get device handshake configuration
   */
  async getMobileConfig(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/config`);
    if (!res.ok) throw new Error(`BFF Config error: ${res.status}`);
    return await res.json();
  }

  /**
   * Get real-time BFF telemetry metrics
   */
  async getBffMetrics(): Promise<MobileBffMetricsResponse> {
    const res = await fetch(`${this.baseUrl}/metrics`);
    if (!res.ok) throw new Error(`BFF Metrics error: ${res.status}`);
    return await res.json();
  }
}

export const mobileBffClient = new MobileBffClient();
