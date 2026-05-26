package testutils

import (
	"database/sql"
	"testing"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/services"
	"congres-app/backend/pkg/utils"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

const (
	TestJWTSecret        = "test-jwt-secret-at-least-32-chars!"
	TestJWTRefreshSecret = "test-refresh-secret-at-least-32ch"
)

// NewMockDB creates a GORM DB backed by a SQL mock for unit testing.
func NewMockDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock, *sql.DB) {
	t.Helper()

	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	dialector := postgres.New(postgres.Config{Conn: sqlDB})
	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		sqlDB.Close()
		t.Fatalf("failed to open gorm db: %v", err)
	}

	return db, mock, sqlDB
}

// NewTestConfig creates a test config with empty SMTP (no actual emails sent).
func NewTestConfig() *config.Config {
	cfg := &config.Config{
		JWTSecret:        TestJWTSecret,
		JWTRefreshSecret: TestJWTRefreshSecret,
		UploadPath:       t_tempDir(),
		AppBaseURL:       "http://localhost:5173",
		APIBaseURL:       "http://localhost:8080",
		MailFrom:         "test@congres.app",
		SMTPHost:         "", // empty → mail.Send() is a no-op
	}
	config.AppConfig = cfg
	return cfg
}

func t_tempDir() string {
	return "./testdata"
}

// NewTestMailService creates a MailService that will never send real emails.
func NewTestMailService() *services.MailService {
	return services.NewMailService(NewTestConfig())
}

// GenerateTestAccessToken generates a valid JWT access token using the test secret.
func GenerateTestAccessToken(userID uuid.UUID, role, email string) string {
	token, _ := utils.GenerateAccessToken(userID, role, email, "", TestJWTSecret)
	return token
}

// GenerateTestRefreshToken generates a valid JWT refresh token using the test secret.
func GenerateTestRefreshToken(userID uuid.UUID, role, email string) string {
	token, _ := utils.GenerateRefreshToken(userID, role, email, "", TestJWTRefreshSecret)
	return token
}

// UserColumns returns the ordered column list for the users table.
func UserColumns() []string {
	return []string{
		"id", "civilite", "nom", "prenom", "sexe", "telephone",
		"adresse", "profession", "organisme", "biographie",
		"email", "password", "role", "active", "created_at", "updated_at",
	}
}

// UserRow returns a sqlmock row for a test user.
func UserRow(id uuid.UUID, email, hashedPw, role string) *sqlmock.Rows {
	return sqlmock.NewRows(UserColumns()).AddRow(
		id, "M", "Dupont", "Jean", "M", "0612345678",
		nil, nil, nil, nil,
		email, hashedPw, role, true, time.Now(), time.Now(),
	)
}

// SoumissionColumns returns the ordered column list for the soumissions table.
func SoumissionColumns() []string {
	return []string{
		"id", "submission_type", "theme", "topics", "document_title",
		"author_name", "resume", "keywords", "file_path", "user_id",
		"statut", "raison_rejet", "created_at", "updated_at",
	}
}

// SoumissionRow returns a sqlmock row for a test soumission.
func SoumissionRow(id, userID uuid.UUID, statut string) *sqlmock.Rows {
	return sqlmock.NewRows(SoumissionColumns()).AddRow(
		id, "Abstract", "IA médicale", "Machine Learning", "Mon article sur l'IA",
		"Jean Dupont", "Résumé du travail de recherche...", "{}", "", userID,
		statut, nil, time.Now(), time.Now(),
	)
}

// RefreshTokenColumns returns the ordered column list for refresh_tokens.
func RefreshTokenColumns() []string {
	return []string{"id", "user_id", "token", "expires_at", "revoked_at", "created_at", "updated_at"}
}

// NotificationColumns returns the ordered column list for notifications.
func NotificationColumns() []string {
	return []string{"id", "type", "notifiable_id", "notifiable_type", "data", "read_at", "created_at", "updated_at"}
}
