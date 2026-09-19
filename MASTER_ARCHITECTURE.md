# Master Architecture Specification — RYM Platform (V2)

## 1. System Architecture

The system is designed as a **Modular Monolith API Platform + Specialized Go Realtime Service** tailored for local delivery logistics in Ahmed Rachedi (Wilaya 43 - Mila).

### Core Architectural Principle
> **Every important piece of state and every important decision must have exactly one owner.**

### System Subsystems & Boundaries:
- **Applications (UI Presentation)**:
  - Customer Application (Mobile-first shell, actions submitted via API)
  - Courier Application (Ultra-simple, delivery offers queue)
  - Merchant Application (Tablet/Desktop kitchen & inventory dashboard)
  - Admin Dashboard (Operations, analytics, audit trail)
- **API Platform (Modular Monolith)**:
  - Handles Auth, Stores, Discovery, Checkout, Orders, Pricing, Promotions, Loyalty, Scheduling, Notifications, Admin.
  - Exposes HTTPS / WSS endpoints; enforces transactional boundaries.
- **Durable Core (PostgreSQL)**:
  - Authoritative, durable source of truth for Users, Stores, Products, Orders, Deliveries, Payments, Promotions, and Audit Ledgers.
- **Client Local Storage / Offline Cache**:
  - `localStorage` and memory caching strictly for client convenience (cached stores, cart, offline queue, user preferences). Non-authoritative.
- **Go Realtime Platform (`services/realtime-dispatch`)**:
  - Low-allocation, low-latency micro-daemon structured into distinct sub-packages:
    - `websocket/`: Gateway connection hub & streaming broadcasts.
    - `presence/`: Courier presence, heartbeats, operational state (`ONLINE`, `AVAILABLE`, `BUSY`, `OFFLINE`).
    - `tracking/`: Real-time GPS state, adaptive tracking intervals (20s/5s/3s), in-memory fast lookups.
    - `dispatch/`: Single authoritative dispatch subsystem:
      - `candidate.go`: Spatial candidate filtering within radius.
      - `scorer.go`: Multi-criteria deterministic scoring.
      - `assignment.go`: Delivery offers generation & accept/reject queue.
      - `batching.go`: Batch manager & multi-order bundling eligibility.
      - `route.go`: Route optimizer (stop sequencing: pickup before dropoff).
    - `telemetry/`: Telemetry store for sampled metrics (battery, latency, network), decoupled from live state.
- **Event & Integration Adapters**:
  - **FCM Push Notification Adapter**: Pushes order events to mobile devices.
  - **Maps Adapter**: Leaflet / OpenStreetMap routing and visual polylines.
  - **Payment Adapter**: Cash-on-Delivery (COD) cash reconciliation and settlements.
  - **SMS Gateway**: Telecom SMS OTP / notifications.

---

## 2. Authoritative Single-Owner Matrix

| State / Decision | Authoritative Owner | Secondary / Cache Storage | Invariant Rule |
|---|---|---|---|
| **Order State** | API + PostgreSQL | Firestore mirror / Local cache | Transitions validated by `OrderLifecycle` state machine; client only requests actions |
| **Payment State / COD** | Payment Domain + PostgreSQL | Courier COD Ledger | Immutable once collected; reconciled at courier shift checkout |
| **Order Pricing & Fees** | Server Pricing Engine | Client UI display state | Re-evaluated server-side on checkout; client amounts never trusted |
| **Promotion Validity** | Promotion Domain + PostgreSQL | Local cache for UI badges | Verified against usage quotas and anti-stacking policies in transaction |
| **Courier Live GPS State** | Go Realtime Platform (Memory) | None | Ephemeral streaming over WebSockets/SSE; never persisted per GPS tick |
| **Historical Telemetry** | Telemetry Store | Delivery milestone snapshots | Sampled ring buffer (battery, connection quality, speed) |
| **Dispatch Decision** | Go Dispatch Subsystem | Outbox Event Log | Deterministic candidate ranking and assignment offer queue |
| **Route Stop Sequence** | Route Optimizer (under Batch Manager) | Courier App navigation view | Orders stops by transit efficiency respecting pickup before dropoff |
| **UI State** | Client Local State | Browser Session / LocalStorage | Purely display/interaction state; no authoritative business logic |
| **Push Notification Delivery** | FCM Push Adapter | Native Web Notification Tray | Consumes from Outbox domain events asynchronously |
| **Audit Logs & History** | Outbox Event Bus + PostgreSQL | Append-only Ledger | Every state change produces an immutable audit record |

