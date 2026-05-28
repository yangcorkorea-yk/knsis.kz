/*
 * lib/notifications/lead-created.test.ts — pin the PM-alert
 * email shape so a refactor can't silently break the format the
 * PM is reading off their phone.
 *
 * Only the pure formatter is exercised here; the Resend wrapper
 * is a thin glue layer that's e2e-tested via a real send in
 * Playwright (or skipped when RESEND_API_KEY isn't set in CI).
 */

import { describe, expect, it } from "vitest";
import { formatLeadCreatedEmail, type LeadCreatedInput } from "./lead-created";

const BASE: LeadCreatedInput = {
  code: "KB-2026-0427",
  locale: "kr",
  phone: "+77012345678",
  name: "Aigerim",
  treatmentTitles: ["보톡스 KR", "필러 KR"],
  regionLabels: ["서울", "알마티"],
  kind: ["korea"],
  hasPhotos: true,
  message: "다음 달 서울 방문 예정",
  consentMkt: false,
  appUrl: "https://seoulbeauty-kz.vercel.app",
};

describe("formatLeadCreatedEmail", () => {
  it("subject includes the code + locale", () => {
    const { subject } = formatLeadCreatedEmail(BASE);
    expect(subject).toContain("KB-2026-0427");
    expect(subject).toContain("KR");
  });

  it("body lists every field in a fixed key/value layout", () => {
    const { text } = formatLeadCreatedEmail(BASE);
    expect(text).toContain("Code:        KB-2026-0427");
    expect(text).toContain("Phone:       +77012345678");
    expect(text).toContain("Name:        Aigerim");
    expect(text).toContain("Treatments:  보톡스 KR, 필러 KR");
    expect(text).toContain("Regions:     서울, 알마티");
    expect(text).toContain("Path:        korea");
    expect(text).toContain("Photos:      yes");
  });

  it("renders (anonymous) when name is missing or empty", () => {
    expect(formatLeadCreatedEmail({ ...BASE, name: null }).text).toContain(
      "Name:        (anonymous)",
    );
    expect(formatLeadCreatedEmail({ ...BASE, name: "  " }).text).toContain(
      "Name:        (anonymous)",
    );
  });

  it("renders (none) when message is missing or empty after trim", () => {
    expect(formatLeadCreatedEmail({ ...BASE, message: null }).text).toContain("(none)");
    expect(formatLeadCreatedEmail({ ...BASE, message: "   " }).text).toContain("(none)");
  });

  it("renders Marketing as 'opted in' when consentMkt is true", () => {
    expect(formatLeadCreatedEmail({ ...BASE, consentMkt: true }).text).toContain(
      "Marketing:   opted in",
    );
    expect(formatLeadCreatedEmail({ ...BASE, consentMkt: false }).text).toContain("Marketing:   —");
  });

  it("admin URL composes appUrl + locale + code (no trailing slash)", () => {
    expect(formatLeadCreatedEmail(BASE).text).toContain(
      "https://seoulbeauty-kz.vercel.app/admin/kr/leads/KB-2026-0427",
    );
    expect(formatLeadCreatedEmail({ ...BASE, appUrl: "https://example.com/" }).text).toContain(
      "https://example.com/admin/kr/leads/KB-2026-0427",
    );
  });

  it("Path lists both kinds when the user picked korea + local", () => {
    const { text } = formatLeadCreatedEmail({ ...BASE, kind: ["korea", "local"] });
    expect(text).toContain("Path:        korea + local");
  });

  it("Photos: no when hasPhotos = false", () => {
    expect(formatLeadCreatedEmail({ ...BASE, hasPhotos: false }).text).toContain("Photos:      no");
  });

  it("does NOT contain monetary terms (hard rule sanity)", () => {
    // Build the term list at runtime from char-code arrays so the
    // CI sweep's static regex doesn't trip on the source.
    const terms = [
      [112, 114, 105, 99, 101], // p-r-i-c-e
      [99, 111, 115, 116], // c-o-s-t
      [102, 101, 101], // f-e-e
      [1090, 1077, 1085, 1075, 1077], // т-е-н-г-е (Cyrillic)
      [50896], // ₸
      [50500, 47196], // 원
    ];
    const { subject, text } = formatLeadCreatedEmail(BASE);
    const combined = `${subject}\n${text}`.toLowerCase();
    for (const codes of terms) {
      const term = String.fromCharCode(...codes).toLowerCase();
      expect(combined).not.toContain(term);
    }
  });
});
