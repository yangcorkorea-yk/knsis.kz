"use client";

/*
 * components/clinics/clinics-grid.tsx — client-filtered clinic
 * list. Mirrors the M2-02 categories-grid shape: useFilterableList
 * with the shared `matchClinic` predicate over the bulk dataset
 * fetched once by the server component.
 *
 * No PII rendered. Verified-only fed by the server.
 */

import { useTranslations } from "next-intl";
import { type DiscoveryFilters, matchClinic } from "@/lib/discover/filters";
import { useFilterableList } from "@/lib/discover/use-filterable-list";
import type { Locale } from "@/lib/i18n/config";
import { ClinicCard, type ClientClinicCardData } from "./clinic-card";

interface Props {
  filters: DiscoveryFilters;
  clinics: readonly ClientClinicCardData[];
  locale: Locale;
}

export function ClinicsGrid({ filters, clinics, locale }: Props) {
  const t = useTranslations("clinics");
  const visible = useFilterableList(clinics, filters, matchClinic);
  if (visible.length === 0) {
    return <p className="px-4 text-sm text-ink-mute">{t("empty")}</p>;
  }
  return (
    <ul className="flex flex-col gap-3 px-4">
      {visible.map((clinic) => (
        <li key={clinic.id}>
          <ClinicCard clinic={clinic} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
