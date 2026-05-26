package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Soumission struct {
	ID             uuid.UUID      `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	SubmissionType string         `json:"submission_type" gorm:"not null"` // Abstract, Poster, Communication
	Theme          string         `json:"theme" gorm:"not null"`
	Topics         string         `json:"topics" gorm:"not null"`
	DocumentTitle  string         `json:"document_title" gorm:"not null"`
	AuthorName     string         `json:"author_name" gorm:"not null"`
	Resume         string         `json:"resume" gorm:"not null"`
	Keywords       pq.StringArray `json:"keywords" gorm:"type:text[]"`
	FilePath       string         `json:"file_path" gorm:"not null"`
	UserID         uuid.UUID      `json:"user_id" gorm:"type:uuid;not null"`
	User           User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Statut         string         `json:"statut" gorm:"default:'En attente';not null"` // En attente, Approuvée, Rejetée
	RaisonRejet    *string        `json:"raison_rejet"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}
