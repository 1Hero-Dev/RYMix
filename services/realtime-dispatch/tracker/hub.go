package tracker

import (
	"encoding/json"
	"sync"
	"time"
)

// Hub manages active WebSocket telemetry broadcast subscribers
type TelemetryHub struct {
	mu          sync.RWMutex
	subscribers map[string]chan []byte // subscriberID -> broadcast channel
	store       *InMemCourierStore
}

func NewTelemetryHub(store *InMemCourierStore) *TelemetryHub {
	return &TelemetryHub{
		subscribers: make(map[string]chan []byte),
		store:       store,
	}
}

func (h *TelemetryHub) Subscribe(id string) chan []byte {
	h.mu.Lock()
	defer h.mu.Unlock()

	ch := make(chan []byte, 16)
	h.subscribers[id] = ch
	return ch
}

func (h *TelemetryHub) Unsubscribe(id string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if ch, ok := h.subscribers[id]; ok {
		close(ch)
		delete(h.subscribers, id)
	}
}

// BroadcastSnapshot sends telemetry ticks to all connected clients every 2 seconds
func (h *TelemetryHub) StartBroadcastTicker(stopCh <-chan struct{}) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-stopCh:
			return
		case <-ticker.C:
			couriers := h.store.GetAllCouriers()
			payload, err := json.Marshal(map[string]interface{}{
				"event":        "TELEMETRY_TICK",
				"timestamp":    time.Now().Format(time.RFC3339),
				"fleet_count":  len(couriers),
				"max_radius_m": LaunchMaxRadiusMeters,
				"couriers":     couriers,
			})
			if err != nil {
				continue
			}

			h.mu.RLock()
			for _, ch := range h.subscribers {
				select {
				case ch <- payload:
				default:
					// Drop tick if client buffer is congested (preserves real-time freshness)
				}
			}
			h.mu.RUnlock()
		}
	}
}
