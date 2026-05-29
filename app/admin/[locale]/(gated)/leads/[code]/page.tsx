/*
 * /admin/[locale]/leads/[code] — M5-03 lead drawer (read-only).
 *
 * Server page. Direct-link addressable: closes the M3 PM-alert
 * email loop (`Open: /admin/{locale}/leads/{code}`) which has been
 * 404'ing since lead capture shipped.
 *
 * The "drawer" is a regular route for MVP — the slide-in animation
 * + intercepting-routes overlay are a polish item. What matters is
 * that the URL deep-links to the right lead, requireRole gates it
 * (inherited from (gated)/layout.tsx), and the back link returns
 * to the list (the browser back-stack preserves filter state).
 *
 * Mutation controls (status / owner / clinic / notes) land in the
 * next commit. This one is read-only: fields + signed photo gallery
 * + notes list + activity feed.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LeadActivityLog } from "@/components/admin/lead-activity-log";
import {
  LeadDrawerFields,
  type LeadDrawerFieldsLabels,
} from "@/components/admin/lead-drawer-fields";
import { LeadNotesList } from "@/components/admin/lead-notes-list";
import { CITY_SLUGS, type CitySlug } from "@/lib/discover/filters";
import { LEAD_STATUSES } from "@/lib/admin/leads/filters";
import { fetchLeadDrawerByCode } from "@/lib/admin/leads/drawer-queries";
import { isLocale, LOCALES, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const LOCALE_TO_BCP47: Record<Locale, string> = { kz: "kk-KZ", ru: "ru-RU", kr: "ko-KR" };

export default async function AdminLeadDrawerPage({
  params: { locale, code },
}: {
  params: { locale: string; code: string };
}) {
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  setRequestLocale(activeLocale);

  const payload = await fetchLeadDrawerByCode(code);
  if (!payload) notFound();

  const t = await getTranslations("admin.leads");
  const td = await getTranslations("admin.leads.drawer");
  const tn = await getTranslations("admin.leads.notes");
  const ta = await getTranslations("admin.leads.activity");
  const tact = await getTranslations("admin.leads.activity.actions");

  const fmt = new Intl.DateTimeFormat(LOCALE_TO_BCP47[activeLocale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fieldsLabels: LeadDrawerFieldsLabels = {
    status: Object.fromEntries(LEAD_STATUSES.map((s) => [s, t(`status.${s}`)])) as Record<
      (typeof LEAD_STATUSES)[number],
      string
    >,
    fields: {
      name: td("fields.name"),
      phone: td("fields.phone"),
      email: td("fields.email"),
      whatsapp: td("fields.whatsapp"),
      telegram: td("fields.telegram"),
      preferredLanguage: td("fields.preferred_language"),
      channelPref: td("fields.channel_pref"),
      regions: td("fields.regions"),
      kind: td("fields.kind"),
      treatments: td("fields.treatments"),
      owner: td("fields.owner"),
      clinic: td("fields.clinic"),
      message: td("fields.message"),
      photos: td("fields.photos"),
      createdAt: td("fields.created_at"),
      updatedAt: td("fields.updated_at"),
    },
    kind: { korea: t("kind.korea"), local: t("kind.local") },
    region: Object.fromEntries(CITY_SLUGS.map((c) => [c, t(`region.${c}`)])) as Record<
      CitySlug,
      string
    >,
    localeLabels: Object.fromEntries(LOCALES.map((l) => [l, td(`locale.${l}`)])) as Record<
      string,
      string
    >,
    noPhotos: td("no_photos"),
    unassigned: t("unassigned"),
    none: td("none"),
  };

  const ACTIVITY_ACTIONS = [
    "lead.status.update",
    "lead.owner.assign",
    "lead.owner.unassign",
    "lead.clinic.assign",
    "lead.clinic.unassign",
    "lead.note.add",
  ] as const;

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href={`/admin/${activeLocale}/leads`}
        className="self-start text-xs font-medium text-rose-deep hover:underline"
      >
        ← {td("back")}
      </Link>
      <article className="flex flex-col gap-8 rounded-lg border border-line bg-paper p-6">
        <LeadDrawerFields
          lead={payload.lead}
          locale={activeLocale}
          labels={fieldsLabels}
          dateFormat={(d) => fmt.format(d)}
        />
        <LeadNotesList
          notes={payload.notes}
          labels={{ title: tn("title"), empty: tn("empty") }}
          dateFormat={(d) => fmt.format(d)}
        />
        <LeadActivityLog
          rows={payload.audit}
          labels={{
            title: ta("title"),
            empty: ta("empty"),
            // Action strings ("lead.status.update") have literal dots,
            // which next-intl reads as path separators. Catalog keys
            // use underscores; we slug-normalise the action at render
            // time so the row keeps its canonical `entity.field.verb`
            // shape in the audit log.
            actions: Object.fromEntries(
              ACTIVITY_ACTIONS.map((a) => [a, tact(a.replace(/\./g, "_"))]),
            ),
          }}
          dateFormat={(d) => fmt.format(d)}
        />
      </article>
    </section>
  );
}
