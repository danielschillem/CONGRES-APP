package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"congres-app/backend/internal/handlers"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/testutils"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/datatypes"
)

// ─── Inscription ─────────────────────────────────────────────────────────

func TestCreateInscription_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	mail := testutils.NewTestMailService()
	h := handlers.NewInscriptionHandler(db, cfg, mail)

	congressID := uuid.New()
	userID := uuid.New()
	now := time.Now()

	// Find active congress
	mock.ExpectQuery(`SELECT .+ FROM "congresses" WHERE`).
		WillReturnRows(sqlmock.NewRows(testutils.CongressColumns()).AddRow(
			congressID, "Test Congress", "", "", "1",
			now, now.Add(72*time.Hour), "Venue", "City", "Country",
			datatypes.JSON(`{"deadlines":{"registration_start":"2000-01-01","registration_end":"2099-12-31"}}`),
			datatypes.JSON(`{}`), datatypes.JSON(`{}`),
			nil, false, "active",
			userID, now, now,
		))

	// Insert inscription
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "inscriptions"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectCommit()

	body := `{
		"nom":"Dupont","prenom":"Jean","email":"jean@example.com",
		"telephone":"0612345678","pays":"France","tariff_label":"Plein tarif",
		"participation_type":"Présentiel","montant":25000,
		"methode_paiement":"orange_money","code_otp":"123456",
		"congress_id":"` + congressID.String() + `"
	}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/inscriptions", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set(middleware.ContextUserID, userID.String())

	h.CreateInscription(c)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			Nom           string `json:"nom"`
			Prenom        string `json:"prenom"`
			Email         string `json:"email"`
			PaymentStatus string `json:"payment_status"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, "pending", resp.Data.PaymentStatus)
}

func TestCreateInscription_CongressNotFound(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	mail := testutils.NewTestMailService()
	h := handlers.NewInscriptionHandler(db, cfg, mail)

	congressID := uuid.New()
	userID := uuid.New()

	mock.ExpectQuery(`SELECT .+ FROM "congresses" WHERE`).
		WillReturnRows(sqlmock.NewRows(testutils.CongressColumns()))

	body := `{
		"nom":"Dupont","prenom":"Jean","email":"jean@example.com",
		"telephone":"0612345678","pays":"France","tariff_label":"Plein tarif",
		"participation_type":"Présentiel","montant":25000,
		"methode_paiement":"orange_money","code_otp":"123456",
		"congress_id":"` + congressID.String() + `"
	}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/inscriptions", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set(middleware.ContextUserID, userID.String())

	h.CreateInscription(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ─── Orange Money Webhook ────────────────────────────────────────────────

func TestWebhook_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	cfg.OrangeMoneyWebhookSecret = "test-webhook-secret"
	mail := testutils.NewTestMailService()
	h := handlers.NewWebhookHandler(db, cfg, mail)

	userID := uuid.New()
	congressID := uuid.New()
	now := time.Now()

	mock.ExpectQuery(`SELECT .+ FROM "inscriptions" WHERE numero_facture`).
		WillReturnRows(sqlmock.NewRows(testutils.InscriptionColumns()).AddRow(
			1, userID, congressID, "Dupont", "Jean", "jean@example.com",
			"0612345678", "Org", "France", "Plein tarif", "Présentiel",
			25000, "orange_money", "FACT-20260528-00001", "",
			"pending", now, now,
		))

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "inscriptions"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	// Match the same struct ordering as orangeMoneyWebhookPayload so json.Marshal produces identical output
	payload := struct {
		OrderID       string `json:"order_id"`
		TransactionID string `json:"transaction_id"`
		Status        string `json:"status"`
		Amount        string `json:"amount"`
		Phone         string `json:"phone"`
		Signature     string `json:"signature"`
	}{
		OrderID:       "FACT-20260528-00001",
		TransactionID: "TXN123456",
		Status:        "SUCCESS",
		Amount:        "25000",
		Phone:         "0612345678",
	}
	payloadBytes, _ := json.Marshal(payload)
	payloadStr := string(payloadBytes)

	sig := handlers.ComputeHMACSHA256(payloadStr, "test-webhook-secret")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/webhooks/orange-money", strings.NewReader(payloadStr))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Request.Header.Set("X-Signature", sig)

	h.HandleOrangeMoneyNotification(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			Status string `json:"status"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, "ok", resp.Data.Status)
}

