package handlers

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
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
	CongressID        string  `json:"congress_id" binding:"required"`
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

	congressID, err := uuid.Parse(req.CongressID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid congress ID")
		return
	}

	var congress models.Congress
	if err := h.db.Where("id = ? AND status = ?", congressID, "active").First(&congress).Error; err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Congress not found or not active")
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
		CongressID:        congressID,
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
		PaymentStatus:     "pending",
	}

	if err := h.db.Create(&inscription).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create inscription")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, inscription)
}

// ListMyInscriptions returns all inscriptions of the currently authenticated user.
func (h *InscriptionHandler) ListMyInscriptions(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	congressIDStr := c.Query("congress_id")
	var inscriptions []models.Inscription
	query := h.db.Where("user_id = ?", userID).Preload("Congress").Order("created_at desc")
	if congressIDStr != "" {
		query = query.Where("congress_id = ?", congressIDStr)
	}
	if err := query.Find(&inscriptions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to retrieve inscriptions")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, inscriptions)
}

// GetMyInscription returns the latest inscription of the currently authenticated user.
func (h *InscriptionHandler) GetMyInscription(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	var inscription models.Inscription
	query := h.db.Where("user_id = ?", userID).Preload("Congress").Order("created_at desc")
	if congressID := c.Query("congress_id"); congressID != "" {
		query = query.Where("congress_id = ?", congressID)
	}
	if err := query.First(&inscription).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.RespondSuccess(c, http.StatusOK, nil)
			return
		}
		utils.RespondError(c, http.StatusInternalServerError, "Failed to retrieve inscription")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, inscription)
}

// GetInscription returns a specific inscription by ID (must belong to current user).
func (h *InscriptionHandler) GetInscription(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid inscription ID")
		return
	}

	var inscription models.Inscription
	if err := h.db.Preload("Congress").First(&inscription, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Inscription not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, inscription)
}

// generateInvoiceNumber creates a unique invoice number with timestamp and random suffix.
func generateInvoiceNumber() string {
	now := time.Now()
	n, _ := rand.Int(rand.Reader, big.NewInt(99999))
	return fmt.Sprintf("FACT-%d%02d%02d-%05d",
		now.Year(), now.Month(), now.Day(),
		n.Int64(),
	)
}

// getMyInscription fetches the current user's inscription (optionally filtered by congress_id).
func (h *InscriptionHandler) getMyInscription(c *gin.Context) (*models.Inscription, error) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return nil, err
	}

	var inscription models.Inscription
	query := h.db.Where("user_id = ?", userID).Order("created_at desc")
	if congressID := c.Query("congress_id"); congressID != "" {
		query = query.Where("congress_id = ?", congressID)
	}
	if err := query.First(&inscription).Error; err != nil {
		return nil, err
	}
	return &inscription, nil
}

// getInscriptionByID fetches a specific inscription by ID (must belong to current user).
func (h *InscriptionHandler) getInscriptionByID(c *gin.Context) (*models.Inscription, error) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return nil, err
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		return nil, err
	}

	var inscription models.Inscription
	if err := h.db.First(&inscription, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		return nil, err
	}
	return &inscription, nil
}

// @Summary     Télécharger le reçu de paiement
// @Description Génère un reçu de paiement au format HTML pour l'utilisateur connecté
// @Tags        inscriptions
// @Produce     text/html
// @Success     200 {string} string "HTML du reçu"
// @Failure     401 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /inscriptions/receipt [get]
func (h *InscriptionHandler) DownloadReceipt(c *gin.Context) {
	inscription, err := h.getMyInscription(c)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Inscription not found")
		return
	}

	if inscription.PaymentStatus != "confirmed" {
		utils.RespondError(c, http.StatusForbidden, "Payment not yet confirmed")
		return
	}

	h.renderReceiptHTML(c, inscription)
}

// @Summary     Télécharger le reçu d'une inscription spécifique
// @Description Génère un reçu de paiement au format HTML pour une inscription donnée
// @Tags        inscriptions
// @Produce     text/html
// @Param       id path int true "ID de l'inscription"
// @Success     200 {string} string "HTML du reçu"
// @Failure     401 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /inscriptions/{id}/receipt [get]
func (h *InscriptionHandler) DownloadInscriptionReceipt(c *gin.Context) {
	inscription, err := h.getInscriptionByID(c)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Inscription not found")
		return
	}

	if inscription.PaymentStatus != "confirmed" {
		utils.RespondError(c, http.StatusForbidden, "Payment not yet confirmed")
		return
	}

	h.renderReceiptHTML(c, inscription)
}

