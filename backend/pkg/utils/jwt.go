package utils

import (
	"errors"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	Email  string `json:"email"`
	Type   string `json:"type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

// In-memory refresh token store (maps token string -> userID)
var (
	refreshTokenStore = make(map[string]uuid.UUID)
	refreshTokenMu    sync.RWMutex
)

func GenerateAccessToken(userID uuid.UUID, role, email, jwtSecret string) (string, error) {
	claims := Claims{
		UserID: userID.String(),
		Role:   role,
		Email:  email,
		Type:   "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

func GenerateRefreshToken(userID uuid.UUID, role, email, refreshSecret string) (string, error) {
	claims := Claims{
		UserID: userID.String(),
		Role:   role,
		Email:  email,
		Type:   "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(refreshSecret))
	if err != nil {
		return "", err
	}

	// Store refresh token
	refreshTokenMu.Lock()
	refreshTokenStore[signed] = userID
	refreshTokenMu.Unlock()

	return signed, nil
}

func ValidateToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func ValidateRefreshToken(tokenString, refreshSecret string) (*Claims, error) {
	claims, err := ValidateToken(tokenString, refreshSecret)
	if err != nil {
		return nil, err
	}

	if claims.Type != "refresh" {
		return nil, errors.New("token is not a refresh token")
	}

	// Check if the token is in our store
	refreshTokenMu.RLock()
	_, exists := refreshTokenStore[tokenString]
	refreshTokenMu.RUnlock()

	if !exists {
		return nil, errors.New("refresh token not found or already revoked")
	}

	return claims, nil
}

func RevokeRefreshToken(tokenString string) {
	refreshTokenMu.Lock()
	delete(refreshTokenStore, tokenString)
	refreshTokenMu.Unlock()
}

func RotateRefreshToken(oldToken string, userID uuid.UUID, role, email, refreshSecret string) (string, error) {
	// Revoke old token
	RevokeRefreshToken(oldToken)
	// Issue new one
	return GenerateRefreshToken(userID, role, email, refreshSecret)
}
