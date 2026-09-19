# RYM V2 Route Optimization & Adaptive ETA Specification

**Domain:** Logistics & Telemetry  
**Code Reference:** `src/domain/routeOptimizer.ts`, `src/services/etaService.ts`

---

## 1. Route Optimization
- Uses an efficient, lightweight Nearest-Neighbor heuristic to sequence multiple pickup and dropoff stops.
- Prevents computationally expensive route solvers from draining mobile battery and bandwidth.
- Enforces precedence: Pickups must always be visited before their corresponding dropoffs.

## 2. Adaptive ETA Engine
Combines multiple real-world factors:
1. **Kitchen Prep Status:** 20 min (Pending) -> 15 min (Confirmed) -> 8 min (Preparing) -> 0 min (Ready).
2. **Transit Time:** Based on courier road distance at an urban speed benchmark of 22 km/h.
3. **Adaptive Recalculation Cache:** Prevents recalculating ETA on every GPS ping. Only updates when:
   - Courier has moved > 40 meters.
   - Order status changes.
   - 20 seconds have elapsed since previous calculation.
