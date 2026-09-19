# RYM V2 Security Audit & Threat Matrix

**Date:** September 2026  
**Auditor:** Principal Security Engineer  
**Scope:** V2 Pricing, Promotions, Loyalty, Dispatch & Multi-Zone

---

## 1. Threat Scenarios & Mitigations

### Threat 1: Client Price Tampering
- **Attack Vector:** Malicious user modifies JSON payload during checkout to set `deliveryFee: 0` or `total: 1 DZD`.
- **Defense in V2:** The server rejects client prices and re-calculates all amounts authoritatively via `DynamicPricingEngine`.
- **Verdict:** SECURE.

### Threat 2: Promotion Stacking & Expired Coupon Abuse
- **Attack Vector:** Applying multiple codes or reusing an expired voucher code.
- **Defense in V2:** `PromotionsEngine.validateCoupon` enforces date boundary checks, minimum subtotal thresholds, and restricts each checkout to a single active voucher.
- **Verdict:** SECURE.

### Threat 3: Loyalty Balance Double-Spending
- **Attack Vector:** Concurrently placing multiple orders to redeem more points than available in the account.
- **Defense in V2:** All loyalty changes are written as transactional records with strict pre-condition checks (`account.balancePoints >= pointsToRedeem`).
- **Verdict:** SECURE.

### Threat 4: Horizontal Privilege Escalation
- **Attack Vector:** Merchant accessing another store's orders or courier reading customer data for unassigned orders.
- **Defense in V2:** Role-based access control filters all query endpoints by authenticated user identity and store ownership.
- **Verdict:** SECURE.
