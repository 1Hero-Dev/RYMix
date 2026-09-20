package websocket

// Minimal RFC 6455 server implementation built on the standard library only,
// so the service keeps a dependency-free go.mod.
//
// It supports what this gateway actually needs: the opening handshake, writing
// text frames, replying to pings, and detecting client close. Fragmented and
// binary inbound frames are drained rather than interpreted, since clients here
// only subscribe and listen.

import (
	"bufio"
	"crypto/sha1"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// wsGUID is the fixed value defined by RFC 6455 for the accept-key handshake.
const wsGUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

const (
	opContinuation = 0x0
	opText         = 0x1
	opBinary       = 0x2
	opClose        = 0x8
	opPing         = 0x9
	opPong         = 0xA
)

// Conn is a single upgraded WebSocket connection. Safe for concurrent writes.
type Conn struct {
	conn net.Conn
	rw   *bufio.ReadWriter

	writeMu sync.Mutex
	closed  bool
	closeMu sync.RWMutex
}

// IsWebSocketUpgrade reports whether r is a WebSocket handshake request.
func IsWebSocketUpgrade(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("Upgrade"), "websocket") &&
		strings.Contains(strings.ToLower(r.Header.Get("Connection")), "upgrade")
}

// Upgrade performs the opening handshake and takes over the TCP connection.
//
// checkOrigin must return true for origins allowed to connect. Browsers do not
// apply the same-origin policy to WebSockets, so skipping this check would
// expose the stream to any website the user visits while signed in.
func Upgrade(w http.ResponseWriter, r *http.Request, checkOrigin func(origin string) bool) (*Conn, error) {
	if !IsWebSocketUpgrade(r) {
		return nil, errors.New("not a websocket upgrade request")
	}
	if r.Header.Get("Sec-WebSocket-Version") != "13" {
		w.Header().Set("Sec-WebSocket-Version", "13")
		http.Error(w, "Unsupported WebSocket version", http.StatusUpgradeRequired)
		return nil, errors.New("unsupported websocket version")
	}
	if checkOrigin != nil && !checkOrigin(r.Header.Get("Origin")) {
		http.Error(w, "Forbidden: origin not allowed", http.StatusForbidden)
		return nil, errors.New("origin not allowed")
	}

	key := r.Header.Get("Sec-WebSocket-Key")
	if key == "" {
		http.Error(w, "Bad Request: missing Sec-WebSocket-Key", http.StatusBadRequest)
		return nil, errors.New("missing websocket key")
	}

	hijacker, ok := w.(http.Hijacker)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return nil, errors.New("response writer does not support hijacking")
	}

	netConn, rw, err := hijacker.Hijack()
	if err != nil {
		return nil, fmt.Errorf("hijack: %w", err)
	}

	sum := sha1.Sum([]byte(key + wsGUID))
	accept := base64.StdEncoding.EncodeToString(sum[:])

	handshake := "HTTP/1.1 101 Switching Protocols\r\n" +
		"Upgrade: websocket\r\n" +
		"Connection: Upgrade\r\n" +
		"Sec-WebSocket-Accept: " + accept + "\r\n\r\n"

	if _, err := rw.WriteString(handshake); err != nil {
		netConn.Close()
		return nil, fmt.Errorf("write handshake: %w", err)
	}
	if err := rw.Flush(); err != nil {
		netConn.Close()
		return nil, fmt.Errorf("flush handshake: %w", err)
	}

	return &Conn{conn: netConn, rw: rw}, nil
}

// WriteText sends a single unfragmented text frame.
func (c *Conn) WriteText(payload []byte) error {
	return c.writeFrame(opText, payload)
}

// WritePing sends a ping frame to keep intermediaries from idling the socket out.
func (c *Conn) WritePing() error {
	return c.writeFrame(opPing, nil)
}

func (c *Conn) writeFrame(opcode byte, payload []byte) error {
	c.closeMu.RLock()
	if c.closed {
		c.closeMu.RUnlock()
		return net.ErrClosed
	}
	c.closeMu.RUnlock()

	c.writeMu.Lock()
	defer c.writeMu.Unlock()

	header := make([]byte, 0, 10)
	header = append(header, 0x80|opcode) // FIN set, single frame

	n := len(payload)
	switch {
	case n < 126:
		header = append(header, byte(n))
	case n <= 0xFFFF:
		header = append(header, 126)
		var ext [2]byte
		binary.BigEndian.PutUint16(ext[:], uint16(n))
		header = append(header, ext[:]...)
	default:
		header = append(header, 127)
		var ext [8]byte
		binary.BigEndian.PutUint64(ext[:], uint64(n))
		header = append(header, ext[:]...)
	}

	_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	if _, err := c.rw.Write(header); err != nil {
		return err
	}
	if len(payload) > 0 {
		if _, err := c.rw.Write(payload); err != nil {
			return err
		}
	}
	return c.rw.Flush()
}

// ReadLoop consumes inbound frames until the peer closes or errors.
//
// Clients here only listen, so inbound data frames are discarded; the loop
// exists to answer pings and to notice disconnects promptly.
func (c *Conn) ReadLoop() error {
	for {
		opcode, payload, err := c.readFrame()
		if err != nil {
			return err
		}
		switch opcode {
		case opClose:
			return nil
		case opPing:
			if err := c.writeFrame(opPong, payload); err != nil {
				return err
			}
		case opText, opBinary, opContinuation, opPong:
			// Ignored: this endpoint is broadcast-only.
		}
	}
}

func (c *Conn) readFrame() (byte, []byte, error) {
	var head [2]byte
	if _, err := io.ReadFull(c.rw, head[:]); err != nil {
		return 0, nil, err
	}

	opcode := head[0] & 0x0F
	masked := head[1]&0x80 != 0
	length := uint64(head[1] & 0x7F)

	switch length {
	case 126:
		var ext [2]byte
		if _, err := io.ReadFull(c.rw, ext[:]); err != nil {
			return 0, nil, err
		}
		length = uint64(binary.BigEndian.Uint16(ext[:]))
	case 127:
		var ext [8]byte
		if _, err := io.ReadFull(c.rw, ext[:]); err != nil {
			return 0, nil, err
		}
		length = binary.BigEndian.Uint64(ext[:])
	}

	// Cap inbound frames; clients should never send anything large here.
	const maxFrame = 1 << 20
	if length > maxFrame {
		return 0, nil, errors.New("inbound frame too large")
	}

	var maskKey [4]byte
	if masked {
		if _, err := io.ReadFull(c.rw, maskKey[:]); err != nil {
			return 0, nil, err
		}
	}

	payload := make([]byte, length)
	if length > 0 {
		if _, err := io.ReadFull(c.rw, payload); err != nil {
			return 0, nil, err
		}
	}
	if masked {
		for i := range payload {
			payload[i] ^= maskKey[i%4]
		}
	}
	return opcode, payload, nil
}

// Close sends a close frame (best effort) and releases the connection.
func (c *Conn) Close() error {
	c.closeMu.Lock()
	if c.closed {
		c.closeMu.Unlock()
		return nil
	}
	c.closed = true
	c.closeMu.Unlock()

	c.writeMu.Lock()
	_ = c.conn.SetWriteDeadline(time.Now().Add(time.Second))
	_, _ = c.rw.Write([]byte{0x88, 0x00})
	_ = c.rw.Flush()
	c.writeMu.Unlock()

	return c.conn.Close()
}
