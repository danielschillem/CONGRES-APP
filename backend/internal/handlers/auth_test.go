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
	"golang.org/x/crypto/bcrypt"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// ─── Register ───────────────────────────────────────────────────────────────

func TestRegister_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAuthHandler(db, testutils.NewTestConfig())

	// Email uniqueness check → not found (empty rows = record not found)
	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE email`).
		WillReturnRows(sqlmock.NewRows(testutils.UserColumns()))

	// Phone uniqueness check → not found
	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE telephone`).
		WillReturnRows(sqlmock.NewRows(testutils.UserColumns()))

	// Insert user
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "users"`).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(uuid.New()))
	mock.ExpectCommit()

	// Insert refresh token
	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO "refresh_tokens"`).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	body := `{
		"civilite":"M","nom":"Dupont","prenom":"Jean","sexe":"M",
		"telephone":"0612345678","email":"new@example.com","password":"password123"
	}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Register(c)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.NotEmpty(t, resp.Data.AccessToken)
	assert.NotEmpty(t, resp.Data.RefreshToken)
}

func TestRegister_DuplicateEmail(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAuthHandler(db, testutils.NewTestConfig())

	// Email check → found (conflict)
	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE email`).
		WillReturnRows(testutils.UserRow(uuid.New(), "existing@example.com", "hashed", "user"))

	body := `{
		"civilite":"M","nom":"Dupont","prenom":"Jean","sexe":"M",
		"telephone":"0612345678","email":"existing@example.com","password":"password123"
	}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Register(c)

	assert.Equal(t, http.StatusConflict, w.Code)

	var resp struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.False(t, resp.Success)
	assert.Contains(t, resp.Error, "Email already registered")
}

func TestRegister_InvalidData(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAuthHandler(db, testutils.NewTestConfig())

	// Missing required fields + invalid email → binding validation fails, no DB query
	body := `{"email":"not-an-email","password":"123"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Register(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp struct{ Success bool `json:"success"` }
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.False(t, resp.Success)
}

// ─── Login ───────────────────────────────────────────────────────────────────

func TestLogin_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAuthHandler(db, testutils.NewTestConfig())

	// Use bcrypt cost 4 (min) to keep tests fast
	hashedPw, _ := bcrypt.GenerateFromPassword([]byte("password123"), 4)

	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE email`).
		WillReturnRows(testutils.UserRow(uuid.New(), "user@example.com", string(hashedPw), "user"))

	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO "refresh_tokens"`).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	body := `{"email":"user@example.com","password":"password123"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Login(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.NotEmpty(t, resp.Data.AccessToken)
	assert.NotEmpty(t, resp.Data.RefreshToken)
}

func TestLogin_WrongPassword(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAuthHandler(db, testutils.NewTestConfig())

	hashedPw, _ := bcrypt.GenerateFromPassword([]byte("correctpassword"), 4)

	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE email`).
		WillReturnRows(testutils.UserRow(uuid.New(), "user@example.com", string(hashedPw), "user"))

	body := `{"email":"user@example.com","password":"wrongpassword"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Login(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var resp struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.False(t, resp.Success)
	assert.Contains(t, resp.Error, "Invalid email or password")
}

func TestLogin_UserNotFound(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAuthHandler(db, testutils.NewTestConfig())

	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE email`).
		WillReturnRows(sqlmock.NewRows(testutils.UserColumns()))

	body := `{"email":"unknown@example.com","password":"password123"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Login(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var resp struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.False(t, resp.Success)
	assert.Contains(t, resp.Error, "Invalid email or password")
}

func TestLogin_MissingFields(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAuthHandler(db, testutils.NewTestConfig())

	body := `{"email":"notanemail"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Login(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

func TestRefresh_Success(t *testing.T) {
	db, mock, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	cfg := testutils.NewTestConfig()
	h := handlers.NewAuthHandler(db, cfg)

	userID := uuid.New()
	refreshToken := testutils.GenerateTestRefreshToken(userID, "user", "user@example.com")

	// Find refresh token by token value (not revoked)
	rtCols := testutils.RefreshTokenColumns()
	mock.ExpectQuery(`SELECT .+ FROM "refresh_tokens" WHERE token`).
		WillReturnRows(sqlmock.NewRows(rtCols).AddRow(
			uuid.New(), userID, refreshToken,
			time.Now().Add(7*24*time.Hour), nil,
			time.Now(), time.Now(),
		))

	// Find user by ID
	mock.ExpectQuery(`SELECT .+ FROM "users" WHERE id`).
		WillReturnRows(testutils.UserRow(userID, "user@example.com", "hashedpw", "user"))

	// Revoke old refresh token (UPDATE SET revoked_at)
	mock.ExpectBegin()
	mock.ExpectExec(`UPDATE "refresh_tokens"`).
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	// Insert new refresh token
	mock.ExpectBegin()
	mock.ExpectExec(`INSERT INTO "refresh_tokens"`).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	body := `{"refresh_token":"` + refreshToken + `"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/refresh", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Refresh(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Success bool `json:"success"`
		Data    struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
		} `json:"data"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.True(t, resp.Success)
	assert.NotEmpty(t, resp.Data.AccessToken)
	assert.NotEmpty(t, resp.Data.RefreshToken)
}

func TestRefresh_InvalidToken(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAuthHandler(db, testutils.NewTestConfig())

	body := `{"refresh_token":"invalid.jwt.token"}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/refresh", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Refresh(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var resp struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
	assert.False(t, resp.Success)
	assert.NotEmpty(t, resp.Error)
}

func TestRefresh_MissingBody(t *testing.T) {
	db, _, sqlDB := testutils.NewMockDB(t)
	defer sqlDB.Close()

	h := handlers.NewAuthHandler(db, testutils.NewTestConfig())

	body := `{}`

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/auth/refresh", strings.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	h.Refresh(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
