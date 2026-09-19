# Master Architecture Specification

## 1. System Architecture
The system is designed as a **Modular Monolith + Specialized Realtime Service** tailored for small-city/local delivery (e.g., a 2 km delivery radius).

### Components:
- **Fastify API (TypeScript)**: The core modular monolith. Handles Auth, Users, Stores, Catalog, Orders, Payments, Promotions, Merchant logic, and Admin logic. Talks to PostgreSQL.
- **Go Realtime Engine**: A specialized, low-allocation service for WebSockets, GPS state, Courier presence, and Dispatch assignment.
- **PostgreSQL**: The durable database (managed via Prisma).
- **Frontends (React/Vite)**:
  - Customer PWA (Mobile-first, max-width shell)
  - Courier PWA (Mobile-first, ultra-simple)
  - Merchant Web (Tablet/Desktop dashboard)
  - Admin Web (Desktop dashboard)
- **Reverse Proxy**: Handles HTTPS/WSS and routes traffic, ensuring internal services (Fastify <-> Go) communicate securely and are not directly exposed.

---

## 2. Database ERD (Prisma / PostgreSQL)
Data ownership belongs exclusively to PostgreSQL. Historical orders must rely on **snapshots**, not live catalog data.
Key Entities:
- **Users, Roles & Auth**: Users (Phone + OTP based), Sessions.
- **Stores & Catalog**: Stores, StoreHours, MenuCategories, MenuItems (with `isAvailable` state).
- **Orders**: Orders, OrderItems (includes `unitPriceSnapshot`, `productNameSnapshot`), OrderStatusHistory.
- **Deliveries**: A distinct entity from `Order` handling courier logistics, assignment, and status.

---

## 3. Order State Machine
Strict server-side validated state transitions:
`PENDING → CONFIRMED → PREPARING → READY → ASSIGNED → PICKED_UP → DELIVERING → DELIVERED`
Cancellations:
`PENDING/CONFIRMED/PREPARING → CANCELLED` (depending on business rules).
All transitions are recorded in `OrderStatusHistory`.

---

## 4. Dispatch Algorithm
Deterministic scoring system instead of AI.
For a `READY` order, find available couriers within the radius and calculate:
`Score = distance_to_store + current_active_orders_penalty + direction_penalty + estimated_delay + courier_status_penalty`.
Offer to the best courier. If timeout/rejected, try the next.

---

## 5. GPS & WebSocket Protocol
### GPS Tracking (Adaptive Updates)
- Courier stationary: 20-30s
- Moving normally: 5-10s
- Within 300m of destination: 3-5s
- Moved < 10m: Do not broadcast.
Stale location detection: If no update for 15s -> "Location updating...", 60s -> "Location unavailable".
Stop tracking when courier has no active delivery.

### WebSocket
- **Auth**: Must be authenticated (JWT) and authorized (Does this customer own this order?).
- **Resilience**: Implement a reconnect strategy with jitter (1s, 2s, 4s, 8s). On reconnect, use REST to fetch current state, then resume WebSocket.

---

## 6. Authentication & Roles
- **Primary Auth**: Phone number + SMS OTP -> JWT Session (short-lived access token + refresh token).
- **Roles**:
  - `ADMIN`: (Super Admin, Operations, Support)
  - `MERCHANT`: (Owner, Staff)
  - `COURIER`
  - `CUSTOMER`

---

## 7. UX & Offline Behavior
### Offline UX
UI must communicate network state gracefully (`ONLINE` -> `DEGRADED` -> `OFFLINE`).
"Connection is weak. Your order is still safe." instead of generic error screens.

### Maps
- Optimize map rendering: Do not recreate the map on GPS update; only update the marker position/heading.
- Customer wants ETA and Status prioritized over a massive map.

### Customer & Checkout
- Mobile shell (`max-w-md`).
- Address includes landmarks and structured delivery instructions.
- Checkout is a single bottom-sheet.
- Initial payment: Cash on Delivery (hide disabled options to reduce noise).
- Cart state in `localStorage` must be validated against the server.

### Merchant & Courier
- **Merchant**: Needs comprehensive dashboard (Accept/Reject, Prep time logic, Availability toggles).
- **Courier**: Extremely simple flow (Go Online -> Accept -> Navigate -> Pickup -> Navigate -> Deliver).

---

## 8. Performance Rules
- **Images**: Critical. Use WebP/AVIF, responsive sizes, lazy loading. Small thumbnails for lists, medium for details.
- **Go Service**: Low-allocation, low-GC pressure. Uses partitioned state managers to avoid race conditions.
- **Distance Calculation**: Use bounding boxes first before precise lat/lng distance calculations.
- **API**: Price and fee calculations are strictly server-authoritative.

---

## 9. Security & Deployment
- Fastify -> Go communication is private, with rate limiting, timeouts, request IDs, and internal network binding.
- Implement Rate Limiting, CORS, JWT Expiry, SQL Injection protection, Request size limits, and Security headers.
- Reverse proxy handles public exposure.
