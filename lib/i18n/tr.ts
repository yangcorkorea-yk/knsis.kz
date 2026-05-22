/*
 * lib/i18n/tr.ts — pick the locale-correct string from a Trilingual
 * JSON column (Treatment.title, Clinic.name, Treatment.summary, …).
 *
 * Fallback chain: requested locale → kz (master) → empty string.
 * Mirrors the spec §09 "missing key → KZ → key literal" behaviour
 * but at the row-data layer rather than the static catalog layer.
 */

import type { Locale } from "./config";

export type TrilingualText = {
  kz?: string | null;
  ru?: string | null;
  kr?: string | null;
};

export type TrilingualList = {
  kz?: string[] | null;
  ru?: string[] | null;
  kr?: string[] | null;
};

export function tr(json: unknown, locale: Locale): string {
  if (!json || typeof json !== "object") return "";
  const t = json as TrilingualText;
  return t[locale] ?? t.kz ?? "";
}

export function trList(json: unknown, locale: Locale): string[] {
  if (!json || typeof json !== "object") return [];
  const t = json as TrilingualList;
  const value = t[locale];
  if (value && value.length > 0) return value;
  return t.kz ?? [];
}
