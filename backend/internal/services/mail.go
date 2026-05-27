package services

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"congres-app/backend/internal/config"
)

type MailService struct {
	cfg *config.Config
}

func NewMailService(cfg *config.Config) *MailService {
	return &MailService{cfg: cfg}
}

func (s *MailService) Send(to, subject, htmlBody string) error {
	if s.cfg.SMTPHost == "" {
		log.Printf("[Mail] SMTP not configured — skipping email to %s (subject: %s)", to, subject)
		return nil
	}

	headers := make(map[string]string)
	headers["From"] = s.cfg.MailFrom
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	addr := fmt.Sprintf("%s:%s", s.cfg.SMTPHost, s.cfg.SMTPPort)

	tlsConfig := &tls.Config{ServerName: s.cfg.SMTPHost}
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		log.Printf("[Mail] Failed to connect to %s: %v", addr, err)
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.cfg.SMTPHost)
	if err != nil {
		log.Printf("[Mail] Failed to create SMTP client: %v", err)
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	if s.cfg.SMTPUser != "" {
		auth := smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPass, s.cfg.SMTPHost)
		if err := client.Auth(auth); err != nil {
			log.Printf("[Mail] SMTP auth failed: %v", err)
			return fmt.Errorf("SMTP authentication failed: %w", err)
		}
	}

	if err := client.Mail(s.cfg.MailFrom); err != nil {
		return fmt.Errorf("failed to set MAIL FROM: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set RCPT TO: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to start data command: %w", err)
	}
	if _, err := w.Write([]byte(msg.String())); err != nil {
		return fmt.Errorf("failed to write email body: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("failed to close data writer: %w", err)
	}

	log.Printf("[Mail] Sent to %s (subject: %s)", to, subject)
	return nil
}

