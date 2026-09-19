# Security & Authorization Specification — RYM Platform

**Version:** 1.0.0  
**Compliance Standard:** OWASP Top 10 Mobile / Web API Security Standards

---

## 1. Cardinal Security Directives

1. **Zero Trust for Client-Calculated Values:** The server NEVER trusts prices, delivery fees, discounts, order totals, or courier IDs sent by the client. All amounts are recalculated authoritatively.
2. **Server-Side Role-Based Access Control (RBAC):** Every order state transition enforces that `actorRole` is permitted for that exact status (e.g., only `MERCHANT` can confirm an order; only `COURIER` or `ADMIN` can mark an order picked up or delivered).
3. **No Direct Database Access from Frontend:** Clients interact exclusively through typed application service boundaries and validated API endpoints.

---

## 2. Role Isolation Matrix

| Resource | Customer | Merchant | Courier | Admin |
|---|---|---|---|---|
| **Own Profile & Address** | Read / Write | Read / Write | Read / Write | Full Access |
| **Catalog & Store Settings** | Read Only | Read / Write (Own store) | Read Only | Full Access |
| **Order Creation** | Create (Own) | Forbidden | Forbidden | Create / Supervise |
| **Order Confirmation** | Forbidden | Authoritative (Own store) | Forbidden | Supervise |
| **Courier Delivery Pool** | Forbidden | Forbidden | Read / Accept | Full Access |
| **Courier Live Coordinates** | Subscribed Order only | Subscribed Order only | Broadcast (Self) | Full View |
| **Cash Settlement Ledger** | Forbidden | Forbidden | Read (Self) | Full Access |
| **Audit Log History** | Forbidden | Forbidden | Forbidden | Read Only |

---

## 3. Secret Protection & Environment Hygiene

- Production database passwords and JWT signing keys are stored exclusively in environment variables (`DATABASE_URL`, `JWT_SECRET`, `INTERNAL_DISPATCH_SECRET`).
- `services/realtime-dispatch` validates internal API invocations using constant-time string comparison (`crypto/subtle.ConstantTimeCompare`) via `X-Internal-Secret` to prevent timing attacks.
- Sensitive error stack traces are stripped in production builds; client errors receive sanitized domain codes (`VALIDATION_ERROR`, `AUTHORIZATION_ERROR`, etc.).
