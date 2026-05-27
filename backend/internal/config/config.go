package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBName     string
	DBUser     string
	DBPassword string
	DSN        string

	JWTSecret        string
	JWTRefreshSecret string

	Port       string
	UploadPath string

	CORSOrigins string

	AppBaseURL string
	APIBaseURL string

	OrangeMoneyTestURL        string
	OrangeMoneyProdURL        string
	OrangeMoneyMerchantMSISDN string
	OrangeMoneyAPIUsername    string
	OrangeMoneyAPIPassword    string
	OrangeMoneyWebhookSecret  string

	JitsiDomain string

	SMTPHost string
	SMTPPort string
	SMTPUser string
	SMTPPass string
	MailFrom string
}

var AppConfig *Config

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading environment variables directly")
	}

	cfg := &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBName:     getEnv("DB_NAME", "congres_app"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "password"),

		JWTSecret:        getEnv("JWT_SECRET", ""),
		JWTRefreshSecret: getEnv("JWT_REFRESH_SECRET", ""),

		Port:       getEnv("PORT", "8080"),
		UploadPath: getEnv("UPLOAD_PATH", "./uploads/soumissions"),

		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"),

		AppBaseURL: getEnv("APP_BASE_URL", "http://localhost:5173"),
		APIBaseURL: getEnv("API_BASE_URL", "http://localhost:8080"),

		OrangeMoneyTestURL:        getEnv("ORANGE_MONEY_TEST_URL", ""),
		OrangeMoneyProdURL:        getEnv("ORANGE_MONEY_PROD_URL", ""),
		OrangeMoneyMerchantMSISDN: getEnv("ORANGE_MONEY_MERCHANT_MSISDN", ""),
		OrangeMoneyAPIUsername:    getEnv("ORANGE_MONEY_API_USERNAME", ""),
		OrangeMoneyAPIPassword:    getEnv("ORANGE_MONEY_API_PASSWORD", ""),
		OrangeMoneyWebhookSecret:  getEnv("ORANGE_MONEY_WEBHOOK_SECRET", ""),

		JitsiDomain: getEnv("JITSI_DOMAIN", "meet.jit.si"),

		SMTPHost: getEnv("SMTP_HOST", ""),
		SMTPPort: getEnv("SMTP_PORT", "1025"),
		SMTPUser: getEnv("SMTP_USER", ""),
		SMTPPass: getEnv("SMTP_PASS", ""),
		MailFrom: getEnv("MAIL_FROM", "noreply@congres.app"),
	}

	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}
	if cfg.JWTRefreshSecret == "" {
		log.Fatal("JWT_REFRESH_SECRET environment variable is required")
	}

	cfg.DSN = fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort,
	)

	AppConfig = cfg
	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
