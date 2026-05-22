import { describe, expect, it } from "vitest";
import { tr, trList } from "./tr";

describe("tr (Trilingual text)", () => {
  it("returns the requested locale when present", () => {
    expect(tr({ kz: "K", ru: "R", kr: "Ko" }, "ru")).toBe("R");
  });
  it("falls back to kz master when locale value is null", () => {
    expect(tr({ kz: "K", ru: null, kr: null }, "ru")).toBe("K");
  });
  it("falls back to kz when the locale key is missing", () => {
    expect(tr({ kz: "K" }, "kr")).toBe("K");
  });
  it("returns empty string for null / undefined / non-object input", () => {
    expect(tr(null, "kz")).toBe("");
    expect(tr(undefined, "kz")).toBe("");
    expect(tr("plain string", "kz")).toBe("");
  });
});

describe("trList (Trilingual string[])", () => {
  it("returns the requested locale array when non-empty", () => {
    expect(trList({ kz: ["a"], ru: ["b"], kr: ["c"] }, "kr")).toEqual(["c"]);
  });
  it("falls back to kz when locale list is empty", () => {
    expect(trList({ kz: ["a", "b"], ru: [], kr: [] }, "ru")).toEqual(["a", "b"]);
  });
  it("returns [] for null / undefined", () => {
    expect(trList(null, "kz")).toEqual([]);
    expect(trList(undefined, "kz")).toEqual([]);
  });
});
