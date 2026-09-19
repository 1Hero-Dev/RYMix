# RYM V2 Data Invariants & Consistency Guarantees

This document establishes the non-negotiable invariants that must be maintained across all RYM V2 transactions, dispatch operations, and financial events.

---

## 1. Core State Invariants

### Invariant 1: Independent Order Lifecycle within Batches
- **Rule:** A `DeliveryBatch` coordinates physical courier movement, but each constituent `Order` retains its own independent state machine (`Order.status`).
- **Violation Guard:** A courier completing Stop 1 (Pickup Order A) transitions Order A to `PICKED_UP`. Order B remains in `PREPARING` or `READY` until Stop 2 is explicitly checked in.
- **Never allowed:** A batch state overwriting or replacing individual order states.

### Invariant 2: Authoritative Server Pricing
- **Rule:** Client applications never calculate final totals for persistence. All prices, fees, surge multipliers, discounts, and packaging charges are re-computed and signed server-side via `PricingStrategy`.
- **Violation Guard:** Any checkout payload containing mismatched client totals is rejected with `422 Unprocessable Entity`.

### Invariant 3: Immutable Loyalty Ledger
- **Rule:** A user's `balance_points` is strictly a deterministic projection of all rows in `loyalty_transactions`.
- **Violation Guard:** No `UPDATE loyalty_accounts SET balance_points = X` without an accompanying insert into `loyalty_transactions`.

### Invariant 4: Scheduled Order Dispatch Delay
- **Rule:** A scheduled order must NOT be dispatched immediately upon order confirmation. It must reside in `SCHEDULED_WAITING` until its preparation window (e.g. 25 minutes before customer fulfillment time).
- **Violation Guard:** Dispatch candidate queries filter `WHERE scheduled_for IS NULL OR scheduled_for <= NOW() + INTERVAL '25 minutes'`.

### Invariant 5: Courier Capacity Cap
- **Rule:** No courier may have more than 2 active deliveries (single or grouped batch) concurrently in Ahmed Rachedi.
- **Violation Guard:** `ScoredCourierStrategy` and `BatchDeliveryEngine` reject couriers with `currentActiveDeliveries >= 2`.
