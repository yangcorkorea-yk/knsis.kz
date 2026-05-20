# 03 · API surface

> REST under `/api`. Auth via HTTP-only cookie. Every mutating route rate-limited. Every public route Zod-validated.

## Conventions

- Routes live in `app/api/**/route.ts`.
- DTOs are Zod schemas in `lib/dto/*` — same schema is reused on FE for `react-hook-form`.
- Success: `200` for read, `201` for create, `204` for delete.
- Error envelope: `{ error: { code, message, fields? } }`. Code is a stable string (`OTP_EXPIRED`, `RATE_LIMITED`).
- Pagination: cursor-based, `?cursor=...&limit=20`.

## Public & user routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/otp/send` | Send OTP to a phone |
| POST | `/api/auth/otp/verify` | Verify code, start session |
| POST | `/api/auth/signout` | Kill all sessions |
| GET | `/api/treatments?category=lift&locale=kz` | List + filters |
| GET | `/api/treatments/[slug]` | Detail |
| GET | `/api/clinics?kind=korea` | List |
| GET | `/api/clinics/[slug]` | Detail |
| GET | `/api/reviews?txId=…` | Filtered feed |
| GET | `/api/search?q=…` | Treatments + clinics + reviews |
| POST | `/api/leads` | Create consultation (auth) |
| GET | `/api/leads/me` | My consultations |
| POST | `/api/uploads/sign` | Presigned URL for photo |
| GET | `/api/me/notifications` | Inbox |
| PATCH | `/api/me/settings` | Notif channels, language, privacy |
| DELETE | `/api/me` | Delete account (PII purge + audit) |

## Admin routes

All require `requireRole('manager+')` server-side guard. Audit-logged.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/leads?status=new&owner=me` | Inbox |
| PATCH | `/api/admin/leads/[id]` | Update status / owner / clinic / notes |
| POST | `/api/admin/leads/[id]/messages` | Send templated message via channel |
| GET | `/api/admin/customers?seg=vip` | List + segments |
| GET | `/api/admin/clinics` | List |
| POST | `/api/admin/clinics` | Create |
| PATCH | `/api/admin/clinics/[id]` | Verify / suspend |
| PATCH | `/api/admin/reviews/[id]` | Approve / reject / request edit |
| GET | `/api/admin/templates` | List |
| PATCH | `/api/admin/templates/[id]` | Save body / vars / channels |
| POST | `/api/admin/templates/[id]/test` | Send test to manager |
| GET | `/api/admin/automation` | Rules list |
| POST | `/api/admin/automation` | Create rule |
| GET | `/api/admin/messages?status=failed` | Send log |
| POST | `/api/admin/messages/[id]/retry` | Resend |
| GET | `/api/admin/managers` | Team |
| POST | `/api/admin/managers/invite` | Invite by email |

## Webhooks (signed)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/webhooks/whatsapp` | Inbound + delivery / read |
| POST | `/api/webhooks/telegram` | Inbound + delivery |
| POST | `/api/webhooks/sms` | Delivery |
| POST | `/api/webhooks/inngest` | Queue runner callback |

- Signature verification mandatory before the handler reads the body.
- 401 immediately on bad signature; do not leak shape.
- Idempotency-keyed at the provider's message id.

## Rate limits

Defaults — per IP, per phone, sliding window:

| Route | Limit |
|---|---|
| `POST /auth/otp/send` | 3 / 10 min per phone, 10 / hour per IP |
| `POST /leads` | 1 / 10 min per phone, 5 / day per IP |
| `POST /uploads/sign` | 10 / min per session |
| `GET /search` | 30 / min per IP |
| All admin mutations | 60 / min per actor |

Use Upstash Redis or a Vercel Edge Config-backed counter. Block list lives in DB and is honored at middleware level.

## Caching

- Public GETs (`/treatments`, `/clinics`, `/reviews`) — Next.js `revalidate: 60` segment-cached + `Cache-Control: s-maxage=60, stale-while-revalidate=600`.
- Per-user GETs — `Cache-Control: private, no-store`.
- Admin GETs — `no-store`.
