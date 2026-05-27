package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type BroadcastMessage struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CongressID   uuid.UUID      `json:"congress_id" gorm:"type:uuid;not null;index"`
	Subject      string         `json:"subject" gorm:"not null"`
	Body         string         `json:"body" gorm:"type:text;not null"`
	TargetType   string         `json:"target_type" gorm:"not null"`
	TargetFilter datatypes.JSON `json:"target_filter" gorm:"type:jsonb"`
	SentAt       *time.Time     `json:"sent_at"`
	SentCount    int            `json:"sent_count" gorm:"default:0"`
	CreatedBy    uuid.UUID      `json:"created_by" gorm:"type:uuid;not null"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

func (message *BroadcastMessage) BeforeCreate(tx *gorm.DB) error {
	if message.ID == uuid.Nil {
		message.ID = uuid.New()
	}
	return nil
}

type BroadcastRecipient struct {
	ID                 uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	BroadcastMessageID uuid.UUID  `json:"broadcast_message_id" gorm:"type:uuid;not null;index"`
	UserID             uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	Email              string     `json:"email"`
	SentViaEmail       bool       `json:"sent_via_email" gorm:"default:false"`
	SentViaNotif       bool       `json:"sent_via_notif" gorm:"default:false"`
	SentAt             *time.Time `json:"sent_at"`
	ReadAt             *time.Time `json:"read_at"`
	CreatedAt          time.Time  `json:"created_at"`
}

func (recipient *BroadcastRecipient) BeforeCreate(tx *gorm.DB) error {
	if recipient.ID == uuid.Nil {
		recipient.ID = uuid.New()
	}
	return nil
}
