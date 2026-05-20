# 04 · i18n & content

> Three first-class languages. KZ default. **No language is a translation of another** — write KZ master, then RU + KR are reviewed by natives.

## Routing

- URL strategy: `/[locale]` prefix. Default locale `kz`. Locales: `kz` · `ru` · `kr`.
- `Accept-Language` sniff happens **on first visit only**, then the locale is sticky in a `NEXT_LOCALE` cookie. Don't redirect on every visit.
- `next-intl` middleware handles the prefix.

## Static copy

- Lives in `/messages/kz.json`, `/messages/ru.json`, `/messages/kr.json`.
- Mirror the existing prototype `i18n.jsx` tree (`brand`, `nav`, `onb`, `home`, `cat`, `tx`, `cl`, `cld`, `rv`, `fm`, `ok`, `my`, `ad`, …).
- ICU plural rules supported by next-intl. KZ uses Russian plural form set.
- Lint: PR-blocking check that catches untranslated keys (`pnpm i18n:check`).

## Dynamic content (DB)

- Treatments, clinics, templates, etc. store localized fields as JSON columns: `{ kz: "...", ru: "...", kr: "..." }`.
- Helper: `t(field, locale)` with fallback chain `locale → kz → ru → kr`.
- The admin editor always shows all three languages side by side. No machine translation in v1.

## Fonts

- **Pretendard Variable** covers Latin, Cyrillic, Hangul out of the box.
- System fallback chain: `"Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif` — handles Kazakh extended Cyrillic (`ә ң ғ қ ұ ү һ і`) on the rare old device that needs it.
- Load once globally via `<link>` to `cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9` — already in the prototype.

## Copy guidelines

- KZ is the source. RU is closer to it in tone than KR.
- KR is professional, polite, uses 시술 (시술) not 수술; honorifics on customer-facing copy (-요/-습니다).
- Never machine-translate medical terms. Use the glossary at `docs/glossary.md` (TODO M2-09).
- Numbers stay Arabic. Dates: `YYYY-MM-DD` in DB; locale-formatted on render.

## Workflow

1. Engineer writes KZ + RU + KR placeholder, marks RU/KR with `// TODO: review`.
2. Native reviewer (PM-coordinated) updates RU and KR before phase exit.
3. PR can't merge if any `// TODO: review` survives.
