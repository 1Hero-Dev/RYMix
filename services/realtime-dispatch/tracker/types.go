package tracker

import (
	"time"
)

// Freshness status for GPS positions
type FreshnessStatus string

const (
	FreshnessLive        FreshnessStatus = "LIVE"        // Ping received < 5s ago
	FreshnessUpdating    FreshnessStatus = "UPDATING"    // Ping received 5s–15s ago
	FreshnessUnavailable FreshnessStatus = "UNAVAILABLE" // Ping older than 15s
)

// Constants for Mila launch operations
const (
	MilaCenterLat            = 36.4503
	MilaCenterLng            = 6.2649
	LaunchMaxRadiusMeters    = 2000.0 // Strict ~2.0 km launch perimeter
	StaleTelemetryThreshold = 15 * time.Second
)

// In-memory courier position state
type CourierLocation struct {
	CourierID          string          `json:"courier_id"`
	Name               string          `json:"name"`
	Phone              string          `json:"phone"`
	Vehicle            string          `json:"vehicle"`
	Rating             float64         `json:"rating"`
	Lat                float64         `json:"lat"`
	Lng                float64         `json:"lng"`
	SpeedKmh           float64         `json:"speed_kmh"`
	Heading            float64         `json:"heading"`
	AccuracyMeters     float64         `json:"accuracy_meters"`
	BatteryPct         int             `json:"battery_pct"`
	IsOnline           bool            `json:"is_online"`
	ActiveOrdersCount  int             `json:"active_orders_count"`
	LastPingAt         time.Time       `json:"last_ping_at"`
	Freshness          FreshnessStatus `json:"freshness"`
	DistanceToCenterM  float64         `json:"distance_to_center_meters"`
	IsWithin2KmRadius  bool            `json:"is_within_2km_radius"`
}

// Telemetry update payload sent by the courier device
type TelemetryUpdate struct {
	CourierID      string  `json:"courier_id"`
	Lat            float64 `json:"lat"`
	Lng            float64 `json:"lng"`
	SpeedKmh       float64 `json:"speed_kmh"`
	Heading        float64 `json:"heading"`
	AccuracyMeters float64 `json:"accuracy_meters"`
	BatteryPct     int     `json:"battery_pct"`
}

// Scored dispatch candidate
type RankedCourier struct {
	CourierID             string  `json:"courier_id"`
	Name                  string  `json:"name"`
	Vehicle               string  `json:"vehicle"`
	Rating                float64 `json:"rating"`
	DistanceToStoreMeters float64 `json:"distance_to_store_meters"`
	ActiveOrdersCount     int     `json:"active_orders_count"`
	Score                 float64 `json:"score"` // Lower is better
}
