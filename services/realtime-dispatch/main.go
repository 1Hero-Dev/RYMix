package main

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/rym/realtime-dispatch/dispatch"
	"github.com/rym/realtime-dispatch/presence"
	"github.com/rym/realtime-dispatch/telemetry"
	"github.com/rym/realtime-dispatch/tracking"
	"github.com/rym/realtime-dispatch/websocket"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	internalSecret := os.Getenv("INTERNAL_DISPATCH_SECRET")
	if internalSecret == "" {
		log.Fatal("FATAL: INTERNAL_DISPATCH_SECRET environment variable is required but not set. Refusing to start.")
	}

	// Configurable CORS origins (comma-separated). Defaults to localhost dev server.
	allowedOriginsRaw := os.Getenv("ALLOWED_ORIGINS")
	if allowedOriginsRaw == "" {
		allowedOriginsRaw = "http://localhost:5173,http://localhost:3000"
	}
	allowedOrigins := strings.Split(allowedOriginsRaw, ",")
	for i := range allowedOrigins {
		allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
	}

	// 1. Initialize Realtime Subsystems
	locManager := tracking.NewLocationManager()
	presManager := presence.NewPresenceManager()
	gatewayHub := websocket.NewGatewayHub()
	telemetryStore := telemetry.NewTelemetryStore(100)
	dispatcher := dispatch.NewDispatcher(locManager, presManager)

	// Seed freelance courier fleet in Mila Centre (Wilaya 43)
	locManager.UpdateGPS("courier-walid", 36.4520, 6.2670, 24.5, 85.0, 4.0, 88)
	presManager.SetHeartbeat("courier-walid", 0)

	locManager.UpdateGPS("courier-karim", 36.4555, 6.2690, 18.0, 120.0, 5.2, 74)
	presManager.SetHeartbeat("courier-karim", 1)

	locManager.UpdateGPS("courier-nassim", 36.4610, 6.2750, 32.0, 210.0, 6.0, 62)
	presManager.SetHeartbeat("courier-nassim", 0)

	// Constant-time internal secret validator
	verifyInternalSecret := func(r *http.Request) bool {
		received := r.Header.Get("X-Internal-Secret")
		if received == "" {
			return false
		}
		return subtle.ConstantTimeCompare([]byte(received), []byte(internalSecret)) == 1
	}

	// CORS Middleware - restricted to allowed origins
	withCORS := func(h http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			allowed := false
			for _, o := range allowedOrigins {
				if o == origin {
					allowed = true
					break
				}
			}
			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Internal-Secret")
			w.Header().Set("Vary", "Origin")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			h(w, r)
		}
	}

	// Health check
	http.HandleFunc("/health", withCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":            "UP",
			"service":           "rym-go-realtime-platform",
			"subsystems":        []string{"websocket", "presence", "tracking", "dispatch", "telemetry"},
			"wilaya":            "43 - Mila (Ahmed Rachedi)",
			"launch_radius_m":   tracking.LaunchMaxRadiusMeters,
			"concurrency_model": "Low-allocation sync.RWMutex Subsystem Architecture",
			"timestamp":         time.Now().Format(time.RFC3339),
		})
	}))

	// GET /api/v1/couriers - Snapshot of in-memory locations & presence
	http.HandleFunc("/api/v1/couriers", withCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		locations := locManager.GetAllLocations()
		json.NewEncoder(w).Encode(map[string]interface{}{
			"count":            len(locations),
			"launch_radius_m":  tracking.LaunchMaxRadiusMeters,
			"center_reference": "Mila Centre (36.4503, 6.2649)",
			"couriers":         locations,
		})
	}))

	// POST /api/v1/telemetry - Courier device GPS ingestion
	http.HandleFunc("/api/v1/telemetry", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized: missing bearer token", http.StatusUnauthorized)
			return
		}

		var payload struct {
			CourierID      string  `json:"courier_id"`
			Lat            float64 `json:"lat"`
			Lng            float64 `json:"lng"`
			SpeedKmh       float64 `json:"speed_kmh"`
			Heading        float64 `json:"heading"`
			AccuracyMeters float64 `json:"accuracy_meters"`
			BatteryPct     int     `json:"battery_pct"`
			ActiveOrders   int     `json:"active_orders"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}

		loc := locManager.UpdateGPS(
			payload.CourierID,
			payload.Lat, payload.Lng,
			payload.SpeedKmh, payload.Heading,
			payload.AccuracyMeters, payload.BatteryPct,
		)
		presManager.SetHeartbeat(payload.CourierID, payload.ActiveOrders)

		// Record sample in telemetry store
		telemetryStore.RecordSample(telemetry.MetricSample{
			CourierID:   payload.CourierID,
			Timestamp:   time.Now(),
			BatteryPct:  payload.BatteryPct,
			SpeedKmh:    payload.SpeedKmh,
			NetworkType: "4G",
		})

		// Broadcast delta over gateway
		gatewayHub.Broadcast("courier.location.updated", loc)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"courier": loc,
		})
	}))

	// GET /api/v1/dispatch/candidates - Authoritative Go dispatch candidate ranking
	// V4 FIX: Fail-closed — always require valid internal secret.
	http.HandleFunc("/api/v1/dispatch/candidates", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if !verifyInternalSecret(r) {
			http.Error(w, "Forbidden: missing or invalid internal secret", http.StatusForbidden)
			return
		}

		query := r.URL.Query()
		storeLat := tracking.MilaCenterLat
		storeLng := tracking.MilaCenterLng

		if v, err := strconv.ParseFloat(query.Get("store_lat"), 64); err == nil {
			storeLat = v
		}
		if v, err := strconv.ParseFloat(query.Get("store_lng"), 64); err == nil {
			storeLng = v
		}

		ranked := dispatcher.FindAndRankCandidates(storeLat, storeLng, tracking.LaunchMaxRadiusMeters)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"store_coordinates": map[string]float64{"lat": storeLat, "lng": storeLng},
			"max_radius_meters": tracking.LaunchMaxRadiusMeters,
			"candidates_count":  len(ranked),
			"ranked_candidates": ranked,
		})
	}))

	// POST /api/v1/dispatch/offers - Create delivery offer
	// V4 FIX: Require valid internal secret for offer creation.
	http.HandleFunc("/api/v1/dispatch/offers", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if !verifyInternalSecret(r) {
			http.Error(w, "Forbidden: missing or invalid internal secret", http.StatusForbidden)
			return
		}

		var req struct {
			OrderID      string  `json:"order_id"`
			StoreLat     float64 `json:"store_lat"`
			StoreLng     float64 `json:"store_lng"`
			StoreName    string  `json:"store_name"`
			CustomerName string  `json:"customer_name"`
			FeeDZD       int     `json:"fee_dzd"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		offer, ok := dispatcher.CreateDeliveryOffer(req.OrderID, req.StoreLat, req.StoreLng, req.StoreName, req.CustomerName, req.FeeDZD)
		if !ok {
			http.Error(w, "No eligible couriers available within radius", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"offer":   offer,
		})
	}))

	// SSE / Streaming Telemetry Endpoint for browsers
	http.HandleFunc("/api/v1/telemetry/stream", withCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
			return
		}

		clientID := fmt.Sprintf("client-%d", time.Now().UnixNano())
		subCh := gatewayHub.Subscribe(clientID)
		defer gatewayHub.Unsubscribe(clientID)

		notify := r.Context().Done()

		for {
			select {
			case <-notify:
				return
			case msg := <-subCh:
				fmt.Fprintf(w, "data: %s\n\n", msg)
				flusher.Flush()
			}
		}
	}))

	log.Printf("🚀 RYM Go Real-time Platform running on :%s (Subsystems: websocket, presence, tracking, dispatch, telemetry)", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
