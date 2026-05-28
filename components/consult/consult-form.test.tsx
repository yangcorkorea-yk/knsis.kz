/*
 * components/consult/consult-form.test.tsx — M3 single-page
 * form structural contract.
 *
 * vitest runs in node env (no DOM) so this suite covers SSR
 * structure only — all sections rendered inline at first paint,
 * required-field markers, WA/TG badges, language dropdown,
 * single submit. Behavioural assertions (submit, photo upload,
 * sessionStorage, Turnstile-blocked submit) live in Playwright.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConsultForm, type Labels, type TreatmentOption } from "./consult-form";

const TREATMENTS: TreatmentOption[] = [
  { slug: "botox-jaw", title: { kz: "Ботокс KZ", ru: "Ботокс RU", kr: "보톡스 KR" } },
  { slug: "filler-lip", title: { kz: "Филлер KZ", ru: "Филлер RU", kr: "필러 KR" } },
];

const LABELS: Labels = {
  formAriaLabel: "FORM ARIA",
  footerNote: "FOOTER NOTE",

  sectionContact: "SECTION CONTACT",
  sectionGoal: "SECTION GOAL",
  sectionExtras: "SECTION EXTRAS",

  nameLabel: "NAME",
  namePlaceholder: "ex. Aigerim",
  phoneLabel: "PHONE",
  phoneHelp: "PHONE HELP",
  phonePlaceholder: "+7 …",
  whatsappLabel: "WA LABEL",
  whatsappHelp: "WA HELP",
  whatsappPlaceholder: "WA …",
  whatsappBadge: "WA",
  telegramLabel: "TG LABEL",
  telegramHelp: "TG HELP",
  telegramPlaceholder: "@username",
  telegramBadge: "TG",
  contactChannelsNote: "PREFER WA OR TG",
  languageLabel: "LANG",
  languageHelp: "LANG HELP",
  languageOptions: { kz: "қазақша", ru: "русский", kr: "한국어" },

  treatmentLabel: "TREATMENT",
  treatmentEmpty: "NO TREATMENTS",
  regionLabel: "REGION",
  kindLabel: "KIND",
  kindKorea: "Korea",
  kindLocal: "Local",
  areaLabels: { seoul: "Seoul", busan: "Busan", almaty: "Almaty", astana: "Astana" },

  photoLabel: "PHOTOS",
  photoHelp: "PHOTOS HELP",
  photoAddButton: "ADD",
  photoRemoveButton: "REMOVE",
  photoUploading: "UPLOADING",
  messageLabel: "MESSAGE",
  messageHelp: "MESSAGE HELP",
  messagePlaceholder: "msg",
  consentTosLabel: "TOS",
  consentMktLabel: "MKT",
  consentRequiredNote: "* required",

  submit: "Submit",
  submitting: "Submitting",
  errors: {},
};

function render(treatments = TREATMENTS) {
  return renderToString(
    <ConsultForm locale="kr" treatments={treatments} labels={LABELS} turnstileSiteKey="" />,
  );
}

describe("ConsultForm (M3 single-page initial render)", () => {
  it("does NOT render its own header (page owns h1 / subtitle / disclaimer)", () => {
    const html = render();
    // The form should never duplicate the page-level heading.
    expect(html).not.toMatch(/<h1\b/);
    // The medical disclaimer is rendered at the page level (in
    // app/[locale]/consult/page.tsx) — not inside the form.
    expect(html).not.toContain('aria-label="Medical');
  });

  it("renders ALL three sections inline (no step gating)", () => {
    const html = render();
    expect(html).toContain("SECTION CONTACT");
    expect(html).toContain("SECTION GOAL");
    expect(html).toContain("SECTION EXTRAS");
  });

  it("renders the name field as required (* marker)", () => {
    const html = render();
    // Name label appears with the required marker pattern
    expect(html).toContain("NAME");
    expect(html).toMatch(/NAME[^<]*<span[^>]*ml-0\.5[^>]*>\*/);
  });

  it("renders phone with tel input + tel autocomplete", () => {
    const html = render();
    expect(html).toContain("PHONE");
    expect(html).toContain('type="tel"');
    expect(html).toMatch(/autoComplete="tel"/i);
  });

  it("renders WhatsApp + Telegram fields with their badges", () => {
    const html = render();
    expect(html).toContain("WA LABEL");
    expect(html).toContain("TG LABEL");
    // Badges rendered next to the field labels
    expect(html).toMatch(/>WA</);
    expect(html).toMatch(/>TG</);
  });

  it("renders the preferred-language dropdown with all 3 options", () => {
    const html = render();
    expect(html).toContain("LANG");
    expect(html).toMatch(/<select\b[^>]*name="preferredLanguage"/);
    expect(html).toContain("қазақша");
    expect(html).toContain("русский");
    expect(html).toContain("한국어");
  });

  it("renders the contact-channels recommendation note", () => {
    const html = render();
    expect(html).toContain("PREFER WA OR TG");
  });

  it("renders the treatment / region / kind groups inline (no step nav)", () => {
    const html = render();
    expect(html).toContain("TREATMENT");
    expect(html).toContain("REGION");
    expect(html).toContain(">Korea<");
    expect(html).toContain(">Local<");
  });

  it("renders the photo uploader + message textarea + consent checkboxes inline", () => {
    const html = render();
    expect(html).toContain("PHOTOS");
    expect(html).toContain("ADD");
    expect(html).toContain("MESSAGE");
    expect(html).toContain("TOS");
    expect(html).toContain("MKT");
  });

  it("renders a single Submit button — no Back / Next from the multi-step era", () => {
    const html = render();
    expect(html).toContain(">Submit<");
    expect(html).not.toMatch(/>Back</);
    expect(html).not.toMatch(/>Next</);
  });

  it("renders the footer reassurance copy below the submit button", () => {
    const html = render();
    expect(html).toContain("FOOTER NOTE");
  });

  it("the form carries the page-level aria-label for screen readers", () => {
    const html = render();
    expect(html).toMatch(/<form[^>]*aria-label="FORM ARIA"/);
  });

  it("the form has noValidate so the browser's native validation doesn't compete with Zod messages", () => {
    const html = render();
    expect(html).toMatch(/<form[^>]*novalidate/i);
  });

  it("does NOT render the legacy step-progress copy", () => {
    const html = render();
    expect(html).not.toMatch(/\b\d\/3\b/);
    expect(html).not.toMatch(/Step \d/);
  });

  it("text inputs + textarea + select use bg-paper for visibility against bg-warm pages (M3 sign-off fix)", () => {
    const html = render();
    // Text input + textarea + select all carry bg-paper class.
    expect(html).toMatch(/<input[^>]*class="[^"]*bg-paper/);
    expect(html).toMatch(/<textarea[^>]*class="[^"]*bg-paper/);
    expect(html).toMatch(/<select[^>]*class="[^"]*bg-paper/);
    // Regression: bg-ground should NOT appear on the input affordance
    // (it's still fine on pill toggles / hover states, but inputs need
    // the higher-contrast bg-paper).
    expect(html).not.toMatch(/<input[^>]*class="[^"]*bg-ground/);
    expect(html).not.toMatch(/<textarea[^>]*class="[^"]*bg-ground/);
    expect(html).not.toMatch(/<select[^>]*class="[^"]*bg-ground/);
  });
});
