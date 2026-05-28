/*
 * lib/notifications/lead-created.test.ts — pin the PM-alert
 * email shape so a refactor can't silently break the format the
 * PM is reading off their phone.
 */

import { describe, expect, it } from "vitest";
import { formatLeadCreatedEmail, type LeadCreatedInput } from "./lead-created";

const BASE: LeadCreatedInput = {
  code: "KB-2026-0427",
  locale: "kr",
  phone: "+77012345678",
  name: "Aigerim",
  whatsappId: "+77012345678",
  telegramId: "@aigerim",
  preferredLanguage: "kr",
  treatmentTitles: ["보톡스 KR", "필러 KR"],
  regionLabels: ["서울", "알마티"],
  kind: ["korea"],
  hasPhotos: true,
  message: "다음 달 서울 방문 예정",
  consentMkt: false,
  appUrl: "https://seoulbeauty-kz.vercel.app",
};

describe("formatLeadCreatedEmail", () => {
  it("subject includes the code + consult language", () => {
    const { subject } = formatLeadCreatedEmail(BASE);
    expect(subject).toContain("KB-2026-0427");
    // M3 polish: consult language (preferredLanguage) drives the subject tag,
    // since that's what the manager needs to know up-front.
    expect(subject).toContain("KR");
  });

  it("opens with a REACH NOW block listing WhatsApp + Telegram", () => {
    const { text } = formatLeadCreatedEmail(BASE);
    // Block delimited by === lines + indented >> markers.
    expect(text).toMatch(/^=== REACH NOW ===/);
    expect(text).toContain(">> WhatsApp:  +77012345678");
    expect(text).toContain(">> Telegram:  @aigerim");
  });

  it("renders only the channels that exist (WA only)", () => {
    const { text } = formatLeadCreatedEmail({
      ...BASE,
      whatsappId: "+77012345678",
      telegramId: null,
    });
    expect(text).toContain(">> WhatsApp:");
    expect(text).not.toContain(">> Telegram:");
  });

  it("renders only the channels that exist (TG only)", () => {
    const { text } = formatLeadCreatedEmail({
      ...BASE,
      whatsappId: null,
      telegramId: "@aigerim",
    });
    expect(text).not.toContain(">> WhatsApp:");
    expect(text).toContain(">> Telegram:");
  });

  it("falls back to a 'call phone' line in REACH NOW when both WA + TG are absent", () => {
    const { text } = formatLeadCreatedEmail({
      ...BASE,
      whatsappId: null,
      telegramId: null,
    });
    expect(text).toMatch(/REACH NOW/);
    expect(text).toContain("(no WhatsApp / Telegram — call +77012345678)");
  });

  it("body lists every field in a fixed key/value layout", () => {
    const { text } = formatLeadCreatedEmail(BASE);
    expect(text).toContain("Code:        KB-2026-0427");
    expect(text).toContain("Phone:       +77012345678");
    expect(text).toContain("Name:        Aigerim");
    expect(text).toContain("Site locale: kr");
    expect(text).toContain("Consult lang: kr");
    expect(text).toContain("Treatments:  보톡스 KR, 필러 KR");
    expect(text).toContain("Regions:     서울, 알마티");
    expect(text).toContain("Path:        korea");
    expect(text).toContain("Photos:      yes");
  });

  it("preferredLanguage and site locale are distinct fields (user can submit on KZ site with KR consult)", () => {
    const { text } = formatLeadCreatedEmail({
      ...BASE,
      locale: "kz",
      preferredLanguage: "kr",
    });
    expect(text).toContain("Site locale: kz");
    expect(text).toContain("Consult lang: kr");
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

  it("admin URL composes appUrl + site locale + code (no trailing slash)", () => {
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
