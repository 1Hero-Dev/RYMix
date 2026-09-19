# RYM V2 Advanced Dispatch Specification

**Domain:** Logistics & Courier Assignment  
**Code Reference:** `src/domain/scoredCourierStrategy.ts`, `src/domain/dispatchStrategy.ts`

---

## 1. Overview
V1 used a simple nearest-available courier heuristic. V2 introduces `ScoredCourierStrategy` which evaluates couriers through a transparent, explainable multi-factor scoring system.

## 2. Dispatch Pipeline

```text
All Registered Couriers
        │
        ▼
1. Eligibility Filter
   - Must be Online (`isOnline == true`)
   - Must have active deliveries < 2
   - Must be within operational radius (<= 3000m for Ahmed Rachedi)
   - Must not be suspended
        │
        ▼
2. Multi-Factor Scoring (Lower score = higher dispatch priority)
   Score = DistancePenalty + WorkloadPenalty + DirectionPenalty - RatingBonus - VehicleBonus
        │
        ▼
3. Candidate Ranking & Assignment Offer
```

## 3. Configurable Weights & Formula
- **Distance Penalty:** +15 points per 100 meters to merchant.
- **Workload Penalty:** +350 points per active delivery in progress.
- **Rating Bonus:** -100 points per rating star above 4.0 (rewards top couriers).
- **Vehicle Bonus:** Scooter (-50), Moto (-60), Voiture (-30), Vélo (-10).
- **Direction Penalty:** Up to +100 points if moving in opposite direction.
