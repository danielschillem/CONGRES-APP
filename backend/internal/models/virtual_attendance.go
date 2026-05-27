package models

import (
	"time"

	"github.com/google/uuid"
)

type VirtualAttendance struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	SessionID uuid.UUID  `json:"session_id" gorm:"type:uuid;not null;index"`
	Session   VirtualSession `json:"-" gorm:"foreignKey:SessionID"`
	UserID    uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	User      User       `json:"-" gorm:"foreignKey:UserID"`
	JoinTime  time.Time  `json:"join_time" gorm:"not null"`
	LeaveTime *time.Time `json:"leave_time"`
	Duration  int        `json:"duration" gorm:"default:0"`
	CreatedAt time.Time  `json:"created_at"`
}
