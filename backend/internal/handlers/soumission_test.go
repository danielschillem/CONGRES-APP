package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"congres-app/backend/internal/handlers"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/testutils"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── List ────────────────────────────────────────────────────────────────────

func TestListUserSoumissions_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewSoumissionHandler(db, testutils.NewTestConfig(), testutils.NewTestMailService())

	userID := uuid.New()
	soumissionID := uuid.New()

	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE user_id`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/soumissions", nil)
	c.Set(middleware.ContextUserID, userID.String())

	h.ListUserSoumissions(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool        `json:"success"`
		Data    interface{} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.NotNil(t, resp.Data)
}

func TestListUserSoumissions_Empty(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewSoumissionHandler(db, testutils.NewTestConfig(), testutils.NewTestMailService())

	userID := uuid.New()

	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE user_id`).
		WillReturnRows(sqlmock.NewRows(testutils.SoumissionColumns()))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/soumissions", nil)
	c.Set(middleware.ContextUserID, userID.String())

	h.ListUserSoumissions(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool          `json:"success"`
		Data    []interface{} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
}

func TestListUserSoumissions_InvalidUserID(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewSoumissionHandler(db, testutils.NewTestConfig(), testutils.NewTestMailService())

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/soumissions", nil)
	c.Set(middleware.ContextUserID, "not-a-valid-uuid")

	h.ListUserSoumissions(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// ─── Get ─────────────────────────────────────────────────────────────────────

func TestGetSoumission_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewSoumissionHandler(db, testutils.NewTestConfig(), testutils.NewTestMailService())

	userID := uuid.New()
	soumissionID := uuid.New()

	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/soumissions/"+soumissionID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}
	c.Set(middleware.ContextUserID, userID.String())

	h.GetSoumission(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			ID     string `json:"id"`
			Statut string `json:"statut"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.Equal(t, "En attente", resp.Data.Statut)
}

func TestGetSoumission_NotFound(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewSoumissionHandler(db, testutils.NewTestConfig(), testutils.NewTestMailService())

	userID := uuid.New()
	soumissionID := uuid.New()

	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE`).
		WillReturnRows(sqlmock.NewRows(testutils.SoumissionColumns()))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/soumissions/"+soumissionID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}
	c.Set(middleware.ContextUserID, userID.String())

	h.GetSoumission(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var resp struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.False(t, resp.Success)
	assert.Contains(t, resp.Error, "not found")
}

func TestGetSoumission_InvalidID(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewSoumissionHandler(db, testutils.NewTestConfig(), testutils.NewTestMailService())

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/soumissions/bad-id", nil)
	c.Params = gin.Params{{Key: "id", Value: "bad-id"}}
	c.Set(middleware.ContextUserID, uuid.New().String())

	h.GetSoumission(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ─── Delete ──────────────────────────────────────────────────────────────────

func TestDeleteSoumission_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewSoumissionHandler(db, testutils.NewTestConfig(), testutils.NewTestMailService())

	userID := uuid.New()
	soumissionID := uuid.New()

	// FilePath is empty so no os.Remove() call
	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE`).
		WillReturnRows(testutils.SoumissionRow(soumissionID, userID, "En attente"))

	mock.ExpectBegin()
	mock.ExpectExec(`DELETE FROM "soumissions"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodDelete, "/soumissions/"+soumissionID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}
	c.Set(middleware.ContextUserID, userID.String())

	h.DeleteSoumission(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
}

func TestDeleteSoumission_NotFound(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewSoumissionHandler(db, testutils.NewTestConfig(), testutils.NewTestMailService())

	userID := uuid.New()
	soumissionID := uuid.New()

	mock.ExpectQuery(`SELECT .+ FROM "soumissions" WHERE`).
		WillReturnRows(sqlmock.NewRows(testutils.SoumissionColumns()))

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodDelete, "/soumissions/"+soumissionID.String(), nil)
	c.Params = gin.Params{{Key: "id", Value: soumissionID.String()}}
	c.Set(middleware.ContextUserID, userID.String())

	h.DeleteSoumission(c)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestDeleteSoumission_InvalidID(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewSoumissionHandler(db, testutils.NewTestConfig(), testutils.NewTestMailService())

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodDelete, "/soumissions/bad-id", nil)
	c.Params = gin.Params{{Key: "id", Value: "bad-id"}}
	c.Set(middleware.ContextUserID, uuid.New().String())

	h.DeleteSoumission(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
