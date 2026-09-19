# Domain Map & Boundary Specification — RYM Platform

**Version:** 1.0.0  
**Pattern:** Domain-Driven Design (Modular Architecture)

---

## 1. Business Domains & Module Boundaries

Instead of flat, unorganized dumping grounds (`controllers/`, `services/`, `utils/`), the RYM application architecture is segregated into discrete business domains:

```text
src/
├── domain/
│   ├── auth/              # Authentication rules, session verification, RBAC permissions
│   ├── users/             # User identity, delivery addresses, communication preferences
│   ├── stores/            # Store profiles, opening hours, commercial status, municipal tags
│   ├── catalog/           # Categories, menu items, dietary tags, option groups
│   ├── cart/              # Client cart composition, variation selections, quantity bounds
│   ├── checkout/          # Checkout session, idempotency key generation, delivery notes
│   ├── pricing/           # Authoritative price breakdown, packaging fee, distance fees, surge
│   ├── orders/            # Order creation, authoritative state transitions, status history
│   ├── fulfillment/       # Order fulfillment record, food vs grocery picking workflow
│   ├── courier/           # Courier candidate profiles, vehicle types, presence status
│   ├── dispatch/          # DispatchStrategy, candidate ranking, 2.0 km launch perimeter
│   ├── notifications/     # Notification payloads, recipient resolution, multi-channel delivery
│   ├── merchant/          # Kitchen prep capacity, order acceptance/rejection, branch logic
│   ├── admin/             # Operations supervision, live order tracking, audit trails, zones
│   └── audit/             # Outbox event bus, audit trail history, transactional records
├── adapters/              # External service abstractions (Payment, Map, Notification, Media, Search)
└── db/                    # Local client-side persistence and caching
```

---

## 2. Layering Architecture

Each domain strictly observes clean layer separation:

```text
┌────────────────────────────────────────────────────────┐
│ 1. Presentation Layer (UI Screens & Hooks)             │
│    - StoreDetailScreen, CheckoutScreen, CourierAppView │
│    - No business rule enforcement inside JSX           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 2. Application Layer (Use Cases & Orchestrators)       │
│    - OrderApplicationService (createOrder, transition) │
│    - DispatchEngine (rankCouriers, evaluatePerimeter)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 3. Domain Layer (Pure Business Rules & Entities)       │
│    - orderLifecycle.ts (ORDER_LIFECYCLE_RULES, RBAC)   │
│    - pricingEngine.ts (calculateAuthoritativePrice)    │
│    - dispatchStrategy.ts (SimpleNearestCourierStrategy)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ 4. Infrastructure Layer (Adapters, DB, Network)        │
│    - PostgreSQL / Prisma, Firestore, Go WebSocket Hub  │
│    - PaymentProvider, MapProvider, NotificationProvider│
└────────────────────────────────────────────────────────┘
```
