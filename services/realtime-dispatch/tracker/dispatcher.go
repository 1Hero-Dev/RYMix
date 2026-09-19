package tracker

import (
	"sort"
)

// DispatchEngine manages intelligent matching of orders to the nearest available freelance courier
type DispatchEngine struct {
	store *InMemCourierStore
}

func NewDispatchEngine(store *InMemCourierStore) *DispatchEngine {
	return &DispatchEngine{store: store}
}

// RankCandidatesForStore ranks eligible freelance couriers strictly within the ~2.0 km radius
func (d *DispatchEngine) RankCandidatesForStore(storeLat, storeLng float64) []RankedCourier {
	candidates := d.store.GetCandidatesWithinRadius(storeLat, storeLng, LaunchMaxRadiusMeters)

	ranked := make([]RankedCourier, 0, len(candidates))
	for _, c := range candidates {
		dist := HaversineMeters(storeLat, storeLng, c.Lat, c.Lng)

		// Deterministic scoring formula:
		// Lower score is better
		distanceScore := dist
		activeOrderPenalty := float64(c.ActiveOrdersCount) * 450.0
		ratingBonus := (5.0 - c.Rating) * 200.0

		totalScore := distanceScore + activeOrderPenalty + ratingBonus

		ranked = append(ranked, RankedCourier{
			CourierID:             c.CourierID,
			Name:                  c.Name,
			Vehicle:               c.Vehicle,
			Rating:                c.Rating,
			DistanceToStoreMeters: dist,
			ActiveOrdersCount:     c.ActiveOrdersCount,
			Score:                 totalScore,
		})
	}

	// Sort ascending: lowest score = best candidate
	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].Score < ranked[j].Score
	})

	return ranked
}