func TestWebhook_MissingSignature(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	mail := testutils.NewTestMailService()
	h := handlers.NewWebhookHandler(db, cfg, mail)

	payload := `{"order_id":"FACT-001","status":"SUCCESS"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/webhooks/orange-money", strings.NewReader(payload))
	c.Request.Header.Set("Content-Type", "application/json")

	h.HandleOrangeMoneyNotification(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// ─── Reviewer ────────────────────────────────────────────────────────────

func TestAssignReviewer_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	mail := testutils.NewTestMailService()
	h := handlers.NewAdminHandler(db, mail, cfg)

	soumissionID := uuid.New()
	reviewerID := uuid.New()
	userID := uuid.New()

	// Find soumission
	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	// Find reviewer
	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE`).
		WillReturnRows(testutils.UserRow(reviewerID, "reviewer@example.com", "hashed", "reviewer"))

	// Check existing assignment
	mock.ExpectQuery(`SELECT count\(.+\) FROM "reviews" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	// Insert review
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "reviews"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))
	mock.ExpectCommit()

	// Update soumission status
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "soumissions"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	body := `{"reviewer_id":"` + reviewerID.String() + `"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/admin/soumissions/"+soumissionID.String()+"/assign-reviewer", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}

	h.AssignReviewer(c)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestAssignReviewer_AlreadyAssigned(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	mail := testutils.NewTestMailService()
	h := handlers.NewAdminHandler(db, mail, cfg)

	soumissionID := uuid.New()
	reviewerID := uuid.New()
	userID := uuid.New()

	// Find soumission
	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	// Find reviewer
	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE`).
		WillReturnRows(testutils.UserRow(reviewerID, "reviewer@example.com", "hashed", "reviewer"))

	// Already assigned
	mock.ExpectQuery(`SELECT count\(.+\) FROM "reviews" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	body := `{"reviewer_id":"` + reviewerID.String() + `"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/admin/soumissions/"+soumissionID.String()+"/assign-reviewer", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}

	h.AssignReviewer(c)

	assert.Equal(t, http.StatusConflict, w.Code)
}

// ─── Admin approve/reject soumission ─────────────────────────────────────

func TestApproveSoumission_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	mail := testutils.NewTestMailService()
	h := handlers.NewAdminHandler(db, mail, cfg)

	soumissionID := uuid.New()
	userID := uuid.New()

	// Find soumission with User preload
	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE`).
		WillReturnRows(testutils.UserRow(userID, "user@example.com", "hashed", "user"))

	// Update status
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "soumissions"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/admin/soumissions/"+soumissionID.String()+"/approve", nil)
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}

	h.ApproveSoumission(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			Statut string `json:"statut"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, "Approuvée", resp.Data.Statut)
}

func TestRejectSoumission_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	mail := testutils.NewTestMailService()
	h := handlers.NewAdminHandler(db, mail, cfg)

	soumissionID := uuid.New()
	userID := uuid.New()

	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE`).
		WillReturnRows(testutils.UserRow(userID, "user@example.com", "hashed", "user"))

	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "soumissions"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	body := `{"raison":"Travail insuffisamment original"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/admin/soumissions/"+soumissionID.String()+"/reject", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}

	h.RejectSoumission(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			Statut     string  `json:"statut"`
			RaisonRejet *string `json:"raison_rejet"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, "Rejetée", resp.Data.Statut)
	require.NotNil(t, resp.Data.RaisonRejet)
	assert.Equal(t, "Travail insuffisamment original", *resp.Data.RaisonRejet)
}

func TestRejectSoumission_MissingReason(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	mail := testutils.NewTestMailService()
	h := handlers.NewAdminHandler(db, mail, cfg)

	soumissionID := uuid.New()

	body := `{}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/admin/soumissions/"+soumissionID.String()+"/reject", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}

	h.RejectSoumission(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ─── Stats ───────────────────────────────────────────────────────────────

func TestGetStats(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	mail := testutils.NewTestMailService()
	h := handlers.NewAdminHandler(db, mail, cfg)

	// Count queries for soumissions
	mock.ExpectQuery(`SELECT count\(.+\) FROM "soumissions"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(10))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "soumissions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "soumissions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(4))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "soumissions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "soumissions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "soumissions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(3))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "soumissions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))

	// Count queries for inscriptions
	mock.ExpectQuery(`SELECT count\(.+\) FROM "inscriptions"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(20))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "inscriptions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(8))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "inscriptions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(7))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "inscriptions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "inscriptions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(15))
	mock.ExpectQuery(`SELECT count\(.+\) FROM "inscriptions" WHERE`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(5))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/admin/stats", nil)

	h.GetStats(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			Total                    int64 `json:"total"`
			TotalInscriptions        int64 `json:"total_inscriptions"`
			InscriptionsConfirmees   int64 `json:"inscriptions_confirmees"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, int64(10), resp.Data.Total)
	assert.Equal(t, int64(20), resp.Data.TotalInscriptions)
	assert.Equal(t, int64(15), resp.Data.InscriptionsConfirmees)
}
