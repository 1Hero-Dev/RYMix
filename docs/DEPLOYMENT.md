# Deployment & Operations Specification — RYM Platform

**Version:** 1.0.0  
**Infrastructure Target:** Cloud Run Container / Linux Host with Nginx Reverse Proxy

---

## 1. Port Allocation & Networking

- **Public Reverse Proxy Port:** `3000` (Directly ingress-routed by Cloud Run / reverse proxy).
- **Client Frontend (Vite / React):** Served on port `3000` in production (static build output in `dist/`).
- **Internal Realtime Go Micro-Daemon:** Binds to `0.0.0.0:8080` (or configured `$PORT`), bridging WebSocket telemetry.
- **Durable Relational Database:** PostgreSQL 16+ on managed cloud instance or developer container.

---

## 2. Environment Variables Configuration (`.env.example`)

```env
# Server & Port
PORT=3000
NODE_ENV=production

# PostgreSQL Database (Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/rym_delivery_db?schema=public

# Security Secrets
JWT_SECRET=your_long_random_jwt_secret_key_here
INTERNAL_DISPATCH_SECRET=rym_internal_secret_ahmedrachedi_43

# External Services
FIREBASE_PROJECT_ID=lofty-axle-3dtd0
HTTP_SMS_GATEWAY_URL=http://192.168.1.100:8080/send
HTTP_SMS_API_KEY=your_sms_gateway_key
```

---

## 3. Production Build & Start Verification

1. **Client Build:**
   ```bash
   npm run build
   ```
   Compiles optimized production bundle to `dist/`.
2. **Go Service Compilation:**
   ```bash
   cd services/realtime-dispatch && go build -o bin/realtime-dispatch main.go
   ```
3. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   ```