// @Summary     Télécharger le badge
// @Description Génère le badge du participant au format HTML
// @Tags        inscriptions
// @Produce     text/html
// @Success     200 {string} string "HTML du badge"
// @Failure     401 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /inscriptions/badge [get]
func (h *InscriptionHandler) DownloadBadge(c *gin.Context) {
	inscription, err := h.getMyInscription(c)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Inscription not found")
		return
	}

	if inscription.PaymentStatus != "confirmed" {
		utils.RespondError(c, http.StatusForbidden, "Payment not yet confirmed")
		return
	}

	h.renderBadgeHTML(c, inscription)
}

// @Summary     Télécharger le badge d'une inscription spécifique
// @Description Génère le badge du participant pour une inscription donnée
// @Tags        inscriptions
// @Produce     text/html
// @Param       id path int true "ID de l'inscription"
// @Success     200 {string} string "HTML du badge"
// @Failure     401 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /inscriptions/{id}/badge [get]
func (h *InscriptionHandler) DownloadInscriptionBadge(c *gin.Context) {
	inscription, err := h.getInscriptionByID(c)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Inscription not found")
		return
	}

	if inscription.PaymentStatus != "confirmed" {
		utils.RespondError(c, http.StatusForbidden, "Payment not yet confirmed")
		return
	}

	h.renderBadgeHTML(c, inscription)
}

// @Summary     Télécharger l'attestation
// @Description Génère l'attestation de participation au format HTML (si disponible)
// @Tags        inscriptions
// @Produce     text/html
// @Success     200 {string} string "HTML de l'attestation"
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /inscriptions/attestation [get]
func (h *InscriptionHandler) DownloadAttestation(c *gin.Context) {
	inscription, err := h.getMyInscription(c)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Inscription not found")
		return
	}

	if inscription.PaymentStatus != "confirmed" {
		utils.RespondError(c, http.StatusForbidden, "Payment not yet confirmed")
		return
	}

	congress, _ := h.getCongressForInscription(inscription)
	if congress == nil || !congress.AttestationsAvailable {
		utils.RespondError(c, http.StatusForbidden, "Attestation not yet available")
		return
	}

	h.renderAttestationHTML(c, inscription, congress)
}

// @Summary     Télécharger l'attestation d'une inscription spécifique
// @Description Génère l'attestation pour une inscription donnée
// @Tags        inscriptions
// @Produce     text/html
// @Param       id path int true "ID de l'inscription"
// @Success     200 {string} string "HTML de l'attestation"
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /inscriptions/{id}/attestation [get]
func (h *InscriptionHandler) DownloadInscriptionAttestation(c *gin.Context) {
	inscription, err := h.getInscriptionByID(c)
	if err != nil {
		utils.RespondError(c, http.StatusNotFound, "Inscription not found")
		return
	}

	if inscription.PaymentStatus != "confirmed" {
		utils.RespondError(c, http.StatusForbidden, "Payment not yet confirmed")
		return
	}

	congress, _ := h.getCongressForInscription(inscription)
	if congress == nil || !congress.AttestationsAvailable {
		utils.RespondError(c, http.StatusForbidden, "Attestation not yet available")
		return
	}

	h.renderAttestationHTML(c, inscription, congress)
}

// getCongressForInscription returns the congress directly from the inscription's congress_id.
func (h *InscriptionHandler) getCongressForInscription(inscription *models.Inscription) (*models.Congress, error) {
	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", inscription.CongressID).Error; err != nil {
		return nil, err
	}
	return &congress, nil
}

func badgeTypeColor(participationType string) string {
	m := map[string]string{
		"Présentiel": "#1e40af",
		"En ligne":   "#0369a1",
		"Virtuel":    "#6d28d9",
	}
	if c, ok := m[participationType]; ok {
		return c
	}
	return "#374151"
}

