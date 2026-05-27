/*
 * lib/gallery/mock-cases.ts — placeholder B/A cases for the
 * /[locale]/before-after gallery (M2-07).
 *
 * MVP shell per PM brief: the gallery surface ships with mock
 * data + a CSS-gradient placeholder for both before / after
 * "images". M5 admin moderation introduces:
 *   - A `BeforeAfterCase` Prisma model (or extends Review.photos
 *     with a strict `[before, after]` convention) backed by an
 *     admin upload + consent capture workflow.
 *   - Real images in a private Supabase Storage bucket served
 *     via 5-minute signed URLs (CLAUDE.md §2 hard rule).
 *
 * The UI components on this page (consent banner, slider,
 * disclaimer, card layout) are model-agnostic — they take
 * GalleryCase props and render. The M5 swap is a single
 * page.tsx change from `MOCK_CASES` to a Prisma query that
 * returns the same shape.
 *
 * Trilingual captions follow the M2-09 / M2-06 trilingual seed
 * policy — no KZ fallback visible to RU / KR users at launch.
 */

import type { TrilingualText } from "@/lib/i18n/tr";

/**
 * Visual tone hint for the before / after placeholder. Maps to a
 * Tailwind gradient class inside <BeforeAfterSlider>; lets the
 * mock dataset express a "before darker, after rosier" change
 * without binary image files.
 */
export type CaseTone = "warm" | "ground" | "rose-tint" | "rose-soft" | "lavender-soft";

export interface GalleryCase {
  id: string;
  slug: string;
  treatmentSlug: string;
  clinicSlug: string;
  caption: TrilingualText;
  beforeTone: CaseTone;
  afterTone: CaseTone;
  /** ISO 8601 timestamp — pinned for the case-card meta line. */
  consentedAt: string;
}

export const MOCK_CASES: readonly GalleryCase[] = [
  {
    id: "ba-0001",
    slug: "case-0001",
    treatmentSlug: "pico-laser-toning",
    clinicSlug: "seoul-skin-clinic",
    caption: {
      kz: "3 сеанстан кейін біркелкі тон.",
      ru: "Ровный тон после 3 сеансов.",
      kr: "3회 시술 후 균일한 톤.",
    },
    beforeTone: "warm",
    afterTone: "rose-tint",
    consentedAt: "2026-04-12T10:00:00Z",
  },
  {
    id: "ba-0002",
    slug: "case-0002",
    treatmentSlug: "botox-jaw",
    clinicSlug: "gangnam-medical-aesthetic",
    caption: {
      kz: "Жақ контурының жұмсаруы.",
      ru: "Смягчение контура челюсти.",
      kr: "턱 라인 부드러움.",
    },
    beforeTone: "ground",
    afterTone: "lavender-soft",
    consentedAt: "2026-04-18T14:00:00Z",
  },
  {
    id: "ba-0003",
    slug: "case-0003",
    treatmentSlug: "hyaluronic-filler",
    clinicSlug: "gangnam-medical-aesthetic",
    caption: {
      kz: "Терең қыртыстардың жұмсаруы.",
      ru: "Сглаживание глубоких морщин.",
      kr: "깊은 주름 완화.",
    },
    beforeTone: "warm",
    afterTone: "rose-soft",
    consentedAt: "2026-04-22T11:30:00Z",
  },
  {
    id: "ba-0004",
    slug: "case-0004",
    treatmentSlug: "acne-medical-scaling",
    clinicSlug: "almaty-derma-center",
    caption: {
      kz: "Қабынудың азаюы.",
      ru: "Снижение воспаления.",
      kr: "염증 감소.",
    },
    beforeTone: "ground",
    afterTone: "rose-tint",
    consentedAt: "2026-05-02T09:15:00Z",
  },
  {
    id: "ba-0005",
    slug: "case-0005",
    treatmentSlug: "pigment-spot-removal",
    clinicSlug: "almaty-derma-center",
    caption: {
      kz: "Пигменттік дақтардың азаюы.",
      ru: "Уменьшение пигментных пятен.",
      kr: "색소 침착 감소.",
    },
    beforeTone: "warm",
    afterTone: "rose-soft",
    consentedAt: "2026-05-08T16:20:00Z",
  },
  {
    id: "ba-0006",
    slug: "case-0006",
    treatmentSlug: "thread-lift-mini",
    clinicSlug: "busan-aesthetic-center",
    caption: {
      kz: "Контурдың айқындалуы.",
      ru: "Чёткий контур лица.",
      kr: "또렷한 윤곽.",
    },
    beforeTone: "ground",
    afterTone: "lavender-soft",
    consentedAt: "2026-05-15T13:45:00Z",
  },
];
