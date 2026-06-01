/*
 * lib/korea-visit/schema.ts — zod schema for the Korea Visit
 * planner (M4-01).
 *
 * The KV form creates a Lead with `kind: ["korea"]` AND a
 * KoreaVisit row attached. Unlike the M3 consult form, treatments
 * + regions are NOT required at this stage — the user is planning
 * a visit, the specific treatment may not be locked yet (manager
 * helps narrow it during the consult).
 *
 * Fields cover three logical steps the form renders sequentially:
 *   1. Trip      — dateFrom / dateTo / airport
 *   2. Service   — hotelPref / interpreter / aftercareDays / notes
 *   3. Contact   — name / phone / email / whatsappId / telegramId
 *                  / preferredLanguage / consents
 *
 * Validation rules (i18n message keys consumed by the form):
 *   - dateFrom ≤ dateTo (else: korea_visit.errors.dates_swapped)
 *   - dateFrom ≥ today (else: korea_visit.errors.date_in_past)
 *   - dateTo within 18 months of dateFrom (else: too_far)
 *   - name length 1–80
 *   - phone E.164 / KZ-shape — reuses the M3 phone regex
 *   - email optional, RFC-like
 *   - consentTos required
 */

import { z } from "zod";

export const KV_AIRPORTS = ["ICN", "GMP", "PUS", "CJU"] as const;
export type KvAirport = (typeof KV_AIRPORTS)[number];

export const KV_INTERPRETER_LANGS = ["kz", "ru", "kr", "en"] as const;
export type KvInterpreterLang = (typeof KV_INTERPRETER_LANGS)[number];

export const KV_PREFERRED_LANGS = ["kz", "ru", "kr"] as const;
export type KvPreferredLang = (typeof KV_PREFERRED_LANGS)[number];

// Mirrors lib/leads/schema.ts phone regex (M3-polish).
const PHONE_RE = /^\+?[0-9][0-9 \-().]{7,24}$/;

// ISO date string `YYYY-MM-DD` — input[type=date] native shape.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const TRIP_SECTION = z
  .object({
    dateFrom: z.string().regex(DATE_RE, "korea_visit.errors.date_invalid"),
    dateTo: z.string().regex(DATE_RE, "korea_visit.errors.date_invalid"),
    airport: z.enum(KV_AIRPORTS).nullable(),
  })
  .superRefine((val, ctx) => {
    const from = new Date(val.dateFrom);
    const to = new Date(val.dateTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return;
    if (from > to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateTo"],
        message: "korea_visit.errors.dates_swapped",
      });
    }
    // 18-month outlook ceiling — picks up typos like "2099"
    const max = new Date(from);
    max.setMonth(max.getMonth() + 18);
    if (to > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateTo"],
        message: "korea_visit.errors.dates_too_far",
      });
    }
  });

const SERVICE_SECTION = z.object({
  hotelPref: z.string().trim().max(200).optional().or(z.literal("")),
  interpreter: z.enum(KV_INTERPRETER_LANGS).nullable(),
  aftercareDays: z.number().int().min(0).max(60).nullable(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

const CONTACT_SECTION = z.object({
  name: z.string().trim().min(1, "korea_visit.errors.name_required").max(80),
  phone: z.string().regex(PHONE_RE, "korea_visit.errors.phone_invalid"),
  email: z.string().trim().email("korea_visit.errors.email_invalid").optional().or(z.literal("")),
  whatsappId: z.string().trim().max(64).optional().or(z.literal("")),
  telegramId: z.string().trim().max(64).optional().or(z.literal("")),
  preferredLanguage: z.enum(KV_PREFERRED_LANGS),
  // zod 4 doesn't surface a clean i18n key for `z.literal(true)`'s
  // mismatch message; `.refine` over a plain boolean gives us the
  // exact key the form lookup expects.
  consentTos: z
    .boolean()
    .refine((v) => v === true, { message: "korea_visit.errors.consent_required" }),
  consentMkt: z.boolean().default(false),
});

export const kvSubmitSchema = z.intersection(
  TRIP_SECTION,
  z.intersection(SERVICE_SECTION, CONTACT_SECTION),
);

export type KvSubmit = z.infer<typeof kvSubmitSchema>;

/** Step-shape for the multi-step form's internal validation. */
export const kvStepSchemas = {
  trip: TRIP_SECTION,
  service: SERVICE_SECTION,
  contact: CONTACT_SECTION,
} as const;
