package handlers

import (
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/internal/services"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type InscriptionHandler struct {
	db             *gorm.DB
	cfg            *config.Config
	orangeMoneyService *services.OrangeMoneyService
	mail           *services.MailService
}

func NewInscriptionHandler(db *gorm.DB, cfg *config.Config, mail *services.MailService) *InscriptionHandler {
	return &InscriptionHandler{
		db:             db,
		cfg:            cfg,
		orangeMoneyService: services.NewOrangeMoneyService(cfg),
		mail:           mail,
	}
}

type CreateInscriptionRequest struct {
	Nom               string  `json:"nom" binding:"required"`
	Prenom            string  `json:"prenom" binding:"required"`
	Email             string  `json:"email" binding:"required,email"`
	Telephone         string  `json:"telephone" binding:"required"`
	Organisme         string  `json:"organisme"`
	Pays              string  `json:"pays" binding:"required"`
	ParticipationType string  `json:"participation_type" binding:"required"`
	Montant           float64 `json:"montant" binding:"required,gt=0"`
	MethodePaiement   string  `json:"methode_paiement" binding:"required"`
	CodeOTP           string  `json:"code_otp" binding:"required"`
}

// @Summary     Créer une inscription
// @Description Inscrit un utilisateur au congrès avec paiement via Orange Money
// @Tags        inscriptions
// @Accept      json
// @Produce     json
// @Param       request body CreateInscriptionRequest true "Informations d'inscription"
// @Success     201 {object} utils.SuccessResponse{data=models.Inscription}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     402 {object} utils.ErrorResponse
// @Failure     502 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /inscriptions [post]
func (h *InscriptionHandler) CreateInscription(c *gin.Context) {
	var req CreateInscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	// Generate unique invoice number
	numeroFacture := generateInvoiceNumber()

	// Process payment via Orange Money if configured and method is orange_money
	if req.MethodePaiement == "orange_money" {
		paymentReq := services.OrangeMoneyPaymentRequest{
			Amount:        req.Montant,
			CustomerPhone: req.Telephone,
			OrderID:       numeroFacture,
			Description:   fmt.Sprintf("Inscription au congrès - %s %s", req.Prenom, req.Nom),
			OTP:           req.CodeOTP,
		}

		resp, err := h.orangeMoneyService.InitiatePayment(paymentReq)
		if err != nil {
			utils.RespondError(c, http.StatusBadGateway, "Payment initiation failed: "+err.Error())
			return
		}

		if !resp.Success {
			utils.RespondError(c, http.StatusPaymentRequired, "Payment failed: "+resp.Message)
			return
		}
	}

	inscription := models.Inscription{
		UserID:            userID,
		Nom:               req.Nom,
		Prenom:            req.Prenom,
		Email:             req.Email,
		Telephone:         req.Telephone,
		Organisme:         req.Organisme,
		Pays:              req.Pays,
		ParticipationType: req.ParticipationType,
		Montant:           req.Montant,
		MethodePaiement:   req.MethodePaiement,
		NumeroFacture:     numeroFacture,
	}

	if err := h.db.Create(&inscription).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create inscription")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, inscription)
}

// generateInvoiceNumber creates a unique invoice number with timestamp and random suffix.
func generateInvoiceNumber() string {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	now := time.Now()
	return fmt.Sprintf("FACT-%d%02d%02d-%05d",
		now.Year(), now.Month(), now.Day(),
		rng.Intn(99999),
	)
}
