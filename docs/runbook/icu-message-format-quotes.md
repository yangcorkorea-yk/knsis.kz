# ICU MessageFormat — ASCII single quotes eat your placeholder

## The trap

next-intl uses **ICU MessageFormat** under the hood. ICU treats
ASCII single quotes (`'`) as an escape mechanism: anything
between two `'` is treated as literal text and **placeholders
inside are not substituted**.

PR #10 shipped this on `search.results_count`:

```jsonc
// messages/kz.json (broken)
"results_count": "'{query}' үшін {count} нәтиже"
```

User searched for `피코` → screen rendered
`{query} үшін 3 нәтиже` instead of `«피코» үшін 3 нәтиже`.
The literal substring `{query}` appeared on screen because ICU
saw `'{query}'` and stripped the substitution.

## The fix (51197ea)

Use **typographic quotes** for the visual delimiter — not the
ASCII straight quote ICU reserves for escaping.

```jsonc
// messages/kz.json (correct — guillemets for KZ + RU)
"results_count": "«{query}» үшін {count} нәтиже"

// messages/ru.json
"results_count": "{count} результатов по запросу «{query}»"

// messages/kr.json (smart double quotes for KR)
"results_count": "“{query}”에 대한 {count}개 결과"
```

Locale-appropriate punctuation:

| Locale  | Open / close                    |
| ------- | ------------------------------- |
| kz / ru | `«` / `»` (guillemets)          |
| kr      | `“` / `”` (curly double quotes) |

## Edge cases worth knowing

- `''` (two ASCII single quotes adjacent) renders as a literal
  apostrophe in the output and does NOT escape. So
  `"don''t"` → `don't`. This is the escape mechanism for the
  escape character.
- ICU select / plural blocks have their own brace semantics —
  use `#` instead of `{count}` inside `plural { … }` blocks.
- The JSON file is parsed first (JSON-escapes apply), then ICU
  parses the result. Smart quotes don't need JSON escaping but
  they sometimes get auto-corrected by editors — paste from a
  trusted source or use the `“` / `”` escapes.

## Guard

`lib/i18n/disclaimer-consistency.test.ts` (the catalog hygiene
suite) walks every string in every locale and asserts no key
matches `/'\{[a-zA-Z_]+\}'/` (ASCII single quotes around an
ICU placeholder). One regression vector closed for good.

## Triage when a placeholder doesn't substitute

1. Open the catalog key in the broken locale.
2. Check for ASCII `'` immediately before or after a `{…}`
   token — that's almost always the cause.
3. Replace with locale-appropriate typographic quote.
4. `pnpm test lib/i18n/disclaimer-consistency` — the guard
   should still pass.
5. `pnpm i18n:check` — key parity intact.
