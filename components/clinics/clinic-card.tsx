"use client";

/*
 * components/clinics/clinic-card.tsx — single clinic entry on the
 * /[locale]/clinics list.
 *
 * Pure presentation; navigates to /[locale]/clinics/[slug] via a
 * Next.js Link. Card visuals follow the prototype clinic strip
 * (`docs/prototype/screens-a.jsx` line 632) — verified badge,
 * korea/local kind chip, interpreter language chips, treatment
 * count subtext.
 *
 * a11y: focus-visible ring uses the same ink-mute (#8A8A8A) treatment
 * as the categories filter pills so the focus outline stays
 * decoupled from the rose active palette (M2-02 PR #6 trade-off).
 */

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ClinicKind } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";

export interface ClientClinicCardData {
  id: string;
  slug: string;
  kind: ClinicKind;
  name: { kz?: string | null; ru?: string | null; kr?: string | null };
  city: string;
  cityI18n?: { kz?: string | null; ru?: string | null; kr?: string | null };
  interpreters: string[];
  treatmentCount: number;
  verified: boolean;
}

interface Props {
  clinic: ClientClinicCardData;
  locale: Locale;
}

export function ClinicCard({ clinic, locale }: Props) {
  const t = useTranslations("clinics");
  const cityDisplay = clinic.cityI18n ? tr(clinic.cityI18n, locale) : clinic.city;
  return (
    <Link
      href={`/${locale}/clinics/${clinic.slug}`}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
    >
      <Card className="h-full">
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <p className="break-keep text-sm font-semibold text-ink">{tr(clinic.name, locale)}</p>
            <div className="flex shrink-0 gap-1">
              {clinic.kind === "korea" ? (
                <Badge tone="korea" size="sm">
                  {t("kind.korea")}
                </Badge>
              ) : (
                <Badge tone="lav" size="sm">
                  {t("kind.local")}
                </Badge>
              )}
              {clinic.verified && (
                <Badge tone="success" size="sm">
                  {t("verified")}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-ink-mute">{cityDisplay}</p>
          {clinic.interpreters.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {clinic.interpreters.map((lang) => (
                <Badge key={lang} tone="beige" size="sm">
                  {t(`filter.language.${lang}`)}
                </Badge>
              ))}
            </div>
          )}
          <p className="pt-1 text-[11px] text-ink-mute">
            {t("card.treatment_count", { count: clinic.treatmentCount })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
