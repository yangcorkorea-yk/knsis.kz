/*
 * lib/gallery/mock-cases.ts — placeholder B/A cases for the
 * /[locale]/before-after gallery (M2-07, Iteration 3).
 *
 * Iteration history (full timeline in
 * `docs/decisions/before-after-pattern.md`):
 *
 *   1. Spec letter   — per-card interactive slider
 *   2. PM 1st pass   — list → detail, slider on the detail page
 *   3. PM final pass — single-depth feed card with horizontal-
 *                      swipe image row (4 photos: 2 before + 2
 *                      after), procedure tag, user interview
 *                      quote, clinic meta. Matches the KR
 *                      medical-aesthetic app pattern PM
 *                      validated against (강남언니).
 *
 * MVP ships with CSS gradient placeholders (no binary image
 * files). The M5 admin moderation pass swaps the data layer to
 * a real `BeforeAfterCase` Prisma model + Supabase Storage
 * signed URLs (CLAUDE.md §2). The `GalleryImage.alt` field is
 * already on the shape so M5 doesn't need a type change.
 *
 * Trilingual interview copy follows the M2-09 / M2-06 policy:
 * every locale slot filled at first write — no KZ fallback
 * visible to RU / KR users at launch. KR copy carries PM
 * sign-off; KZ + RU queued for M7 native QA.
 */

import type { TrilingualText } from "@/lib/i18n/tr";

/** Tone hint for the gradient placeholder (no real photos in MVP). */
export type CaseTone = "warm" | "ground" | "rose-tint" | "rose-soft" | "lavender-soft";

export interface GalleryImage {
  tone: CaseTone;
  /**
   * Per-image alt text. MVP renders the gradients as
   * `aria-hidden="true"` (no semantic value); M5 swaps in real
   * photos and the alt text gets surfaced to screen readers.
   */
  alt: TrilingualText;
}

export interface GalleryCase {
  id: string;
  slug: string;
  treatmentSlug: string;
  clinicSlug: string;
  /** Short headline next to the swipe row. */
  caption: TrilingualText;
  /**
   * Exactly four entries: positions 0-1 = before angles, 2-3 =
   * after angles. The card renders them as a horizontal-swipe
   * row with a static page indicator below.
   */
  images: readonly [GalleryImage, GalleryImage, GalleryImage, GalleryImage];
  /**
   * Patient interview blurb shown as a blockquote. Trilingual.
   * M5 path replaces this with a Review.body link
   * (see `docs/decisions/before-after-pattern.md` §"M5 swap path").
   */
  interview: TrilingualText;
  /** ISO 8601 timestamp — pinned for the case-card meta line. */
  consentedAt: string;
}

const BEFORE_ALT: TrilingualText = {
  kz: "Емшарадан бұрын",
  ru: "До процедуры",
  kr: "시술 전",
};
const AFTER_ALT: TrilingualText = {
  kz: "Емшарадан кейін",
  ru: "После процедуры",
  kr: "시술 후",
};

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
    images: [
      { tone: "warm", alt: BEFORE_ALT },
      { tone: "ground", alt: BEFORE_ALT },
      { tone: "rose-tint", alt: AFTER_ALT },
      { tone: "rose-soft", alt: AFTER_ALT },
    ],
    interview: {
      kz: "3 сеанстан кейін пигментация әлсіреді. Аудармашы егжей-тегжейлі түсіндірді.",
      ru: "После 3 сеансов пигментация заметно ослабла. Переводчик подробно всё объяснил.",
      kr: "3회 시술 후 색소 침착이 옅어졌어요. 통역사가 자세히 설명해 주셨습니다.",
    },
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
    images: [
      { tone: "ground", alt: BEFORE_ALT },
      { tone: "warm", alt: BEFORE_ALT },
      { tone: "lavender-soft", alt: AFTER_ALT },
      { tone: "rose-tint", alt: AFTER_ALT },
    ],
    interview: {
      kz: "Алғашқы кеңестен бастап ыңғайлы болды. Нәтижеге қанағаттандым.",
      ru: "С первой консультации было комфортно. Результатом довольна.",
      kr: "처음 상담 때부터 편안했어요. 결과에 만족합니다.",
    },
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
    images: [
      { tone: "warm", alt: BEFORE_ALT },
      { tone: "ground", alt: BEFORE_ALT },
      { tone: "rose-soft", alt: AFTER_ALT },
      { tone: "rose-tint", alt: AFTER_ALT },
    ],
    interview: {
      kz: "Каннам клиникасында аудармашы қасымда болды — тыныш болды. Нәтиже табиғи.",
      ru: "В клинике Каннам переводчик был рядом — было спокойно. Результат естественный.",
      kr: "강남 클리닉의 통역사가 같이 있어서 안심됐어요. 자연스러운 결과예요.",
    },
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
    images: [
      { tone: "ground", alt: BEFORE_ALT },
      { tone: "warm", alt: BEFORE_ALT },
      { tone: "rose-tint", alt: AFTER_ALT },
      { tone: "lavender-soft", alt: AFTER_ALT },
    ],
    interview: {
      kz: "Акне іздері айтарлықтай азайды. Кабинет таза болды.",
      ru: "Следы акне значительно уменьшились. В кабинете было чисто.",
      kr: "여드름 흔적이 많이 줄었어요. 진료실이 깨끗했습니다.",
    },
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
    images: [
      { tone: "warm", alt: BEFORE_ALT },
      { tone: "ground", alt: BEFORE_ALT },
      { tone: "rose-soft", alt: AFTER_ALT },
      { tone: "rose-tint", alt: AFTER_ALT },
    ],
    interview: {
      kz: "Тұрақты сеанстар тонды ретке келтірді. Ұсынамын.",
      ru: "Регулярные сеансы привели тон в порядок. Рекомендую.",
      kr: "꾸준히 시술 받으니 톤이 정돈됐어요. 추천드립니다.",
    },
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
    images: [
      { tone: "ground", alt: BEFORE_ALT },
      { tone: "warm", alt: BEFORE_ALT },
      { tone: "lavender-soft", alt: AFTER_ALT },
      { tone: "rose-tint", alt: AFTER_ALT },
    ],
    interview: {
      kz: "Пусанға дейін бардым — аудармашы сенімді тірек болды. Нәтижеге қанағаттандым.",
      ru: "Доехала до Пусана — переводчик был надёжной поддержкой. Результатом довольна.",
      kr: "부산까지 갔는데 통역이 든든했어요. 결과에 만족합니다.",
    },
    consentedAt: "2026-05-15T13:45:00Z",
  },
];
