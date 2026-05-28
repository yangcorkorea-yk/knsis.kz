/*
 * lib/leads/schema.ts — Zod schemas for the M3 consult form
 * and the M3-03 POST /api/leads boundary.
 *
 * Iteration history (M3-polish): the form was 3 steps with
 * per-step schemas; PM redesign at preview sign-off folded it
 * into a single-page scroll (matches the Kazakhstan-market
 * reference UI). The per-section schemas (`contactSchema`,
 * `goalSchema`, `extrasSchema`) survive as composable units for
 * targeted validation messaging, but the form no longer drives
 * them step by step.
 *
 * Hard rules baked in:
 *   - The schema deliberately rejects any monetary field — see
 *     CLAUDE.md §2 (rule 1). Quotes are delivered 1-on-1 by a
 *     manager and never travel through the lead payload.
 *   - ToS consent is required; marketing consent is optional.
 *   - Phone normalised to E.164 at parse time (server trusts the
 *     parse output, not the raw form value).
 *   - Kazakhstan reality (M3-polish PM decision): the manager
 *     actually reaches users via WhatsApp / Telegram, not phone.
 *     Both identifiers are optional, but the form copy strongly
 *     encourages at least one. Identifiers are informational
 *     ONLY — Channel.wa / Channel.tg writes are still forbidden
 *     by hard rule §8; the manager opens the chat manually.
 *
 * Region + treatment values are slugs already validated by the
 * surrounding catalogues (CITY_SLUGS + the seeded Treatment.slug
 * set) — the schema only checks shape + length, not whitelist
 * membership. Slug membership is enforced on the server in
 * `lib/leads/create.ts` against the live Prisma rows.
 */

import { z } from "zod";
import { CITY_SLUGS } from "@/lib/discover/filters";

/**
 * Contact section. Phone + name now both required; WhatsApp +
 * Telegram identifiers optional but strongly encouraged via help
 * copy. Preferred consult language is a Locale enum value.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "consult.errors.name_required")
    .max(80, "consult.errors.name_too_long"),
  phone: z
    .string()
    .trim()
    .min(1, "consult.errors.phone_required")
    .transform((s) => s.replace(/[\s\-()]/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\+?\d{10,15}$/, "consult.errors.phone_format")
        .transform((s) => (s.startsWith("+") ? s : `+${s}`)),
    ),
  /**
   * WhatsApp identifier — accepts a phone number (e.g. "+7 ...")
   * or any short string ID. We don't enforce E.164 here; the
   * manager opens WhatsApp manually and resolves whatever form
   * the user wrote.
   */
  whatsappId: z
    .string()
    .trim()
    .max(80, "consult.errors.contact_id_too_long")
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined)),
  /**
   * Telegram identifier — typically `@username` or a phone.
   * Same relaxed validation as whatsappId.
   */
  telegramId: z
    .string()
    .trim()
    .max(80, "consult.errors.contact_id_too_long")
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined)),
  /** Preferred language for the consult itself (distinct from UI locale). */
  preferredLanguage: z.enum(["kz", "ru", "kr"]),
});

/**
 * Goal section. At least one treatment + at least one region;
 * `kind` is the form factor (visit Korea / treat locally) and
 * accepts both — some users are weighing both paths and we
 * shouldn't force a single choice up-front.
 */
export const goalSchema = z.object({
  treatmentSlugs: z.array(z.string().min(1).max(80)).min(1, "consult.errors.treatment_required"),
  regions: z.array(z.enum(CITY_SLUGS)).min(1, "consult.errors.region_required"),
  kind: z.array(z.enum(["korea", "local"])).min(1, "consult.errors.kind_required"),
});

/**
 * Per-photo metadata returned by the M3-02 upload endpoint
 * (`{ path, mime }`). The form holds the array of these between
 * the upload completing and the lead submit.
 */
export const photoRefSchema = z.object({
  /** Supabase Storage object path inside the private bucket. */
  path: z.string().min(1).max(255),
  /** Final stored MIME — server always normalises to image/jpeg. */
  mime: z.string().regex(/^image\/(jpeg|png)$/),
});

/**
 * Photos + message + consents. Photos / message optional;
 * `consentTos` literally true is required; `consentMkt` defaults
 * to false.
 */
export const extrasSchema = z.object({
  photos: z.array(photoRefSchema).max(3, "consult.errors.photo_count").default([]),
  message: z.string().trim().max(2000, "consult.errors.message_too_long").optional(),
  consentTos: z.literal(true, { error: "consult.errors.consent_tos_required" }),
  consentMkt: z.boolean().default(false),
});

/**
 * The merged submit shape. POST /api/leads parses this and
 * passes the output to `lib/leads/create.ts`. Idempotency-Key
 * lives in the HTTP header, not the body.
 */
export const leadSubmitSchema = contactSchema.and(goalSchema).and(extrasSchema);

export type ContactInput = z.input<typeof contactSchema>;
export type GoalInput = z.input<typeof goalSchema>;
export type ExtrasInput = z.input<typeof extrasSchema>;

export type Contact = z.output<typeof contactSchema>;
export type Goal = z.output<typeof goalSchema>;
export type Extras = z.output<typeof extrasSchema>;
export type PhotoRef = z.output<typeof photoRefSchema>;
export type LeadSubmit = z.output<typeof leadSubmitSchema>;