---

## 3. Order State Machine

Strict server-side validated state transitions:
`PENDING → CONFIRMED → PREPARING → READY → ASSIGNED → PICKED_UP → DELIVERING → ARRIVED → DELIVERED`

Cancellations:
`PENDING / CONFIRMED / PREPARING → CANCELLED` (depending on merchant and business rules).

All transitions produce domain events through the **Transactional Outbox Event Bus**:
`Order Event → Realtime, Notification (FCM), Dispatch, Analytics, Audit`.

---

## 4. Dispatch & Fulfillment Pipeline

The dispatch system is unified under a single fulfillment pipeline:

```text
Dispatch System (Go)
├── Candidate Selection (Spatial radius filtering)
├── Courier Scoring (Proximity + Active Load + Rating)
├── Assignment (Delivery Offer created -> Courier responds Accept/Reject)
└── Batch Manager
      ├── Batch Eligibility (Store synchronization & prep window)
      ├── Batch Creation (Bundle of compatible deliveries)
      ├── Route Optimizer (Stop sequencing: pickups before dropoffs)
      └── Batch Reassignment (Fallback on courier rejection)
```

---

## 5. GPS Telemetry & Adaptive Interval Rules

- **Stationary Courier**: 20–30s intervals.
- **Moving Normally**: 5–10s intervals.
- **Within 300m of Destination**: 3–5s intervals.
- **Moved < 10m**: Broadcast suppressed to conserve courier battery and mobile bandwidth.
- **Stale Detection**:
  - > 15s without ping: "Location updating..."
  - > 60s without ping: "Location unavailable"

---

## 6. Target Architecture Diagram

```text
                         ┌───────────────────────────────┐
                         │          USERS                │
                         │ Customer Courier Merchant Admin│
                         └───────────────┬───────────────┘
                                         │
                                         ▼
              ┌──────────────────────────────────────────────┐
              │                 APPLICATIONS                 │
              │  (Action requests via API • Presentation UI) │
              │ Customer │ Courier │ Merchant │ Admin        │
              └────────────────────┬─────────────────────────┘
                                   │
                              HTTPS / WSS
                                   │
              ┌────────────────────▼─────────────────────────┐
              │                  API PLATFORM                │
              │                                              │
              │ Auth │ Stores │ Discovery │ Checkout         │
              │ Orders │ Pricing │ Promotions │ Loyalty      │
              │ Scheduling │ Notifications │ Admin           │
              └────────────────────┬─────────────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │   PostgreSQL    │
                          │                 │
                          │ Durable State   │
                          │ Source of Truth │
                          └─────────────────┘


       ┌─────────────────────────────────────────────────────┐
       │                GO REALTIME PLATFORM                  │
       │                                                     │
       │ WebSocket Gateway │ Presence │ GPS │ Tracking       │
       │                                                     │
       │                 DISPATCH SYSTEM                     │
       │              ┌──────────────────┐                   │
       │              │ Eligibility      │                   │
       │              │ Scoring          │                   │
       │              │ Assignment       │                   │
       │              │ Batch Manager    │                   │
       │              │ Route Optimizer  │                   │
       │              │ ETA Engine       │                   │
       │              └──────────────────┘                   │
       └──────────────────────┬──────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             Current State          Telemetry
             / Presence             / Metrics
             (Fast Memory)          (Sampled Store)


                     EVENT / INTEGRATION LAYER
                               │
          ┌───────────────────┼────────────────────┐
          ▼                   ▼                    ▼
       FCM Push             Maps                 Payments
       Adapter             Adapter               Adapter
```
