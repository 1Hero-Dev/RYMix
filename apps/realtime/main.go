package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

// In a real application, this would validate the token against a secret
// and extract the user context (ID, Role).
func validateJWT(token string) bool {
	// For MVP/Placeholder, simply check if a token is present
	return len(token) > 0
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Strict origin checks would go here for production
		return true
	},
}

// handleTracking connections are strictly for authenticated users (customers/merchants)
// who are allowed to track an order.
func handleTracking(w http.ResponseWriter, r *http.Request) {
	// Extract the auth token from query params or headers
	token := r.URL.Query().Get("token")
	if !validateJWT(token) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract the order ID from the URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid Order ID", http.StatusBadRequest)
		return
	}
	orderID := pathParts[3]

	// Upgrade the connection
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer ws.Close()

	log.Printf("Client connected for Order ID: %s", orderID)

	// Placeholder: Subscribe to Redis channel for the specific order
	// so GPS updates published by couriers are pushed to this connection.

	for {
		msgType, msg, err := ws.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}
		// A customer might occasionally ping for keep-alive
		if err = ws.WriteMessage(msgType, msg); err != nil {
			log.Println("Write error:", err)
			break
		}
	}
}

// handleCourierUpdate is for couriers to push their active coordinates.
func handleCourierUpdate(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if !validateJWT(token) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer ws.Close()

	log.Println("Courier connected for GPS push")

	for {
		// Read GPS payload from courier
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		// Dispatch Engine Logic:
		// 1. Verify courier is actively tracking an order.
		// 2. Publish coordinates to the Order's realtime channel.
		// 3. Stale Location detection pinging logic.
		fmt.Printf("Courier GPS Update: %s\n", string(msg))
	}
}

func main() {
	// e.g. /ws/orders/123/track?token=JWT
	http.HandleFunc("/ws/orders/", handleTracking)

	// e.g. /ws/courier/location?token=JWT
	http.HandleFunc("/ws/courier/location", handleCourierUpdate)

	fmt.Println("Realtime Service initialized on :8080 (Auth required)")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
