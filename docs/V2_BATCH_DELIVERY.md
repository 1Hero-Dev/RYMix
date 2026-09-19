# RYM V2 Batch Delivery Specification

**Domain:** Multi-Order Logistics  
**Code Reference:** `src/domain/batchDeliveryEngine.ts`

---

## 1. Overview
The Batch Delivery Engine groups compatible orders assigned to the same courier to optimize delivery mileage, reduce transit time, and lower customer fees, without compromising hot food quality.

## 2. Batch Eligibility Policy
Two orders can be combined into a batch if and only if:
1. **Status Compatibility:** Both orders are in `CONFIRMED`, `PREPARING`, or `READY` status.
2. **Geographic Proximity:**
   - Merchant pickups are within 800 meters of each other (or identical store).
   - Customer dropoff points have a detour of less than 1500 meters.
3. **Temporal Alignment:** Kitchen preparation times are within 12 minutes of each other.
4. **Capacity Limit:** Maximum 2 food orders per batch in Ahmed Rachedi.

## 3. Stop Sequence Execution
Stops are ordered to prioritize pickup completion before final delivery:
- `Stop 1 (PICKUP)`: Merchant A
- `Stop 2 (PICKUP)`: Merchant B
- `Stop 3 (DROPOFF)`: Customer A (closest)
- `Stop 4 (DROPOFF)`: Customer B
