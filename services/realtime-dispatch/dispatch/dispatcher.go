package dispatch

import (
	"github.com/rym/realtime-dispatch/presence"
	"github.com/rym/realtime-dispatch/tracking"
)

// Dispatcher is the single authoritative coordinator for dispatch, matching, and batching
type Dispatcher struct {
	locManager     *tracking.LocationManager
	presManager    *presence.PresenceManager
	assignmentEng  *AssignmentEngine
	batchManager   *BatchManager
	routeOptimizer *RouteOptimizer
}

func NewDispatcher(
	lm *tracking.LocationManager,
	pm *presence.PresenceManager,
) *Dispatcher {
	return &Dispatcher{
		locManager:     lm,
		presManager:    pm,
		assignmentEng:  NewAssignmentEngine(),
		batchManager:   NewBatchManager(),
		routeOptimizer: NewRouteOptimizer(),
	}
}

// FindAndRankCandidates selects and ranks candidate couriers for an order pickup location
func (d *Dispatcher) FindAndRankCandidates(storeLat, storeLng float64, maxRadius float64) []ScoredCandidate {
	locs := d.locManager.GetAllLocations()
	candidates := FilterEligibleCandidates(storeLat, storeLng, maxRadius, locs, d.presManager)
	return ScoreCandidates(candidates)
}

// CreateDeliveryOffer dispatches an official delivery offer to the top ranked courier
func (d *Dispatcher) CreateDeliveryOffer(orderID string, storeLat, storeLng float64, storeName, customerName string, feeDZD int) (*DeliveryOffer, bool) {
	ranked := d.FindAndRankCandidates(storeLat, storeLng, tracking.LaunchMaxRadiusMeters)
	if len(ranked) == 0 {
		return nil, false
	}

	bestCourier := ranked[0]
	offer := d.assignmentEng.CreateOffer(orderID, bestCourier.CourierID, storeName, customerName, feeDZD, 45)
	return offer, true
}

func (d *Dispatcher) RespondToOffer(orderID, courierID string, accept bool) (*DeliveryOffer, bool) {
	return d.assignmentEng.RespondOffer(orderID, courierID, accept)
}

func (d *Dispatcher) GetBatchManager() *BatchManager {
	return d.batchManager
}

func (d *Dispatcher) GetRouteOptimizer() *RouteOptimizer {
	return d.routeOptimizer
}
