# Dynamic content i18n — KZ fallback visible to users is a defect

## Rule (revised at M2-03 visual sign-off)

| Before (M0 → PR #7 first commit)                                                                                               | After (this commit onward)                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KZ master at seed time. M7 native reviewer fills RU/KR in-DB later. KZ fallback visible to RU/KR users is acceptable until M7. | **Three locales filled at seed time.** M7 native reviewer reviews / corrects — does not fill. KZ fallback visible to a RU or KR user is a **launch-quality defect**, not a deferred cosmetic. |

The change came out of the PR #7 M2-03 visual sign-off: an RU
user landing on `/ru/treatments/<slug>` saw Treatment + Clinic
text in Kazakh. The `tr.ts` kz-fallback chain was working as
designed — that's not the bug. The bug was the policy that
allowed the fallback to surface to users.

## Affected surfaces

Anything backed by a Trilingual JSON column on a domain row:

| Model       | Trilingual fields                         | First user-facing route                                                       |
| ----------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `Treatment` | `title`, `summary`, `recovery`, `expects` | `/[locale]/treatments/[slug]` (M2-03)                                         |
| `Clinic`    | `name`, `location.cityI18n`, `about`      | `/[locale]/clinics/[slug]` (M2-05); also surfaces in related-clinics on M2-03 |
| `Review`    | `body`                                    | `/[locale]/reviews` (M2-06)                                                   |

`Review.body` was String through PR #8 and the runbook earlier
flagged it as "deliberately mono-lingual." M2-06 reversed that
call: even seed-fictional reviews need to render in the user's
locale because the spec rule (no KZ fallback visible to RU/KR
users) extends to the reviews feed. The schema migration
`20260526044000_reviews_body_trilingual` converts existing
String values to `{ kz: <existing>, ru: null, kr: null }` JSONB
and the loader fills RU/KR slots from the expanded CSV.

For genuinely user-authored reviews (post-MVP), this stays the
same shape — the user writes in one locale, that locale's slot
is populated, the others stay null until an M7-style review pass
fills them or the surface decides to hide non-locale reviews.
Today's M2-06 seed isn't real user copy; the translations are
implementer-written and queued for M7 native review.

## Seed pipeline (M2-09)

`seed/{treatments,clinics}.csv` carry `*_kz`, `*_ru`, `*_kr`
columns for every Trilingual field. `lib/seed/loaders.ts`:

1. **On create**, writes the full trilingual JSON from CSV.
2. **On re-run with an existing row**, performs a **fill-blanks
   merge**: any locale slot that's already non-null in the DB
   wins — an M7 reviewer edit or an admin Studio tweak survives.
   The CSV value lands only when the existing slot is empty.

Treatment.expects uses the same merge logic at the list level —
a non-empty existing array wins over the CSV for that locale.

Clinic location stores a flat canonical `city` (Russian Cyrillic,
keyed by `lib/discover/filters.ts` `CITY_SLUG_MAP`) AND a
`cityI18n: { kz, ru, kr }` JSON for per-locale display. The
filter dependency on `.city` is preserved; KR users get
Korean-script city names via `cityI18n.kr`.

## Translation authorship

Temp translations from KZ master are written by the implementer
(Claude Code in M2-09 expansion) using standard medical / aesthetic
terminology. PM caveat: the implementer is not a native KZ / RU
speaker — KR is direct competence.

**M7 i18n QA** (per WBS §06):

- Native KZ reviewer: pass over Kazakh source for procedure naming
  conventions + tone.
- Native RU reviewer: pass over the Russian translations for
  medical accuracy + register.
- Native KR reviewer: pass over the Korean translations for
  procedure naming conventions matching Korean clinic vocabulary.

Any reviewer edits live in DB (Supabase Studio / SQL). The
fill-blanks loader semantics mean a CSV re-run will not stomp
the curated values.

## How to verify (visual sign-off matrix)

For each new locale-aware surface:

| Locale    | Expected                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/kz/...` | KZ master copy rendered                                                                                                                                                     |
| `/ru/...` | RU rendering, no Kazakh visible anywhere in the dynamic content                                                                                                             |
| `/kr/...` | KR rendering, no Kazakh or Russian Cyrillic visible (except where data is intentionally cross-locale, e.g., interpreter language codes `ru` / `kz` displayed as ISO labels) |

When a defect is found, the fix path is one of:

1. **Missing CSV column** → add to `seed/<model>.csv`, update
   `lib/seed/loaders.ts`, write the translation, re-seed.
2. **Existing row with stale null** → either re-seed (fill-blanks
   merges the new CSV value) or edit in Studio.
3. **Reviewer correction** → edit in Studio. The CSV doesn't have
   to mirror it; the fill-blanks merge protects it.

## Out of scope (intentionally deferred)

- Per-locale review body display (M2-06 decision).
- Dynamic content language toggles inside a single user-locale
  page (e.g., "show original" button on a translated review) —
  not in MVP.
- Machine-translation pipelines — explicitly out per CLAUDE.md
  §1 scope: zero external integrations.
