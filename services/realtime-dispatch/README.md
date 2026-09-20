# RYM Real-time Dispatch Service (Go)

Lightweight, high-performance real-time courier telemetry and intelligent dispatch engine for **RYM (Ahmed Rachedi, Wilaya 43 - Mila, Algérie)**.

## Architectural Objectives

1. **In-Memory Concurrency**: Uses `sync.RWMutex` protected Go hash-maps for sub-millisecond courier telemetry lookups, eliminating relational database writes on high-frequency GPS ticks (every 2–3 seconds).
2. **~2.0 km Launch Operating Radius**: Strictly enforces a 2,000-meter operating radius geofence centered on Mila (`36.4503, 6.2649`). Couriers outside this boundary are rejected from active candidate matching.
3. **Deterministic Intelligent Dispatch**: Evaluates available couriers using a multi-factor ranking algorithm:
   $$\text{Score} = \text{distanceToStore} + (\text{activeTrips} \times 450) + ((5.0 - \text{rating}) \times 200)$$
4. **Resilient Telemetry Broadcasting**: Provides Server-Sent Events (SSE) and WebSocket channels streaming GPS ticks with freshness categorization (`LIVE` < 5s, `UPDATING` 5–15s, `UNAVAILABLE` > 15s).

## API Endpoints

- `GET /health`: Health diagnostic confirming launch perimeter and engine status.
- `GET /api/v1/couriers`: Returns in-memory state of all online freelance couriers.
- `POST /api/v1/telemetry`: Ingests GPS update from courier mobile app.
- `GET /api/v1/dispatch/candidates?store_lat=...&store_lng=...`: Evaluates candidates within 2.0 km.
- `GET /api/v1/telemetry/stream`: SSE real-time stream of GPS ticks.

## Running Locally

```bash
cd services/realtime-dispatch
go run main.go
```


## Required configuration

The service **refuses to start** unless both of these are set. This is deliberate:
falling back to a default would ship a known credential or trust unverified callers.

| Variable | Purpose |
|---|---|
| `INTERNAL_DISPATCH_SECRET` | Shared secret the API server sends in `X-Internal-Secret` to reach `/api/v1/dispatch/*` and `/api/v1/couriers`. |
| `FIREBASE_PROJECT_ID` | Firebase project whose ID tokens are accepted. Tokens for any other project are rejected. |
| `ALLOWED_ORIGINS` | Optional. Comma-separated browser origins for CORS and WebSocket upgrades. Defaults to the local dev servers. |

### Authentication model

- **Courier identity comes only from a verified Firebase ID token.** `courier_id` in a request
  body is ignored (a mismatch is rejected), so GPS cannot be posted for another courier.
- **`GET /ws`** takes the token as `?access_token=` because browsers cannot set headers on a
  WebSocket handshake. Origins not in `ALLOWED_ORIGINS` are refused.
- **`GET /api/v1/couriers`** (whole-fleet positions) needs the internal secret or an admin token.
- **`GET /api/v1/telemetry/stream`** needs a verified token.
