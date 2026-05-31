/*
 * components/admin/lead-drawer-fields.tsx — read-only field render
 * for the lead drawer. Server component.
 *
 * Phone / WA / TG / photos all become visible here (the list view
 * intentionally hides them per PM Q5). Phone becomes a `tel:` link
 * for one-tap call; WhatsApp / Telegram open the respective
 * universal links — those don't depend on M4-02 chat infrastructure.
 *
 * Photo gallery uses signed URLs pre-minted by the route
 * (5-min TTL); we render them as `<img>` tags rather than `<Image>`
 * because the URL is short-lived and re-mints on every drawer open,
 * defeating next/image's optimisation cache.
 */

import type { LeadStatus } from "@prisma/client";
import type { LeadDrawerLeadView } from "@/lib/admin/leads/drawer-queries";
import { LeadStatusPill } from "./lead-status-pill";

export interface LeadDrawerFieldsLabels {
  status: Record<LeadStatus, string>;
  fields: {
    name: string;
    phone: string;
    email: string;
    whatsapp: string;
    telegram: string;
    preferredLanguage: string;
    channelPref: string;
    regions: string;
    kind: string;
    treatments: string;
    owner: string;
    clinic: string;
    message: string;
    photos: string;
    createdAt: string;
    updatedAt: string;
  };
  kind: { korea: string; local: string };
  region: Record<string, string>;
  localeLabels: Record<string, string>;
  noPhotos: string;
  unassigned: string;
  none: string;
}

interface Props {
  lead: LeadDrawerLeadView;
  /** Active UI locale — used to pick from Json `{kz, ru, kr}` fields. */
  locale: string;
  labels: LeadDrawerFieldsLabels;
  dateFormat: (d: Date) => string;
}

function pickLocalised(field: Record<string, string> | null, locale: string): string | null {
  if (!field) return null;
  return field[locale] ?? field.kz ?? field.ru ?? field.kr ?? null;
}

export function LeadDrawerFields({ lead, locale, labels, dateFormat }: Props) {
  const u = lead.user;
  const phoneHref = u.phone ? `tel:${u.phone.replace(/\s+/g, "")}` : null;
  const waHref = lead.whatsappId ? `https://wa.me/${lead.whatsappId.replace(/[^\d]/g, "")}` : null;
  const tgRaw = lead.telegramId ?? "";
  const tgHref = tgRaw ? `https://t.me/${tgRaw.startsWith("@") ? tgRaw.slice(1) : tgRaw}` : null;

  const regionLabels = lead.regions.map((s) => labels.region[s] ?? s).join(", ") || "—";
  const kindLabels =
    lead.kind
      .map((k) => labels.kind[k])
      .filter(Boolean)
      .join(" · ") || "—";
  const treatmentLabels =
    lead.treatments.map((t) => pickLocalised(t.title, locale) ?? t.slug).join(" · ") || "—";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4 border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-extrabold tracking-display text-ink">{lead.code}</h2>
          <LeadStatusPill status={lead.status} label={labels.status[lead.status]} />
        </div>
        <span className="text-xs text-ink-mute">{dateFormat(lead.createdAt)}</span>
      </header>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm md:grid-cols-2">
        <Field label={labels.fields.name}>{u.name ?? labels.none}</Field>
        <Field label={labels.fields.phone}>
          {phoneHref ? (
            <a href={phoneHref} className="text-rose-deep hover:underline">
              {u.phone}
            </a>
          ) : (
            labels.none
          )}
        </Field>
        <Field label={labels.fields.email}>
          {u.email ? (
            <a href={`mailto:${u.email}`} className="text-rose-deep hover:underline">
              {u.email}
            </a>
          ) : (
            labels.none
          )}
        </Field>
        <Field label={labels.fields.whatsapp}>
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-deep hover:underline"
            >
              {lead.whatsappId}
            </a>
          ) : (
            labels.none
          )}
        </Field>
        <Field label={labels.fields.telegram}>
          {tgHref ? (
            <a
              href={tgHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-deep hover:underline"
            >
              {lead.telegramId}
            </a>
          ) : (
            labels.none
          )}
        </Field>
        <Field label={labels.fields.preferredLanguage}>
          {lead.preferredLanguage
            ? (labels.localeLabels[lead.preferredLanguage] ?? lead.preferredLanguage)
            : (labels.localeLabels[u.locale] ?? u.locale)}
        </Field>
        <Field label={labels.fields.channelPref}>{lead.channelPref}</Field>
        <Field label={labels.fields.regions}>{regionLabels}</Field>
        <Field label={labels.fields.kind}>{kindLabels}</Field>
        <Field label={labels.fields.treatments} wide>
          {treatmentLabels}
        </Field>
        <Field label={labels.fields.owner}>
          {lead.owner ? (lead.owner.name ?? lead.owner.email ?? labels.none) : labels.unassigned}
        </Field>
        <Field label={labels.fields.clinic}>
          {lead.clinic
            ? (pickLocalised(lead.clinic.name, locale) ?? lead.clinic.slug)
            : labels.none}
        </Field>
        <Field label={labels.fields.updatedAt} wide>
          {dateFormat(lead.updatedAt)}
        </Field>
      </dl>

      {lead.message && (
        <section className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
            {labels.fields.message}
          </h3>
          <p className="whitespace-pre-wrap rounded-md border border-line bg-ground/40 p-3 text-sm leading-relaxed text-ink-body">
            {lead.message}
          </p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
          {labels.fields.photos}
        </h3>
        {lead.photoUrls.length === 0 ? (
          <p className="text-sm text-ink-mute">{labels.noPhotos}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {lead.photoUrls.map((p) =>
              p.url ? (
                <li key={p.path} className="overflow-hidden rounded-md border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.path}
                    className="block h-32 w-full object-cover"
                    loading="lazy"
                  />
                </li>
              ) : (
                <li
                  key={p.path}
                  className="flex h-32 items-center justify-center rounded-md border border-dashed border-line bg-ground/40 text-xs text-ink-mute"
                >
                  ⚠
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? "md:col-span-2" : ""}`}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-mute">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}
