# M6 · Notifications workflow

> Templates · automation · send log · B/A admin. Week 8–10. Can be parallelized with M5.

**Phase done when:** "lead received → templated WhatsApp out within 5 minutes" runs hands-off; manager can pause/resume automation and inspect failures in the send log.

## Tasks

### M6-01 · Template store + editor
- [ ] Two-column layout: list (left) + editor (right).
- [ ] Channel toggles (WA / TG / SMS / Email).
- [ ] Language toggle (KZ / RU / KR).
- [ ] Auto-send toggle.
- [ ] Body editor with variable highlighting.
- [ ] Variables panel (drag-to-insert).
- [ ] **Price-mention guard**: regex blocks save if body contains price terms.
- [ ] Send-test button — sends to the current manager only.
- **DoD:** Editor save round-trips; price terms in body refuse to save.
- **Owner:** FE + BE. **Est:** 3d.

### M6-02 · Automation rules
- [ ] Rule list: trigger · delay · channel · template chips.
- [ ] Pause / resume toggle per rule.
- [ ] Create modal with picker for each field.
- **DoD:** A new rule fires for the next matching event.
- **Owner:** FE + BE. **Est:** 2.5d.

### M6-03 · Inngest workers
- [ ] `lead.created → welcome` (immediate).
- [ ] `visit.confirmed → reminder` (24 h before).
- [ ] `lead.done → review.request` (14 d after).
- [ ] Retries with exponential backoff (max 5).
- [ ] Run history visible in admin send log.
- **DoD:** A staged event fires the right template within the scheduled window.
- **Owner:** BE. **Est:** 2.5d.

### M6-04 · WhatsApp Cloud API adapter
- [ ] Outbound send via templates.
- [ ] Template registration helper (semi-manual, with a checklist file).
- [ ] Webhook ingestion at `/api/webhooks/whatsapp`.
- [ ] Delivery + read callbacks update `Message.status`.
- [ ] Signature verification.
- **DoD:** A welcome message reaches a real test WhatsApp number.
- **Owner:** BE. **Est:** 4d.

### M6-05 · Telegram bot adapter
- [ ] Bot token + webhook.
- [ ] Deep-link handover from Done screen.
- [ ] Inbound message creates `Message(direction: 'in')` row.
- **DoD:** Tap deep link → bot greets in chosen language.
- **Owner:** BE. **Est:** 2d.

### M6-06 · SMS adapter (Mobizon)
- [ ] Used for fallback when no WA / TG identity.
- [ ] Per-country routing.
- **DoD:** SMS template lands on a test KZ phone.
- **Owner:** BE. **Est:** 1.5d.

### M6-07 · Send log UI
- [ ] Table: status pills · channel chips · template chip · time.
- [ ] Filters: status · channel · template · manager · date range.
- [ ] Retry button on failed rows.
- **DoD:** Retrying a failed row re-queues via Inngest.
- **Owner:** FE. **Est:** 2d.

### M6-08 · B/A admin
- [ ] Upload form with consent capture (signature pad or explicit confirmation).
- [ ] Tie post to a customer record.
- [ ] Retire toggle (removes from public gallery without deleting).
- **DoD:** A post without consent cannot be published.
- **Owner:** FE + BE. **Est:** 2d.
