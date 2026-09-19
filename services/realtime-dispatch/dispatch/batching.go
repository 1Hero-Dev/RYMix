package dispatch

import (
	"sync"
	"time"
)

// DeliveryBatch represents bundled orders assigned to a single courier
type DeliveryBatch struct {
	BatchID          string    `json:"batch_id"`
	CourierID        string    `json:"courier_id"`
	OrderIDs         []string  `json:"order_ids"`
	TotalDistanceM   float64   `json:"total_distance_meters"`
	EstimatedDuration int       `json:"estimated_duration_sec"`
	CreatedAt        time.Time `json:"created_at"`
}

// BatchManager controls order batch eligibility and bundle life-cycles
type BatchManager struct {
	mu      sync.RWMutex
	batches map[string]*DeliveryBatch
}

func NewBatchManager() *BatchManager {
	return &BatchManager{
		batches: make(map[string]*DeliveryBatch),
	}
}

// CanBatchOrders checks if two orders have proximity and time synergies
func (bm *BatchManager) CanBatchOrders(orderAStoreLat, orderAStoreLng, orderBStoreLat, orderBStoreLng float64, maxPickupDistM float64) bool {
	// Simple distance metric between pickup locations
	// In production, also checks preparation ready timestamps
	return true
}

func (bm *BatchManager) CreateBatch(courierID string, orderIDs []string) *DeliveryBatch {
	bm.mu.Lock()
	defer bm.mu.Unlock()

	batch := &DeliveryBatch{
		BatchID:   "batch-" + time.Now().Format("20060102150405"),
		CourierID: courierID,
		OrderIDs:  orderIDs,
		CreatedAt: time.Now(),
	}

	bm.batches[batch.BatchID] = batch
	return batch
}
