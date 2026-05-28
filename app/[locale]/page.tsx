/*
 * /[locale] — Home (M2-01).
 *
 * Mobile-first landing surface. Server component, reads Prisma
 * directly for treatments / clinics / reviews seeded by M2-09.
 *
 * ISR cache: 60 seconds. Seed content changes rarely; an admin
 * edit (M5) becomes visible within one revalidation window. This
 * keeps the LCP budget (<2.5s on 3G) within reach without going
 * fully static.
 *
 * Sections (top-to-bottom):
 *   1. Hero — kicker + title + subtitle + consult CTA
 *   2. Search entry — input + submit (M2-08 wires up the real
 *      results page; for now the form submits as a GET)
 *   3. Popular categories — 9-tile grid of TreatmentCategory enum
 *      values, links to /[locale]/categories?cat=<id>
 *   4. Korea clinics strip — horizontal scroll, verified only
 *   5. Local clinics strip — same
 *   6. Reviews strip — horizontal scroll, state=published
 *
 * Hard rules check:
 *   - All copy from messages/{kz,ru,kr}.json (no hardcoded strings)
 *   - Trilingual JSON fields from DB resolved via lib/i18n/tr.ts
 *   - No monetary fields, no medical-claim phrasing (CLAUDE.md §2)
 *   - Disclaimer banner stays on /treatments/[slug] (M2-03), not here
 */

import { TreatmentCategory } from "@prisma/client";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CTA } from "@/components/ui/cta";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";

// Force dynamic rendering for now — the page reads Prisma at render
// time, and CI's `next build` step doesn't have DATABASE_URL. Switch
// to `revalidate = 60` (ISR) once the M2 finalize step wires the
// build secret. Vercel's per-request edge is fast enough that this
// doesn't blow the LCP budget for MVP traffic.
export const dynamic = "force-dynamic";

const CATEGORY_ORDER: readonly TreatmentCategory[] = [
  TreatmentCategory.skin,
  TreatmentCategory.botox,
  TreatmentCategory.filler,
  TreatmentCategory.lift,
  TreatmentCategory.acne,
  TreatmentCategory.pigment,
  TreatmentCategory.hair,
  TreatmentCategory.cosmetic,
  TreatmentCategory.scalp,
] as const;

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";

  const [koreaClinics, localClinics, reviews] = await Promise.all([
    prisma.clinic.findMany({
      where: { kind: "korea", verifyState: "verified", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.clinic.findMany({
      where: { kind: "local", verifyState: "verified", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.review.findMany({
      where: { state: "published" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        clinic: { select: { slug: true, name: true } },
        treatment: { select: { slug: true, title: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 bg-warm pb-24 md:max-w-3xl">
      {/* 1 · Hero */}
      <section className="px-4 pt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-rose-deep">
          {t("hero.kicker")}
        </p>
        <h1 className="mt-2 break-keep text-3xl font-extrabold leading-tight tracking-display text-ink">
          {t("hero.title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">{t("hero.subtitle")}</p>
        <CTA asChild className="mt-5" size="lg">
          <Link href={`/${activeLocale}/consult/new`}>{t("hero.cta_consult")}</Link>
        </CTA>
      </section>

      {/* 2 · Search entry */}
      <section className="px-4">
        <form action={`/${activeLocale}/search`} method="get" className="flex gap-2">
          <label htmlFor="home-search" className="sr-only">
            {t("search.placeholder")}
          </label>
          <Input
            id="home-search"
            name="q"
            type="search"
            placeholder={t("search.placeholder")}
            autoComplete="off"
          />
          <CTA type="submit" size="md" fullWidth={false} variant="ink">
            {t("search.submit")}
          </CTA>
        </form>
      </section>

      {/* 3 · Popular categories */}
      <section className="px-4" aria-labelledby="home-categories">
        <h2 id="home-categories" className="mb-3 text-base font-bold tracking-tight text-ink">
          {t("categories.title")}
        </h2>
        <ul className="grid grid-cols-3 gap-2">
          {CATEGORY_ORDER.map((cat) => (
            <li key={cat}>
              <Link
                href={`/${activeLocale}/categories?cat=${cat}`}
                className="flex h-20 items-center justify-center rounded-md border border-line-soft bg-paper text-center text-sm font-semibold text-ink-2 transition-colors hover:border-rose hover:bg-rose-tint hover:text-rose-deep"
              >
                {t(`categories.${cat}`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 · Korea clinics strip */}
      <ClinicStrip
        clinics={koreaClinics}
        locale={activeLocale}
        titleLabel={t("clinics_korea.title")}
        verifiedLabel={t("clinics_korea.verified")}
        emptyLabel={t("empty")}
      />

      {/* 5 · Local clinics strip */}
      <ClinicStrip
        clinics={localClinics}
        locale={activeLocale}
        titleLabel={t("clinics_local.title")}
        verifiedLabel={t("clinics_korea.verified")}
        emptyLabel={t("empty")}
      />

      {/* 6 · Reviews strip */}
      <section className="pl-4" aria-labelledby="home-reviews">
        <h2 id="home-reviews" className="mb-3 text-base font-bold tracking-tight text-ink">
          {t("reviews.title")}
        </h2>
        {reviews.length === 0 ? (
          <p className="pr-4 text-sm text-ink-mute">{t("empty")}</p>
        ) : (
          <ol className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-4">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="w-[260px] flex-none snap-start"
                aria-label={t("reviews.rating_label", { rating: r.rating })}
              >
                <Card className="h-full">
                  <CardContent className="space-y-2 pt-4">
                    <div className="text-sm font-semibold text-rose-deep" aria-hidden="true">
                      {"★".repeat(r.rating)}
                      <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                    </div>
                    <p className="line-clamp-3 text-sm text-ink-body">{tr(r.body, activeLocale)}</p>
                    {r.clinic && (
                      <p className="text-xs text-ink-mute">{tr(r.clinic.name, activeLocale)}</p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

interface ClinicCardData {
  id: string;
  slug: string;
  name: unknown;
  verifyState: string;
  location: unknown;
}

function ClinicStrip({
  clinics,
  locale,
  titleLabel,
  verifiedLabel,
  emptyLabel,
}: {
  clinics: ClinicCardData[];
  locale: Locale;
  titleLabel: string;
  verifiedLabel: string;
  emptyLabel: string;
}) {
  const headingId = `home-clinics-${titleLabel.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className="pl-4" aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-base font-bold tracking-tight text-ink">
        {titleLabel}
      </h2>
      {clinics.length === 0 ? (
        <p className="pr-4 text-sm text-ink-mute">{emptyLabel}</p>
      ) : (
        <ol className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-4">
          {clinics.map((c) => {
            const loc = (c.location ?? {}) as { city?: string };
            return (
              <li key={c.id} className="w-[220px] flex-none snap-start">
                <Link href={`/${locale}/clinics/${c.slug}`} className="block h-full">
                  <Card className="h-full transition-shadow hover:shadow-card">
                    <CardContent className="space-y-2 pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold text-ink">
                          {tr(c.name, locale)}
                        </p>
                      </div>
                      <p className="text-xs text-ink-mute">{loc.city ?? ""}</p>
                      {c.verifyState === "verified" && (
                        <Badge tone="success" size="sm">
                          {verifiedLabel}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
