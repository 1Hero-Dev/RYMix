# RYM V2 Scheduled Orders Specification

**Domain:** Order Lifecycle & Time-Window Fulfillment  
**Code Reference:** `src/domain/schedulingEngine.ts`

---

## 1. Fulfillment Modes
- **ASAP (Immédiat):** Standard instant preparation and immediate courier dispatch.
- **Scheduled (Planifiée):** The customer picks an upcoming time slot (e.g. Today at 13:00 or 20:30).

## 2. Dispatch Window Mechanics
- Scheduled orders stay in `SCHEDULED_WAITING` state.
- Kitchen preparation alerts fire 25 minutes prior to the scheduled delivery target.
- Courier candidate evaluation activates 15 minutes prior to fulfillment time.
- Prevents early courier dispatch hours before the merchant even begins cooking.
