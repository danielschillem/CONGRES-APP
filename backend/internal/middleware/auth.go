package middleware

import (
	"net/http"
	"strings"

	"congres-app/backend/internal/config"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

const (
	ContextUserID     = "user_id"
	ContextRole       = "role"
	ContextEmail      = "email"
	ContextCongressID = "congress_id"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.RespondError(c, http.StatusUnauthorized, "Authorization header is required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			utils.RespondError(c, http.StatusUnauthorized, "Authorization header format must be: Bearer <token>")
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ValidateToken(tokenString, config.AppConfig.JWTSecret)
		if err != nil {
			utils.RespondError(c, http.StatusUnauthorized, "Invalid or expired token")
			c.Abort()
			return
		}

		if claims.Type != "access" {
			utils.RespondError(c, http.StatusUnauthorized, "Token is not an access token")
			c.Abort()
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextRole, claims.Role)
		c.Set(ContextEmail, claims.Email)
		c.Set(ContextCongressID, claims.CongressID)

		c.Next()
	}
}

// AdminRequired checks for super_admin or congress_admin role.
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get(ContextRole)
		if !exists {
			utils.RespondError(c, http.StatusUnauthorized, "Unauthorized")
			c.Abort()
			return
		}

		roleStr := role.(string)
		if roleStr != "super_admin" && roleStr != "congress_admin" {
			utils.RespondError(c, http.StatusForbidden, "Admin access required")
			c.Abort()
			return
		}

		c.Next()
	}
}

// SuperAdminRequired checks for super_admin role only.
func SuperAdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get(ContextRole)
		if !exists {
			utils.RespondError(c, http.StatusUnauthorized, "Unauthorized")
			c.Abort()
			return
		}

		if role.(string) != "super_admin" {
			utils.RespondError(c, http.StatusForbidden, "Super admin access required")
			c.Abort()
			return
		}

		c.Next()
	}
}

// ReviewerRequired checks for reviewer role or higher (reviewer, congress_admin, super_admin).
func ReviewerRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get(ContextRole)
		if !exists {
			utils.RespondError(c, http.StatusUnauthorized, "Unauthorized")
			c.Abort()
			return
		}

		roleStr := role.(string)
		allowed := map[string]bool{"reviewer": true, "congress_admin": true, "super_admin": true}
		if !allowed[roleStr] {
			utils.RespondError(c, http.StatusForbidden, "Reviewer access required")
			c.Abort()
			return
		}

		c.Next()
	}
}
