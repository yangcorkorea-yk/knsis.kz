/*
 * lib/korea-visit/create.ts — Korea Visit submission orchestrator.
 *
 * Creates a Lead (kind=["korea"], minimal — no treatment/region
 * required at this stage) PLUS a KoreaVisit row in one transaction.
 * If either insert fails, both roll back. Lead.code generation +
 * collision retry mirrors lib/leads/create.ts.
 *
 * Distinct from lib/leads/create.ts:
 *   - No treatment slug resolution (KV is "I want to visit" — the
 *     specific treatment is negotiated during the consult).
 *   - No photo seeding (deferred to drawer interaction).
 *   - No idempotency key today — re-submits create duplicate plans;
 *     PM ops cleanup if hit. Re-add when M3-style retry becomes a
 *     real client need.
 *   - WRITES the KoreaVisit row inside the same transaction as the
 *     Lead. The 1:1 relation in the schema means a Lead with kind=
 *     "korea" but no KoreaVisit row is a malformed state.
 *
 * DI pattern matches lib/admin/lead-mutations.ts (the M5-03 surface
 * established): production wrapper + `*Using(deps, ...)` pure form
 * for tests.
 */

import { Channel, Locale, LeadKind } from "@prisma/client";
import type { KvSubmit, KvAirport, KvInterpreterLang } from "./schema";

export interface KvCreateDeps {
  userId: string;
  makeCode: () => string;
  updateUserConsent: (params: {
    userId: string;
    phone: string;
    name: string;
    email: string | null;
    consentTos: boolean;
    consentMkt: boolean;
    consentedAt: Date;
  }) => Promise<void>;
  /**
   * Insert both rows in one transaction. Returns the persisted
   * Lead.code. Throws on unique-collision of Lead.code so the
   * caller can retry with a fresh code.
   */
  insertLeadAndVisit: (params: {
    userId: string;
    code: string;
    whatsappId: string | null;
    telegramId: string | null;
    preferredLanguage: Locale;
    message: string | null;
    visit: {
      dateFrom: Date;
      dateTo: Date;
      airport: KvAirport | null;
      hotelPref: string | null;
      interpreter: KvInterpreterLang | null;
      aftercareDays: number | null;
      notes: string | null;
    };
  }) => Promise<{ code: string }>;
  isCodeUniqueViolation: (error: unknown) => boolean;
}

export type KvCreateResult =
  | { ok: true; code: string }
  | { ok: false; code: "code_collision_exhausted" };

const MAX_CODE_RETRIES = 5;

function trimOrNull(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

export async function createKoreaVisitUsing(
  payload: KvSubmit,
  deps: KvCreateDeps,
): Promise<KvCreateResult> {
  await deps.updateUserConsent({
    userId: deps.userId,
    phone: payload.phone,
    name: payload.name,
    email: trimOrNull(payload.email),
    consentTos: true,
    consentMkt: payload.consentMkt,
    consentedAt: new Date(),
  });

  const visit = {
    dateFrom: new Date(payload.dateFrom),
    dateTo: new Date(payload.dateTo),
    airport: payload.airport,
    hotelPref: trimOrNull(payload.hotelPref),
    interpreter: payload.interpreter,
    aftercareDays: payload.aftercareDays,
    notes: trimOrNull(payload.notes),
  };

  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const code = deps.makeCode();
    try {
      const inserted = await deps.insertLeadAndVisit({
        userId: deps.userId,
        code,
        whatsappId: trimOrNull(payload.whatsappId),
        telegramId: trimOrNull(payload.telegramId),
        preferredLanguage: payload.preferredLanguage as Locale,
        message: trimOrNull(payload.notes),
        visit,
      });
      return { ok: true, code: inserted.code };
    } catch (e) {
      if (deps.isCodeUniqueViolation(e)) {
        lastError = e;
        continue;
      }
      throw e;
    }
  }

  void lastError;
  return { ok: false, code: "code_collision_exhausted" };
}

/**
 * Resolves a KvSubmit into the literal arrays Prisma writes for
 * Lead.kind / Lead.regions / Lead.channelPref / Lead.treatmentIds.
 * Exported so the production wrapper + tests share the same shape.
 */
export function leadShapeForKv(): {
  kind: LeadKind[];
  regions: string[];
  treatmentIds: string[];
  channelPref: Channel;
  photos: string[];
} {
  return {
    kind: [LeadKind.korea],
    regions: [],
    treatmentIds: [],
    channelPref: Channel.inapp,
    photos: [],
  };
}
