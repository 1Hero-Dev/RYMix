# Security and correctness changes

This pass checked the earlier "Phase 1" commit against the code instead of trusting its
message. Much of it was real (Firestore rules, Fastify server, Firebase token verification,
catalog pricing). What remained was a set of gaps that quietly undid those fixes, plus several
bugs the server work had not yet exposed.

## What was wrong

| # | Problem | Effect |
|---|---|---|
| 1 | `CheckoutScreen` fell back to the in-browser gateway on **any** server error | A 401, a rejected price or a closed store still placed the order locally. V1, V2 and V5 were effectively still open. |
| 2 | Order transitions and cancels checked the caller's **role** but not whether they were a **party to that order** | Any merchant could advance any store's orders; any customer could cancel another customer's order. |
| 3 | Role rules were keyed by *source status only* | A customer could confirm their own order (skipping the merchant) and mark it `DELIVERED`, which settles the payment. Any courier could cancel a `READY` order. |
| 4 | The generic status endpoint accepted `CANCELLED` | Bypassed `evaluateCancellationPolicy` entirely. |
| 5 | `ARRIVED` and `CUSTOMER_CONFIRMED` existed in the state machine but not in the database enum | A courier tapping "arrived" passed validation, then failed inside Prisma with a 500. |
| 6 | Nothing ever created a `User` row, but orders, deliveries and loyalty hold foreign keys to `User.id` | Every order from a real account would fail with a foreign-key violation. |
| 7 | `Delivery.courierId` and `assignedAt` were never written | A "claimed" delivery still looked unassigned, so a second courier could act on it, and there was no record of who delivered. |
| 8 | Go service: `/api/v1/couriers` and the telemetry stream were open; telemetry only checked the `Bearer ` prefix and read `courier_id` from the body | Anyone could read the whole fleet's live positions or post GPS for any courier. |
| 9 | Go service: no `/ws` route existed | The hub was built and broadcast to but never served, so live tracking could not work. |
| 10 | API CORS was `*` | Any website could call the API from a signed-in user's browser. |
| 11 | `apps/api` could not be built: `"type": "commonjs"` with ES-module source, no `build` or `start` script | Production deployment was impossible. |
| 12 | Two divergent Prisma schemas, no migrations | A `prisma migrate` from the wrong directory would create a database the API cannot use. |

## Changes by area

### Client (`src/`)
- `components/CheckoutScreen.tsx`: removed the hardcoded session and fake JWT. The server's verdict is final: the local simulation is used **only** when the server is unreachable (a network `TypeError`) **and** simulation is enabled. An HTTP 4xx/5xx is never overridden. The order view model is now built from the server's figures and satisfies the full `Order` type.
- `services/apiGateway.ts`: no longer claims to be RBAC (the caller supplies its own role). In production builds every call is refused at use time (mutations throw, subscriptions return an empty stream) instead of crashing the app at import. Re-enable for staging demos with `VITE_ALLOW_LOCAL_SIMULATION=true`.
- `components/CourierAppView.tsx`, `MerchantAppView.tsx`: fake JWT literals replaced with clearly labelled demo identities that carry no token.
- `services/apiClient.ts`: a production build without `VITE_API_URL` now fails clearly instead of silently calling the user's own `localhost:3001`.

### API (`apps/api/`)
- `routes/orders.ts`: object-level authorization (`isPartyToOrder`) on read, transition and cancel. Atomic courier claim (`updateMany ... WHERE courierId IS NULL OR courierId = me`), which returns **409** if another courier won. Delivery timestamps written before the order update so the response is fresh.
- `domain/orderLifecycle.ts`: per-transition role allowlist; `CANCELLED` refused on the generic path for non-admins. Admin and system keep their override, but only along legal edges.
- `plugins/firebase-auth.ts`: provisions a `User` row on first authenticated request (once per uid per process, race-safe, never overwrites an existing role); 503 if provisioning fails.
- `prisma/schema.prisma`: added `ARRIVED` and `CUSTOMER_CONFIRMED`; `User.phone` is now optional.
- `index.ts`: CORS restricted to `ALLOWED_ORIGINS`.
- `package.json`, `tsconfig.json`: ESM, real `build` / `start` / `typecheck` / `test` scripts.
- New `.env.example`. New `src/domain/orderLifecycle.test.ts` (11 tests), including a guard that fails if the state machine and the database enum ever drift apart again.

