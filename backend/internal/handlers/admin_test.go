package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"congres-app/backend/internal/handlers"
	"congres-app/backend/testutils"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── ListSoumissions (admin) ─────────────────────────────────────────────────

func TestAdminListSoumissions_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAdminHandler(db, testutils.NewTestMailService(), testutils.NewTestConfig())

	userID := uuid.New()
	soumissionID := uuid.New()

	// COUNT query
	mock.ExpectQuery(`SELECT count\(\*\) FROM "soumissions"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	// Data query (with Preload → users query follows)
	mock.ExpectQuery(`SELECT .+ FROM "soumissions"`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	// Preload: fetch user for the soumission
	mock.ExpectQuery(`SELECT .+ FROM "users"`).
		WillReturnRows(testutils.UserRow(userID, "user@example.com", "hashed", "user"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/admin/soumissions", nil)

	h.ListSoumissions(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool        `json:"success"`
		Total   int64       `json:"total"`
		Data    interface{} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, int64(1), resp.Total)
}

func TestAdminListSoumissions_Empty(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAdminHandler(db, testutils.NewTestMailService(), testutils.NewTestConfig())

	mock.ExpectQuery(`SELECT count\(\*\) FROM "soumissions"`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	mock.ExpectQuery(`SELECT .+ FROM "soumissions"`).
		WillReturnRows(sqlmock.NewRows(testutils.SoumissionColumns()))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/admin/soumissions", nil)

	h.ListSoumissions(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool  `json:"success"`
		Total   int64 `json:"total"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, int64(0), resp.Total)
}

// ─── GetSoumission (admin) ───────────────────────────────────────────────────

func TestAdminGetSoumission_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAdminHandler(db, testutils.NewTestMailService(), testutils.NewTestConfig())

	userID := uuid.New()
	soumissionID := uuid.New()

	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE id`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	mock.ExpectQuery(`SELECT .+ FROM "users"`).
		WillReturnRows(testutils.UserRow(userID, "user@example.com", "hashed", "user"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/admin/soumissions/"+soumissionID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}

	h.GetSoumission(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
}

func TestAdminGetSoumission_NotFound(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAdminHandler(db, testutils.NewTestMailService(), testutils.NewTestConfig())

	soumissionID := uuid.New()

	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE id`).
		WillReturnRows(sqlmock.NewRows(testutils.SoumissionColumns()))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/admin/soumissions/"+soumissionID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}

	h.GetSoumission(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ─── ApproveSoumission ───────────────────────────────────────────────────────

func TestAdminApproveSoumission_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAdminHandler(db, testutils.NewTestMailService(), testutils.NewTestConfig())

	userID := uuid.New()
	soumissionID := uuid.New()

	// Fetch soumission with Preload
	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE id`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	mock.ExpectQuery(`SELECT .+ FROM "users"`).
		WillReturnRows(testutils.UserRow(userID, "user@example.com", "hashed", "user"))

	// Update soumission statut (Model.Select.Updates → no RETURNING)
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "soumissions" SET .+ WHERE .+`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	// Goroutine: createUserNotification → INSERT notification
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "notifications"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))
	mock.ExpectCommit()

	// Goroutine: email → user.Email is "user@example.com" (from Preload), SMTPHost empty → no-op, no DB query

	// Goroutine: createUserNotification → INSERT notification
	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO "notifications"`).
		WillReturnResult(sqlmock.NewResult(0, 1))
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

	// Give goroutine time to complete, then verify
	time.Sleep(50 * time.Millisecond)
}

func TestAdminApproveSoumission_InvalidID(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAdminHandler(db, testutils.NewTestMailService(), testutils.NewTestConfig())

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/admin/soumissions/bad-id/approve", nil)
	c.Params = gin.Params{{Key: "id", Value: "bad-id"}}

	h.ApproveSoumission(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ─── RejectSoumission ────────────────────────────────────────────────────────

func TestAdminRejectSoumission_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAdminHandler(db, testutils.NewTestMailService(), testutils.NewTestConfig())

	userID := uuid.New()
	soumissionID := uuid.New()

	// Fetch soumission with Preload
	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE id`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	mock.ExpectQuery(`SELECT .+ FROM "users"`).
		WillReturnRows(testutils.UserRow(userID, "user@example.com", "hashed", "user"))

	// Update soumission statut (Model.Select.Updates → no RETURNING)
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "soumissions" SET .+ WHERE .+`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	// Goroutine: createUserNotification
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "notifications"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))
	mock.ExpectCommit()

	// Goroutine: createUserNotification
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "notifications"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))
	mock.ExpectCommit()

	body := `{"raison":"Hors sujet"}`

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
			Statut      string  `json:"statut"`
			RaisonRejet *string `json:"raison_rejet"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, "Rejetée", resp.Data.Statut)
	require.NotNil(t, resp.Data.RaisonRejet)
	assert.Equal(t, "Hors sujet", *resp.Data.RaisonRejet)

	time.Sleep(20 * time.Millisecond)
}

func TestAdminRejectSoumission_MissingRaison(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAdminHandler(db, testutils.NewTestMailService(), testutils.NewTestConfig())

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

// ─── GetStats ────────────────────────────────────────────────────────────────

func TestAdminGetStats_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAdminHandler(db, testutils.NewTestMailService(), testutils.NewTestConfig())

	// 7 soumission count queries
	soumissionCounts := []struct {
		pattern string
		count   int64
	}{
		{`SELECT count\(\*\) FROM "soumissions"$`, 10},
		{`SELECT count\(\*\) FROM "soumissions" WHERE submission_type`, 4},
		{`SELECT count\(\*\) FROM "soumissions" WHERE submission_type`, 3},
		{`SELECT count\(\*\) FROM "soumissions" WHERE submission_type`, 3},
		{`SELECT count\(\*\) FROM "soumissions" WHERE statut`, 5},
		{`SELECT count\(\*\) FROM "soumissions" WHERE statut`, 3},
		{`SELECT count\(\*\) FROM "soumissions" WHERE statut`, 2},
	}

	for _, q := range soumissionCounts {
		mock.ExpectQuery(q.pattern).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(q.count))
	}

	// 6 inscription count queries
	inscriptionCounts := []int64{20, 8, 7, 5, 15, 5}
	for _, count := range inscriptionCounts {
		mock.ExpectQuery(`SELECT count\(\*\) FROM "inscriptions"`).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(count))
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/admin/stats", nil)

	h.GetStats(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			Total             int64 `json:"total"`
			TotalInscriptions int64 `json:"total_inscriptions"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, int64(10), resp.Data.Total)
	assert.Equal(t, int64(20), resp.Data.TotalInscriptions)
}
