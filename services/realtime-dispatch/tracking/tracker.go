package tracking

import (
	"math"
	"sync"
	"time"
)

type FreshnessStatus string

const (
	FreshnessLive        FreshnessStatus = "LIVE"
	FreshnessUpdating    FreshnessStatus = "UPDATING"
	FreshnessUnavailable FreshnessStatus = "UNAVAILABLE"
)

const (
	MilaCenterLat         = 36.4503
	MilaCenterLng         = 6.2649
	LaunchMaxRadiusMeters = 2000.0
)

// RealtimeLocation stores fast ephemeral GPS state in-memory
type RealtimeLocation struct {
	CourierID          string          `json:"courier_id"`
	Lat                float64         `json:"lat"`
	Lng                float64         `json:"lng"`
	SpeedKmh           float64         `json:"speed_kmh"`
	Heading            float64         `json:"heading"`
	AccuracyMeters     float64         `json:"accuracy_meters"`
	BatteryPct         int             `json:"battery_pct"`
	LastSeen           time.Time       `json:"last_seen"`
	Freshness          FreshnessStatus `json:"freshness"`
	DistanceToCenterM  float64         `json:"distance_to_center_meters"`
	IsWithin2KmRadius  bool            `json:"is_within_2km_radius"`
}

// LocationManager handles in-memory GPS state
type LocationManager struct {
	mu        sync.RWMutex
	locations map[string]*RealtimeLocation
}

func NewLocationManager() *LocationManager {
	return &LocationManager{
		locations: make(map[string]*RealtimeLocation),
	}
}

// HaversineMeters computes distance between two GPS coordinates
func HaversineMeters(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371000.0 // Earth radius in meters
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	rLat1 := lat1 * (math.Pi / 180.0)
	rLat2 := lat2 * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(rLat1)*math.Cos(rLat2)*math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

func (lm *LocationManager) UpdateGPS(courierID string, lat, lng, speed, heading, accuracy float64, battery int) *RealtimeLocation {
	lm.mu.Lock()
	defer lm.mu.Unlock()

	loc, exists := lm.locations[courierID]
	if !exists {
		loc = &RealtimeLocation{CourierID: courierID}
		lm.locations[courierID] = loc
	}

	loc.Lat = lat
	loc.Lng = lng
	loc.SpeedKmh = speed
	loc.Heading = heading
	loc.AccuracyMeters = accuracy
	loc.BatteryPct = battery
	loc.LastSeen = time.Now()
	loc.Freshness = FreshnessLive

	dist := HaversineMeters(MilaCenterLat, MilaCenterLng, lat, lng)
	loc.DistanceToCenterM = dist
	loc.IsWithin2KmRadius = dist <= LaunchMaxRadiusMeters

	return loc
}

func (lm *LocationManager) GetLocation(courierID string) (*RealtimeLocation, bool) {
	lm.mu.RLock()
	defer lm.mu.RUnlock()
	loc, ok := lm.locations[courierID]
	return loc, ok
}

func (lm *LocationManager) GetAllLocations() []*RealtimeLocation {
	lm.mu.RLock()
	defer lm.mu.RUnlock()

	res := make([]*RealtimeLocation, 0, len(lm.locations))
	now := time.Now()

	for _, loc := range lm.locations {
		age := now.Sub(loc.LastSeen)
		if age <= 5*time.Second {
			loc.Freshness = FreshnessLive
		} else if age <= 15*time.Second {
			loc.Freshness = FreshnessUpdating
		} else {
			loc.Freshness = FreshnessUnavailable
		}
		res = append(res, loc)
	}

	return res
}
