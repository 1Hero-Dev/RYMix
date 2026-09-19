# RYM V2 Loyalty & Rewards Specification

**Domain:** Customer Retention & Transactional Ledgers  
**Code Reference:** `src/domain/loyaltyEngine.ts`

---

## 1. Accounting Architecture
- Customer loyalty balance is backed by an append-only transaction ledger (`LoyaltyTransaction`).
- Every balance mutation requires an explicit audit record with `type`, `pointsDelta`, `orderId`, and timestamp.

## 2. Rules
- **Earn Rate:** 1 Point per 100 DZD spent on delivered orders.
- **Redeem Rate:** 100 Points = 100 DZD discount at checkout.
- **Tiers:**
  - `BRONZE`: 0 - 399 lifetime points
  - `SILVER`: 400 - 999 lifetime points
  - `GOLD`: 1,000 - 2,499 lifetime points
  - `VIP_PLATINUM`: 2,500+ lifetime points
