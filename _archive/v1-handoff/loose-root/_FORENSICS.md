## loose-root/ — forensics note

These files lived at the **repo root** with names that **do not match their
content**. The git blob hashes match files inside `../handoff-package/`,
so the content is preserved correctly there.

Mapping observed (filename on disk in this directory → actual content):

| File on disk | Actual content |
|---|---|
| `CLAUDE.md` | `.gitignore` |
| `README.md` | `CLAUDE.md` (v1) |
| `00-stack.md` | `README.md` |
| `02-data-model.md` | `docs/00-stack.md` |
| `04-i18n.md` | `docs/02-data-model.md` |
| `03-api.md`, `05-permissions.md`, `06-nfr.md`, `07-screens.md`, `08-design-tokens.md`, `99-open-questions.md` | similar offset; trust `../handoff-package/docs/` instead |
| `package.json` | `docs/08-design-tokens.md` |
| `schema.prisma` | `docs/99-open-questions.md` |
| `i18n-check.ts` | `package.json` |
| `download` | `.env.example` |

**Do not read files in this directory by name.** Use `../handoff-package/`
for the correctly-named v1 sources.
