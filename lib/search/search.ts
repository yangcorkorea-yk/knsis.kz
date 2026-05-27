/*
 * lib/search/search.ts — unified case-insensitive substring search
 * over the M2 discovery dataset (treatments + clinics + reviews).
 *
 * MVP cut, per WBS M2-08. Postgres FTS (with locale-aware
 * tokenisation for Cyrillic + Hangul + Latin in the same column)
 * is the post-MVP destination; the dataset size today (≤ 30
 * treatments + < 200 clinics + < 50 reviews in active prod) is
 * small enough that an in-process linear scan over the bulk-fetched
 * set is faster than the round-trip, and it sidesteps the
 * tokenisation problem entirely.
 *
 * Matching happens against every locale slot of every searchable
 * field — a KZ user typing "필러" still hits the Korean title.
 * Each match counts once; per-field highlight info lives in the
 * renderer (HighlightedText splits the value separately).
 */

import type { TrilingualText } from "@/lib/i18n/tr";

export interface SearchableTreatment {
  id: string;
  slug: string;
  title: TrilingualText;
  summary: TrilingualText;
  category: string;
}

export interface SearchableClinic {
  id: string;
  slug: string;
  name: TrilingualText;
  kind: "korea" | "local";
  city: TrilingualText | null;
}

export interface SearchableReview {
  id: string;
  code: string;
  body: TrilingualText;
  rating: number;
  customerInitial: string;
  clinicSlug: string | null;
  clinicName: TrilingualText | null;
  treatmentSlug: string | null;
  treatmentTitle: TrilingualText | null;
}

export interface SearchInput {
  treatments: readonly SearchableTreatment[];
  clinics: readonly SearchableClinic[];
  reviews: readonly SearchableReview[];
}

export interface SearchOutput {
  treatments: SearchableTreatment[];
  clinics: SearchableClinic[];
  reviews: SearchableReview[];
  totalCount: number;
}

export function search(query: string, items: SearchInput): SearchOutput {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return { treatments: [], clinics: [], reviews: [], totalCount: 0 };
  }
  const treatments = items.treatments.filter((tx) => matchesTreatment(tx, q));
  const clinics = items.clinics.filter((c) => matchesClinic(c, q));
  const reviews = items.reviews.filter((r) => matchesReview(r, q));
  return {
    treatments,
    clinics,
    reviews,
    totalCount: treatments.length + clinics.length + reviews.length,
  };
}

function matchesAny(value: TrilingualText | null | undefined, q: string): boolean {
  if (!value) return false;
  for (const k of ["kz", "ru", "kr"] as const) {
    const v = value[k];
    if (typeof v === "string" && v.toLowerCase().includes(q)) return true;
  }
  return false;
}

function matchesTreatment(tx: SearchableTreatment, q: string): boolean {
  return matchesAny(tx.title, q) || matchesAny(tx.summary, q);
}

function matchesClinic(c: SearchableClinic, q: string): boolean {
  return matchesAny(c.name, q) || matchesAny(c.city, q);
}

function matchesReview(r: SearchableReview, q: string): boolean {
  return matchesAny(r.body, q) || matchesAny(r.clinicName, q) || matchesAny(r.treatmentTitle, q);
}
