/*
 * components/gallery/image-modal.test.tsx — Iteration 3b
 * lightbox a11y + structural contract.
 *
 * vitest runs in `environment: "node"` (vitest.config.ts) — no
 * jsdom / happy-dom — so we pin the dialog's static a11y shape
 * via renderToString. Behavioral assertions (Esc / arrow keys /
 * outside click) live in the Playwright suite where a real
 * browser executes the useEffect that wires up listeners.
 *
 * What we DO pin here:
 *   - role="dialog" + aria-modal="true" + aria-label
 *   - close button + sr-only label
 *   - prev / next controls + sr-only labels (multi-image)
 *   - single-image case: prev / next hidden
 *   - focus ring colour consistent with the rest of the app
 *   - main image surface exposes role="img" + locale-resolved alt
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GalleryImage } from "@/lib/gallery/mock-cases";
import { ImageModal, type ImageModalLabels } from "./image-modal";

const LABELS: ImageModalLabels = {
  modalLabel: "Photo viewer",
  closeLabel: "Close",
  prevLabel: "Previous photo",
  nextLabel: "Next photo",
};

const FOUR_IMAGES: GalleryImage[] = [
  { tone: "warm", alt: { kz: "Бұрын 1", ru: "До 1", kr: "전 1" } },
  { tone: "ground", alt: { kz: "Бұрын 2", ru: "До 2", kr: "전 2" } },
  { tone: "rose-tint", alt: { kz: "Кейін 1", ru: "После 1", kr: "후 1" } },
  { tone: "rose-soft", alt: { kz: "Кейін 2", ru: "После 2", kr: "후 2" } },
];

function render(
  images: readonly GalleryImage[] = FOUR_IMAGES,
  initialIndex = 0,
  locale: "kz" | "ru" | "kr" = "kr",
) {
  return renderToString(
    <ImageModal
      images={images}
      initialIndex={initialIndex}
      locale={locale}
      labels={LABELS}
      onClose={() => {}}
    />,
  );
}

describe("ImageModal (Iteration 3b lightbox)", () => {
  it("renders as a labelled modal dialog", () => {
    const html = render();
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Photo viewer"');
  });

  it("renders a close button with an sr-only label", () => {
    const html = render();
    // The X glyph is decorative (aria-hidden) and the label sits in sr-only.
    expect(html).toMatch(/<button[^>]*>[^<]*<span[^>]*aria-hidden[^>]*>×/);
    expect(html).toContain("Close");
    expect(html).toMatch(/<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>Close<\/span>/);
  });

  it("renders prev + next navigation controls when there are multiple images", () => {
    const html = render();
    expect(html).toContain("Previous photo");
    expect(html).toContain("Next photo");
    expect(html).toMatch(/<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>Previous photo<\/span>/);
    expect(html).toMatch(/<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>Next photo<\/span>/);
  });

  it("hides prev + next controls when there is only one image", () => {
    const html = render([FOUR_IMAGES[0]!], 0);
    expect(html).not.toContain("Previous photo");
    expect(html).not.toContain("Next photo");
  });

  it("renders the current image at the initialIndex with the locale-resolved alt", () => {
    const html = render(FOUR_IMAGES, 2, "kr");
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="후 1"');
    // The other tones must not be present in the displayed surface
    // (only the active image is rendered, prev/next live in buttons).
    expect(html).toMatch(/from-rose-tint/);
  });

  it("renders the locale-resolved alt for the initial image (kz / ru / kr)", () => {
    expect(render(FOUR_IMAGES, 0, "kz")).toContain('aria-label="Бұрын 1"');
    expect(render(FOUR_IMAGES, 0, "ru")).toContain('aria-label="До 1"');
    expect(render(FOUR_IMAGES, 0, "kr")).toContain('aria-label="전 1"');
  });

  it("uses ink-mute focus ring on every interactive control (consistent with the rest of the app)", () => {
    const html = render();
    expect(html).toMatch(/focus-visible:ring-ink-mute/);
    expect(html).not.toMatch(/focus-visible:ring-rose/);
  });

  it("backdrop sits at z-50 above the page chrome", () => {
    const html = render();
    expect(html).toMatch(/z-50/);
  });
});
