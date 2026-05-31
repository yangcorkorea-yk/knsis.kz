/*
 * lib/admin/leads/filters.ts — URL searchParams ⇄ typed admin-leads
 * filters + Prisma where-clause builder.
 *
 * Mirrors `lib/discover/filters.ts` (M2-02) — parsing is strict, the
 * URL is user-controllable, unknown values are dropped. Filter state
 * lives in the URL so a manager can share a filtered view and
 * back/forward preserves position.
 *
 * Filter axes (per `docs/decisions/m5-batch-1-spec.md` §"URL-state filters"):
 *
 *   - status   LeadStatus, multi (?status=new,contacted)
 *   - kind     LeadKind, single  (?kind=korea | ?kind=local)
 *   - region   city slug, single (?region=seoul)
 *   - owner    "unassigned" | userId (?owner=unassigned | ?owner={uuid})
 *   - hasPhoto bool             (?hasPhoto=1)
 *   - q        substring        (?q=Айгерим)
 *   - sort     createdAt:desc | createdAt:asc (default desc)
 *   - page     pagination, 50/page (?page=2)
 *
 * `?q` matches across:
 *   - Lead.code (case-insensitive substring)
 *   - User.name (case-insensitive substring)
 *   - User.phone (substring — already digit-normalised at write time)
 *
 * Phone search uses `contains` on the stored column. The schema notes
 * phone is encrypted at rest at the Supabase column level (pgcrypto);
 * for MVP we treat it as a plain string at the Prisma surface. If the
 * encryption boundary moves into the Prisma layer in M-POST, this
 * predicate gets replaced with a transparent decrypt-then-match call.
 */

import type { LeadKind, LeadStatus, Prisma } from "@prisma/client";

export const PAGE_SIZE = 50;

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "in_progress",
  "scheduled",
  "done",
  "on_hold",
] as const;

export const LEAD_KINDS: readonly LeadKind[] = ["korea", "local"] as const;

/** Sentinel for "owner not assigned" filter — matches Lead.ownerId IS NULL. */
export const UNASSIGNED_OWNER = "unassigned" as const;

export interface AdminLeadsFilters {
  /** Multi: matches Lead.status IN (...). Empty array = no filter. */
  status: LeadStatus[];
  /** Single: matches Lead.kind contains the slug. */
  kind: LeadKind | null;
  /** Single: matches Lead.regions contains the slug. */
  region: string | null;
  /** "unassigned" → ownerId NULL. UUID string → ownerId = uuid. null → no filter. */
  owner: string | null;
  /** True → Lead.photos array is non-empty. */
  hasPhoto: boolean;
  /** Free-text substring (Lead.code / User.name / User.phone). */
  q: string | null;
  /** Sort axis. createdAt only for M5-03; updatedAt added later if asked. */
  sort: { field: "createdAt"; dir: "asc" | "desc" };
  /** 1-indexed page number. */
  page: number;
}

export const DEFAULT_FILTERS: AdminLeadsFilters = {
  status: [],
  kind: null,
  region: null,
  owner: null,
  hasPhoto: false,
  q: null,
  sort: { field: "createdAt", dir: "desc" },
  page: 1,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z][a-z0-9-]{0,63}$/;

function pickOne(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function parseStatusList(raw: string | undefined): LeadStatus[] {
  if (!raw) return [];
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<LeadStatus>();
  for (const part of parts) {
    if ((LEAD_STATUSES as readonly string[]).includes(part)) {
      seen.add(part as LeadStatus);
    }
  }
  return Array.from(seen);
}

export function parseAdminLeadsFilters(
  searchParams: Record<string, string | string[] | undefined>,
): AdminLeadsFilters {
  const out: AdminLeadsFilters = {
    ...DEFAULT_FILTERS,
    status: parseStatusList(pickOne(searchParams.status)),
  };

  const kind = pickOne(searchParams.kind);
  if (kind && (LEAD_KINDS as readonly string[]).includes(kind)) {
    out.kind = kind as LeadKind;
  }

  const region = pickOne(searchParams.region);
  if (region && SLUG_RE.test(region)) {
    out.region = region;
  }

  const owner = pickOne(searchParams.owner);
  if (owner === UNASSIGNED_OWNER) {
    out.owner = UNASSIGNED_OWNER;
  } else if (owner && UUID_RE.test(owner)) {
    out.owner = owner.toLowerCase();
  }

  const hasPhoto = pickOne(searchParams.hasPhoto);
  if (hasPhoto === "1" || hasPhoto === "true") {
    out.hasPhoto = true;
  }

  const q = pickOne(searchParams.q);
  if (q && q.trim()) {
    out.q = q.trim().slice(0, 200);
  }

  const sort = pickOne(searchParams.sort);
  if (sort === "createdAt:asc") {
    out.sort = { field: "createdAt", dir: "asc" };
  }
  // default desc — no `else` branch needed

  const pageRaw = pickOne(searchParams.page);
  const pageNum = pageRaw ? Number.parseInt(pageRaw, 10) : NaN;
  if (Number.isFinite(pageNum) && pageNum >= 1 && pageNum <= 10_000) {
    out.page = pageNum;
  }

  return out;
}

/** Serialise back to a stable URLSearchParams (sorted keys + omit defaults). */
export function serializeAdminLeadsFilters(filters: AdminLeadsFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.status.length > 0) sp.set("status", filters.status.join(","));
  if (filters.kind) sp.set("kind", filters.kind);
  if (filters.region) sp.set("region", filters.region);
  if (filters.owner) sp.set("owner", filters.owner);
  if (filters.hasPhoto) sp.set("hasPhoto", "1");
  if (filters.q) sp.set("q", filters.q);
  if (filters.sort.dir === "asc") sp.set("sort", "createdAt:asc");
  if (filters.page > 1) sp.set("page", String(filters.page));
  return sp;
}

/**
 * Build the Prisma where-clause from a parsed filter set. Returns the
 * full `Lead.findMany({ where })` shape — no need for the caller to
 * unfold conditions.
 */
export function buildAdminLeadsWhere(filters: AdminLeadsFilters): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};

  if (filters.status.length > 0) {
    where.status = { in: filters.status };
  }
  if (filters.kind) {
    where.kind = { has: filters.kind };
  }
  if (filters.region) {
    where.regions = { has: filters.region };
  }
  if (filters.owner === UNASSIGNED_OWNER) {
    where.ownerId = null;
  } else if (filters.owner) {
    where.ownerId = filters.owner;
  }
  if (filters.hasPhoto) {
    where.photos = { isEmpty: false };
  }
  if (filters.q) {
    const q = filters.q;
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q } } },
    ];
  }

  return where;
}

/** Convenience: `skip` / `take` from page number. */
export function paginationFor(filters: AdminLeadsFilters): { skip: number; take: number } {
  return { skip: (filters.page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

/** Convenience: `orderBy` from sort. */
export function orderByFor(filters: AdminLeadsFilters): Prisma.LeadOrderByWithRelationInput {
  return { createdAt: filters.sort.dir };
}
