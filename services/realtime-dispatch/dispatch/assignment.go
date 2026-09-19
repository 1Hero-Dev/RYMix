package dispatch

import (
	"sync"
	"time"
)

type OfferStatus string

const (
	OfferPending  OfferStatus = "PENDING"
	OfferAccepted OfferStatus = "ACCEPTED"
	OfferRejected OfferStatus = "REJECTED"
	OfferExpired  OfferStatus = "EXPIRED"
)

// DeliveryOffer is an authoritative dispatch offer issued to a courier
type DeliveryOffer struct {
	OfferID         string      `json:"offer_id"`
	OrderID         string      `json:"order_id"`
	CourierID       string      `json:"courier_id"`
	StoreName       string      `json:"store_name"`
	CustomerName    string      `json:"customer_name"`
	DeliveryFeeDZD  int         `json:"delivery_fee_dzd"`
	Status          OfferStatus `json:"status"`
	ExpiresAt       time.Time   `json:"expires_at"`
	CreatedAt       time.Time   `json:"created_at"`
}

// AssignmentEngine coordinates delivery offers and match commitments
type AssignmentEngine struct {
	mu     sync.RWMutex
	offers map[string]*DeliveryOffer // orderID -> current active offer
}

func NewAssignmentEngine() *AssignmentEngine {
	return &AssignmentEngine{
		offers: make(map[string]*DeliveryOffer),
	}
}

func (ae *AssignmentEngine) CreateOffer(orderID, courierID, storeName, customerName string, feeDZD int, timeoutSec int) *DeliveryOffer {
	ae.mu.Lock()
	defer ae.mu.Unlock()

	now := time.Now()
	offer := &DeliveryOffer{
		OfferID:        "off-" + orderID,
		OrderID:        orderID,
		CourierID:      courierID,
		StoreName:      storeName,
		CustomerName:   customerName,
		DeliveryFeeDZD: feeDZD,
		Status:         OfferPending,
		CreatedAt:      now,
		ExpiresAt:      now.Add(time.Duration(timeoutSec) * time.Second),
	}

	ae.offers[orderID] = offer
	return offer
}

func (ae *AssignmentEngine) RespondOffer(orderID, courierID string, accept bool) (*DeliveryOffer, bool) {
	ae.mu.Lock()
	defer ae.mu.Unlock()

	offer, exists := ae.offers[orderID]
	if !exists || offer.CourierID != courierID || offer.Status != OfferPending {
		return nil, false
	}

	if time.Now().After(offer.ExpiresAt) {
		offer.Status = OfferExpired
		return offer, false
	}

	if accept {
		offer.Status = OfferAccepted
	} else {
		offer.Status = OfferRejected
	}

	return offer, true
}
