# RYM V2 Security Hardening & Privilege Isolation

**Domain:** Security Engineering & Fraud Mitigation  
**Code Reference:** `src/domain/dynamicPricingEngine.ts`, `src/domain/promotionsEngine.ts`

---

## 1. Privilege Boundaries & Role Isolation
- **Merchant Data Isolation:** Merchants can only query and mutate orders associated with their own `storeId`.
- **Courier Data Isolation:** Couriers can only access the dropoff address and phone number for orders actively assigned to them.
- **Customer Isolation:** Customers can only read their own order history and fidelity ledger.
- **Admin Supervision:** Restricted administrative actions (reassigning couriers, manual status override) are logged in the audit ledger.

## 2. Anti-Fraud & Abuse Protections
- **Pricing Tamper Resistance:** Total calculations are strictly verified server-side; client manipulation is blocked.
- **Coupon Stacking Prevention:** Only one promo code per order is allowed; codes with expired timestamps or unreached minimum spends fail fast.
- **Idempotency Keys:** Every order creation request carries an `idempotencyKey` preventing duplicate checkout charges.
- **Rate Limiting:** API rate limits protect auth, search, and dispatch endpoints against abuse.
