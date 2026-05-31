import { describe, expect, it } from "vitest";
import {
  buildAdminLeadsWhere,
  DEFAULT_FILTERS,
  LEAD_KINDS,
  LEAD_STATUSES,
  orderByFor,
  PAGE_SIZE,
  paginationFor,
  parseAdminLeadsFilters,
  serializeAdminLeadsFilters,
  UNASSIGNED_OWNER,
} from "./filters";

describe("parseAdminLeadsFilters", () => {
  it("returns defaults on empty query", () => {
    expect(parseAdminLeadsFilters({})).toEqual(DEFAULT_FILTERS);
  });

  it("parses status as comma-separated multi", () => {
    const f = parseAdminLeadsFilters({ status: "new,contacted,on_hold" });
    expect(f.status).toEqual(["new", "contacted", "on_hold"]);
  });

  it("drops unknown status values silently", () => {
    const f = parseAdminLeadsFilters({ status: "new,bogus,contacted" });
    expect(f.status).toEqual(["new", "contacted"]);
  });

  it("dedupes status list", () => {
    const f = parseAdminLeadsFilters({ status: "new,new,contacted" });
    expect(f.status).toEqual(["new", "contacted"]);
  });

  it("accepts the LeadKind enum values only", () => {
    expect(parseAdminLeadsFilters({ kind: "korea" }).kind).toBe("korea");
    expect(parseAdminLeadsFilters({ kind: "local" }).kind).toBe("local");
    expect(parseAdminLeadsFilters({ kind: "mars" }).kind).toBeNull();
  });

  it("accepts city-slug-shaped region tokens, drops others", () => {
    expect(parseAdminLeadsFilters({ region: "seoul" }).region).toBe("seoul");
    expect(parseAdminLeadsFilters({ region: "" }).region).toBeNull();
    expect(parseAdminLeadsFilters({ region: "Seoul" }).region).toBeNull();
    expect(parseAdminLeadsFilters({ region: "; drop table" }).region).toBeNull();
  });

  it("recognises the unassigned-owner sentinel and UUIDs (lowercased)", () => {
    expect(parseAdminLeadsFilters({ owner: UNASSIGNED_OWNER }).owner).toBe(UNASSIGNED_OWNER);
    expect(parseAdminLeadsFilters({ owner: "11111111-1111-4111-8111-111111111111" }).owner).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(
      parseAdminLeadsFilters({ owner: "11111111-1111-4111-8111-111111111111".toUpperCase() }).owner,
    ).toBe("11111111-1111-4111-8111-111111111111");
    expect(parseAdminLeadsFilters({ owner: "not-a-uuid" }).owner).toBeNull();
  });

  it("accepts hasPhoto=1 and =true; rejects anything else", () => {
    expect(parseAdminLeadsFilters({ hasPhoto: "1" }).hasPhoto).toBe(true);
    expect(parseAdminLeadsFilters({ hasPhoto: "true" }).hasPhoto).toBe(true);
    expect(parseAdminLeadsFilters({ hasPhoto: "yes" }).hasPhoto).toBe(false);
  });

  it("trims and caps q to 200 chars", () => {
    expect(parseAdminLeadsFilters({ q: "  KB-2026-0001  " }).q).toBe("KB-2026-0001");
    expect(parseAdminLeadsFilters({ q: "x".repeat(500) }).q?.length).toBe(200);
    expect(parseAdminLeadsFilters({ q: "   " }).q).toBeNull();
  });

  it("flips sort to asc only on the exact literal", () => {
    expect(parseAdminLeadsFilters({ sort: "createdAt:asc" }).sort.dir).toBe("asc");
    expect(parseAdminLeadsFilters({ sort: "createdAt:desc" }).sort.dir).toBe("desc");
    expect(parseAdminLeadsFilters({ sort: "bogus" }).sort.dir).toBe("desc");
  });

  it("clamps page to [1, 10000]", () => {
    expect(parseAdminLeadsFilters({ page: "1" }).page).toBe(1);
    expect(parseAdminLeadsFilters({ page: "42" }).page).toBe(42);
    expect(parseAdminLeadsFilters({ page: "0" }).page).toBe(1);
    expect(parseAdminLeadsFilters({ page: "-5" }).page).toBe(1);
    expect(parseAdminLeadsFilters({ page: "99999" }).page).toBe(1);
    expect(parseAdminLeadsFilters({ page: "abc" }).page).toBe(1);
  });
});

