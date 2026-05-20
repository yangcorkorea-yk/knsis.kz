# 07 · Screens — acceptance criteria

> 28 designed screens. Each has a WBS task ID. The visual source-of-truth is `K-Beauty Сana MVP.html` + `screens-*.jsx` in the parent project.

## Public mobile (10)

### 01 · Onboarding · `M1-02`
- Three language cards (KZ default highlighted, RU, KR).
- "Start" CTA disabled until a card is tapped.
- ToS micro-copy under the CTA.
- Picking a language sets `NEXT_LOCALE` cookie and the User.locale on first auth.

### 02 · Home · `M2-01`
- Greeting block ("Бүгінгі K-Beauty — Алматыдан бастаңыз").
- Search input → routes to `/[locale]/search`.
- Popular categories (9 tiles, scrollable).
- Section: Korea consultation (clinic horizontal rail).
- Section: Local partners (clinic horizontal rail).
- Section: Verified-only band.
- Section: Real reviews (3 cards).
- Bottom tab.

### 03 · Categories · `M2-02`
- Grid of 9 category tiles with custom SVG art (use `category-art.jsx` as the source).
- Filter chips: area, concern, language.
- URL state: `?area=almaty&concern=lift&lang=ru`.

### 04 · Treatment detail · `M2-03`
- Hero with kicker (`ЛИФТИНГ · LIFTING`), title, summary, duration, languages.
- "Recommended for" bullet list.
- "What to expect" bullet list.
- Info blocks: time, recovery, pre-consult, caution.
- Related clinics rail.
- Disclaimer footer.
- Sticky CTA "Request consultation for this treatment".

### 05 · Clinic list · `M2-04`
- Tabs: All · 🇰🇷 Korea · 🇰🇿 Local.
- Sort dropdown: reviews · popularity.
- Card per clinic with rating, badges, treatment chips.

### 06 · Clinic detail · `M2-05`
- Hero image + verified badge.
- Language / interpreter / Korea-partnership / aftercare badges.
- About text.
- Featured doctors.
- Treatment areas.
- Hours table.
- Before/After strip (consent gated).
- Certification info.
- Reviews section.
- Sticky CTA.

### 07 · Reviews feed · `M2-06`
- Filter strip: treatment, region, clinic, rating min.
- Summary: total verified count + description.
- Cards with rating, body, before/after thumbs (if consent).

### 08 · Consult form · `M3-01`
- Multi-step (basic info → interest → method → photos → message → consents).
- Resumable via local-storage draft.
- Validates client (Zod) + server.
- Submits → `POST /api/leads` → routes to Done.

### 09 · Done · `M3-04`
- "Your request was received" hero.
- Request summary (5 rows).
- Next-steps timeline (3 items).
- CTA to Home or Browse more.

### 10 · My page · `M1-04`
- Profile header with locale chip.
- 3 stats: requests, fav treatments, fav clinics.
- Request history list.
- Favorites section.
- Settings card link.

## Korea Visit flow (3)

### 11 · KV landing · `M4-01`
- Hero, value props, "Plan my visit" CTA.

### 12 · KV plan form · `M4-01`
- Dates, airport, hotel preference, interpreter language, aftercare days.

### 13 · KV confirmed · `M4-01`
- Itinerary card, what to bring, contact card.

## Login flow (3)

### 14 · Phone entry · `M1-02`
- Country picker (default KZ +7).
- E.164 normalization.
- Channel pick: WhatsApp / SMS.

### 15 · OTP · `M1-02`
- 4-digit code, auto-advance, resend after 30 s.

### 16 · Permissions / consent · `M1-02`
- Required: ToS.
- Optional: marketing, push.

## Before & After (1)

### 17 · B&A gallery · `M2-07`
- Strip slider (before / after).
- Consent banner above each post.
- Filter by treatment.

## Mobile extras (4)

### 18 · Notifications · `M4-03`
- Tabs: All · Consult · Review · Promo.
- Today / Earlier groups.
- Unread indicator per row.
- "Mark all read" affordance.

### 19 · Chat with manager · `M4-02`
- Header with manager avatar + presence dot + WA/TG quick-links.
- Hours banner.
- Bubble list (manager left, user right rose).
- Rich card messages (clinic preview).
- Quick-reply chips above input.
- Input row with attach, camera, send.

### 20 · Search results · `M2-08`
- Empty state: recent searches + trending.
- Result state: tabs (All / Treatment / Clinic / Review) with counts.
- Highlight matched substring.

### 21 · Settings · `M4-05`
- Language picker (3 cards).
- Profile rows (name, phone, email).
- Notification channel toggles.
- Privacy rows (consent, photo consent, download, delete account).
- Support rows.
- Logout + version.

## Admin desktop (10)

### 22 · Dashboard · `M5-02`
- 5 KPI cards.
- Funnel (5 stages).
- 7-day bar chart.
- Channel split.
- Sources split.
- Manager load.
- Activity feed.

### 23 · Leads · `M5-03`
- Sidebar + topbar + filter row + status tabs + table + right-side detail drawer.
- Table cols: name+code, channel+id, procedure, area+kind, language, owner+clinic, status, when.
- Detail drawer: WA/TG buttons, status, manager/clinic assignment, notes, activity log.

### 24 · Customers · `M5-04`
- Segment tabs: All · Active · Repeat · VIP · Dormant.
- Table cols: customer+id, language, region, requests, last activity, tag, channel.

### 25 · Clinics admin · `M5-05`
- Tabs: All · Korea · Local · Pending · Suspended.
- Card grid with verify state, kind, leads, rating, interpreters.

### 26 · Review moderation · `M5-06`
- Tabs: Pending · Flagged · Published · Rejected.
- Review card with body, photos, consent state, flag reason.
- Actions: Approve · Request edit · Reject.

### 27 · Managers · `M5-07`
- Team table with avatar+presence, languages, role pill, load, SLA, last activity, status.
- Permission matrix panel showing role × feature → permission.

### 28 · Notification templates · `M6-01`
- Two-column: template list (left) + editor (right).
- Editor: channel toggle, language toggle, auto-send toggle, body editor with variable highlighting, variables panel, send-test button.

### 29 · Automation rules · `M6-02`
- Rule list with trigger · delay · channel · template chips.
- Pause / resume toggle per rule.

### 30 · Send log · `M6-07`
- Filterable log: status pills, channel chips, template chip, retry button.

### 31 · B/A admin · `M6-08`
- Upload form with consent capture, customer link, retire toggle.
