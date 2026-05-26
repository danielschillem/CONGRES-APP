package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID     string `json:"user_id"`
	Role       string `json:"role"`
	Email      string `json:"email"`
	CongressID string `json:"congress_id,omitempty"`
	Type       string `json:"type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

func GenerateAccessToken(userID uuid.UUID, role, email, congressID, jwtSecret string) (string, error) {
	claims := Claims{
		UserID:     userID.String(),
		Role:       role,
		Email:      email,
		CongressID: congressID,
		Type:       "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

func GenerateRefreshToken(userID uuid.UUID, role, email, congressID, refreshSecret string) (string, error) {
	claims := Claims{
		UserID:     userID.String(),
		Role:       role,
		Email:      email,
		CongressID: congressID,
		Type:       "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(refreshSecret))
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
