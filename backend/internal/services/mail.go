package services

import (
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

	var auth smtp.Auth
	if s.cfg.SMTPUser != "" {
		auth = smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPass, s.cfg.SMTPHost)
	}

	if err := smtp.SendMail(addr, auth, s.cfg.MailFrom, []string{to}, []byte(msg.String())); err != nil {
		log.Printf("[Mail] Failed to send to %s: %v", to, err)
		return fmt.Errorf("failed to send email: %w", err)
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
