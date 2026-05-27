package models

import (
	"time"

	"github.com/google/uuid"
)

type Inscription struct {
	ID                uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID            uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	User              User      `json:"-" gorm:"foreignKey:UserID"`
	CongressID        uuid.UUID `json:"congress_id" gorm:"type:uuid;not null;index"`
	Congress          Congress  `json:"-" gorm:"foreignKey:CongressID"`
	Nom               string    `json:"nom" gorm:"not null"`
	Prenom            string    `json:"prenom" gorm:"not null"`
	Email             string    `json:"email" gorm:"not null"`
	Telephone         string    `json:"telephone" gorm:"not null"`
	Organisme         string    `json:"organisme" gorm:"not null"`
	Pays              string    `json:"pays" gorm:"not null"`
	ParticipationType string    `json:"participation_type" gorm:"not null"`
	Montant           float64   `json:"montant" gorm:"not null"`
	MethodePaiement   string    `json:"methode_paiement" gorm:"not null"`

	NumeroFacture     string    `json:"numero_facture" gorm:"uniqueIndex;not null"`
	TransactionID     string    `json:"transaction_id" gorm:""`
	PaymentStatus     string    `json:"payment_status" gorm:"default:pending"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
