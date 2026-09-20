// Package auth verifies Firebase ID tokens using only the Go standard library.
//
// The realtime service must not trust a courier_id supplied in a request body:
// that would let anyone post GPS for any courier, or read another courier's
// position. Identity is therefore taken from a cryptographically verified
// Firebase ID token and nothing else.
//
// Deliberately dependency-free (no firebase-admin SDK) so the service keeps its
// zero-dependency go.mod.
package auth

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

// googleCertsURL serves the public x509 certificates matching the private keys
// Google uses to sign Firebase ID tokens.
const googleCertsURL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

// Claims is the subset of the token payload this service needs.
type Claims struct {
	UID      string // Firebase user id (the "sub" claim)
	Email    string
	Role     string // custom claim, may be empty
	Audience string
	Expires  time.Time
}

// Verifier validates Firebase ID tokens for one Firebase project.
type Verifier struct {
	projectID string
	client    *http.Client

	mu        sync.RWMutex
	keys      map[string]*rsa.PublicKey
	keysFetch time.Time
}

// NewVerifier builds a verifier for the given Firebase project ID.
func NewVerifier(projectID string) *Verifier {
	return &Verifier{
		projectID: projectID,
		client:    &http.Client{Timeout: 10 * time.Second},
		keys:      make(map[string]*rsa.PublicKey),
	}
}

// publicKey returns the signing key for kid, refreshing the cache when needed.
func (v *Verifier) publicKey(kid string) (*rsa.PublicKey, error) {
	v.mu.RLock()
	key, ok := v.keys[kid]
	fresh := time.Since(v.keysFetch) < time.Hour
	v.mu.RUnlock()
	if ok && fresh {
		return key, nil
	}

	if err := v.refreshKeys(); err != nil {
		// Fall back to a cached key rather than rejecting every request if
		// Google is briefly unreachable.
		if ok {
			return key, nil
		}
		return nil, err
	}

	v.mu.RLock()
	defer v.mu.RUnlock()
	if key, ok := v.keys[kid]; ok {
		return key, nil
	}
	return nil, fmt.Errorf("no signing key matches kid %q", kid)
}

func (v *Verifier) refreshKeys() error {
	resp, err := v.client.Get(googleCertsURL)
	if err != nil {
		return fmt.Errorf("fetch google certs: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("fetch google certs: status %d", resp.StatusCode)
	}

	var certsPEM map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&certsPEM); err != nil {
		return fmt.Errorf("decode google certs: %w", err)
	}

	keys := make(map[string]*rsa.PublicKey, len(certsPEM))
	for kid, certPEM := range certsPEM {
		block, _ := pem.Decode([]byte(certPEM))
		if block == nil {
			continue
		}
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			continue
		}
		if pub, ok := cert.PublicKey.(*rsa.PublicKey); ok {
			keys[kid] = pub
		}
	}
	if len(keys) == 0 {
		return errors.New("no usable signing keys returned by google")
	}

	v.mu.Lock()
	v.keys = keys
	v.keysFetch = time.Now()
	v.mu.Unlock()
	return nil
}

// Verify checks the signature and the standard Firebase claims, returning the
// verified identity. Any error means the caller must be treated as anonymous.
func (v *Verifier) Verify(idToken string) (*Claims, error) {
	parts := strings.Split(idToken, ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed token: expected three segments")
	}

	var header struct {
		Alg string `json:"alg"`
		Kid string `json:"kid"`
	}
	headerJSON, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, fmt.Errorf("decode header: %w", err)
	}
	if err := json.Unmarshal(headerJSON, &header); err != nil {
		return nil, fmt.Errorf("parse header: %w", err)
	}
	// Reject "alg": "none" and any non-RS256 algorithm.
	if header.Alg != "RS256" {
		return nil, fmt.Errorf("unexpected signing algorithm %q", header.Alg)
	}
	if header.Kid == "" {
		return nil, errors.New("token has no key id")
	}

	payloadJSON, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("decode payload: %w", err)
	}
	var payload struct {
		Sub   string `json:"sub"`
		Aud   string `json:"aud"`
		Iss   string `json:"iss"`
		Exp   int64  `json:"exp"`
		Iat   int64  `json:"iat"`
		Email string `json:"email"`
		Role  string `json:"role"`
		Admin bool   `json:"admin"`
	}
	if err := json.Unmarshal(payloadJSON, &payload); err != nil {
		return nil, fmt.Errorf("parse payload: %w", err)
	}

	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, fmt.Errorf("decode signature: %w", err)
	}

	key, err := v.publicKey(header.Kid)
	if err != nil {
		return nil, err
	}

	signed := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	if err := rsa.VerifyPKCS1v15(key, crypto.SHA256, signed[:], signature); err != nil {
		return nil, errors.New("signature verification failed")
	}

	// Claim checks. Skipping these would accept a validly signed token issued
	// for a different Firebase project.
	now := time.Now()
	if payload.Sub == "" {
		return nil, errors.New("token has no subject")
	}
	if payload.Aud != v.projectID {
		return nil, fmt.Errorf("token audience %q does not match project", payload.Aud)
	}
	if payload.Iss != "https://securetoken.google.com/"+v.projectID {
		return nil, fmt.Errorf("unexpected token issuer %q", payload.Iss)
	}
	if payload.Exp == 0 || now.After(time.Unix(payload.Exp, 0)) {
		return nil, errors.New("token has expired")
	}
	// Allow a minute of clock skew on issued-at.
	if payload.Iat != 0 && now.Add(time.Minute).Before(time.Unix(payload.Iat, 0)) {
		return nil, errors.New("token issued in the future")
	}

	role := payload.Role
	if payload.Admin {
		role = "ADMIN"
	}

	return &Claims{
		UID:      payload.Sub,
		Email:    payload.Email,
		Role:     strings.ToUpper(role),
		Audience: payload.Aud,
		Expires:  time.Unix(payload.Exp, 0),
	}, nil
}

// BearerToken extracts the token from an Authorization header.
func BearerToken(r *http.Request) (string, bool) {
	header := r.Header.Get("Authorization")
	const prefix = "Bearer "
	if len(header) <= len(prefix) || !strings.EqualFold(header[:len(prefix)], prefix) {
		return "", false
	}
	token := strings.TrimSpace(header[len(prefix):])
	return token, token != ""
}
