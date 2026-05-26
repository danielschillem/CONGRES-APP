package models

import "time"

type Inscription struct {
	ID                uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Nom               string    `json:"nom" gorm:"not null"`
	Prenom            string    `json:"prenom" gorm:"not null"`
	Email             string    `json:"email" gorm:"not null"`
	Telephone         string    `json:"telephone" gorm:"not null"`
	Organisme         string    `json:"organisme" gorm:"not null"`
	Pays              string    `json:"pays" gorm:"not null"`
	ParticipationType string    `json:"participation_type" gorm:"not null"`
	Montant           float64   `json:"montant" gorm:"not null"`
	MethodePaiement   string    `json:"methode_paiement" gorm:"not null"`
	CodeOTP           string    `json:"code_otp"`
	NumeroFacture     string    `json:"numero_facture" gorm:"uniqueIndex;not null"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
