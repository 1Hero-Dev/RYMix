# RYM V2 Promotions & Coupon Engine Specification

**Domain:** Commerce & Customer Growth  
**Code Reference:** `src/domain/promotionsEngine.ts`

---

## 1. Supported Promotion Types
- `PERCENTAGE`: Percentage discount capped by an optional ceiling (e.g. 15% off up to 400 DZD).
- `FIXED_DZD`: Flat currency deduction (e.g. 200 DZD off).
- `FREE_DELIVERY`: Delivery fee waived when minimum spend is reached.

## 2. Anti-Abuse & Safety Controls
1. **Expiry Verification:** Promos past `validUntil` are rejected immediately.
2. **Minimum Spend Check:** Subtotal must meet `minSpendDZD`.
3. **Store Scoping:** Stores can be restricted to specific vendor partnerships.
4. **Single Stacking:** Only one voucher can be applied per checkout to prevent discount stacking exploits.
5. **Non-Negative Total Floor:** Total cannot fall below 0 DZD.