func (s *MailService) layout(body string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="padding:32px 40px;background:#1a1a2e">
<table width="100%%" cellpadding="0" cellspacing="0">
<tr>
<td style="color:#ffffff;font-size:20px;font-weight:700">Congrès Scientifique</td>
<td style="text-align:right;color:#a0a0b0;font-size:12px">%s</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:40px;font-size:15px;line-height:1.6;color:#333">
%s
</td></tr>
<tr><td style="padding:20px 40px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center">
Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`, s.cfg.AppBaseURL, body)
}

func (s *MailService) InscriptionConfirmee(to, prenom, nom, participationType, facture, montant string) error {
	body := fmt.Sprintf(`
<h2 style="color:#1a1a2e;margin:0 0 20px">Inscription confirmée</h2>
<p>Bonjour <strong>%s %s</strong>,</p>
<p>Votre inscription au congrès a bien été enregistrée et votre paiement confirmé.</p>
<table width="100%%" cellpadding="8" cellspacing="0" style="background:#f8f9fa;border-radius:6px;margin:20px 0;font-size:14px">
<tr><td style="color:#666;width:120px">Type</td><td style="font-weight:600">%s</td></tr>
<tr><td style="color:#666">Facture</td><td style="font-weight:600">%s</td></tr>
<tr><td style="color:#666">Montant</td><td style="font-weight:600">%s FCFA</td></tr>
</table>
<p>Vous retrouverez tous les détails de votre inscription dans votre espace personnel.</p>
<p style="color:#666;font-size:13px">L'équipe d'organisation</p>`, prenom, nom, participationType, facture, montant)
	return s.Send(to, "Inscription confirmée — Congrès Scientifique", s.layout(body))
}

func (s *MailService) SoumissionApprouvee(to, prenom, nom, titre, dashboardURL string) error {
	body := fmt.Sprintf(`
<h2 style="color:#1a1a2e;margin:0 0 20px">Soumission approuvée</h2>
<p>Bonjour <strong>%s %s</strong>,</p>
<p>Nous avons le plaisir de vous informer que votre soumission <strong>«&nbsp;%s&nbsp;»</strong> a été <span style="color:#16a34a;font-weight:600">approuvée</span>.</p>
<p>Elle sera présentée lors du congrès selon le programme qui vous sera communiqué ultérieurement.</p>
<p style="margin:24px 0"><a href="%s" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Voir ma soumission</a></p>
<p style="color:#666;font-size:13px">L'équipe d'organisation</p>`, prenom, nom, titre, dashboardURL)
	return s.Send(to, "Soumission approuvée — Congrès Scientifique", s.layout(body))
}

func (s *MailService) SoumissionRejetee(to, prenom, nom, titre, raison, dashboardURL string) error {
	body := fmt.Sprintf(`
<h2 style="color:#1a1a2e;margin:0 0 20px">Soumission non retenue</h2>
<p>Bonjour <strong>%s %s</strong>,</p>
<p>Votre soumission <strong>«&nbsp;%s&nbsp;»</strong> n'a malheureusement pas été retenue.</p>
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px;margin:20px 0;font-size:14px">
<p style="margin:0 0 4px;font-weight:600;color:#dc2626">Motif du rejet</p>
<p style="margin:0;color:#333">%s</p>
</div>
<p>Vous pouvez consulter les détails et soumettre une nouvelle proposition dans votre espace personnel.</p>
<p style="margin:24px 0"><a href="%s" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Voir les détails</a></p>
<p style="color:#666;font-size:13px">L'équipe d'organisation</p>`, prenom, nom, titre, raison, dashboardURL)
	return s.Send(to, "Soumission non retenue — Congrès Scientifique", s.layout(body))
}

func (s *MailService) NouvelleSoumissionAdmin(to, prenom, nom, titre, auteur, adminURL string) error {
	body := fmt.Sprintf(`
<h2 style="color:#1a1a2e;margin:0 0 20px">Nouvelle soumission reçue</h2>
<p>Bonjour <strong>%s %s</strong>,</p>
<p>Une nouvelle soumission a été déposée sur la plateforme :</p>
<table width="100%%" cellpadding="8" cellspacing="0" style="background:#f8f9fa;border-radius:6px;margin:20px 0;font-size:14px">
<tr><td style="color:#666;width:100px">Titre</td><td style="font-weight:600">%s</td></tr>
<tr><td style="color:#666">Auteur</td><td style="font-weight:600">%s</td></tr>
</table>
<p style="margin:24px 0"><a href="%s" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Examiner la soumission</a></p>
<p style="color:#666;font-size:13px">Ceci est un message automatique.</p>`, prenom, nom, titre, auteur, adminURL)
	return s.Send(to, "Nouvelle soumission — Congrès Scientifique", s.layout(body))
}

func (s *MailService) SoumissionModifieeAdmin(to, prenom, nom, titre, auteur, adminURL string) error {
	body := fmt.Sprintf(`
<h2 style="color:#1a1a2e;margin:0 0 20px">Soumission modifiée</h2>
<p>Bonjour <strong>%s %s</strong>,</p>
<p>La soumission <strong>«&nbsp;%s&nbsp;»</strong> de %s a été modifiée.</p>
<p style="margin:24px 0"><a href="%s" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Voir les modifications</a></p>
<p style="color:#666;font-size:13px">Ceci est un message automatique.</p>`, prenom, nom, titre, auteur, adminURL)
	return s.Send(to, "Soumission modifiée — Congrès Scientifique", s.layout(body))
}

func (s *MailService) ReviewerInvitation(to, prenom, nom, congressTitle, acceptURL, message string) error {
	greeting := "Bonjour"
	if prenom != "" && nom != "" {
		greeting = fmt.Sprintf("Bonjour <strong>%s %s</strong>", prenom, nom)
	}

	msgBlock := ""
	if message != "" {
		msgBlock = fmt.Sprintf(`
<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:16px 0;font-size:14px;color:#333">
<p style="margin:0 0 8px;font-weight:600;color:#1a1a2e">Message du comité d'organisation</p>
<p style="margin:0">%s</p>
</div>`, message)
	}

	body := fmt.Sprintf(`
<h2 style="color:#1a1a2e;margin:0 0 20px">Invitation à devenir relecteur</h2>
<p>%s,</p>
<p>Vous avez été invité(e) à participer au comité de relecture du congrès <strong>«&nbsp;%s&nbsp;»</strong>.</p>
%s
<p>En tant que relecteur, vous serez amené(e) à évaluer les soumissions scientifiques soumises au congrès selon une grille d'évaluation définie.</p>
<p style="margin:24px 0"><a href="%s" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Accepter l'invitation</a></p>
<p style="color:#666;font-size:13px">Ce lien est valable 14 jours. Si vous avez déjà un compte, vous serez automatiquement redirigé après connexion.</p>
<p style="color:#666;font-size:13px">L'équipe d'organisation</p>`, greeting, congressTitle, msgBlock, acceptURL)
	return s.Send(to, "Invitation au comité de relecture — Congrès Scientifique", s.layout(body))
}

func (s *MailService) ReviewerWelcome(to, prenom, nom, tempPassword, loginURL string) error {
	body := fmt.Sprintf(`
<h2 style="color:#1a1a2e;margin:0 0 20px">Bienvenue dans l'équipe de relecture</h2>
<p>Bonjour <strong>%s %s</strong>,</p>
<p>Votre invitation a été acceptée avec succès. Un compte relecteur a été créé pour vous.</p>
<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:20px 0;font-size:14px">
<p style="margin:0 0 4px;font-weight:600;color:#1a1a2e">Vos identifiants de connexion</p>
<p style="margin:0 0 4px">Email : <strong>%s</strong></p>
<p style="margin:0">Mot de passe temporaire : <strong style="color:#dc2626">%s</strong></p>
</div>
<p style="color:#dc2626;font-size:13px">Veuillez changer votre mot de passe après votre première connexion.</p>
<p style="margin:24px 0"><a href="%s" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Se connecter</a></p>
<p style="color:#666;font-size:13px">L'équipe d'organisation</p>`, prenom, nom, to, tempPassword, loginURL)
	return s.Send(to, "Bienvenue — Relecteur Congrès Scientifique", s.layout(body))
}

func (s *MailService) ReviewReminder(to, name string, pendingCount int, dashboardURL string) error {
	body := fmt.Sprintf(`
<h2 style="color:#1a1a2e;margin:0 0 20px">Relance — Évaluations en attente</h2>
<p>Bonjour <strong>%s</strong>,</p>
<p>Vous avez actuellement <strong style="color:#dc2626">%d évaluation(s)</strong> en attente de votre part sur la plateforme de soumission.</p>
<p>Nous vous remercions de bien vouloir finaliser vos évaluations dans les meilleurs délais afin de permettre la clôture du processus de relecture.</p>
<p style="margin:24px 0"><a href="%s" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Voir mes évaluations</a></p>
<p style="color:#666;font-size:13px">Ceci est un message automatique de relance.</p>`, name, pendingCount, dashboardURL)
	return s.Send(to, "Relance — Évaluations en attente", s.layout(body))
}

func (s *MailService) BroadcastMessage(to, prenom, nom, subject, bodyText, notificationsURL string) error {
	greeting := "Bonjour"
	if prenom != "" {
		greeting = fmt.Sprintf("Bonjour <strong>%s</strong>", prenom)
	}
	if nom != "" && prenom != "" {
		greeting = fmt.Sprintf("Bonjour <strong>%s %s</strong>", prenom, nom)
	}

	body := fmt.Sprintf(`
<h2 style="color:#1a1a2e;margin:0 0 20px">%s</h2>
<p>%s,</p>
<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin:16px 0;font-size:14px;line-height:1.8;color:#333">
%s
</div>
<p style="margin:24px 0"><a href="%s" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Voir mes notifications</a></p>
<p style="color:#666;font-size:13px">Ceci est un message envoyé par le comité d'organisation.</p>`, subject, greeting, bodyText, notificationsURL)
	return s.Send(to, subject, s.layout(body))
}
