/*
 * POST /api/leads — M3 consult-form submit endpoint.
 *
 * Pipeline:
 *   1. ensureGuestUserFromRequest (creates User row on first
 *      meaningful POST; bot UA short-circuits with 410)
 *   2. Parse + Zod-validate the body via leadSubmitSchema
 *   2.5. Turnstile siteverify — skipped automatically when
 *        TURNSTILE_SECRET_KEY is blank (dev mock)
 *   2.6. Rate limit — 5 leads / user / 24h + 1 / phone / 10 min
 *   3. Composes createLead with real Prisma queries
 *      (idempotency-key short-circuit lives inside createLead)
 *   4. Fires the PM "new lead" Resend email — non-fatal on
 *      failure (the Lead row is already persisted; PM will
 *      still see it in the M5 admin inbox)
 *   5. Returns { code }
 *
 * Response shape:
 *   200 { code }                                 — happy + idempotent reuse
 *   400 { ok: false, code: "validation" }        — Zod parse error
 *   400 { ok: false, code: "invalid_treatment" } — slug not in catalog
 *   403 { ok: false, code: "turnstile_invalid"
 *                       | "turnstile_unreachable" } — CAPTCHA failure
 *   410 { ok: false, code: "bot" }               — UA matched bot regex
 *   429 { ok: false, code: "rate_user_day"
 *                       | "rate_phone_window" } — rate limit
 *   500 { ok: false, code: "internal" }          — Prisma / code-gen surprise
 */

import { Prisma } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { ensureGuestUserFromRequest } from "@/lib/auth/ensure-guest-user";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { createLead } from "@/lib/leads/create";
import { defaultDeps as codeGenDefaults, makeLeadCode } from "@/lib/leads/code-gen";
import { leadSubmitSchema } from "@/lib/leads/schema";
import { sendLeadCreatedEmail } from "@/lib/notifications/lead-created";
import { checkLeadRateLimits } from "@/lib/ratelimit/lead-limits";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";
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

  // Step 2.5 — Turnstile gate (skipped automatically in dev when
  // TURNSTILE_SECRET_KEY is blank). Runs before the rate-limit
  // check so a CAPTCHA-failing bot doesn't poison the user/phone
  // window with attempts.
  const turnstileToken = req.headers.get("cf-turnstile-response");
  const remoteIp =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const turnstile = await verifyTurnstileToken(turnstileToken, { remoteIp });
  if (!turnstile.ok) {
    return NextResponse.json({ ok: false, code: turnstile.code }, { status: 403 });
  }

  // Step 2.6 — rate limits (5 leads / user / day, 1 lead / phone /
  // 10 min). User-bound instead of IP-bound (PII hygiene); phone
  // bucket catches the cookie-cycle attacker. Per the lead-channel-
  // strategy doc, idempotency-key reuse short-circuits inside
  // createLead so a retry of a successful submit doesn't bump
  // these counters.
  const rateCheck = await checkLeadRateLimits(
    { userId: ensured.userId, phone: payload.phone },
    {
      countLeadsForUser: ({ userId, since }) =>
        prisma.lead.count({
          where: { userId, createdAt: { gte: since } },
        }),
      countLeadsForPhone: ({ phone, since }) =>
        prisma.lead.count({
          where: { user: { phone }, createdAt: { gte: since } },
        }),
    },
  );
  if (!rateCheck.ok) {
    return NextResponse.json({ ok: false, code: rateCheck.code }, { status: 429 });
  }

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
      whatsappId,
      telegramId,
      preferredLanguage,
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
          whatsappId,
          telegramId,
          preferredLanguage,
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
  //
  // History:
  //   - M3-03 shipped `void notifyPm(...).catch(...)` (fire-and-forget).
  //     Vercel killed the function context the moment the response
  //     returned, cutting the Resend.send() fetch mid-flight. No
  //     log, no error, no email. Captured in
  //     `docs/runbook/vercel-fire-and-forget.md`.
  //   - M3 hotfix (PR #14) switched to `await notifyPm(...)`. Worked,
  //     added ~300-700 ms to lead-submit latency.
  //   - M3 closure (this commit): switched to `waitUntil(notifyPm(...))`
  //     from `@vercel/functions`. Vercel keeps the function context
  //     alive until the registered promise resolves, so the user's
  //     response returns in <100 ms again AND the background work
  //     actually completes (no cut-off, unlike the original
  //     fire-and-forget). M-POST queue carve (CLAUDE.md §4) is
  //     untouched — `waitUntil` is a runtime helper, not a job queue.
  //
  // Error inside notifyPm is logged but non-fatal: Lead row is
  // already persisted, M5 admin inbox surfaces it once M5 ships.
  if (!result.reused) {
    console.log(`[lead-created] code=${result.code} locale=${locale} — scheduling PM alert`);
    waitUntil(
      notifyPm(result.code, locale, payload)
        .then(() => {
          console.log(`[lead-created] code=${result.code} — PM alert dispatched`);
        })
        .catch((err) => {
          console.error(
            `[lead-created] code=${result.code} — PM alert failed (non-fatal):`,
            err instanceof Error ? err.message : err,
          );
        }),
    );
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
    name: payload.name,
    whatsappId: payload.whatsappId ?? null,
    telegramId: payload.telegramId ?? null,
    preferredLanguage: payload.preferredLanguage,
    treatmentTitles,
    regionLabels: payload.regions,
    kind: payload.kind,
    hasPhotos: payload.photos.length > 0,
    message: payload.message?.trim() ? payload.message.trim() : null,
    consentMkt: payload.consentMkt,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://seoulbeauty-kz.vercel.app",
  });
}
