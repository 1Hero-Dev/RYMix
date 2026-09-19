# Realtime Communication Contract — RYM Platform

**Version:** 1.0.0  
**Transport:** WebSockets (`ws://` / `wss://`) & SSE Fallback  
**Service Daemon:** Go Realtime Dispatcher (`services/realtime-dispatch`)

---

## 1. Connection & Authentication

- **Endpoint:** `wss://{host}/ws`
- **Query Parameter / Header:** `?token={JWT_TOKEN}` or `Authorization: Bearer {JWT_TOKEN}`
- **Heartbeat:** 
  - Server sends ping frame every 30 seconds.
  - Client must respond with pong within 10 seconds.
  - Disconnect declared if 2 consecutive heartbeats fail.
- **Reconnection Policy:** Exponential backoff with jitter:
  `T_backoff = min(30s, initialDelay * 2^attempt) + jitter`
  (e.g., 1s, 2s, 4s, 8s, 16s, max 30s). On reconnect, client performs REST state fetch to bridge any missed events.

---

## 2. Channel & Room Subscriptions

To minimize bandwidth on Algerian mobile networks, clients receive ONLY the events relevant to their specific role and active scope:

| Channel Pattern | Authorized Roles | Description & Events |
|---|---|---|
| `order:{orderId}` | Customer (Owner), Courier (Assigned), Merchant (Fulfiller), Admin | Real-time status updates, ETA changes, and delivery milestone alerts |
| `courier:{courierId}` | Courier (Self), Admin | Direct dispatch delivery offers, cancellation alerts, and route changes |
| `merchant:{storeId}` | Merchant (Store Staff/Owner), Admin | Incoming order alerts, courier arrival notices, and kitchen prep reminders |
| `admin:operations` | Admin | Real-time operational heatmaps, active delivery counts, and dispatch alerts |

---

## 3. Telemetry Payload Format

### A. Courier GPS Telemetry (Client -> Server)
```json
{
  "type": "COURIER_GPS_PING",
  "courierId": "c-walid-01",
  "lat": 36.4528,
  "lng": 6.2652,
  "speedKmh": 24.5,
  "headingDeg": 182,
  "timestamp": 1726750000000
}
```

### B. Order Live Tracking Broadcast (Server -> Customer)
```json
{
  "type": "ORDER_TRACKING_DELTA",
  "orderId": "order-101",
  "status": "DELIVERING",
  "courierLocation": {
    "lat": 36.4528,
    "lng": 6.2652,
    "headingDeg": 182
  },
  "etaMinutes": 6,
  "timestamp": 1726750000000
}
```

---

## 4. Adaptive GPS Frequency Policy

To protect courier mobile battery life and preserve data quotas:
- **Stationary / Waiting:** Update every 20–30 seconds.
- **Normal In-Transit:** Update every 5–10 seconds.
- **Destination Proximity (< 300m):** Update every 3–5 seconds.
- **Stationary Deadband (< 10m movement):** Broadcast suppressed unless 60s elapse.
