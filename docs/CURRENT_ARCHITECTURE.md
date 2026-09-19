# Current Architecture & Component Inventory — RYM Platform (V2 Status)

**Version:** 2.0.0  
**Status:** Reviewed & Fully Aligned with Target Architecture  
**Scope:** Wilaya 43 (Mila) & Ahmed Rachedi Core Operations  

---

## 1. Resolved Architectural Conflicts

All previously identified ambiguities from the architectural audit have been formally resolved:

1. **Dual Dispatch Implementations:**
   - **Resolved:** Unified dispatch ownership strictly under the Go Realtime Service (`services/realtime-dispatch/dispatch`). The TypeScript implementation in `src/services/dispatchEngine.ts` is relegated to domain business policies and fulfillment rules (`src/domain/deliveryPolicy.ts`).
2. **Go Service Structure:**
   - **Resolved:** Decomposed from a monolithic `tracker/` directory into cleanly isolated packages:
     - `websocket/`: Gateway connection hub & streaming broadcasts.
     - `presence/`: Operational courier state (`ONLINE`, `AVAILABLE`, `BUSY`, `OFFLINE`).
     - `tracking/`: In-memory GPS coordinates and spatial calculations.
     - `dispatch/`: Complete fulfillment pipeline (`candidate.go`, `scorer.go`, `assignment.go`, `batching.go`, `route.go`).
     - `telemetry/`: Rolling window store for sampled telemetry metrics.
3. **Database & Persistence Ambiguity:**
   - **Resolved:** **PostgreSQL** is the authoritative primary transaction database for business state (Orders, Stores, Users, Payments, Deliveries, Promotions, Audit). `src/db/localDatabase.ts` is explicitly bounded and labeled as **Client Local Cache / Offline Store** (non-authoritative).
4. **Firebase Ambiguity:**
   - **Resolved:** Firebase is explicitly bounded as the **FCM Push Notification Adapter** within the Event & Integration Layer, not a generic catch-all.
5. **Client UI Actions:**
   - **Resolved:** Client applications submit action requests (e.g. `POST /orders/:id/cancel`, `POST /orders/:id/accept`), strictly delegating order status transitions to the server state machine (`OrderApplicationService` + `OrderLifecycle`).
6. **Delivery Pool Renaming:**
   - **Resolved:** Renamed "Courier Order Pool" to **Delivery Offers / Delivery Queue**, reflecting the authoritative Go dispatch model (Dispatch -> Delivery Offer -> Courier Accept/Reject).

---

## 2. Active Component Inventory

### A. Client Applications (`src/components/`)
- `CustomerApp`: Mobile-first discovery, cart, bottom-sheet checkout, order tracking.
- `CourierAppView`: Realtime mission offers, delivery queue, active navigation, turn-by-turn simulation.
- `MerchantAppView`: Tablet/desktop kitchen dashboard, preparation timers, inventory availability.
- `AdminDashboard`: Operations overview, live courier radar, architecture boundaries inspector, outbox monitor.

### B. Domain & Application Services (`src/domain/` & `src/services/`)
- `orderApplicationService.ts`: Idempotent order orchestration and outbox event emission.
- `orderLifecycle.ts`: Strict 11-state machine.
- `pricingEngine.ts`: Server-authoritative price & fee calculation.
- `deliveryPolicy.ts`: Business fulfillment rules and courier eligibility criteria.
- `outboxEventBus.ts`: Transactional outbox event dispatcher.

### C. Go Realtime Platform (`services/realtime-dispatch/`)
- `websocket/hub.go`: Realtime WebSocket & SSE gateway hub.
- `presence/presence.go`: Operational status and courier heartbeats.
- `tracking/tracker.go`: High-speed in-memory GPS state.
- `dispatch/`: Candidate selection, scoring, assignment offers, batch manager, route optimizer.
- `telemetry/telemetry.go`: Rolling window for device health and network metrics.

### D. Durable Data & Cache
- **PostgreSQL**: Authoritative relational transaction store.
- **Client Local Cache / Offline Store**: Offline queue, local cart, cached catalog, user preferences.
- **FCM Push Notification Adapter**: Transactional push delivery to customer and courier devices.
