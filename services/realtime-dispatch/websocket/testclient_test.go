package websocket

import (
	"bufio"
	"crypto/rand"
	"encoding/base64"
	"encoding/binary"
	"io"
	"net"
	"net/url"
	"strings"
	"testing"
	"time"
)

// dialAndRead performs a client handshake and reads one text frame.
func dialAndRead(t *testing.T, serverURL string) string {
	t.Helper()
	u, _ := url.Parse(serverURL)
	conn, err := net.Dial("tcp", u.Host)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer conn.Close()
	_ = conn.SetDeadline(time.Now().Add(5 * time.Second))

	var keyBytes [16]byte
	rand.Read(keyBytes[:])
	key := base64.StdEncoding.EncodeToString(keyBytes[:])

	req := strings.Join([]string{
		"GET / HTTP/1.1",
		"Host: " + u.Host,
		"Upgrade: websocket",
		"Connection: Upgrade",
		"Sec-WebSocket-Key: " + key,
		"Sec-WebSocket-Version: 13",
		"", "",
	}, "\r\n")
	if _, err := conn.Write([]byte(req)); err != nil {
		t.Fatalf("write handshake: %v", err)
	}

	br := bufio.NewReader(conn)
	statusLine, err := br.ReadString('\n')
	if err != nil {
		t.Fatalf("read status: %v", err)
	}
	if !strings.Contains(statusLine, "101") {
		t.Fatalf("expected 101, got %q", statusLine)
	}
	for {
		line, err := br.ReadString('\n')
		if err != nil {
			t.Fatalf("read headers: %v", err)
		}
		if strings.TrimSpace(line) == "" {
			break
		}
	}

	var head [2]byte
	if _, err := io.ReadFull(br, head[:]); err != nil {
		t.Fatalf("read frame head: %v", err)
	}
	if head[0]&0x0F != 0x1 {
		t.Fatalf("expected text opcode, got %x", head[0]&0x0F)
	}
	if head[1]&0x80 != 0 {
		t.Fatal("server frames must not be masked")
	}
	length := uint64(head[1] & 0x7F)
	if length == 126 {
		var ext [2]byte
		io.ReadFull(br, ext[:])
		length = uint64(binary.BigEndian.Uint16(ext[:]))
	}
	payload := make([]byte, length)
	io.ReadFull(br, payload)
	return string(payload)
}
