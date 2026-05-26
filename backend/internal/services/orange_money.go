package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"congres-app/backend/internal/config"
)

type OrangeMoneyService struct {
	cfg *config.Config
}

func NewOrangeMoneyService(cfg *config.Config) *OrangeMoneyService {
	return &OrangeMoneyService{cfg: cfg}
}

type OrangeMoneyPaymentRequest struct {
	Amount        float64 `json:"amount"`
	CustomerPhone string  `json:"customer_phone"`
	OrderID       string  `json:"order_id"`
	Description   string  `json:"description"`
}

type OrangeMoneyPaymentResponse struct {
	Success       bool   `json:"success"`
	Message       string `json:"message"`
	TransactionID string `json:"transaction_id,omitempty"`
	PaymentURL    string `json:"payment_url,omitempty"`
}

// orangeMoneyRequestBody is the payload sent to the Orange Money API.
type orangeMoneyRequestBody struct {
	MerchantMSISDN string  `json:"merchant_msisdn"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	OrderID        string  `json:"order_id"`
	ReturnURL      string  `json:"return_url"`
	CancelURL      string  `json:"cancel_url"`
	NotifURL       string  `json:"notif_url"`
	Lang           string  `json:"lang"`
	CustomerPhone  string  `json:"customer_phone"`
	Description    string  `json:"description"`
}

// InitiatePayment sends a payment request to Orange Money.
// When Orange Money credentials are not configured, it acts as a stub returning success.
func (s *OrangeMoneyService) InitiatePayment(req OrangeMoneyPaymentRequest) (*OrangeMoneyPaymentResponse, error) {
	log.Printf("[OrangeMoney] Initiating payment: OrderID=%s, Amount=%.2f, CustomerPhone=%s",
		req.OrderID, req.Amount, req.CustomerPhone)

	// Stub mode: if no API credentials are configured, return success immediately
	if s.cfg.OrangeMoneyAPIUsername == "" || s.cfg.OrangeMoneyAPIPassword == "" || s.cfg.OrangeMoneyMerchantMSISDN == "" {
		log.Printf("[OrangeMoney] Running in stub mode (no credentials configured). Returning success for OrderID=%s", req.OrderID)
		return &OrangeMoneyPaymentResponse{
			Success:       true,
			Message:       "Payment accepted (stub mode)",
			TransactionID: fmt.Sprintf("STUB-%d", time.Now().UnixNano()),
		}, nil
	}

	// Determine API URL: prefer test URL, fallback to production
	apiURL := s.cfg.OrangeMoneyTestURL
	if apiURL == "" {
		apiURL = s.cfg.OrangeMoneyProdURL
	}
	if apiURL == "" {
		log.Printf("[OrangeMoney] No API URL configured, using stub response for OrderID=%s", req.OrderID)
		return &OrangeMoneyPaymentResponse{
			Success:       true,
			Message:       "Payment accepted (stub mode - no URL configured)",
			TransactionID: fmt.Sprintf("STUB-%d", time.Now().UnixNano()),
		}, nil
	}

	payload := orangeMoneyRequestBody{
		MerchantMSISDN: s.cfg.OrangeMoneyMerchantMSISDN,
		Amount:         req.Amount,
		Currency:       "XOF",
		OrderID:        req.OrderID,
		ReturnURL:      "http://localhost:5173/inscription/success",
		CancelURL:      "http://localhost:5173/inscription/cancel",
		NotifURL:       "http://localhost:8080/api/webhooks/orange-money",
		Lang:           "fr",
		CustomerPhone:  req.CustomerPhone,
		Description:    req.Description,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payment request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, apiURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Basic auth
	credentials := base64.StdEncoding.EncodeToString(
		[]byte(s.cfg.OrangeMoneyAPIUsername + ":" + s.cfg.OrangeMoneyAPIPassword),
	)
	httpReq.Header.Set("Authorization", "Basic "+credentials)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("[OrangeMoney] HTTP request failed for OrderID=%s: %v", req.OrderID, err)
		return nil, fmt.Errorf("orange money API request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	log.Printf("[OrangeMoney] Response for OrderID=%s: status=%d body=%s", req.OrderID, resp.StatusCode, string(respBody))

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return &OrangeMoneyPaymentResponse{
			Success: false,
			Message: fmt.Sprintf("Orange Money API returned status %d: %s", resp.StatusCode, string(respBody)),
		}, nil
	}

	// Parse response - adjust field names based on actual Orange Money API spec
	var apiResp map[string]interface{}
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to parse Orange Money response: %w", err)
	}

	paymentResp := &OrangeMoneyPaymentResponse{
		Success: true,
		Message: "Payment initiated successfully",
	}

	if txID, ok := apiResp["transaction_id"].(string); ok {
		paymentResp.TransactionID = txID
	}
	if payURL, ok := apiResp["payment_url"].(string); ok {
		paymentResp.PaymentURL = payURL
	}

	return paymentResp, nil
}
