/*
 * /[locale]/clinics — verified clinic list (M2-04).
 *
 * Server component. Bulk-fetches verified clinics in one shot
 * (same shape as M2-02 categories): the dataset is small enough
 * to ship to a client island that runs all filter + count math
 * in-memory. Pill taps never touch the network — see
 * docs/runbook/optimistic-feedback.md §"When client-side filtering
 * wins".
 *
 * Filter axes (URL-state, parsed by lib/discover/filters.ts):
 *   - area   : seoul / busan / almaty / astana
 *   - kind   : korea / local
 *   - language: kz / ru / kr / en (interpreter availability)
 *
 * Hard rules check:
 *   - All static copy from messages/{kz,ru,kr}.json (`clinics.*`)
 *   - Clinic.name + cityI18n via tr.ts (M2-09 three-locale seed)
 *   - No monetary fields, no medical-claim phrasing
 *   - No PII (verified clinic records only)
 *   - Disclaimer lands on /clinics/[slug] (not on the list page)
 */

import { setRequestLocale } from "next-intl/server";
import { type ClientClinicCardData } from "@/components/clinics/clinic-card";
import { ClinicsIsland } from "@/components/clinics/clinics-island";
import { prisma } from "@/lib/db/client";
import { parseFilters } from "@/lib/discover/filters";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function ClinicsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const initialFilters = parseFilters(searchParams);

  const clinics = await prisma.clinic.findMany({
    where: { deletedAt: null, verifyState: "verified" },
    select: {
      id: true,
      slug: true,
      kind: true,
      name: true,
      location: true,
      interpreters: true,
      treatmentIds: true,
      verifyState: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const cardData: ClientClinicCardData[] = clinics.flatMap((c) => {
    const loc = c.location as { city?: unknown; cityI18n?: unknown } | null;
    const city = typeof loc?.city === "string" ? loc.city : "";
    if (city.length === 0) return [];
    return [
      {
        id: c.id,
        slug: c.slug,
        kind: c.kind,
        name: c.name as ClientClinicCardData["name"],
        city,
        cityI18n: loc?.cityI18n as ClientClinicCardData["cityI18n"],
        interpreters: c.interpreters,
        treatmentCount: c.treatmentIds.length,
        verified: c.verifyState === "verified",
      },
    ];
  });

  return <ClinicsIsland initialFilters={initialFilters} clinics={cardData} locale={activeLocale} />;
}
