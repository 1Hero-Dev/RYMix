package tracker

import (
	"math"
	"sync"
	"time"
)

// In-Memory Courier Store with sync.RWMutex for high-throughput concurrency
type InMemCourierStore struct {
	mu       sync.RWMutex
	couriers map[string]*CourierLocation
}

// NewInMemCourierStore initializes the store with seed couriers in Mila (Wilaya 43)
func NewInMemCourierStore() *InMemCourierStore {
	s := &InMemCourierStore{
		couriers: make(map[string]*CourierLocation),
	}

	// Seed freelance courier fleet in Mila Centre
	now := time.Now()
	s.couriers["courier-walid"] = &CourierLocation{
		CourierID:         "courier-walid",
		Name:              "Walid M.",
		Phone:             "+213 551 23 45 67",
		Vehicle:           "Scooter SYM Jet 14",
		Rating:            4.95,
		Lat:               36.4520,
		Lng:               6.2670,
		SpeedKmh:          24.5,
		Heading:           85.0,
		AccuracyMeters:    4.0,
		BatteryPct:        88,
		IsOnline:          true,
		ActiveOrdersCount: 0,
		LastPingAt:        now,
		Freshness:         FreshnessLive,
	}

	s.couriers["courier-karim"] = &CourierLocation{
		CourierID:         "courier-karim",
		Name:              "Karim S.",
		Phone:             "+213 558 99 11 22",
		Vehicle:           "Scooter Peugeot Tweet",
		Rating:            4.88,
		Lat:               36.4555,
		Lng:               6.2690,
		SpeedKmh:          18.0,
		Heading:           120.0,
		AccuracyMeters:    5.2,
		BatteryPct:        74,
		IsOnline:          true,
		ActiveOrdersCount: 1,
		LastPingAt:        now.Add(-4 * time.Second),
		Freshness:         FreshnessLive,
	}

	s.couriers["courier-nassim"] = &CourierLocation{
		CourierID:         "courier-nassim",
		Name:              "Nassim B.",
		Phone:             "+213 662 44 55 66",
		Vehicle:           "Moto Yamaha YBR 125",
		Rating:            4.75,
		Lat:               36.4610,
		Lng:               6.2750,
		SpeedKmh:          32.0,
		Heading:           210.0,
		AccuracyMeters:    6.0,
		BatteryPct:        62,
		IsOnline:          true,
		ActiveOrdersCount: 0,
		LastPingAt:        now.Add(-8 * time.Second),
		Freshness:         FreshnessUpdating,
	}

	// Update derived distance & radius flags
	for _, c := range s.couriers {
		s.recomputeMetrics(c)
	}

	return s
}

// UpdateLocation updates an active courier's GPS position in-memory
func (s *InMemCourierStore) UpdateLocation(u TelemetryUpdate) *CourierLocation {
	s.mu.Lock()
	defer s.mu.Unlock()

	c, exists := s.couriers[u.CourierID]
	if !exists {
		c = &CourierLocation{
			CourierID: u.CourierID,
			Name:      "Coursier Partenaire",
			Vehicle:   "Scooter",
			Rating:    4.90,
			IsOnline:  true,
		}
		s.couriers[u.CourierID] = c
	}

	c.Lat = u.Lat
	c.Lng = u.Lng
	c.SpeedKmh = u.SpeedKmh
	c.Heading = u.Heading
	c.AccuracyMeters = u.AccuracyMeters
	c.BatteryPct = u.BatteryPct
	c.LastPingAt = time.Now()
	c.Freshness = FreshnessLive

	s.recomputeMetrics(c)
	return c
}

// GetCourier returns a single courier's telemetry snapshot
func (s *InMemCourierStore) GetCourier(courierID string) (*CourierLocation, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	c, exists := s.couriers[courierID]
	if !exists {
		return nil, false
	}
	// Copy to prevent data races
	copied := *c
	s.updateFreshness(&copied)
	return &copied, true
}

// GetAllCouriers returns all couriers with updated freshness statuses
func (s *InMemCourierStore) GetAllCouriers() []*CourierLocation {
	s.mu.RLock()
	defer s.mu.RUnlock()

	results := make([]*CourierLocation, 0, len(s.couriers))
	for _, c := range s.couriers {
		copied := *c
		s.updateFreshness(&copied)
		results = append(results, &copied)
	}
	return results
}

// GetCandidatesWithinRadius filters online couriers strictly within the launch perimeter (<= 2000m)
func (s *InMemCourierStore) GetCandidatesWithinRadius(storeLat, storeLng float64, maxRadiusMeters float64) []*CourierLocation {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if maxRadiusMeters <= 0 {
		maxRadiusMeters = LaunchMaxRadiusMeters // Default 2.0 km
	}

	var candidates []*CourierLocation
	for _, c := range s.couriers {
		if !c.IsOnline || c.ActiveOrdersCount >= 3 {
			continue
		}

		dist := HaversineMeters(storeLat, storeLng, c.Lat, c.Lng)
		if dist <= maxRadiusMeters {
			copied := *c
			s.updateFreshness(&copied)
			copied.DistanceToCenterM = dist
			candidates = append(candidates, &copied)
		}
	}
	return candidates
}

func (s *InMemCourierStore) recomputeMetrics(c *CourierLocation) {
	c.DistanceToCenterM = HaversineMeters(MilaCenterLat, MilaCenterLng, c.Lat, c.Lng)
	c.IsWithin2KmRadius = c.DistanceToCenterM <= LaunchMaxRadiusMeters
	s.updateFreshness(c)
}

func (s *InMemCourierStore) updateFreshness(c *CourierLocation) {
	diff := time.Since(c.LastPingAt)
	if diff < 5*time.Second {
		c.Freshness = FreshnessLive
	} else if diff < StaleTelemetryThreshold {
		c.Freshness = FreshnessUpdating
	} else {
		c.Freshness = FreshnessUnavailable
	}
}

// HaversineMeters calculates the great-circle distance between two points in meters
func HaversineMeters(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusMeters = 6371000.0

	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	rLat1 := lat1 * (math.Pi / 180.0)
	rLat2 := lat2 * (math.Pi / 180.0)

	a := math.Sin(dLat/2.0)*math.Sin(dLat/2.0) +
		math.Cos(rLat1)*math.Cos(rLat2)*math.Sin(dLon/2.0)*math.Sin(dLon/2.0)

	c := 2.0 * math.Atan2(math.Sqrt(a), math.Sqrt(1.0-a))
	return earthRadiusMeters * c
}
