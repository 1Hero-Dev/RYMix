package websocket

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestUpgradeAndBroadcast(t *testing.T) {
	hub := NewGatewayHub()
	done := make(chan string, 1)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := Upgrade(w, r, func(origin string) bool { return true })
		if err != nil {
			t.Errorf("upgrade: %v", err)
			return
		}
		defer conn.Close()
		ch := hub.Subscribe("c1")
		defer hub.Unsubscribe("c1")
		go conn.ReadLoop()
		select {
		case msg := <-ch:
			if err := conn.WriteText(msg); err != nil {
				t.Errorf("write: %v", err)
			}
		case <-time.After(3 * time.Second):
			t.Error("no message")
		}
		time.Sleep(200 * time.Millisecond)
	}))
	defer srv.Close()

	go func() {
		time.Sleep(300 * time.Millisecond)
		hub.Broadcast("courier.location.updated", map[string]any{"lat": 36.45, "lng": 6.26})
	}()

	got := dialAndRead(t, srv.URL)
	done <- got
	if got == "" {
		t.Fatal("client received nothing")
	}
	t.Logf("client received: %s", got)
	if !contains(got, "courier.location.updated") {
		t.Fatalf("unexpected payload: %s", got)
	}
}

func contains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
