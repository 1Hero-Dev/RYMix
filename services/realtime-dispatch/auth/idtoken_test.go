package auth

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const testProject = "lofty-axle-3dtd0"

func sign(t *testing.T, key *rsa.PrivateKey, kid string, claims map[string]any, alg string) string {
	t.Helper()
	header := map[string]string{"alg": alg, "kid": kid, "typ": "JWT"}
	hb, _ := json.Marshal(header)
	cb, _ := json.Marshal(claims)
	signingInput := base64.RawURLEncoding.EncodeToString(hb) + "." + base64.RawURLEncoding.EncodeToString(cb)

	if alg == "none" {
		return signingInput + "."
	}
	sum := sha256.Sum256([]byte(signingInput))
	sig, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, sum[:])
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	return signingInput + "." + base64.RawURLEncoding.EncodeToString(sig)
}

// newVerifierWithKey returns a verifier whose key cache is preloaded, so tests
// never reach the network.
func newVerifierWithKey(key *rsa.PrivateKey, kid string) *Verifier {
	v := NewVerifier(testProject)
	v.keys[kid] = &key.PublicKey
	v.keysFetch = time.Now()
	return v
}

func validClaims() map[string]any {
	now := time.Now()
	return map[string]any{
		"sub":   "courier-walid-43",
		"aud":   testProject,
		"iss":   "https://securetoken.google.com/" + testProject,
		"iat":   now.Add(-time.Minute).Unix(),
		"exp":   now.Add(time.Hour).Unix(),
		"email": "walid@example.com",
		"role":  "courier",
	}
}

func TestVerifyAcceptsValidToken(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	v := newVerifierWithKey(key, "kid1")

	claims, err := v.Verify(sign(t, key, "kid1", validClaims(), "RS256"))
	if err != nil {
		t.Fatalf("expected valid token, got error: %v", err)
	}
	if claims.UID != "courier-walid-43" {
		t.Errorf("uid = %q, want courier-walid-43", claims.UID)
	}
	if claims.Role != "COURIER" {
		t.Errorf("role = %q, want COURIER", claims.Role)
	}
}

func TestVerifyPromotesAdminClaim(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	v := newVerifierWithKey(key, "kid1")

	c := validClaims()
	c["admin"] = true
	claims, err := v.Verify(sign(t, key, "kid1", c, "RS256"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if claims.Role != "ADMIN" {
		t.Errorf("role = %q, want ADMIN", claims.Role)
	}
}

// The classic JWT bypass: strip the signature and set alg to none.
func TestVerifyRejectsAlgNone(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	v := newVerifierWithKey(key, "kid1")

	if _, err := v.Verify(sign(t, key, "kid1", validClaims(), "none")); err == nil {
		t.Fatal("alg=none token was accepted")
	}
}

func TestVerifyRejectsForeignSigningKey(t *testing.T) {
	realKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	attackerKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	v := newVerifierWithKey(realKey, "kid1")

	if _, err := v.Verify(sign(t, attackerKey, "kid1", validClaims(), "RS256")); err == nil {
		t.Fatal("token signed with an unknown key was accepted")
	}
}

func TestVerifyRejectsWrongAudienceAndIssuer(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	v := newVerifierWithKey(key, "kid1")

	wrongAud := validClaims()
	wrongAud["aud"] = "some-other-project"
	if _, err := v.Verify(sign(t, key, "kid1", wrongAud, "RS256")); err == nil {
		t.Error("token for another project was accepted")
	}

	wrongIss := validClaims()
	wrongIss["iss"] = "https://evil.example.com/" + testProject
	if _, err := v.Verify(sign(t, key, "kid1", wrongIss, "RS256")); err == nil {
		t.Error("token with a foreign issuer was accepted")
	}
}

func TestVerifyRejectsExpiredToken(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	v := newVerifierWithKey(key, "kid1")

	expired := validClaims()
	expired["exp"] = time.Now().Add(-time.Minute).Unix()
	if _, err := v.Verify(sign(t, key, "kid1", expired, "RS256")); err == nil {
		t.Fatal("expired token was accepted")
	}
}

func TestVerifyRejectsMalformedToken(t *testing.T) {
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	v := newVerifierWithKey(key, "kid1")

	for _, tok := range []string{"", "abc", "a.b", "a.b.c.d", strings.Repeat("x", 50)} {
		if _, err := v.Verify(tok); err == nil {
			t.Errorf("malformed token %q was accepted", tok)
		}
	}
}

func TestBearerToken(t *testing.T) {
	cases := []struct {
		header string
		want   string
		ok     bool
	}{
		{"Bearer abc123", "abc123", true},
		{"bearer abc123", "abc123", true}, // case-insensitive scheme
		{"Bearer ", "", false},
		{"Basic abc123", "", false},
		{"", "", false},
	}
	for _, c := range cases {
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		if c.header != "" {
			r.Header.Set("Authorization", c.header)
		}
		got, ok := BearerToken(r)
		if ok != c.ok || got != c.want {
			t.Errorf("BearerToken(%q) = (%q, %v), want (%q, %v)", c.header, got, ok, c.want, c.ok)
		}
	}
}
