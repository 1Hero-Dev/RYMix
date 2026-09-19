# Target Architecture Specification — RYM Platform V2

**Version:** 2.0.0-production  
**Status:** Approved Target Architecture  
**Target Market:** Ahmed Rachedi (Wilaya 43 - Mila), Algeria  

---

## 1. Logical Architecture Diagram

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
     (Notifications)    (Leaflet / OSM)       (Cash / COD)
```

---

## 2. Fulfillment Pipeline Flow

```text
Order Event (READY)
       │
       ▼
Go Dispatch Subsystem
       │
       ├── 1. Candidate Selection: Filter eligible couriers within 2.0 km radius
       ├── 2. Courier Scoring: Multi-factor score (distance + active orders + rating + vehicle)
       ├── 3. Assignment Engine: Generate delivery offer to top courier
       ├── 4. Batch Manager: Evaluate multi-order bundling eligibility
       └── 5. Route Optimizer: Sequence stops (Pickups before Dropoffs)
```

---

## 3. Single-Owner State Matrix

```text
Order state             → API + PostgreSQL
Payment state           → Payment domain + PostgreSQL
Pricing                 → Pricing domain (Server-side)
Promotion validity      → Promotion domain
Courier current state   → Go Realtime (Memory)
Courier historical data → Telemetry Store (Sampled)
Dispatch decision       → Go Dispatch Subsystem
Route sequence          → Route Optimizer (under Batch Manager)
UI state                → Client Local State
Push delivery           → FCM Push Notification Adapter
Analytics & Audit       → Outbox Event Bus & Ledger
```
