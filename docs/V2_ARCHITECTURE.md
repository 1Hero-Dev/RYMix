# RYM V2 Architecture — Master Specification

**Status:** Approved Target Architecture  
**Scope:** Wilaya 43 (Mila) & Ahmed Rachedi Core Operations  
**Architecture Style:** Additive Evolutionary Platform with Strict Single-Owner State  

---

## 1. Executive Summary

RYM V2 represents an intelligent logistics and commerce evolution built directly on top of the rock-solid RYM foundation. Rather than creating competing subsystems, V2 enforces strict architectural ownership boundaries:
- **One Authoritative Dispatch Subsystem**: Implemented in Go (`services/realtime-dispatch/dispatch`), coordinating Candidate Selection, Multi-factor Scoring, Delivery Offers, Batch Management, and Route Optimization.
- **Go Realtime Platform**: Subsystems for WebSocket Gateway, Presence, Tracking, and Telemetry metrics.
- **Durable Core (PostgreSQL)**: Transactional business state (Orders, Stores, Users, Payments, Deliveries, Promotions, Audit).
- **Client Local Cache / Offline Store**: Strictly presentation and offline convenience cache; non-authoritative.
- **FCM Push Notification Adapter**: Dedicated integration adapter consuming Outbox domain events.

---

## 2. Target Architecture Diagram

```text
                         ┌───────────────────────────────┐
                         │          USERS                │
                         │                               │
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

## 3. Domain Ownership & Separation of Concerns

1. **Transactional Durability:** PostgreSQL owns orders, customers, stores, ledger transactions, and audit trails.
2. **Realtime Ephemeral State:** The Go Realtime server owns active courier GPS locations, battery/freshness indicators, and active WebSocket connection pools.
3. **Dispatch & Logistics Optimization:** Route optimization and batch eligibility are computed by the Go Dispatch subsystem to spare mobile bandwidth and battery life.
4. **Client Role:** Client applications are strictly display and interaction layers; they request actions through API endpoints (e.g. `POST /orders/:id/action`), never directly deciding pricing, order status transitions, or dispatch outcomes.

---

## 4. Single-Owner State Matrix

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
