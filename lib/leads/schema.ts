/*
 * lib/leads/schema.ts — Zod schemas for the M3-01 consult form
 * and the M3-03 POST /api/leads boundary.
 *
 * The form is 3 steps; each step has its own Zod schema so the
 * "Next" button can validate only what's been shown. The merged
 * `leadSubmitSchema` is what the API parses.
 *
 * Hard rules baked in:
 *   - The schema deliberately rejects any monetary field — see
 *     CLAUDE.md §2 (rule 1). Quotes are delivered 1-on-1 by a
 *     manager and never travel through the lead payload.
 *   - ToS consent is required; marketing consent is optional.
 *   - Phone normalised to E.164 at parse time (server trusts the
 *     parse output, not the raw form value).
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
 * Step 1 — contact. Phone is required (the only channel that
 * lets a manager reach a guest); name is optional (some users
 * want to stay anonymous until they hear back).
 */
export const stepContactSchema = z.object({
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
  name: z.string().trim().max(80, "consult.errors.name_too_long").optional(),
});

/**
 * Step 2 — goal. At least one treatment + at least one region;
 * `kind` is the form factor (visit Korea / treat locally) and
 * accepts both — some users are weighing both paths and we
 * shouldn't force a single choice up-front.
 */
export const stepGoalSchema = z.object({
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
 * Step 3 — photos + message + consents. All fields here are
 * optional except `consentTos` (gates submit) and at least the
 * presence of step 3 itself (the form can't submit without
 * landing on this step).
 */
export const stepPhotosSchema = z.object({
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
export const leadSubmitSchema = stepContactSchema.and(stepGoalSchema).and(stepPhotosSchema);

export type StepContactInput = z.input<typeof stepContactSchema>;
export type StepGoalInput = z.input<typeof stepGoalSchema>;
export type StepPhotosInput = z.input<typeof stepPhotosSchema>;

export type StepContact = z.output<typeof stepContactSchema>;
export type StepGoal = z.output<typeof stepGoalSchema>;
export type StepPhotos = z.output<typeof stepPhotosSchema>;
export type PhotoRef = z.output<typeof photoRefSchema>;
export type LeadSubmit = z.output<typeof leadSubmitSchema>;
