# V2 Extension Points & Interface Catalog — RYM Platform

**Version:** 1.0.0  
**Architectural Goal:** Enable V2 evolution without rewriting any V1 core domains or database schemas.

---

## 1. Extension Point Catalog

| Domain | V1 Implementation | V2 Extension Interface | File Location | Future Capability Enabled |
|---|---|---|---|---|
| **Dispatch** | `SimpleNearestCourierStrategy` | `DispatchStrategy` | `src/domain/dispatchStrategy.ts` | Multi-factor courier scoring, route optimization, multi-order batching |
| **Pricing** | `StandardAuthoritativePricingStrategy` | `PricingStrategy` | `src/domain/pricingStrategy.ts` | Real-time surge pricing, demand-based delivery fees, promo vouchers |
| **Payments** | `CashOnDeliveryPaymentProvider` | `PaymentProvider` | `src/adapters/paymentProvider.ts` | SATIM / CIB / Carte Edahabia web payment redirect & webhook verification |
| **Maps & Routing** | `LeafletOsmMapProvider` | `MapProvider` | `src/adapters/mapProvider.ts` | Google Maps Platform Distance Matrix, Traffic, Road snapping |
| **Notifications** | `BrowserAndFcmNotificationProvider` | `NotificationProvider` | `src/adapters/notificationProvider.ts` | Local Android HTTP-SMS APK SIM Gateway, WhatsApp notifications |
| **Media CDN** | `WebPMediaProvider` | `MediaProvider` | `src/adapters/mediaProvider.ts` | Cloud storage auto-resize buckets, AVIF format conversion |
| **Catalog Search** | `LocalNormalizedSearchProvider` | `SearchProvider` | `src/adapters/searchProvider.ts` | Algolia / Meilisearch / Vector embeddings for semantic search |
| **Observability** | `LightweightTelemetryAnalyticsProvider` | `AnalyticsProvider` | `src/adapters/analyticsProvider.ts` | ClickHouse / BigQuery data warehouse stream |

---

## 2. Adding a V2 Module Without Rewriting V1

### Example: Adding SATIM CIB Online Payment in V2
1. Implement `SatimCibPaymentProvider implements PaymentProvider` inside `src/adapters/paymentProvider.ts`.
2. Register the provider:
   ```typescript
   PaymentServiceRegistry.setProvider(new SatimCibPaymentProvider(satimConfig));
   ```
3. The checkout screen and order creation orchestrator interact purely via `PaymentServiceRegistry.getProvider().initiatePayment(...)`.
4. **V1 core remains 100% untouched.**
