package websocket

import (
	"encoding/json"
	"sync"
	"time"
)

// GatewayHub manages active WebSocket / SSE streaming subscribers
type GatewayHub struct {
	mu          sync.RWMutex
	subscribers map[string]chan []byte
}

func NewGatewayHub() *GatewayHub {
	return &GatewayHub{
		subscribers: make(map[string]chan []byte),
	}
}

func (h *GatewayHub) Subscribe(clientID string) chan []byte {
	h.mu.Lock()
	defer h.mu.Unlock()

	ch := make(chan []byte, 32)
	h.subscribers[clientID] = ch
	return ch
}

func (h *GatewayHub) Unsubscribe(clientID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if ch, ok := h.subscribers[clientID]; ok {
		close(ch)
		delete(h.subscribers, clientID)
	}
}

func (h *GatewayHub) Broadcast(event string, data interface{}) {
	payload, err := json.Marshal(map[string]interface{}{
		"event":     event,
		"timestamp": time.Now().Format(time.RFC3339),
		"data":      data,
	})
	if err != nil {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, ch := range h.subscribers {
		select {
		case ch <- payload:
		default:
			// Congestion drop to prevent buffer head-of-line blocking
		}
	}
}
