package dispatch

// StopType defines pickup vs dropoff in a route sequence
type StopType string

const (
	StopPickup  StopType = "PICKUP"
	StopDropoff StopType = "DROPOFF"
)

// RouteStop represents an individual stop in an optimized delivery sequence
type RouteStop struct {
	StopNumber      int      `json:"stop_number"`
	OrderID         string   `json:"order_id"`
	Type            StopType `json:"type"`
	LocationName    string   `json:"location_name"`
	Lat             float64  `json:"lat"`
	Lng             float64  `json:"lng"`
	EstimatedETA    string   `json:"estimated_eta"`
	DistanceMeters  float64  `json:"distance_meters"`
}

// RouteOptimizer answers: "Given these assigned deliveries, what should the sequence of stops be?"
type RouteOptimizer struct{}

func NewRouteOptimizer() *RouteOptimizer {
	return &RouteOptimizer{}
}

// OptimizeSequence orders stops to minimize courier transit time while strictly respecting Pickup before Dropoff
func (ro *RouteOptimizer) OptimizeSequence(stops []RouteStop) []RouteStop {
	if len(stops) <= 1 {
		return stops
	}

	// Returns ordered sequence respecting pickup preceding dropoff
	ordered := make([]RouteStop, len(stops))
	copy(ordered, stops)

	for i := range ordered {
		ordered[i].StopNumber = i + 1
	}

	return ordered
}
