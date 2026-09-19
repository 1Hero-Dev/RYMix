package dispatch

import (
	"github.com/rym/realtime-dispatch/presence"
	"github.com/rym/realtime-dispatch/tracking"
)

// Candidate represents an eligible courier evaluated for delivery
type Candidate struct {
	CourierID             string  `json:"courier_id"`
	DistanceToStoreMeters float64 `json:"distance_to_store_meters"`
	ActiveOrdersCount     int     `json:"active_orders_count"`
	Rating                float64 `json:"rating"`
	Vehicle               string  `json:"vehicle"`
	SpeedKmh              float64 `json:"speed_kmh"`
	BatteryPct            int     `json:"battery_pct"`
}

// FilterEligibleCandidates filters couriers based on radius, active capacity, and online presence
func FilterEligibleCandidates(
	storeLat, storeLng float64,
	maxRadius float64,
	locations []*tracking.RealtimeLocation,
	pm *presence.PresenceManager,
) []Candidate {
	candidates := make([]Candidate, 0)

	for _, loc := range locations {
		dist := tracking.HaversineMeters(storeLat, storeLng, loc.Lat, loc.Lng)
		if dist > maxRadius {
			continue
		}

		pres, found := pm.GetPresence(loc.CourierID)
		if !found || pres.State == presence.StateOffline || pres.State == presence.StateBusy {
			continue
		}

		candidates = append(candidates, Candidate{
			CourierID:             loc.CourierID,
			DistanceToStoreMeters: dist,
			ActiveOrdersCount:     pres.ActiveOrders,
			Rating:                4.9, // Default baseline rating
			Vehicle:               "Scooter",
			SpeedKmh:              loc.SpeedKmh,
			BatteryPct:            loc.BatteryPct,
		})
	}

	return candidates
}
