# Order State Machine Specification — RYM Platform

**Version:** 1.0.0  
**Domain Authority:** `src/domain/orderLifecycle.ts` and `src/services/orderApplicationService.ts`

---

## 1. Natural State Progression (Happy Path)

```text
[PENDING]
   │  (Merchant accepts order)
   ▼
[CONFIRMED]
   │  (Kitchen begins cooking / Store begins picking)
   ▼
[PREPARING]
   │  (Order packed & sealed in bag)
   ▼
[READY]
   │  (Courier assigned via pool or direct dispatch)
   ▼
[ASSIGNED]
   │  (Courier arrives at store & collects package)
   ▼
[PICKED_UP]
   │  (Courier departs towards customer address)
   ▼
[DELIVERING]
   │  (Courier reaches customer building / landmark)
   ▼
[ARRIVED]
   │  (Customer verifies delivery)
   ▼
[CUSTOMER_CONFIRMED]
   │  (Physical cash collected & delivery closed)
   ▼
[DELIVERED] (Terminal State)
```

---

## 2. Transition Matrix & Role-Based Access Control (RBAC)

| Current Status | Allowed Target Statuses | Authorized Actor Roles | Required Condition | Side Effects & Notifications |
|---|---|---|---|---|
| **PENDING** | `CONFIRMED`, `CANCELLED` | `MERCHANT`, `ADMIN`, `CUSTOMER` (cancel only) | Merchant confirms stock | Emits `order.accepted`; pushes alert to customer |
| **CONFIRMED** | `PREPARING`, `CANCELLED` | `MERCHANT`, `ADMIN` | Kitchen starts prep | Sets prep timer estimate; notifies customer |
| **PREPARING** | `READY`, `CANCELLED` | `MERCHANT`, `ADMIN` | Items packed | Emits `order.ready`; triggers dispatch candidate ranking |
| **READY** | `ASSIGNED`, `PICKED_UP`, `CANCELLED` | `COURIER`, `MERCHANT`, `ADMIN` | Courier available | Assigns courier ID; courier app receives navigation |
| **ASSIGNED** | `PICKED_UP`, `CANCELLED` | `COURIER`, `ADMIN` | Courier at store | Attaches pickup timestamp to `delivery` object |
| **PICKED_UP** | `DELIVERING`, `CANCELLED` | `COURIER`, `ADMIN` | Package verified | Updates ETA range; customer tracking map switches to live delivery mode |
| **DELIVERING** | `ARRIVED`, `CUSTOMER_CONFIRMED`, `DELIVERED`, `CANCELLED` | `COURIER`, `ADMIN` | Courier en route | Starts proximity detection (<300m triggers arrival alert) |
| **ARRIVED** | `CUSTOMER_CONFIRMED`, `DELIVERED` | `COURIER`, `CUSTOMER`, `ADMIN` | Courier within 30m | Native notification: "Le livreur est à votre porte !" |
| **CUSTOMER_CONFIRMED** | `DELIVERED` | `CUSTOMER`, `COURIER`, `ADMIN` | Package handed over | Prepares COD cash ledger settlement |
| **DELIVERED** | *None (Terminal)* | `COURIER`, `ADMIN` | Cash collected | Payment status set to `COLLECTED`; triggers fidelity points & rating modal |
| **CANCELLED** | *None (Terminal)* | `CUSTOMER`, `MERCHANT`, `ADMIN` | Valid cancellation policy | Refunds fidelity points; logs cancellation reason |

---

## 3. Strict Cancellation Policy

1. **Customer Cancellation:**
   - Permitted freely during `PENDING` state.
   - Permitted during `CONFIRMED` only if merchant has not yet begun preparation (< 2 minutes elapsed).
   - Forbidden once order is `PREPARING`, `PICKED_UP`, or `DELIVERING` (must contact Admin support).
2. **Merchant Cancellation:**
   - Permitted during `PENDING` or `CONFIRMED` if item is out of stock or kitchen is at maximum capacity.
   - Requires explicit rejection reason logged to audit history.
3. **Admin Cancellation:**
   - Authorized at any stage in case of emergency, unreachable customer, or traffic roadblock.