### Go realtime service (`services/realtime-dispatch/`)
- New `auth/idtoken.go`: standard-library Firebase ID token verifier (RS256 only, rejects `alg: none`, checks signature, audience, issuer and expiry; caches Google's keys). Standard library only, because the module has no third-party dependencies.
- `main.go`: fleet endpoint needs the internal secret or an admin token; telemetry takes the courier from the verified token; the event stream needs a token; new authenticated `/ws` endpoint.
- New `websocket/conn.go`: minimal RFC 6455 server (handshake, text frames, ping/pong, origin check).

### Repo hygiene
- `prisma/schema.prisma` (root) marked DEPRECATED. It has diverged from the live schema. Delete when convenient.
- `.env.example` and the Go `README.md` document the new required configuration.

## Behaviour changes to be aware of

**New required configuration**
- Go service: `FIREBASE_PROJECT_ID` (it refuses to start without it, as with `INTERNAL_DISPATCH_SECRET`).
- Production client builds: `VITE_API_URL`.
- API: `ALLOWED_ORIGINS` for any frontend not on localhost.

**Narrowed permissions** (previously allowed, now refused)

| Role | No longer allowed |
|---|---|
| Customer | `PENDING → CONFIRMED`; `DELIVERED` from any state; cancel via the generic endpoint |
| Merchant | `READY → ASSIGNED / PICKED_UP`; cancel via the generic endpoint |
| Courier | cancelling; `CUSTOMER_CONFIRMED` on the customer's behalf |
| Anyone | acting on an order they are not a party to |

Cancellation goes through `POST /orders/:id/cancel`, which applies the cancellation policy.

**Operational**
- Roles come from **Firebase custom claims** (`role`, or `admin: true`). Nothing in the repo sets them, so until you do, every account is a `CUSTOMER`.
- A merchant can act only on stores they have a `StoreMembership` row for. Nothing creates those yet.
- In production the courier-offer and merchant-availability simulations are disabled (they have no server endpoints yet), so those screens show empty rather than fabricated data.

## Verification

Ran and passing:
- Go: `go build`, `go vet`, and 9 tests (8 token-verifier cases including `alg: none`, wrong key, wrong audience or issuer and expiry; 1 end-to-end WebSocket handshake and broadcast).
- API: `tsc --noEmit` with 0 errors; 11 domain tests. The drift-guard test was mutation-checked: reverting the enum fix makes it fail with `statuses missing from the database enum: ARRIVED, CUSTOMER_CONFIRMED`.
- Client: the repo's own `npm run lint` (`tsc --noEmit`) with 0 errors; `vite build` succeeds. The production guard logic (extracted from the file, with the class stubbed) was exercised in dev, production, and production with opt-in.

**Not verified** (could not be, from here):
- The API against a real PostgreSQL. No database was available and Prisma's engine download is blocked. The route logic (user provisioning, courier claim, 409 path) is type-checked but has **not been run end to end**.
- Token verification against Google's live keys (unit-tested with locally generated keys only).
- The WebSocket endpoint from a real browser, and the Firestore rules (no emulator).

## Not done: needs you

1. **Create migrations.** There are none. From `apps/api`, with a database available: `npx prisma migrate dev --name init`. I could not generate one because the schema engine could not be downloaded here, and I did not hand-write the full initial migration.
2. **Seed stores, menu items and `StoreMembership` rows, and set custom claims.** The client's mock catalog IDs do not match database UUIDs, so real checkouts need seeded data. Simulation is used only when the server is unreachable.
3. **Server endpoints for courier offers, accept/decline and merchant availability**, and have the API call the Go dispatcher (it currently does not).
4. **Firestore `orders` rules.** Parties can still update any field, including `totalDZD` and `paymentStatus`. Once the server mirrors orders to Firestore, make client writes to that collection server-only. I did not change the rules without an emulator to test them.
5. **Split persona bundles.** The production build still ships `AdminAppView` (about 198 kB) to every customer.
6. **Cash-on-delivery settlement ledger.** Couriers hold customer cash and there is still no record of cash collected per courier and shift.
7. Five Go files were already not `gofmt`-clean (`dispatch/*.go`, `presence`, `tracking`). I left them alone to keep this diff reviewable.
