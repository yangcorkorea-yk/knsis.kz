/*
 * lib/leads/create.ts — Lead create orchestration (M3-03).
 *
 * Pure helper — accepts injected dependencies (db lookup, code
 * generator, etc.) so vitest can drive it without a real Prisma
 * client. The route handler in `app/api/leads/route.ts` composes
 * this with real Prisma + the lead-created Resend notification.
 *
 * Flow per call:
 *   1. Idempotency check — if the request's Idempotency-Key has
 *      a Lead under this user in the last 24h, return that Lead's
 *      code (HTTP 200, same response shape — the client can't
 *      tell the difference from a fresh create).
 *   2. Resolve treatment slugs to IDs against the active
 *      Treatment list. Unknown slugs reject as `invalid_treatment`
 *      (not a 500 — this is a client-correctable error).
 *   3. Generate Lead.code via the injected makeCode helper;
 *      retry up to 5 times on the unique-constraint collision
 *      (suffix space is 10k, MVP volume is ~100/year, so this is
 *      defence in depth, not a likely path).
 *   4. Mark User.consentTos / consentMkt / consentedAt — every
 *     consult submit re-records consent timestamp (legal trail).
 *   5. Insert the Lead row with channelPref=inapp (the only
 *      channel we can guarantee outbound today), photos = path[],
 *      treatmentIds = resolved IDs, regions = whitelisted slugs,
 *      idempotencyKey persisted for the next retry.
 *   6. Return { code }.
 *
 * Hard rules satisfied:
 *   - channelPref locked to `inapp` (Channel.email/wa/tg/sms not
 *     written here — outbound goes through lib/messaging/send.ts)
 *   - No monetary field is written (Lead schema doesn't expose one)
 *   - consentTos timestamp captured (legal requirement)
 *   - PII (phone, name) lives in User columns — Supabase disk
 *     encryption covers this at-rest
 */

import { Channel } from "@prisma/client";
import type { LeadSubmit } from "./schema";

export interface CreateLeadDeps {
  /** Inject the user id from ensureGuestUserFromRequest. */
  userId: string;
  /** Idempotency-Key header value (may be undefined). */
  idempotencyKey: string | undefined;
  /**
   * Look up an existing lead for the (userId, idempotencyKey)
   * pair. Return the existing Lead.code or null.
   */
  findExistingByKey: (params: {
    userId: string;
    idempotencyKey: string;
  }) => Promise<{ code: string } | null>;
  /**
   * Resolve a list of treatment slugs to IDs. Skips unknown
   * slugs — caller checks length parity for whitelist enforcement.
   */
  resolveTreatmentSlugs: (slugs: string[]) => Promise<{ slug: string; id: string }[]>;
  /** Generate a candidate lead code (caller retries on collision). */
  makeCode: () => string;
  /** Update the User row with the latest consent state. */
  updateUserConsent: (params: {
    userId: string;
    phone: string;
    name: string | null;
    consentTos: boolean;
    consentMkt: boolean;
    consentedAt: Date;
  }) => Promise<void>;
  /**
   * Insert the Lead row. Returns the persisted Lead.code (the
   * caller doesn't re-derive it because Prisma may have collided
   * + the caller retried with a fresh code).
   */
  insertLead: (params: {
    userId: string;
    code: string;
    treatmentIds: string[];
    regions: string[];
    kind: ("korea" | "local")[];
    channelPref: Channel;
    photos: string[];
    message: string | null;
    idempotencyKey: string | null;
  }) => Promise<{ code: string }>;
  /** True if a unique-constraint violation on `Lead.code` is the cause. */
  isCodeUniqueViolation: (error: unknown) => boolean;
}

export type CreateLeadResult =
  | { ok: true; code: string; reused: boolean }
  | { ok: false; code: "invalid_treatment" | "code_collision_exhausted" };

const MAX_CODE_RETRIES = 5;

export async function createLead(
  payload: LeadSubmit,
  deps: CreateLeadDeps,
): Promise<CreateLeadResult> {
  // Step 1 — idempotency short-circuit.
  if (deps.idempotencyKey) {
    const existing = await deps.findExistingByKey({
      userId: deps.userId,
      idempotencyKey: deps.idempotencyKey,
    });
    if (existing) {
      return { ok: true, code: existing.code, reused: true };
    }
  }

  // Step 2 — treatment slug → ID whitelist.
  const resolved = await deps.resolveTreatmentSlugs(payload.treatmentSlugs);
  if (resolved.length !== payload.treatmentSlugs.length) {
    return { ok: false, code: "invalid_treatment" };
  }
  const treatmentIds = resolved.map((r) => r.id);

  // Step 4 — record consent timestamp + carry-forward phone/name.
  await deps.updateUserConsent({
    userId: deps.userId,
    phone: payload.phone,
    name: payload.name ?? null,
    consentTos: true,
    consentMkt: payload.consentMkt,
    consentedAt: new Date(),
  });

  // Step 3 + 5 — generate code with collision retry, insert.
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const code = deps.makeCode();
    try {
      const inserted = await deps.insertLead({
        userId: deps.userId,
        code,
        treatmentIds,
        regions: payload.regions,
        kind: payload.kind,
        channelPref: Channel.inapp,
        photos: payload.photos.map((p) => p.path),
        message: payload.message?.trim() ? payload.message.trim() : null,
        idempotencyKey: deps.idempotencyKey ?? null,
      });
      return { ok: true, code: inserted.code, reused: false };
    } catch (e) {
      if (deps.isCodeUniqueViolation(e)) {
        lastError = e;
        continue;
      }
      throw e;
    }
  }

  // 5 collisions in a row → operator visibility, not silent fail.
  if (lastError) {
    return { ok: false, code: "code_collision_exhausted" };
  }
  return { ok: false, code: "code_collision_exhausted" };
}
