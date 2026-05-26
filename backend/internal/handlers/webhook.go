package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/models"
	"congres-app/backend/internal/services"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WebhookHandler struct {
	db   *gorm.DB
	cfg  *config.Config
	mail *services.MailService
}

func NewWebhookHandler(db *gorm.DB, cfg *config.Config, mail *services.MailService) *WebhookHandler {
	return &WebhookHandler{db: db, cfg: cfg, mail: mail}
}

type orangeMoneyWebhookPayload struct {
	OrderID       string `json:"order_id"`
	TransactionID string `json:"transaction_id"`
	Status        string `json:"status"`
	Amount        string `json:"amount"`
	Phone         string `json:"phone"`
	Signature     string `json:"signature"`
}

// @Summary     Webhook Orange Money
// @Description Reçoit les notifications de paiement Orange Money pour les inscriptions
// @Tags        webhooks
// @Accept      json
// @Produce     json
// @Param       request body orangeMoneyWebhookPayload true "Payload du webhook Orange Money"
// @Success     200 {object} utils.SuccessResponse{data=object{status=string}}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Router      /webhooks/orange-money [post]
func (h *WebhookHandler) HandleOrangeMoneyNotification(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Failed to read request body")
		return
	}

	var payload orangeMoneyWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if payload.OrderID == "" || payload.Status == "" {
		utils.RespondError(c, http.StatusBadRequest, "Missing required fields: order_id, status")
		return
	}

	// Signature validation — compute HMAC over body without the signature field
	payload.Signature = ""
	cleanBody, _ := json.Marshal(payload)
	headerSig := c.GetHeader("X-Signature")
	if headerSig == "" {
		utils.RespondError(c, http.StatusUnauthorized, "Missing X-Signature header")
		return
	}
	sig := computeHMACSHA256(string(cleanBody), h.cfg.OrangeMoneyWebhookSecret)
	if !hmac.Equal([]byte(sig), []byte(headerSig)) {
		log.Printf("[Webhook] Invalid signature for OrderID=%s", payload.OrderID)
		utils.RespondError(c, http.StatusUnauthorized, "Invalid signature")
		return
	}

	log.Printf("[Webhook] Payment notification for OrderID=%s: status=%s, txnID=%s",
		payload.OrderID, payload.Status, payload.TransactionID)

	var inscription models.Inscription
	if err := h.db.Where("numero_facture = ?", payload.OrderID).First(&inscription).Error; err != nil {
		log.Printf("[Webhook] Inscription not found for OrderID=%s", payload.OrderID)
		utils.RespondError(c, http.StatusNotFound, "Inscription not found")
		return
	}

	updates := map[string]interface{}{
		"transaction_id": payload.TransactionID,
		"payment_status": "confirmed",
	}
	if payload.Status != "success" && payload.Status != "SUCCESS" {
		updates["payment_status"] = "failed"
	}

	if err := h.db.Model(&inscription).Updates(updates).Error; err != nil {
		log.Printf("[Webhook] Failed to update inscription %d: %v", inscription.ID, err)
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update inscription")
		return
	}

	if updates["payment_status"] == "confirmed" {
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[PANIC] Webhook mail: %v", r)
				}
			}()
			var user models.User
			if err := h.db.First(&user, "id = ?", inscription.UserID).Error; err == nil && user.Email != "" {
				h.mail.InscriptionConfirmee(
					user.Email, user.Prenom, user.Nom,
					inscription.ParticipationType,
					inscription.NumeroFacture,
					fmt.Sprintf("%.0f", inscription.Montant),
				)
			}
		}()
	}

	log.Printf("[Webhook] Inscription %d updated: OrderID=%s → %s", inscription.ID, payload.OrderID, updates["payment_status"])
	utils.RespondSuccess(c, http.StatusOK, gin.H{"status": "ok"})
}

func computeHMACSHA256(data, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(data))
	return hex.EncodeToString(mac.Sum(nil))
}