func (h *InscriptionHandler) renderReceiptHTML(c *gin.Context, ins *models.Inscription) {
	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Reçu de paiement — %s</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; background: #f3f4f6; display: flex; justify-content: center; padding: 40px 20px; }
  .receipt { max-width: 400px; width: 100%%; background: white; border: 2px solid #d1d5db; border-radius: 12px; padding: 32px; }
  h1 { font-size: 18px; text-align: center; margin-bottom: 4px; color: #111827; }
  .subtitle { text-align: center; font-size: 11px; color: #6b7280; margin-bottom: 24px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header .amount { font-size: 28px; font-weight: bold; color: #059669; }
  .header .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
  hr { border: none; border-top: 1px dashed #d1d5db; margin: 16px 0; }
  .row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
  .row .lbl { color: #6b7280; }
  .row .val { color: #111827; font-weight: 500; text-align: right; }
  .status { text-align: center; margin-top: 16px; padding: 8px; background: #ecfdf5; border-radius: 8px; font-size: 13px; font-weight: bold; color: #059669; }
  .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #9ca3af; }
  @media print { body { background: white; padding: 0; } .receipt { border: none; box-shadow: none; } }
</style>
</head>
<body>
<div class="receipt">
  <h1>Reçu de paiement</h1>
  <p class="subtitle">Congrès Scientifique</p>
  <hr>
  <div class="header">
    <p class="label">Montant payé</p>
    <p class="amount">%.0f FCFA</p>
  </div>
  <hr>
  <div class="row"><span class="lbl">N° Facture</span><span class="val">%s</span></div>
  <div class="row"><span class="lbl">Participant</span><span class="val">%s %s</span></div>
  <div class="row"><span class="lbl">Email</span><span class="val">%s</span></div>
  <div class="row"><span class="lbl">Téléphone</span><span class="val">%s</span></div>
  <div class="row"><span class="lbl">Type</span><span class="val">%s</span></div>
  <div class="row"><span class="lbl">Pays</span><span class="val">%s</span></div>
  <div class="row"><span class="lbl">Organisme</span><span class="val">%s</span></div>
  <div class="row"><span class="lbl">Méthode</span><span class="val">%s</span></div>
  <div class="row"><span class="lbl">Date</span><span class="val">%s</span></div>
  <hr>
  <div class="status">Paiement confirmé</div>
  <div class="footer">Ce reçu est généré automatiquement. Fait le %s.</div>
</div>
<script>window.print()</script>
</body>
</html>`,
		ins.NumeroFacture,
		ins.Montant,
		ins.NumeroFacture,
		ins.Prenom, ins.Nom,
		ins.Email,
		ins.Telephone,
		ins.ParticipationType,
		ins.Pays,
		ins.Organisme,
		ins.MethodePaiement,
		ins.CreatedAt.Format("02/01/2006 15:04"),
		time.Now().Format("02/01/2006 15:04"),
	)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"recu_%s.html\"", ins.NumeroFacture))
	c.String(http.StatusOK, html)
}

func (h *InscriptionHandler) renderBadgeHTML(c *gin.Context, ins *models.Inscription) {
	color := badgeTypeColor(ins.ParticipationType)
	orgDisplay := ""
	if ins.Organisme != "" {
		orgDisplay = fmt.Sprintf(`<div class="badge-org">%s</div>`, ins.Organisme)
	}

	congress, _ := h.getCongressForInscription(ins)
	congressName := "Congrès Scientifique"
	congressDates := ""
	if congress != nil {
		congressName = congress.Title
		congressDates = congress.StartDate.Format("02/01/2006") + " – " + congress.EndDate.Format("02/01/2006")
		if congress.Location != "" {
			congressDates += " • " + congress.Location
		}
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Mon badge — %s</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: #f3f4f6; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; }
  .controls { margin-bottom: 24px; display: flex; gap: 12px; }
  .controls button { padding: 10px 24px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
  .btn-primary { background: #1e40af; color: white; }
  .btn-secondary { background: #6b7280; color: white; }
  .badge { width: 85mm; height: 54mm; background: white; border: 2px solid #d1d5db; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
  .badge-header { background: %s; color: white; font-size: 7.5px; font-weight: bold; text-align: center; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; }
  .badge-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 12px; text-align: center; }
  .badge-name { font-size: 16px; font-weight: bold; color: #111827; line-height: 1.2; }
  .badge-org { font-size: 9px; color: #6b7280; margin-top: 3px; }
  .badge-type-row { margin-top: 8px; }
  .badge-type-pill { font-size: 9px; font-weight: bold; padding: 2px 10px; border-radius: 999px; background: %s20; color: %s; border: 1px solid %s40; }
  .badge-footer { display: flex; justify-content: space-between; font-size: 7px; color: #9ca3af; padding: 4px 8px; border-top: 1px solid #f3f4f6; }
  @media print { body { background: white; padding: 5mm; } .controls { display: none; } }
</style>
</head>
<body>
<div class="controls">
  <button class="btn-primary" onclick="window.print()">Imprimer / Télécharger (PDF)</button>
  <button class="btn-secondary" onclick="window.close()">Fermer</button>
</div>
<div class="badge">
  <div class="badge-header">%s</div>
  <div class="badge-body">
    <div class="badge-name">%s %s</div>
    %s
    <div class="badge-type-row">
      <span class="badge-type-pill">%s</span>
    </div>
  </div>
  <div class="badge-footer">
    <span>%s</span>
    <span>%s</span>
  </div>
</div>
</body>
</html>`,
		congressName,
		color, color, color, color,
		congressName,
		ins.Prenom, ins.Nom,
		orgDisplay,
		ins.ParticipationType,
		congressDates,
		ins.NumeroFacture,
	)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"badge_%s.html\"", ins.NumeroFacture))
	c.String(http.StatusOK, html)
}

func (h *InscriptionHandler) renderAttestationHTML(c *gin.Context, ins *models.Inscription, congress *models.Congress) {
	congressName := "Congrès Scientifique"
	congressDates := ""
	congressLocation := ""
	if congress != nil {
		congressName = congress.Title
		congressDates = congress.StartDate.Format("02/01/2006") + " au " + congress.EndDate.Format("02/01/2006")
		congressLocation = congress.Location
		if congress.City != "" {
			congressLocation = congress.City + ", " + congress.Location
		}
	}

	city := congressLocation
	if city == "" {
		city = "Kinshasa"
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Attestation de participation — %s</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; background: #f3f4f6; display: flex; justify-content: center; padding: 40px 20px; }
  .attestation { max-width: 700px; width: 100%%; background: white; border: 3px solid #d1d5db; border-radius: 16px; padding: 48px 40px; position: relative; }
  .border-deco { position: absolute; top: 12px; left: 12px; right: 12px; bottom: 12px; border: 1px solid #e5e7eb; border-radius: 10px; pointer-events: none; }
  h1 { font-size: 22px; text-align: center; color: #1e40af; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 2px; }
  .subtitle { text-align: center; font-size: 13px; color: #6b7280; margin-bottom: 32px; font-style: italic; }
  .content { position: relative; z-index: 1; }
  .intro { font-size: 14px; color: #4b5563; line-height: 1.8; text-align: justify; margin-bottom: 24px; }
  .name { text-align: center; font-size: 26px; font-weight: bold; color: #111827; margin: 16px 0; text-transform: uppercase; letter-spacing: 1px; }
  .details { font-size: 14px; color: #4b5563; line-height: 2; text-align: center; margin-bottom: 24px; }
  .signature-row { display: flex; justify-content: space-between; margin-top: 40px; }
  .signature { text-align: center; }
  .signature .line { width: 180px; border-top: 1px solid #9ca3af; margin-top: 40px; padding-top: 8px; font-size: 12px; color: #6b7280; }
  .stamp { text-align: center; margin-top: 16px; }
  .stamp img { width: 80px; height: 80px; }
  .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  .legal { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 4px; }
  @media print { body { background: white; padding: 0; } .attestation { border: none; box-shadow: none; } }
</style>
</head>
<body>
<div class="attestation">
  <div class="border-deco"></div>
  <div class="content">
    <h1>Attestation de participation</h1>
    <p class="subtitle">%s</p>

    <p class="intro">
      Le comité d'organisation du <strong>%s</strong> atteste que :
    </p>

    <div class="name">%s %s</div>

    <p class="details">
      a participé au congrès qui s'est déroulé du <strong>%s</strong>,
      à <strong>%s</strong>, en qualité de <strong>%s</strong>.
    </p>

    <p class="details">
      N° Facture : <strong>%s</strong>
    </p>

    <div class="signature-row">
      <div class="signature">
        <div class="line">Fait à %s, le %s</div>
      </div>
      <div class="signature">
        <div class="line">Le Président du comité</div>
      </div>
    </div>

    <div class="footer">Document officiel — %s</div>
    <div class="legal">Attestation générée le %s</div>
  </div>
</div>
<script>window.print()</script>
</body>
</html>`,
		congressName,
		congressName,
		congressName,
		ins.Prenom, ins.Nom,
		congressDates,
		city,
		ins.ParticipationType,
		ins.NumeroFacture,
		city, time.Now().Format("02/01/2006"),
		congressName,
		time.Now().Format("02/01/2006 à 15:04"),
	)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"attestation_%s.html\"", ins.NumeroFacture))
	c.String(http.StatusOK, html)
}
