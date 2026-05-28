/*
 * POST /api/leads — M3-03 consult-form submit endpoint.
 *
 * Pipeline:
 *   1. ensureGuestUserFromRequest (creates User row on first
 *      meaningful POST; bot UA short-circuits with 410)
 *   2. Parse + Zod-validate the body via leadSubmitSchema
 *   3. Composes createLead with real Prisma queries
 *   4. Fires the PM "new lead" Resend email — non-fatal on
 *      failure (the Lead row is already persisted; PM will
 *      still see it in the M5 admin inbox)
 *   5. Returns { code }
 *
 * Response shape:
 *   200 { code }                              — happy + idempotent reuse
 *   400 { ok: false, code: "validation" }     — Zod parse error
 *   400 { ok: false, code: "invalid_treatment" } — slug not in catalog
 *   410 { ok: false, code: "bot" }
 *   500 { ok: false, code: "internal" }       — Prisma surprise / code-gen exhausted
 *
 * Rate limit (5 leads / IP / day, 1 lead / phone / 10 min)
 * + Turnstile siteverify land in M3-05.
 */

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ensureGuestUserFromRequest } from "@/lib/auth/ensure-guest-user";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { createLead } from "@/lib/leads/create";
import { defaultDeps as codeGenDefaults, makeLeadCode } from "@/lib/leads/code-gen";
import { leadSubmitSchema } from "@/lib/leads/schema";
import { sendLeadCreatedEmail } from "@/lib/notifications/lead-created";
import { tr, type TrilingualText } from "@/lib/i18n/tr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  // Step 0 — locale hint from referer or Accept-Language. The
  // PM alert email needs a locale; default to kz per CLAUDE.md.
  const locale = pickLocaleFromRequest(req);

  // Step 1 — guest user (lazy create).
  const ensured = await ensureGuestUserFromRequest({ locale });
  if (ensured.kind === "bot") {
    return NextResponse.json({ ok: false, code: "bot" }, { status: 410 });
  }

  // Step 2 — body parse + Zod.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "validation" }, { status: 400 });
  }
  const parsed = leadSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "validation" }, { status: 400 });
  }
  const payload = parsed.data;
  const idempotencyKey = req.headers.get("idempotency-key") ?? undefined;

  // Step 3 — orchestrate.
  const result = await createLead(payload, {
    userId: ensured.userId,
    idempotencyKey,
    findExistingByKey: ({ userId, idempotencyKey }) =>
      prisma.lead.findFirst({
        where: {
          userId,
          idempotencyKey,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { code: true },
      }),
    resolveTreatmentSlugs: async (slugs) =>
      prisma.treatment.findMany({
        where: { slug: { in: slugs }, deletedAt: null },
        select: { slug: true, id: true },
      }),
    makeCode: () => makeLeadCode(codeGenDefaults),
    updateUserConsent: async ({ userId, phone, name, consentTos, consentMkt, consentedAt }) => {
      await prisma.user.update({
        where: { id: userId },
        data: { phone, name, consentTos, consentMkt, consentedAt },
      });
    },
    insertLead: ({
      userId,
      code,
      treatmentIds,
      regions,
      kind,
      channelPref,
      photos,
      message,
      idempotencyKey,
    }) =>
      prisma.lead.create({
        data: {
          userId,
          code,
          treatmentIds,
          regions,
          kind,
          channelPref,
          photos,
          message,
          idempotencyKey,
        },
        select: { code: true },
      }),
    isCodeUniqueViolation: (err) =>
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002" &&
      Array.isArray(err.meta?.target) &&
      (err.meta?.target as string[]).includes("code"),
  });

  if (!result.ok) {
    if (result.code === "invalid_treatment") {
      return NextResponse.json({ ok: false, code: "invalid_treatment" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500 });
  }

  // Step 4 — fire PM alert (only on a fresh create; the
  // idempotent reuse path already alerted the first time).
  if (!result.reused) {
    void notifyPm(result.code, locale, payload).catch(() => {
      // Notification failures are non-fatal — Lead is persisted.
    });
  }

  // Step 5 — return.
  return NextResponse.json({ code: result.code });
}

function pickLocaleFromRequest(req: Request): Locale {
  const referer = req.headers.get("referer") ?? "";
  const match = referer.match(/\/(kz|ru|kr)(?:\/|$)/);
  if (match && isLocale(match[1]!)) return match[1] as Locale;
  return "kz";
}

async function notifyPm(
  code: string,
  locale: Locale,
  payload: ReturnType<typeof leadSubmitSchema.parse>,
) {
  const treatments = await prisma.treatment.findMany({
    where: { slug: { in: payload.treatmentSlugs } },
    select: { slug: true, title: true },
  });
  const titleBySlug = new Map<string, TrilingualText>(
    treatments.map((t) => [t.slug, t.title as TrilingualText]),
  );
  const treatmentTitles = payload.treatmentSlugs.map((s) => {
    const title = titleBySlug.get(s);
    return title ? tr(title, locale) : s;
  });

  await sendLeadCreatedEmail({
    code,
    locale,
    phone: payload.phone,
    name: payload.name ?? null,
    treatmentTitles,
    regionLabels: payload.regions,
    kind: payload.kind,
    hasPhotos: payload.photos.length > 0,
    message: payload.message?.trim() ? payload.message.trim() : null,
    consentMkt: payload.consentMkt,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://seoulbeauty-kz.vercel.app",
  });
}
