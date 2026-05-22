/*
 * lib/discover/filters.ts — URL searchParams ⇄ typed discovery filters.
 *
 * The /[locale]/categories page reads three filter axes from the
 * URL: area (city slug), concern (TreatmentCategory enum), language
 * (interpreter code). Each axis is independent, optional, and
 * survives refresh / share by virtue of living in the URL.
 *
 * Parsing is strict by design — unknown values are dropped, never
 * passed through to Prisma. The seed CSV uses Cyrillic city names
 * (`Сеул`, `Алматы`), but the URL slug is always lowercase English
 * (`seoul`, `almaty`) so it's link-safe and stable across locales.
 * CITY_SLUG_MAP bridges the two.
 *
 * The 9 TreatmentCategory enum values come from prisma/schema.prisma;
 * we keep the slug literals here so the front-end never imports the
 * Prisma client just to render a label.
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
 * never let it dictate a Prisma query.
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

/**
 * Build the next URL search string when a filter pill is toggled.
 * If `value` is already active on that axis, the axis is cleared
 * (so a second tap toggles the filter off). Other axes are
 * preserved exactly.
 */
export function toggleFilter(
  current: URLSearchParams,
  key: "area" | "concern" | "language",
  value: string,
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (next.get(key) === value) {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  return next;
}
