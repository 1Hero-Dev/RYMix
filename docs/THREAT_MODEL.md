# Security Threat Model & Mitigations — RYM Platform V2

**Document Status:** Complete & Audited  
**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
**High-Risk Target Assets:** Pricing Engine, Payment Flows, Courier GPS Location Telemetry

---

## 1. Asset: Pricing & Promotions Engine

### Threat 1.1: Client-Side Price Tampering (Tampering)
- **Attack Scenario:** A customer alters client-side memory or intercepts `POST /api/checkout` to pass `total: 50` DZD instead of `1500` DZD.
- **Vulnerability Identified in Review:** Finding C5 (Pricing calculated in client path).
- **Enforced Mitigation:**
  - The API Gateway executes authoritative server-side pricing (`calculateAuthoritativePrice`).
  - The client payload is restricted to `{ storeId, items: [{ menuItemId, quantity }], voucherCode, deliveryAddress }`.
  - Prices are looked up directly from the database menu catalog. Any price fields provided in the HTTP request body are discarded.

### Threat 1.2: Promo Code / Voucher Multi-Replay (Tampering / Privilege)
- **Attack Scenario:** A user rapidly submits parallel requests using a one-time promo code (`BIENVENUE`) to obtain multiple discounts.
- **Enforced Mitigation:**
  - Idempotency key requirement on order checkout.
  - Transactional lock on voucher redemption table in PostgreSQL before committing order creation.
  - Server-side anti-cumul enforcement (`maxDiscountCap` + strict tier validation).

---

## 2. Asset: Payment & Cash-on-Delivery (COD) Flow

### Threat 2.1: Direct Client Payment Exploitation (Elevation / Tampering)
- **Attack Scenario:** Client calls payment gateway API directly with arbitrary amounts or triggers fake payment success callbacks.
- **Vulnerability Identified in Review:** Finding C4 (Payments charged from UI screen).
- **Enforced Mitigation:**
  - Payment orchestration moved 100% server-side.
  - Client only supplies payment method token or selects `COD`.
  - Server initiates PaymentIntent with verified total and handles webhooks with cryptographic HMAC signature verification (`stripe-signature` / Algerian SATIM merchant secret).
  - COD reconciliation ledger: Courier must enter actual cash collected at customer door; variance is flagged automatically to Admin audit.

### Threat 2.2: Order State Transition Spoofing (Spoofing / Privilege)
- **Attack Scenario:** A courier or customer attempts to mark an order as `DELIVERED` or `REFUNDED` to bypass fees or fraud controls.
- **Vulnerability Identified in Review:** Finding C6, H6.
- **Enforced Mitigation:**
  - Every transition request passes through `orderApplicationService.transitionOrder` with mandatory RBAC verification.
  - Only authenticated couriers assigned to the specific order can progress to `DELIVERED`.
  - Refunds are strictly restricted to role `ADMIN`.

---

## 3. Asset: Courier Realtime GPS Location Telemetry

### Threat 3.1: Global Courier Location Scraping (Information Disclosure)
- **Attack Scenario:** An unauthorized user connects to the WebSocket gateway and listens to all couriers' real-time GPS coordinates, tracking courier movements across Wilaya 43.
- **Vulnerability Identified in Review:** Finding H5, H6.
- **Enforced Mitigation:**
  - WebSocket gateway authenticates clients via bearer tokens and requires an active `orderId` subscription claim.
  - Customers can ONLY receive GPS deltas for the specific courier assigned to their own active order.
  - GPS coordinates are fuzzy-jittered (rounded to 100m) until the courier enters the immediate 500m delivery corridor.
  - Couriers not engaged in an active delivery have their location visible only to the internal Dispatch Engine and Admin Operations.

### Threat 3.2: GPS Spoofing & Telemetry Flooding (Tampering / DoS)
- **Attack Scenario:** A malicious courier app transmits fake teleportation coordinates or sends 100 updates/sec to overwhelm the server.
- **Enforced Mitigation:**
  - Adaptive GPS tracker (`adaptiveGpsTracker.ts`): Server enforces maximum ingest rate (minimum 3-second interval). Excess ticks are dropped.
  - Plausibility velocity checks: Speed exceeding 80 km/h in urban Ahmed Rachedi is rejected as an anomaly.
  - Telemetry is held in volatile memory; only sampled checkpoints (1 per 60s) are recorded for historical delivery verification.
