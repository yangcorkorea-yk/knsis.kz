/*
 * POST /api/korea-visit — M4-01 Korea Visit submit endpoint.
 *
 * Pipeline mirrors `app/api/leads/route.ts` (M3 consult) but with
 * the KV-specific create orchestration:
 *   1. ensureGuestUserFromRequest (creates User row on first
 *      meaningful POST; bot UA → 410)
 *   2. Parse + Zod-validate body via kvSubmitSchema
 *   3. createKoreaVisitUsing → Lead + KoreaVisit in one tx
 *
 * Anti-abuse (Turnstile + rate limits) NOT wired yet — KV is a
 * lower-volume entry than /consult, so a uniform pass across all
 * customer endpoints lands as a polish follow-up. The endpoint is
 * still server-side validated and bot-UA-gated.
 *
 * Response shape mirrors /api/leads:
 *   200 { code }                                   — happy
 *   400 { ok: false, code: "validation" }          — Zod parse error
 *   410 { ok: false, code: "bot" }                 — UA matched bot regex
 *   500 { ok: false, code: "internal" }            — collision exhausted / Prisma surprise
 */

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureGuestUserFromRequest } from "@/lib/auth/ensure-guest-user";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { defaultDeps as codeGenDefaults, makeLeadCode } from "@/lib/leads/code-gen";
import { createKoreaVisitUsing, leadShapeForKv } from "@/lib/korea-visit/create";
import { kvSubmitSchema } from "@/lib/korea-visit/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const locale = pickLocaleFromRequest(req);

  const ensured = await ensureGuestUserFromRequest({ locale });
  if (ensured.kind === "bot") {
    return NextResponse.json({ ok: false, code: "bot" }, { status: 410 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "validation" }, { status: 400 });
  }
  const parsed = kvSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "validation" }, { status: 400 });
  }
  const payload = parsed.data;
  const shape = leadShapeForKv();

  const result = await createKoreaVisitUsing(payload, {
    userId: ensured.userId,
    makeCode: () => makeLeadCode(codeGenDefaults),
    updateUserConsent: async ({
      userId,
      phone,
      name,
      email,
      consentTos,
      consentMkt,
      consentedAt,
    }) => {
      await prisma.user.update({
        where: { id: userId },
        data: { phone, name, email: email ?? undefined, consentTos, consentMkt, consentedAt },
      });
    },
    insertLeadAndVisit: async (params) => {
      // Single transaction — Lead row first, then KoreaVisit (1:1
      // FK enforced via Lead.id). If KoreaVisit insert collides
      // (impossible — KV.leadId is unique and the Lead.id is fresh),
      // the whole tx rolls back so we don't leave a phantom Lead.
      return prisma.$transaction(async (tx) => {
        const lead = await tx.lead.create({
          data: {
            userId: params.userId,
            code: params.code,
            ...shape,
            whatsappId: params.whatsappId,
            telegramId: params.telegramId,
            preferredLanguage: params.preferredLanguage,
            message: params.message,
          },
          select: { id: true, code: true },
        });
        await tx.koreaVisit.create({
          data: {
            leadId: lead.id,
            dateFrom: params.visit.dateFrom,
            dateTo: params.visit.dateTo,
            airport: params.visit.airport,
            hotelPref: params.visit.hotelPref,
            interpreter: params.visit.interpreter,
            aftercareDays: params.visit.aftercareDays,
            notes: params.visit.notes,
          },
        });
        return { code: lead.code };
      });
    },
    isCodeUniqueViolation: (err) =>
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002" &&
      Array.isArray(err.meta?.target) &&
      (err.meta?.target as string[]).includes("code"),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500 });
  }
  return NextResponse.json({ code: result.code });
}

function pickLocaleFromRequest(req: Request): Locale {
  const referer = req.headers.get("referer") ?? "";
  const match = referer.match(/\/(kz|ru|kr)(?:\/|$)/);
  if (match && isLocale(match[1]!)) return match[1] as Locale;
  return "kz";
}
