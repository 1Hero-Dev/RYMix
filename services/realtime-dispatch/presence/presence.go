package presence

import (
	"sync"
	"time"
)

// OperationalState defines the business readiness of a courier
type OperationalState string

const (
	StateOffline   OperationalState = "OFFLINE"
	StateOnline    OperationalState = "ONLINE"
	StateAvailable OperationalState = "AVAILABLE"
	StateBusy      OperationalState = "BUSY"
)

// CourierPresence tracks operational status and heartbeats
type CourierPresence struct {
	CourierID        string           `json:"courier_id"`
	State            OperationalState `json:"state"`
	ActiveOrders     int              `json:"active_orders"`
	MaxCapacity      int              `json:"max_capacity"`
	LastHeartbeatAt  time.Time        `json:"last_heartbeat_at"`
	IsConnectedWS    bool             `json:"is_connected_ws"`
}

// PresenceManager manages courier connectivity and operational state
type PresenceManager struct {
	mu       sync.RWMutex
	presence map[string]*CourierPresence
}

func NewPresenceManager() *PresenceManager {
	return &PresenceManager{
		presence: make(map[string]*CourierPresence),
	}
}

func (pm *PresenceManager) SetHeartbeat(courierID string, activeOrders int) *CourierPresence {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	p, exists := pm.presence[courierID]
	if !exists {
		p = &CourierPresence{
			CourierID:   courierID,
			State:       StateAvailable,
			MaxCapacity: 3,
		}
		pm.presence[courierID] = p
	}

	p.LastHeartbeatAt = time.Now()
	p.ActiveOrders = activeOrders
	p.IsConnectedWS = true

	if p.ActiveOrders >= p.MaxCapacity {
		p.State = StateBusy
	} else if p.State == StateOffline {
		p.State = StateAvailable
	}

	return p
}

func (pm *PresenceManager) SetState(courierID string, state OperationalState) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if p, ok := pm.presence[courierID]; ok {
		p.State = state
		if state == StateOffline {
			p.IsConnectedWS = false
		}
	}
}

func (pm *PresenceManager) GetPresence(courierID string) (*CourierPresence, bool) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	p, ok := pm.presence[courierID]
	return p, ok
}

func (pm *PresenceManager) GetAllOnline() []*CourierPresence {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	res := make([]*CourierPresence, 0)
	for _, p := range pm.presence {
		if p.State != StateOffline {
			res = append(res, p)
		}
	}
	return res
}
