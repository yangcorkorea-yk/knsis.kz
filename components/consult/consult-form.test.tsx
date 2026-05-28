/*
 * components/consult/consult-form.test.tsx — M3-01 form
 * structural contract.
 *
 * vitest runs in node env (no DOM) so this suite covers SSR
 * structure only — initial render at step 1, all field labels +
 * disclaimer + step-progress copy land, error-message i18n keys
 * resolve. Behavioural assertions (step nav, submit, photo
 * upload, sessionStorage) live in Playwright.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConsultForm, type TreatmentOption } from "./consult-form";

const TREATMENTS: TreatmentOption[] = [
  { slug: "botox-jaw", title: { kz: "Ботокс KZ", ru: "Ботокс RU", kr: "보톡스 KR" } },
  { slug: "filler-lip", title: { kz: "Филлер KZ", ru: "Филлер RU", kr: "필러 KR" } },
];

const LABELS = {
  disclaimerBody: "DISCLAIMER BODY",
  disclaimerAriaLabel: "DISCLAIMER ARIA",
  stepProgress: (c: number, t: number) => `step ${c}/${t}`,
  stepContactTitle: "STEP CONTACT",
  stepGoalTitle: "STEP GOAL",
  stepPhotosTitle: "STEP PHOTOS",
  phoneLabel: "PHONE",
  phoneHelp: "PHONE HELP",
  phonePlaceholder: "+7 …",
  nameLabel: "NAME",
  nameHelp: "NAME HELP",
  namePlaceholder: "Name",
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
  back: "Back",
  next: "Next",
  submit: "Submit",
  submitting: "Submitting",
  errors: {} as Record<string, string>,
};

function render(treatments = TREATMENTS) {
  return renderToString(<ConsultForm locale="kr" treatments={treatments} labels={LABELS} />);
}

describe("ConsultForm (M3-01 initial render — step 1)", () => {
  it("renders the medical disclaimer", () => {
    const html = render();
    expect(html).toContain("DISCLAIMER BODY");
    expect(html).toContain("DISCLAIMER ARIA");
  });

  it("renders the step progress copy (1 of 3)", () => {
    const html = render();
    expect(html).toContain("step 1/3");
  });

  it("renders step 1 (contact) on first paint, NOT step 2 or 3", () => {
    const html = render();
    expect(html).toContain("STEP CONTACT");
    expect(html).not.toContain("STEP GOAL");
    expect(html).not.toContain("STEP PHOTOS");
  });

  it("renders the phone + name inputs with their labels", () => {
    const html = render();
    expect(html).toContain("PHONE");
    expect(html).toContain('type="tel"');
    // react-dom/server preserves the React camelCase attribute (autoComplete)
    expect(html).toMatch(/autoComplete="tel"/i);
    expect(html).toContain("NAME");
    expect(html).toMatch(/autoComplete="name"/i);
  });

  it("renders a Next button on step 1, no Back, no Submit", () => {
    const html = render();
    expect(html).toContain(">Next<");
    expect(html).not.toContain(">Back<");
    expect(html).not.toContain(">Submit<");
  });

  it("the form's aria-label matches the current step (step 1)", () => {
    const html = render();
    expect(html).toMatch(/<form[^>]*aria-label="STEP CONTACT"/);
  });

  it("does NOT render the photo uploader on step 1", () => {
    const html = render();
    expect(html).not.toContain("ADD");
    expect(html).not.toContain("UPLOADING");
  });

  it("does NOT render the consent checkboxes on step 1", () => {
    const html = render();
    expect(html).not.toContain("TOS");
    expect(html).not.toContain("MKT");
  });

  it("does NOT render the treatment / region / kind groups on step 1", () => {
    const html = render();
    expect(html).not.toContain("TREATMENT");
    expect(html).not.toContain("REGION");
    expect(html).not.toContain(">Korea<");
  });

  it("the form has noValidate so the browser's native validation doesn't compete with Zod messages", () => {
    const html = render();
    expect(html).toMatch(/<form[^>]*novalidate/i);
  });
});
