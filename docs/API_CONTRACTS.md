# API Contracts Specification — RYM Platform

**Version:** 1.0.0  
**Protocol:** RESTful HTTPS with JSON payloads  
**Auth Header:** `Authorization: Bearer <jwt_token>`

---

## 1. Standard Response & Error Envelope

All API endpoints strictly adhere to a consistent response model:

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-19T10:00:00.000Z",
    "version": "v1"
  }
}
```

### Error Response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | AUTHENTICATION_ERROR | AUTHORIZATION_ERROR | NOT_FOUND | CONFLICT | RATE_LIMITED | SERVER_ERROR",
    "message": "User-facing descriptive explanation in French / Arabic",
    "details": {}
  }
}
```

---

## 2. V1 Core Endpoints

### A. Authentication
- `POST /api/v1/auth/request-otp`: Request phone verification code.
  - Body: `{ "phone": "+213550123456" }`
- `POST /api/v1/auth/verify-otp`: Validate code and obtain JWT session token.
  - Body: `{ "phone": "+213550123456", "code": "123456" }`

### B. Discovery & Stores
- `GET /api/v1/stores`: Paginated list of active merchants in Ahmed Rachedi.
  - Query: `?category=restaurant&page=1&limit=20`
- `GET /api/v1/stores/:storeId`: Full store profile with menu categories and items.

### C. Cart & Pricing
- `POST /api/v1/pricing/quote`: Server-authoritative price recalculation.
  - Body: `{ "storeId": "s1", "items": [{ "itemId": "i1", "quantity": 2 }], "zone": "Ahmed Rachedi Centre" }`
  - Returns: `{ "subtotal": 1200, "deliveryFee": 100, "packagingFee": 50, "discount": 0, "total": 1350 }`

### D. Orders & Checkout
- `POST /api/v1/orders`: Create new order with idempotency protection.
  - Headers: `X-Idempotency-Key: <uuid-v4>`
  - Body: `{ "cart": [...], "deliveryAddress": {...}, "paymentMethod": "CASH_ON_DELIVERY" }`
- `GET /api/v1/orders/:orderId`: Retrieve full order details and status timeline.
- `POST /api/v1/orders/:orderId/transition`: Authoritative status change.
  - Body: `{ "toStatus": "CONFIRMED", "actorRole": "MERCHANT", "note": "Commande acceptée" }`

### E. Courier & Telemetry
- `POST /api/v1/courier/telemetry`: Send adaptive location ping.
  - Body: `{ "lat": 36.4528, "lng": 6.2652, "speedKmh": 24 }`
- `GET /api/v1/courier/deliveries/available`: List available ready orders in pool.
- `POST /api/v1/courier/deliveries/:orderId/accept`: Claim delivery order.

---

## 3. Reserved for V2 (Not Active in V1)

- `POST /api/v2/payments/satim/initiate`: CIB / Edahabia payment gateway initiation.
- `POST /api/v2/dispatch/batch`: Multi-order batch allocation.
- `POST /api/v2/loyalty/redeem`: Points exchange for cart discount.
- `POST /api/v2/recommendations/personal`: AI-assisted catalog recommendation query.
