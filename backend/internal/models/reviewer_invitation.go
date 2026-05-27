package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReviewerInvitation struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CongressID     uuid.UUID  `json:"congress_id" gorm:"type:uuid;not null;index"`
	Email          string     `json:"email" gorm:"not null"`
	Nom            string     `json:"nom"`
	Prenom         string     `json:"prenom"`
	Organisme      string     `json:"organisme"`
	Token          string     `json:"token" gorm:"uniqueIndex;not null"`
	Status         string     `json:"status" gorm:"default:'pending'"` // pending, accepted, declined, expired
	ReviewerID     *uuid.UUID `json:"reviewer_id" gorm:"type:uuid"`
	InvitedAt      time.Time  `json:"invited_at"`
	RespondedAt    *time.Time `json:"responded_at"`
	ExpiresAt      time.Time  `json:"expires_at"`
	LastReminderAt *time.Time `json:"last_reminder_at"`
	ReminderCount  int        `json:"reminder_count" gorm:"default:0"`
	Message        string     `json:"message"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (invitation *ReviewerInvitation) BeforeCreate(tx *gorm.DB) error {
	if invitation.ID == uuid.Nil {
		invitation.ID = uuid.New()
	}
	return nil
}
