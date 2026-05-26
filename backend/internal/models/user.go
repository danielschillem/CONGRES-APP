package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Civilite   string    `json:"civilite" gorm:"not null"`
	Nom        string    `json:"nom" gorm:"not null"`
	Prenom     string    `json:"prenom" gorm:"not null"`
	Sexe       string    `json:"sexe" gorm:"not null"`
	Telephone  string    `json:"telephone" gorm:"uniqueIndex;not null"`
	Adresse    *string   `json:"adresse"`
	Profession *string   `json:"profession"`
	Organisme  *string   `json:"organisme"`
	Biographie *string   `json:"biographie"`
	Email      string    `json:"email" gorm:"uniqueIndex;not null"`
	Password   string    `json:"-" gorm:"not null"`
	Role       string    `json:"role" gorm:"default:'user';not null"`

	Soumissions   []Soumission   `json:"soumissions,omitempty" gorm:"foreignKey:UserID"`
	Notifications []Notification `json:"notifications,omitempty" gorm:"foreignKey:NotifiableID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
