## v1 handoff archive

Snapshot of the **full-scope v1** engineering handoff that predates the MVP cut.
Kept for forensic reference and for partial re-adoption when M-POST starts
(WhatsApp / Telegram / SMS / OTP / template editor / automation engine).

### Layout

- `handoff-package/` — the original `claude-code-handoff/` directory, moved
  here verbatim. Contains `CLAUDE.md`, `README.md`, `docs/00-08`,
  `prisma/schema.prisma` (v1 schema with required `phone`, no `guest` role),
  `package.json` (with `inngest`, no MVP scoping), `scripts/no-price-guard.ts`,
  `scripts/i18n-check.ts`, `wbs/M0..M7-*.md`.
- `loose-root/` — files that were left at the repo root with **rotated /
  swapped names** (the tarball that produced this repo lost name↔content
  mapping). Content is preserved as-found; do not trust the filename. The
  same content, correctly named, lives under `handoff-package/`.
- `variant-htmls/` — non-master HTML variants of the spec
  (`Build Roadmap & WBS.html`, `MVP Roadmap & WBS-print.html`,
  `K-Beauty Сana v0.2 (full scope).html`, `Claude Code Handoff.html`).

### MVP rules vs v1 rules

When the v1 docs in here contradict the MVP, **the MVP wins**. The MVP
source of truth lives at the repo root:

- `MVP Roadmap & WBS.html` — master spec
- `K-Beauty Сana MVP.html` — interactive prototype entry
- `docs/prototype/*.jsx` — prototype React source

Known overrides vs `handoff-package/`:

| Item | v1 (here) | MVP (active) |
|---|---|---|
| Auth | Phone OTP + Better-Auth | Guest cookie + staff email/password |
| Channels | wa · tg · sms · email · inapp (all live) | inapp + email only; wa/tg/sms enum values reserved, never written |
| `inngest` dep | yes | removed (returns in M-POST) |
| `Role` enum | no `guest` | adds `guest` |
| `Lead.channelPref` default | `wa` | `inapp` |
| `User.phone` | required + unique | optional, no uniqueness |
| `User.passwordHash`, `User.guestId` | absent | present |
| `Template`, `AutomationRule`, `PushSubscription`, `OtpAttempt` | created | **not created in MVP migration** (single additive M-POST migration) |
| Screen count | "28 screens" | 18 customer + 7 admin (= 25) |
| PRs | one per WBS task | one per milestone |

### Re-adoption plan (M-POST)

When the post-MVP track starts, salvage from here:

- `handoff-package/wbs/M1-auth.md` for OTP screens
- `handoff-package/wbs/M6-notifications-workflow.md` for template editor +
  automation rule engine
- `handoff-package/prisma/schema.prisma` for `Template`, `AutomationRule`,
  `OtpAttempt`, `PushSubscription` model bodies (paste into a new additive
  migration; the M-POST schema is forward-compatible with MVP — no
  destructive change required)
- `handoff-package/docs/05-permissions.md` for the expanded RBAC matrix
  (doctor portal, etc.)

Everything else in this directory should be considered stale.
