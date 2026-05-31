/*
 * components/admin/leads-pagination.tsx — prev/next links with
 * summary. Server-rendered; navigation uses next/link so the
 * server page re-fetches for the new page.
 */

import Link from "next/link";

interface Labels {
  prev: string;
  next: string;
  /** ICU-templated "{from}–{to} / {total}". */
  summary: string;
}

interface Props {
  locale: string;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  /** The serialised filter params WITHOUT the page key — pagination merges its own. */
  baseQuery: URLSearchParams;
  labels: Labels;
}

function buildHref(locale: string, baseQuery: URLSearchParams, page: number): string {
  const sp = new URLSearchParams(baseQuery);
  if (page > 1) sp.set("page", String(page));
  else sp.delete("page");
  const qs = sp.toString();
  return `/admin/${locale}/leads${qs ? `?${qs}` : ""}`;
}

function fillSummary(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function LeadsPagination({
  locale,
  page,
  pageCount,
  pageSize,
  total,
  baseQuery,
  labels,
}: Props) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  const prevHref = buildHref(locale, baseQuery, page - 1);
  const nextHref = buildHref(locale, baseQuery, page + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between border-t border-line bg-paper px-4 py-3 text-sm"
    >
      <span className="text-xs text-ink-mute">
        {fillSummary(labels.summary, {
          from: String(from),
          to: String(to),
          total: String(total),
        })}
      </span>
      <div className="flex items-center gap-2">
        {prevDisabled ? (
          <span className="rounded-md border border-line px-2 py-1 text-xs text-ink-mute opacity-50">
            {labels.prev}
          </span>
        ) : (
          <Link
            href={prevHref}
            className="rounded-md border border-line px-2 py-1 text-xs text-ink-body hover:bg-ground"
          >
            {labels.prev}
          </Link>
        )}
        {nextDisabled ? (
          <span className="rounded-md border border-line px-2 py-1 text-xs text-ink-mute opacity-50">
            {labels.next}
          </span>
        ) : (
          <Link
            href={nextHref}
            className="rounded-md border border-line px-2 py-1 text-xs text-ink-body hover:bg-ground"
          >
            {labels.next}
          </Link>
        )}
      </div>
    </nav>
  );
}
