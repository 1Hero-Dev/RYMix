# V1 Scope & Functional Boundaries — RYM Platform

**Version:** 1.0.0  
**Status:** Canonical Scope Boundary

---

## 1. What V1 Strictly Implements

### Customer Capabilities:
- Phone & OTP Authentication (with simulated demo fallback).
- Store discovery with categorized feeds (Restaurants, Supermarchés, Pâtisserie, Boucherie).
- Store catalog browsing with modifier options and price calculation.
- Local-first Cart with quantity increments, notes, and local storage persistence.
- Single-page Checkout bottom sheet with address landmark selection.
- Authoritative Pricing (Base fee, delivery zone calculation, packaging fee, promo threshold).
- Cash on Delivery (COD) payment workflow.
- Live Order Tracking screen with interactive Leaflet map, courier marker, and ETA countdown.
- Milestone Timeline showing exact state transitions.
- Order History and in-app order rating.

### Merchant Capabilities:
- Merchant dashboard with three active tabs: Incoming (Pending), Preparing, and Ready for Pickup.
- Accept / Reject order workflow with prep time selector (15m, 25m, 40m).
- Stock availability toggle per menu item.
- Notification ring on new incoming orders.

### Courier Capabilities:
- Online / Offline toggle.
- Available order pool with pickup/dropoff distance and earnings breakdown.
- Step-by-step delivery workflow: Accept -> En route to store -> Pick up package -> En route to customer -> Arrived -> Confirm COD cash collected.
- Adaptive GPS telemetry sending location updates without excessive battery drain.
- Courier daily earnings and cash-on-hand ledger.

### Admin & System Operations:
- Real-time operations overview with live order status counts and courier presence map.
- Order audit history viewer with timestamps, actors, and state transitions.
- Ahmed Rachedi municipal delivery zones and store branch capacity controls.
- Outbox event bus and diagnostic telemetry logs.

---

## 2. What is Deferred to V2 (Architecturally Prepared, NOT Built in V1)

- **Multi-Order Batching:** V1 enforces 1 order = 1 courier. Batch delivery interfaces exist in `src/domain/dispatchStrategy.ts`.
- **CIB / Carte Edahabia Online Payment:** V1 uses Cash on Delivery. Adapter interface exists in `src/adapters/paymentProvider.ts`.
- **AI Recommendations & Vector Search:** V1 uses tokenized local search. Interface exists in `src/adapters/searchProvider.ts`.
- **Predictive ML ETA & Fleet Optimization:** V1 uses deterministic Haversine distance with speed heuristics.
- **Automated SMS Gateway Hardware:** V1 uses Native Web Push and Firestore triggers. Interface exists in `src/adapters/notificationProvider.ts`.
- **Dynamic Surge Pricing:** V1 uses static municipal zone pricing. Interface exists in `src/domain/pricingStrategy.ts`.
