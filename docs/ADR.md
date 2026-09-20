# Architecture Decision Records (ADR) — RYM Delivery Platform V2

**Document Status:** Approved & Implemented  
**Scope:** Express Delivery Platform (Ahmed Rachedi, Mila, Algeria)  
**Authoritative Review Reference:** RYM Architectural Review Report 2026

---

## ADR-001: Authoritative Source of Truth and Data Layer Hierarchy

### Context & Problem Statement (Findings H2, C6)
Previously, three overlapping data persistence mechanisms co-existed with ambiguous ownership:
1. Browser LocalStorage (`fidelityDB`, `purchasingHistoryDB`)
2. Cloud Firestore (`syncOrderToFirestore`)
3. Backend Server State

This led to potential split-brain scenarios, client-side data tampering, and lack of transaction isolation.

### Decision
We establish an authoritative, single-directional hierarchy of data stores:
1. **Primary Authoritative Store (PostgreSQL):**
   - The absolute single source of truth for all durable business state: Users, Stores, Orders, Payments, Deliveries, Vouchers, and the Audit Ledger.
   - All state mutations MUST be executed via backend database transactions with strict ACID semantics.
2. **Hot Realtime State (Redis / Memory):**
   - Holds ephemeral, high-frequency state: Courier presence (heartbeats), active GPS coordinates, and real-time dispatch lock leases.
   - Never authoritative for order status or financial accounting.
3. **Cloud Firestore / Realtime Gateway Mirror:**
   - Functions strictly as a downstream read-only replica and fan-out push bridge for mobile client synchronization.
   - Writes to Firestore are projections of PostgreSQL events, never authoritative inputs.
4. **Client Local Cache / Offline Store:**
   - Strictly bounded local cache for UI responsiveness, draft carts, and offline tolerance.
   - Server state always overwrites client cache on conflict.

---

## ADR-002: Transactional Outbox Pattern & Asynchronous Event Subscriptions

### Context & Problem Statement (Findings C6, M3, M4, H4, H4b)
Previously, the order lifecycle synchronously executed non-core side effects:
- Direct calls to award loyalty points during order progression.
- Direct client-initiated push notifications ("sends alerts").
- Disconnected dispatch engine that had no mechanism to discover ready orders.

### Decision
We introduce a **Transactional Outbox Event Bus (`outboxEventBus`)**:
1. When an aggregate (e.g., Order, Payment, Delivery) changes state, an immutable domain event is atomically recorded in the Outbox queue within the same transaction.
2. The Outbox processor dispatches events to registered decoupled subscribers:
   - **Order Dispatch Subscriber (`order.ready`):** Triggers the Go Dispatch Subsystem to evaluate courier candidates within 2.0 km.
   - **Loyalty Engine Subscriber (`order.delivered`):** Asynchronously credits loyalty points using idempotent deduplication (`processedDeliveredOrderIds`). Failure in loyalty never aborts order completion.
   - **Server Notification Service:** Listens to `order.placed`, `order.accepted`, `order.ready`, `order.delivered` to dispatch FCM, Web Push, and SMS to the appropriate persona.
   - **Realtime Gateway:** Pure fan-out subscriber streaming delta events to connected clients via WebSockets.

---

## ADR-003: Server-Authoritative Pricing & Payment Orchestration

### Context & Problem Statement (Findings C4, C5)
In the legacy flow, the client `CheckoutScreen.tsx` computed the order total, applied discounts, calculated delivery fees, and directly triggered payment execution. A malicious user could modify JavaScript values in DevTools to order food for 0 DZD.

### Decision
1. **Zero Client Math for Authorization:**
   - The client UI only requests a quote (`apiGateway.quoteCartPrice`).
   - On checkout submission, the API Gateway re-computes all items, base prices, distance fees (based on server coordinates), and promo voucher validity from scratch.
   - Client-submitted totals are explicitly ignored and rejected.
2. **Server-Side Payment Intent:**
   - The payment intent is created server-side via `PaymentServiceRegistry` with the exact server-calculated amount.
   - For COD (Cash on Delivery), a verified ledger entry is created in `UNPAID` state, only marked `PAID` upon courier cash collection confirmation.

---

## ADR-004: Unified API Gateway (BFF) and Role-Based Access Control (RBAC)

### Context & Problem Statement (Findings H1, H3, H6, C1, C2, C3)
The Customer app functioned as a "god client" with direct connections to 5+ internal services and third-party APIs. There was no explicit identity layer or role enforcement on order actions.

### Decision
1. **Single Entry Point (`apiGateway`):**
   - All 4 persona applications (Customer, Merchant, Courier, Admin) communicate exclusively with the API Gateway over HTTPS / WebSockets.
2. **RBAC Role Claims:**
   - Every request carries an authenticated session with a verified role (`CUSTOMER`, `MERCHANT`, `COURIER`, `ADMIN`).
   - Action permissions are strictly enforced:
     - `CONFIRMED`, `PREPARING`, `READY`: Only `MERCHANT` or `ADMIN`.
     - `PICKED_UP`, `DELIVERING`, `ARRIVED`, `DELIVERED`: Only `COURIER` or `ADMIN`.
     - `CANCELLED`: `CUSTOMER` (only before merchant accepts), `MERCHANT`, or `ADMIN`.
     - System overrides and financial reassignments: Exclusively `ADMIN`.

---

## ADR-005: Unified Go Dispatch Subsystem Pipeline

### Context & Problem Statement (Findings C2, H4, M1)
The Dispatch Engine was an isolated box in Delivery Operations with no outgoing path to Couriers, and Batch Delivery and Route Optimizer were disconnected orphan components.

### Decision
The Go Dispatch Subsystem is structured into a deterministic 5-stage fulfillment pipeline:
1. **Candidate Selection:** Geofenced query filtering active, online couriers within a 2.0 km radius in Ahmed Rachedi.
2. **Multi-Factor Scoring:** Weighted score combining Euclidean/road distance, active bag load, courier rating, and vehicle suitability.
3. **Assignment Engine:** Emits a time-bounded `DeliveryJobOffer` (60s lease) to the top candidate via WebSockets.
4. **Batch Delivery Manager:** Evaluates bundling multi-order drop-offs if spatial detour is under 800m.
5. **Route Optimizer:** Sequences stops deterministically enforcing the invariant: **All pickups before drop-offs**.
