# 02 · Data model

> Source of truth is `prisma/schema.prisma`. This file is the narrative. UUIDs everywhere. Soft-delete where reasonable. `createdAt` + `updatedAt` on everything.

## Core entities

### `User`

End customer or staff.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `phone` | string, unique | E.164 |
| `name` | string? |  |
| `email` | string? | optional |
| `locale` | enum | `kz` (default) · `ru` · `kr` |
| `role` | enum | `customer` · `support` · `manager` · `head` · `admin` |
| `consentTos` | bool | required at signup |
| `consentMkt` | bool | optional |
| `consentedAt` | timestamp |  |

### `Lead`

A consultation request.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `code` | string, unique | `KB-2025-####` — generated at insert |
| `userId` | FK User |  |
| `channelPref` | enum | `wa` · `tg` · `sms` · `email` |
| `treatmentIds` | uuid[] |  |
| `regions` | string[] | `almaty` · `astana` · `seoul` … |
| `kind` | enum[] | `korea` · `local` |
| `status` | enum | `new` · `contacted` · `in_progress` · `scheduled` · `done` · `on_hold` |
| `ownerId` | FK User? | assigned manager |
| `clinicId` | FK Clinic? |  |
| `photos` | string[] | storage paths |
| `message` | text? |  |

### `Clinic`

Partner clinic. Note: localized strings live as JSON columns.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `slug` | string, unique |  |
| `name` | json `{ kz, ru, kr }` |  |
| `kind` | enum | `korea` · `local` |
| `location` | json | `{ country, city, area, geo: [lat, lng] }` |
| `interpreters` | string[] | `kz` · `ru` · `kr` · `en` |
| `treatmentIds` | uuid[] |  |
| `verifyState` | enum | `verified` · `pending` · `suspended` |
| `hours` | json | weekday array + holiday closures |

### `Treatment`

Catalog item. **No price field, ever.**

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `slug` | string, unique |  |
| `category` | enum | `skin` · `botox` · `filler` · `lift` · `acne` · `pigment` · `hair` · `cosmetic` · `scalp` |
| `title` | json `{ kz, ru, kr }` |  |
| `summary` | json `{ kz, ru, kr }` |  |
| `durationMin` | int |  |
| `recovery` | json `{ kz, ru, kr }` |  |
| `expects` | json `{ kz: string[], ru: string[], kr: string[] }` | bullet list |

### `Review`

Moderated user review.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `code` | string, unique | `RV-2025-###` |
| `userId` | FK User |  |
| `clinicId` | FK Clinic? |  |
| `txId` | FK Treatment? |  |
| `rating` | int 1..5 |  |
| `body` | text |  |
| `photos` | string[] |  |
| `photoConsent` | bool |  |
| `state` | enum | `pending` · `flagged` · `published` · `rejected` |

### `Message`

In-app + outbound log row.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `leadId` | FK Lead |  |
| `channel` | enum | `inapp` · `wa` · `tg` · `sms` · `email` |
| `direction` | enum | `in` · `out` |
| `body` | text |  |
| `templateId` | FK Template? | if templated |
| `status` | enum | `queued` · `sent` · `delivered` · `read` · `failed` |
| `providerId` | string? | external message id (Meta / Telegram / SMSC) |

### `Template`

Message template, per-channel + i18n.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `key` | string, unique | `welcome` · `reminder` · `aftercare` · `visit` · `review` |
| `channels` | enum[] | subset of `wa` · `tg` · `sms` · `email` |
| `bodies` | json | `{ [channel]: { kz, ru, kr } }` |
| `vars` | string[] | `{{name}}`, `{{date}}`, `{{clinic}}` |
| `auto` | bool | enrolled in automation |

### `AutomationRule`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK |  |
| `trigger` | enum | `lead.created` · `status.changed` · `visit.confirmed` · `review.due` |
| `delayMin` | int | minutes after trigger |
| `templateId` | FK Template |  |
| `channel` | enum |  |
| `paused` | bool |  |

### Also

- `KoreaVisit` (flights, hotel, pickup, dates, interpreter, attached to a Lead)
- `Favorite` (userId, kind, refId)
- `Notification` (in-app inbox row)
- `AuditLog` (actor, action, entity, before, after, ip, ua, ts)
- `Session` (Better-Auth managed)

## Indexes

- `Lead.status`, `Lead.ownerId`, `Lead.createdAt` (DESC) — inbox queries.
- `Review.state`, `Review.createdAt` (DESC) — moderation queue.
- `Message.leadId`, `Message.createdAt` — chat fetch.
- `User.phone` unique.
- Full-text index on `Treatment.title` (per-locale) and `Clinic.name` (per-locale) for search.

## Migration policy

- Every schema change is a Prisma migration committed in the same PR.
- Never edit a shipped migration; always add a new one.
- Pre-deploy: `prisma migrate deploy` runs in CI before Vercel cuts the release.
