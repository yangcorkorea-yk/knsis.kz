/*
 * lib/discover/filters.ts — URL searchParams ⇄ typed discovery filters,
 * pure predicates, and a pure reducer for filter toggling.
 *
 * The /[locale]/categories page reads three filter axes from the URL:
 * area (city slug), concern (TreatmentCategory enum), language
 * (interpreter code). Each axis is independent, optional, and survives
 * refresh / share by virtue of living in the URL.
 *
 * Parsing is strict by design — unknown values are dropped, never
 * passed through to Prisma. The seed CSV uses Cyrillic city names
 * (`Сеул`, `Алматы`), but the URL slug is always lowercase English
 * (`seoul`, `almaty`) so it's link-safe and stable across locales.
 * CITY_SLUG_MAP bridges the two.
 *
 * The match* predicates are the in-memory equivalent of the old
 * server-side Prisma where-clauses — both layers share the same
 * filter shape so behaviour stays identical when we moved the
 * work client-side.
 */

import type { TreatmentCategory } from "@prisma/client";

export const CITY_SLUGS = ["seoul", "busan", "almaty", "astana"] as const;
export type CitySlug = (typeof CITY_SLUGS)[number];

/** URL slug → the canonical city string Clinic.location.city is seeded with. */
export const CITY_SLUG_MAP: Record<CitySlug, string> = {
  seoul: "Сеул",
  busan: "Пусан",
  almaty: "Алматы",
  astana: "Астана",
};

export const CONCERNS: readonly TreatmentCategory[] = [
  "skin",
  "botox",
  "filler",
  "lift",
  "acne",
  "pigment",
  "hair",
  "cosmetic",
  "scalp",
] as const;

export const INTERPRETER_LANGS = ["kz", "ru", "kr", "en"] as const;
export type InterpreterLang = (typeof INTERPRETER_LANGS)[number];

export type FilterKey = "area" | "concern" | "language";

export interface DiscoveryFilters {
  area?: CitySlug;
  concern?: TreatmentCategory;
  language?: InterpreterLang;
}

function pickOne(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

/**
 * Parse Next.js `searchParams` into a typed filter set. Unknown
 * values are silently dropped — the URL is user-controllable, we
 * never let it dictate downstream behaviour without validation.
 */
export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DiscoveryFilters {
  const out: DiscoveryFilters = {};
  const area = pickOne(searchParams.area);
  if (area && (CITY_SLUGS as readonly string[]).includes(area)) {
    out.area = area as CitySlug;
  }
  const concern = pickOne(searchParams.concern);
  if (concern && (CONCERNS as readonly string[]).includes(concern)) {
    out.concern = concern as TreatmentCategory;
  }
  const language = pickOne(searchParams.language);
  if (language && (INTERPRETER_LANGS as readonly string[]).includes(language)) {
    out.language = language as InterpreterLang;
  }
  return out;
}

/** Serialise a typed filter set back to a stable URLSearchParams. */
export function filtersToSearchParams(filters: DiscoveryFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.area) sp.set("area", filters.area);
  if (filters.concern) sp.set("concern", filters.concern);
  if (filters.language) sp.set("language", filters.language);
  return sp;
}

/**
 * Pure reducer used by the discovery client island's `setFilters`
 * callback. Re-tapping the active value on an axis clears that axis
 * (off-switch); a different value replaces the previous one on the
 * same axis; other axes are untouched. The result is re-parsed so
 * an unknown value coming in (shouldn't happen for pill clicks,
 * defends against stale URL) gets dropped instead of poisoning state.
 */
export function applyToggle(
  prev: DiscoveryFilters,
  key: FilterKey,
  value: string,
): DiscoveryFilters {
  if (prev[key] === value) {
    const next = { ...prev };
    delete next[key];
    return next;
  }
  const merged: Record<string, string> = {};
  if (prev.area) merged.area = prev.area;
  if (prev.concern) merged.concern = prev.concern;
  if (prev.language) merged.language = prev.language;
  merged[key] = value;
  return parseFilters(merged);
}

/** Drop an axis entirely (the "All" pill). */
export function applyClear(prev: DiscoveryFilters, key: FilterKey): DiscoveryFilters {
  if (!(key in prev)) return prev;
  const next = { ...prev };
  delete next[key];
  return next;
}

/* ───── In-memory predicates ─────────────────────────────────────────
 * These run client-side over the bulk dataset shipped on first load.
 * They MUST mirror the Prisma where-clauses they replaced so the
 * visible grid is identical to what the server would have rendered
 * for the same URL.
 */

export interface ClinicMatchShape {
  /** Canonical Cyrillic city string from Clinic.location.city. */
  city: string;
  /** Interpreter language codes (kz / ru / kr / en). */
  interpreters: readonly string[];
}

export interface TreatmentMatchShape {
  category: TreatmentCategory;
}

export function matchClinic(clinic: ClinicMatchShape, filters: DiscoveryFilters): boolean {
  if (filters.area && clinic.city !== CITY_SLUG_MAP[filters.area]) return false;
  if (filters.language && !clinic.interpreters.includes(filters.language)) return false;
  return true;
}

export function matchTreatment(tx: TreatmentMatchShape, filters: DiscoveryFilters): boolean {
  if (filters.concern && tx.category !== filters.concern) return false;
  return true;
}
