import { describe, expect, it } from "vitest";
import { STATUS_PILL, statusPillStyle } from "./status-pill";

describe("STATUS_PILL", () => {
  it("covers every Prisma LeadStatus value", () => {
    const expected = ["new", "contacted", "in_progress", "scheduled", "done", "on_hold"] as const;
    expect(Object.keys(STATUS_PILL).sort()).toEqual([...expected].sort());
  });

  it("uses hex bg + fg pairs", () => {
    for (const [status, token] of Object.entries(STATUS_PILL)) {
      expect(token.bg, `${status}.bg`).toMatch(/^#[0-9A-F]{6}$/);
      expect(token.fg, `${status}.fg`).toMatch(/^#[0-9A-F]{6}$/);
      expect(token.label, `${status}.label`).toMatch(/\w/);
    }
  });

  it("statusPillStyle returns inline style with bg + fg", () => {
    const s = statusPillStyle("new");
    expect(s.backgroundColor).toBe("#FCE7EC");
    expect(s.color).toBe("#C84365");
  });
});
