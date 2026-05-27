"use client";

/*
 * components/search/recent-searches.tsx
 *
 * sessionStorage-backed "recent searches" panel + tracker. Two
 * exports:
 *
 *   <RecentSearchesTracker query={q} /> — write-only client island
 *      placed on the results page; on mount it pushes the current
 *      query to the front of the recent list, dedupes, and trims to
 *      the cap (5).
 *
 *   <RecentSearchesList locale={l} label={…} clearLabel={…} />
 *      — read-only panel for the empty (no-query) state. Renders
 *      the stored queries as <Link>s back to /search?q=… and a
 *      "clear history" action.
 *
 * sessionStorage (not localStorage) by design — the spec calls
 * for "recent searches in session", not a persistent profile. No
 * PII concerns + cleared when the tab closes.
 *
 * Server snapshot of either component is empty (the data is in
 * the browser only); both gracefully render nothing during SSR
 * and populate after hydration.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const KEY = "knsis:recent-searches";
const CAP = 5;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").slice(0, CAP);
  } catch {
    return [];
  }
}

function writeRecent(values: readonly string[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(values.slice(0, CAP)));
  } catch {
    /* quota / privacy modes — silently drop. */
  }
}

interface TrackerProps {
  query: string;
}

export function RecentSearchesTracker({ query }: TrackerProps) {
  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) return;
    const prev = readRecent();
    const next = [q, ...prev.filter((v) => v.toLowerCase() !== q.toLowerCase())].slice(0, CAP);
    writeRecent(next);
  }, [query]);
  return null;
}

interface ListProps {
  locale: string;
  label: string;
  clearLabel: string;
}

export function RecentSearchesList({ locale, label, clearLabel }: ListProps) {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setRecent(readRecent());
  }, []);

  const clear = useCallback(() => {
    writeRecent([]);
    setRecent([]);
  }, []);

  if (recent.length === 0) return null;
  return (
    <section className="px-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
          {label}
        </h2>
        <button
          type="button"
          onClick={clear}
          className="rounded text-[11px] text-ink-mute hover:text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
        >
          {clearLabel}
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {recent.map((q) => (
          <li key={q}>
            <Link
              href={`/${locale}/search?q=${encodeURIComponent(q)}`}
              className="inline-flex items-center rounded-full border border-line-soft bg-paper px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-ground hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
            >
              {q}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
