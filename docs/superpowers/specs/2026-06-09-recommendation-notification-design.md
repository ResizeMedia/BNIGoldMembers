# Recommendation Notification to Directors — Design

**Date:** 2026-06-09
**Project:** BNI Gold Members Romania

## Goal
When anyone submits a recommendation, email the group's launch consultant and the
region's executive director(s) so they validate it quickly. Works for public
submissions (no SMTP in the submitter's browser) → send server-side.

## Components

### lib/send-mail.ts (new, server-only)
Extract nodemailer transporter build + `sendMail(settings, {to,subject,body})` +
`getSmtpErrorMessage` from the send-email route. Shared by both email routes.

### app/api/smtp (new)
`GET` reads `data/smtp.json` (returns `initialSmtpSettings` if missing), `PUT` writes.
Mirrors the directors route. Password stays plaintext (consistent with existing).

### app/api/notify-recommendation (new, POST)
Payload: `{ recommendation: {from,to,domain,group}, region, template:{subject,body} }`.
- Read `data/smtp.json`; if incomplete → `{success:true, sent:0}` (never blocks submit).
- Read `data/directors.json`; recipients =
  - launch_consultant where `director.group === recommendation.group`
  - executive_director where `getDirectorRegions(director)` includes `region`
  - dedupe by email, skip empty emails.
- Render template per recipient (placeholders incl `directorName`), send best-effort.
- Return `{success:true, sent:N}`.

### Email template `recommendation_notification`
Add to `EmailTemplateType` + `initialEmailTemplates`. Placeholders:
`{{directorName}}`, `{{recommenderName}}`, `{{recommendedName}}`, `{{domain}}`, `{{group}}`.
Editable in admin Template email tab (tab maps over `emailTemplates`).

### Admin
- SMTP loaded from `/api/smtp` on mount, saved to `/api/smtp` on change (+ localStorage
  fallback). Mirrors directors server-persistence + `smtpLoadedFromServer` guard.
- On load, merge any missing template types from `initialEmailTemplates` into
  `emailTemplates` so the new notification template appears for existing localStorage.

### Recommendations page (submit)
After writing the recommendation + confirmation email (unchanged), POST fire-and-forget
to `/api/notify-recommendation` with the recommendation, the group's `region` (from
`groups`/`initialGroups`), and the notification template (localStorage or default).

## Error handling
Notification is best-effort: failure never blocks recommendation registration.

## v1 limitations (noted)
- Server-side notifications are not written to the admin's `emailLog` (log is per-browser
  localStorage). Server-side email logging can be added later if needed.
- Admin edits to the notification template only apply when that admin's browser submits;
  public submits use the default template (templates not persisted server-side in v1).
