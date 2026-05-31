/*
 * /admin/[locale]/leads — M5-03 leads workbench.
 *
 * Server page. Parses URL filters via `parseAdminLeadsFilters`,
 * fetches the matching slice + total via `fetchAdminLeadsPage`, and
 * renders three pieces:
 *
 *   1. <LeadsFilterBar> — client island. URL ⇄ controls.
 *   2. <LeadsTable> — server. Columns per PM Q5: code · status ·
 *      name · city · kind · createdAt. Phone is intentionally
 *      omitted (drawer-only per PII minimisation).
 *   3. <LeadsPagination> — server. 50/page, prev/next links.
 *
 * `dynamic = "force-dynamic"` because the page depends on the
 * cookie-driven role check (inherited from the (gated) layout) and
 * on user-supplied search params. Caching it would serve stale
 * rows + leak one staff member's filter view to another.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { LeadsFilterBar, type LeadsFilterBarLabels } from "@/components/admin/leads-filter-bar";
import { LeadsPagination } from "@/components/admin/leads-pagination";
import { LeadsTable } from "@/components/admin/leads-table";
import { CITY_SLUGS, type CitySlug } from "@/lib/discover/filters";
import {
  parseAdminLeadsFilters,
  serializeAdminLeadsFilters,
  LEAD_STATUSES,
  LEAD_KINDS,
} from "@/lib/admin/leads/filters";
import { fetchAdminLeadsPage, fetchStaffOptions } from "@/lib/admin/leads/queries";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const LOCALE_TO_BCP47: Record<Locale, string> = { kz: "kk-KZ", ru: "ru-RU", kr: "ko-KR" };

export default async function AdminLeadsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  setRequestLocale(activeLocale);
  const t = await getTranslations("admin.leads");

  const filters = parseAdminLeadsFilters(searchParams);
  const [pageData, staffOptions] = await Promise.all([
    fetchAdminLeadsPage(filters),
    fetchStaffOptions(),
  ]);

  const filterLabels: LeadsFilterBarLabels = {
    searchPlaceholder: t("search_placeholder"),
    statusLabel: t("filter.status_label"),
    kindLabel: t("filter.kind_label"),
    regionLabel: t("filter.region_label"),
    ownerLabel: t("filter.owner_label"),
    hasPhoto: t("filter.has_photo"),
    clear: t("filter.clear"),
    unassigned: t("unassigned"),
    status: Object.fromEntries(LEAD_STATUSES.map((s) => [s, t(`status.${s}`)])) as Record<
      (typeof LEAD_STATUSES)[number],
      string
    >,
    kind: { korea: t("kind.korea"), local: t("kind.local") },
    region: Object.fromEntries(CITY_SLUGS.map((c) => [c, t(`region.${c}`)])) as Record<
      CitySlug,
      string
    >,
  };

  const tableLabels = {
    table: {
      code: t("table.code"),
      status: t("table.status"),
      name: t("table.name"),
      city: t("table.city"),
      kind: t("table.kind"),
      createdAt: t("table.created_at"),
    },
    status: Object.fromEntries(LEAD_STATUSES.map((s) => [s, t(`status.${s}`)])) as Record<
      (typeof LEAD_STATUSES)[number],
      string
    >,
    kind: Object.fromEntries(LEAD_KINDS.map((k) => [k, t(`kind.${k}`)])) as Record<
      (typeof LEAD_KINDS)[number],
      string
    >,
    region: Object.fromEntries(CITY_SLUGS.map((c) => [c, t(`region.${c}`)])) as Record<
      string,
      string
    >,
    empty: t("empty"),
    emptyFiltered: t("empty_filtered"),
  };

  const baseQuery = serializeAdminLeadsFilters({ ...filters, page: 1 });
  const tag = LOCALE_TO_BCP47[activeLocale];
  const fmt = new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isFiltered =
    filters.status.length > 0 ||
    filters.kind !== null ||
    filters.region !== null ||
    filters.owner !== null ||
    filters.hasPhoto ||
    filters.q !== null;

  return (
    <section className="flex flex-col gap-0">
      <header className="flex flex-col gap-1 px-4 pb-3 pt-1">
        <h1 className="break-keep text-xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
      </header>
      <div className="overflow-hidden rounded-lg border border-line">
        <LeadsFilterBar locale={activeLocale} staffOptions={staffOptions} labels={filterLabels} />
        <LeadsTable
          locale={activeLocale}
          rows={pageData.rows}
          labels={tableLabels}
          emptyIsFiltered={isFiltered}
          dateFormat={(d) => fmt.format(d)}
        />
        <LeadsPagination
          locale={activeLocale}
          page={pageData.page}
          pageCount={pageData.pageCount}
          pageSize={pageData.pageSize}
          total={pageData.total}
          baseQuery={baseQuery}
          labels={{
            prev: t("pagination.prev"),
            next: t("pagination.next"),
            summary: t("pagination.summary"),
          }}
        />
      </div>
    </section>
  );
}
