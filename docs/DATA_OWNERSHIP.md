# Data Ownership & Single Source of Truth — RYM Platform V2

**Version:** 2.0.0  
**Mandate:** Every piece of application state must have exactly ONE authoritative owner. Competing sources of truth are strictly forbidden.

---

## 1. Authoritative Ownership Matrix

| Data Entity | Authoritative Owner | Secondary / Cache Storage | Mutation & Invariant Rule |
|---|---|---|---|
| **Order State** | API + PostgreSQL (`Order`, `OrderStatusHistory`) | Firestore mirror / Client cache | Validated by `OrderLifecycle` state machine; client UI only submits action requests |
| **Payment State & COD** | Payment Domain + PostgreSQL (`Payment`) | Courier COD local ledger | Immutable once collected; audited and reconciled during daily courier shift closure |
| **Pricing & Delivery Fees** | Server `PricingEngine` | Client UI display state | Always calculated server-side; client totals are untrusted |
| **Promotion Validity & Vouchers** | Promotion Domain + PostgreSQL | Client cache for instant badge display | Anti-stacking rules and usage caps validated in primary checkout transaction |
| **Store & Catalog Data** | PostgreSQL (`Store`, `MenuItem`) | Client Local Cache (`mockData.ts`) | Merchant owner or Admin only |
| **Courier Presence & Heartbeat** | Go Realtime `presence` package | In-memory `sync.RWMutex` map | Operational state: `ONLINE`, `AVAILABLE`, `BUSY`, `OFFLINE`; 45s TTL |
| **Current Courier GPS Coordinates** | Go Realtime `tracking` package | Fast in-memory buffer | Ephemeral streaming over WebSockets/SSE; NEVER persisted per GPS tick |
| **Historical Courier Telemetry** | Telemetry Store (`telemetry` package) | Delivery milestone snapshots in PostgreSQL | Sampled ring buffer (battery, connection quality, speed) |
| **Dispatch Decision** | Go Dispatch Subsystem (`dispatch` package) | Outbox Event Log | Single authoritative decision-maker; spatial radius filter (2.0 km) + deterministic scoring |
| **Route Stop Sequence** | Route Optimizer (under Batch Manager) | Courier App navigation view | Orders stops by transit efficiency respecting pickup before dropoff |
| **UI State & User Preferences** | Client Local State (`localStorage`) | Browser Session Storage | Purely display/interaction state; no authoritative business logic |
| **Push Notification Delivery** | FCM Push Notification Adapter | Native Web Notification Tray | Consumes from Outbox domain events asynchronously |
| **Audit Logs & Historical Records** | Outbox Event Bus + PostgreSQL Ledger | Append-only Ledger | Every state change produces an immutable audit record |

---

## 2. Synchronization & Architectural Rules

1. **Client is Presentation Only:** The client application requests actions via API (e.g. `POST /orders/:id/cancel`, `POST /orders/:id/accept`). The client must NEVER mutate state transitions directly or assume its local price/discount is final until confirmed by the backend.
2. **Client Local Storage is Non-Authoritative:** Labeled strictly as `Client Local Cache / Offline Store`. Used for instant startup, offline queuing, and user preferences.
3. **No Double Storage of GPS:** Realtime courier coordinates are handled strictly through in-memory Go tracking and broadcast via WebSockets. They are NOT written to PostgreSQL or Firestore on every GPS tick.
4. **Outbox Event Bus:** When state changes occur in the order lifecycle, a domain event is emitted atomically. Downstream listeners (FCM Push Adapter, Maps Adapter, Analytics) consume from this outbox queue without blocking the primary transactional write.
