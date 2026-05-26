package models

import (
	"time"

	"github.com/google/uuid"
)

type RefreshToken struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index"`
	Token     string     `gorm:"type:text;not null;uniqueIndex"`
	ExpiresAt time.Time  `gorm:"not null"`
	RevokedAt *time.Time `gorm:"index"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