describe("serializeAdminLeadsFilters", () => {
  it("omits all default axes (clean URLs)", () => {
    expect(serializeAdminLeadsFilters(DEFAULT_FILTERS).toString()).toBe("");
  });

  it("round-trips a non-default filter set", () => {
    const filters = {
      ...DEFAULT_FILTERS,
      status: ["new", "contacted"] as ("new" | "contacted")[],
      kind: "korea" as const,
      region: "seoul",
      owner: UNASSIGNED_OWNER,
      hasPhoto: true,
      q: "Айгерим",
      sort: { field: "createdAt", dir: "asc" } as const,
      page: 3,
    };
    const sp = serializeAdminLeadsFilters({ ...filters });
    const parsed = parseAdminLeadsFilters(Object.fromEntries(sp));
    expect(parsed).toEqual(filters);
  });
});

describe("buildAdminLeadsWhere", () => {
  it("returns empty where on defaults", () => {
    expect(buildAdminLeadsWhere(DEFAULT_FILTERS)).toEqual({});
  });

  it("maps status list to `in`", () => {
    const where = buildAdminLeadsWhere({
      ...DEFAULT_FILTERS,
      status: ["new", "contacted"],
    });
    expect(where.status).toEqual({ in: ["new", "contacted"] });
  });

  it("maps kind to `has` (Lead.kind is array)", () => {
    expect(buildAdminLeadsWhere({ ...DEFAULT_FILTERS, kind: "korea" }).kind).toEqual({
      has: "korea",
    });
  });

  it("maps region to `has` (Lead.regions is array)", () => {
    expect(buildAdminLeadsWhere({ ...DEFAULT_FILTERS, region: "seoul" }).regions).toEqual({
      has: "seoul",
    });
  });

  it("maps unassigned-owner sentinel to ownerId IS NULL", () => {
    expect(buildAdminLeadsWhere({ ...DEFAULT_FILTERS, owner: UNASSIGNED_OWNER }).ownerId).toBe(
      null,
    );
  });

  it("maps UUID owner to equality", () => {
    const uuid = "11111111-1111-4111-8111-111111111111";
    expect(buildAdminLeadsWhere({ ...DEFAULT_FILTERS, owner: uuid }).ownerId).toBe(uuid);
  });

  it("maps hasPhoto to photos isEmpty: false", () => {
    expect(buildAdminLeadsWhere({ ...DEFAULT_FILTERS, hasPhoto: true }).photos).toEqual({
      isEmpty: false,
    });
  });

  it("expands q into a 3-axis OR across code / name / phone", () => {
    const where = buildAdminLeadsWhere({ ...DEFAULT_FILTERS, q: "Aйгерим" });
    expect(where.OR).toHaveLength(3);
    expect(where.OR?.[0]).toEqual({ code: { contains: "Aйгерим", mode: "insensitive" } });
    expect(where.OR?.[1]).toEqual({
      user: { name: { contains: "Aйгерим", mode: "insensitive" } },
    });
    expect(where.OR?.[2]).toEqual({ user: { phone: { contains: "Aйгерим" } } });
  });
});

describe("paginationFor / orderByFor", () => {
  it("paginationFor honours page * PAGE_SIZE", () => {
    expect(paginationFor({ ...DEFAULT_FILTERS, page: 1 })).toEqual({ skip: 0, take: PAGE_SIZE });
    expect(paginationFor({ ...DEFAULT_FILTERS, page: 3 })).toEqual({
      skip: 2 * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  });

  it("orderByFor honours sort dir", () => {
    expect(orderByFor(DEFAULT_FILTERS)).toEqual({ createdAt: "desc" });
    expect(orderByFor({ ...DEFAULT_FILTERS, sort: { field: "createdAt", dir: "asc" } })).toEqual({
      createdAt: "asc",
    });
  });
});

describe("constants", () => {
  it("LEAD_STATUSES has 6 values (matches Prisma enum)", () => {
    expect(LEAD_STATUSES.length).toBe(6);
  });
  it("LEAD_KINDS has 2 values", () => {
    expect(LEAD_KINDS.length).toBe(2);
  });
});
