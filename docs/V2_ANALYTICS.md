# RYM V2 Analytics & Operations Intelligence Specification

**Domain:** Operational Supervision & Reporting  
**Code Reference:** `src/domain/operationsIntelligence.ts`

---

## 1. Operations Center Telemetry
Provides live monitoring for platform dispatchers and administrators:
- **Active Orders Count:** Real-time volume across all states.
- **Unassigned Orders Count:** Orders in `CONFIRMED` or `READY` awaiting couriers.
- **System Health Score (0-100%):** Dynamically calculated based on operational bottlenecks.

## 2. Deterministic Anomaly Detection Rules
- `ORDER_UNASSIGNED_TOO_LONG`: Order unassigned > 7 minutes (Warning) or > 15 minutes (Critical).
- `MERCHANT_PREP_DELAYED`: Kitchen cooking time exceeding 25 minutes.
- `COURIER_STALLED`: Courier GPS stationary for > 6 minutes during active transit.
- `ETA_OVERSHOOT`: Transit duration exceeding estimated delivery time by > 10 minutes.
