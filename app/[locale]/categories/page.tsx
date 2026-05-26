/*
 * /[locale]/categories — discovery grid (M2-02).
 *
 * Server component. Fetches the entire discovery dataset (verified
 * clinics + treatments) ONCE per request and ships it to a client
 * island that runs all filter / count math in-memory. Pill taps stay
 * on the client and don't hit the network — they used to fan out to
 * a Vercel ICN → IAD function → Supabase EU round-trip (1–2 s for
 * KZ users), which optimistic-UI patching never fully hid.
 *
 * Bulk fetch sizes (MVP, single-region seed):
 *   - Treatments: ~25 rows (id, title, summary, category)
 *   - Verified clinics: low hundreds at most (id, treatmentIds,
 *     location.city, interpreters)
 *   - Both coarse-grained; nothing PII; payload < 50 KB gzipped.
 *
 * Hard rules check:
 *   - All copy from messages/{kz,ru,kr}.json (`categories.*`)
 *   - Treatment.title resolved via lib/i18n/tr.ts (kz fallback)
 *   - No monetary fields, no medical-claim phrasing
 *   - No PII rendered (treatments + counts only)
 */

import { setRequestLocale } from "next-intl/server";
import { type ClientClinic, type ClientTreatment } from "@/components/discover/categories-grid";
import { CategoriesIsland } from "@/components/discover/categories-island";
import { prisma } from "@/lib/db/client";
import { parseFilters } from "@/lib/discover/filters";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const initialFilters = parseFilters(searchParams);

  const [clinics, treatments] = await Promise.all([
    prisma.clinic.findMany({
      where: { deletedAt: null, verifyState: "verified" },
      select: { id: true, treatmentIds: true, location: true, interpreters: true, kind: true },
    }),
    prisma.treatment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, summary: true, category: true },
    }),
  ]);

  const clientClinics: ClientClinic[] = clinics.flatMap((c) => {
    const city = (c.location as { city?: unknown } | null)?.city;
    if (typeof city !== "string" || city.length === 0) return [];
    return [
      {
        id: c.id,
        treatmentIds: c.treatmentIds,
        city,
        interpreters: c.interpreters,
        kind: c.kind,
      },
    ];
  });

  const clientTreatments: ClientTreatment[] = treatments.map((tx) => ({
    id: tx.id,
    title: tx.title as ClientTreatment["title"],
    summary: tx.summary as ClientTreatment["summary"],
    category: tx.category,
  }));

  return (
    <CategoriesIsland
      initialFilters={initialFilters}
      treatments={clientTreatments}
      clinics={clientClinics}
      locale={activeLocale}
    />
  );
}
