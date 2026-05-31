/*
 * /admin/[locale]/leads/[code] — M5-03 lead drawer.
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
 * Sections (top-down):
 *   1. Fields — all the PII-sensitive surface (phone tel: link,
 *      WA / TG universal links, photo gallery via 5-min signed URLs).
 *   2. Controls (canEdit only) — status pill picker, owner +
 *      clinic dropdowns. Every mutation routes through withAudit.
 *   3. Notes list + composer (canEdit only).
 *   4. Activity log — newest-first AuditLog rows for this Lead.
 *
 * Permission split (PM spec):
 *   - support → read-only (no control surface rendered)
 *   - manager / head / admin → full read + write
 */

import { Role } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LeadActivityLog } from "@/components/admin/lead-activity-log";
import { LeadClinicControl } from "@/components/admin/lead-clinic-control";
import {
  LeadDrawerFields,
  type LeadDrawerFieldsLabels,
} from "@/components/admin/lead-drawer-fields";
import { LeadNoteComposer } from "@/components/admin/lead-note-composer";
import { LeadNotesList } from "@/components/admin/lead-notes-list";
import { LeadOwnerControl } from "@/components/admin/lead-owner-control";
import { LeadStatusControl } from "@/components/admin/lead-status-control";
import { requireRole } from "@/lib/auth/require-role";
import { CITY_SLUGS, type CitySlug } from "@/lib/discover/filters";
import { LEAD_STATUSES } from "@/lib/admin/leads/filters";
import { fetchLeadDrawerByCode } from "@/lib/admin/leads/drawer-queries";
import { fetchClinicOptions, fetchStaffOptions } from "@/lib/admin/leads/queries";
import { EDITOR_ROLES } from "@/lib/admin/mutation-helpers";
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

  // Layout already enforces requireRole(STAFF_ROLES); we re-check
  // here to surface the actor's role for permission-gated controls.
  // The cookie roundtrip is cheap; the gate is the source of truth.
  const gate = await requireRole([Role.support, Role.manager, Role.head, Role.admin]);
  if (!gate.ok) redirect(`/admin/${activeLocale}/sign-in`);
  const canEdit = (EDITOR_ROLES as readonly Role[]).includes(gate.session.role);

  const [payload, staffOptions, clinicOptions] = await Promise.all([
    fetchLeadDrawerByCode(code),
    canEdit ? fetchStaffOptions() : Promise.resolve([]),
    canEdit ? fetchClinicOptions() : Promise.resolve([]),
  ]);
  if (!payload) notFound();

  const t = await getTranslations("admin.leads");
  const td = await getTranslations("admin.leads.drawer");
  const tn = await getTranslations("admin.leads.notes");
  const tc = await getTranslations("admin.leads.controls");
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
        {canEdit && (
          <section className="grid grid-cols-1 gap-4 rounded-md bg-ground/40 p-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5 md:col-span-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-mute">
                {tc("status_label")}
              </span>
              <LeadStatusControl
                code={payload.lead.code}
                current={payload.lead.status}
                labels={
                  Object.fromEntries(LEAD_STATUSES.map((s) => [s, t(`status.${s}`)])) as Record<
                    (typeof LEAD_STATUSES)[number],
                    string
                  >
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-mute">
                {tc("owner_label")}
              </span>
              <LeadOwnerControl
                code={payload.lead.code}
                currentOwnerId={payload.lead.owner?.id ?? null}
                staffOptions={staffOptions.map((s) => ({
                  id: s.id,
                  name: s.name,
                  email: s.email,
                }))}
                labels={{ unassigned: t("unassigned"), placeholder: tc("owner_label") }}
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-mute">
                {tc("clinic_label")}
              </span>
              <LeadClinicControl
                code={payload.lead.code}
                currentClinicId={payload.lead.clinic?.id ?? null}
                clinicOptions={clinicOptions.map((c) => ({
                  id: c.id,
                  label:
                    (c.name && (c.name[activeLocale] ?? c.name.kz ?? c.name.ru ?? c.name.kr)) ??
                    c.slug,
                }))}
                labels={{ none: tc("clinic_none"), placeholder: tc("clinic_label") }}
              />
            </div>
          </section>
        )}
        <LeadNotesList
          notes={payload.notes}
          labels={{ title: tn("title"), empty: tn("empty") }}
          dateFormat={(d) => fmt.format(d)}
        />
        {canEdit && (
          <LeadNoteComposer
            code={payload.lead.code}
            labels={{
              placeholder: tn("placeholder"),
              submit: tn("submit"),
              submitting: tn("submitting"),
            }}
          />
        )}
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
