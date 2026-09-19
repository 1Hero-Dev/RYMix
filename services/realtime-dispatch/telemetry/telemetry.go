package telemetry

import (
	"sync"
	"time"
)

// MetricSample represents a sampled operational telemetry snapshot
type MetricSample struct {
	CourierID         string    `json:"courier_id"`
	Timestamp         time.Time `json:"timestamp"`
	BatteryPct        int       `json:"battery_pct"`
	SpeedKmh          float64   `json:"speed_kmh"`
	ConnectionLatency int64     `json:"connection_latency_ms"`
	NetworkType       string    `json:"network_type"` // e.g. "4G", "3G", "WiFi"
}

// TelemetryStore maintains rolling historical samples without spamming durable PostgreSQL
type TelemetryStore struct {
	mu      sync.RWMutex
	samples map[string][]MetricSample // courierID -> ring buffer
	maxRing int
}

func NewTelemetryStore(maxRing int) *TelemetryStore {
	if maxRing <= 0 {
		maxRing = 60 // Keep last 60 sampled points
	}
	return &TelemetryStore{
		samples: make(map[string][]MetricSample),
		maxRing: maxRing,
	}
}

// RecordSample records a telemetry snapshot at intervals (e.g. 15-30s)
func (ts *TelemetryStore) RecordSample(sample MetricSample) {
	ts.mu.Lock()
	defer ts.mu.Unlock()

	list := ts.samples[sample.CourierID]
	if len(list) >= ts.maxRing {
		list = list[1:]
	}
	ts.samples[sample.CourierID] = append(list, sample)
}

func (ts *TelemetryStore) GetRecentSamples(courierID string) []MetricSample {
	ts.mu.RLock()
	defer ts.mu.RUnlock()

	return append([]MetricSample(nil), ts.samples[courierID]...)
}
