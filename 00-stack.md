# knsis.kz — Claude Code Handoff Package

This is the buildable spec for **knsis.kz**, a K-Beauty consultation platform.

> **Read `CLAUDE.md` first.** It is the master entry for any engineer or coding assistant working on this project.

## Package contents

```
claude-code-handoff/
├─ CLAUDE.md                 ← Master entry. Read first.
├─ README.md                 ← You are here.
├─ docs/                     ← Reference specs
│  ├─ 00-stack.md
│  ├─ 01-responsive.md
│  ├─ 02-data-model.md
│  ├─ 03-api.md
│  ├─ 04-i18n.md
│  ├─ 05-permissions.md
│  ├─ 06-nfr.md
│  ├─ 07-screens.md
│  ├─ 08-design-tokens.md
│  └─ 99-open-questions.md
├─ wbs/                      ← Phase task sheets — execute in order
│  ├─ M0-foundation.md
│  ├─ M1-auth.md
│  ├─ M2-discovery.md
│  ├─ M3-lead-capture.md
│  ├─ M4-kv-chat-notif.md
│  ├─ M5-admin-core.md
│  ├─ M6-notifications-workflow.md
│  └─ M7-launch.md
├─ prisma/
│  └─ schema.prisma          ← Starter schema (M0-03 deliverable)
├─ package.json              ← Scripts + pinned deps
├─ .env.example
└─ .gitignore
```

## Companion artifacts (in parent project)

- **`K-Beauty Сana MVP.html`** — The interactive visual prototype. 28 screens, 3 languages, live navigation. Toggle the **Tweaks** panel to switch languages.
- **`Build Roadmap & WBS.html`** — The narrative roadmap document this package is derived from.
- **`screens-*.jsx`, `screen-admin*.jsx`** — Source for every screen. Treat as design reference, not as code to copy.

## How to use this package

### If you are an engineer

1. Read `CLAUDE.md` end to end.
2. Read `docs/00-stack.md` and `docs/02-data-model.md` to understand the shape.
3. Skim `docs/07-screens.md` for the surfaces you'll be touching.
4. Open `wbs/M0-foundation.md` and start checking boxes.

### If you are Claude Code

```
Read claude-code-handoff/CLAUDE.md, then start on wbs/M0-foundation.md.
For each task: read the task spec, write the code, run tests, open a PR.
When the phase's checklist is complete, move to the next phase file.
```

### If you are a PM / reviewer

- The phase plan is in `wbs/*` — each file ends with a "Phase done when" checklist.
- The acceptance criteria per screen are in `docs/07-screens.md`.
- Open questions waiting on you: `docs/99-open-questions.md`.

## Total estimate

~125 person-days across FE/BE/DE/OPS/QA. Two-engineer team → ~12 weeks. Solo + Claude Code → ~16 weeks.
