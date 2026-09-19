# RYM V2 Progressive Rollout & Feature Flag Strategy

**Domain:** DevOps & Deployment Risk Mitigation  
**Code Reference:** `src/domain/featureFlags.ts`

---

## 1. Rollout Phases
1. **Phase A — Internal Alpha (Active):** Feature flags enabled in staging and local testing environments.
2. **Phase B — Pilot Merchants in Ahmed Rachedi:** Deploy Scored Dispatch and Batching to selected high-volume stores (Pizzeria Le Palmier, Fast Food El Baraka).
3. **Phase C — General Availability (Wilaya 43):** Full activation of dynamic pricing, loyalty, and scheduling across all stores in Ahmed Rachedi and Mila.

## 2. Instant Rollback Mechanism
- If any operational regression occurs, the system can instantly toggle back to V1 behavior using `FeatureFlagManager.setFlag('<feature>', false)`.
- Fallbacks are implemented natively (e.g. `DispatchStrategyRegistry` falls back to `SimpleNearestCourierStrategy`, `PricingStrategyRegistry` falls back to `StandardAuthoritativePricingStrategy`).
