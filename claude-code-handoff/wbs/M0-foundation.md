# M0 · Foundation

> Setup, design tokens, base UI, auth scaffold. Ship a deployable shell. Week 1–2.

**Phase done when:** a preview URL at `knsis.kz/preview` shows the empty app shell with locale routing, design tokens render correctly, Supabase is reachable, and the base component library has at least 8 reusable primitives committed.

## Tasks

### M0-01 · Bootstrap monorepo
- [ ] `pnpm create next-app@latest knsis --typescript --tailwind --app --eslint`
- [ ] Configure `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`.
- [ ] Add Prettier, Husky, lint-staged.
- [ ] Folder layout per `CLAUDE.md §3`.
- **DoD:** `pnpm dev` runs, `pnpm typecheck` is green.
- **Owner:** FE. **Est:** 1.5d.

### M0-02 · CI/CD + Vercel previews
- [ ] Vercel project linked, env vars set per-environment.
- [ ] GitHub Action: lint + typecheck + vitest on PR.
- [ ] Auto preview deploy comment on PR.
- **DoD:** A throwaway PR boots a preview URL.
- **Owner:** OPS. **Est:** 1d.

### M0-03 · Supabase + Prisma schema v0
- [ ] Supabase EU project created (see open question #1).
- [ ] `prisma init`, copy starter schema from `prisma/schema.prisma` in this package.
- [ ] First migration committed.
- [ ] Seed script creates 3 manager users, 5 clinics, 12 treatments.
- **DoD:** `pnpm db:migrate && pnpm db:seed` succeeds in CI.
- **Owner:** BE. **Est:** 2d.

### M0-04 · Design tokens → Tailwind
- [ ] Lift `docs/08-design-tokens.md` into `tailwind.config.ts`.
- [ ] Add Pretendard Variable load in root layout.
- [ ] Add global CSS for `.kb-card`, `.kb-display`, `.kb-img-ph` classes (mirror prototype).
- **DoD:** A test page styled with tokens visually matches the prototype.
- **Owner:** FE. **Est:** 1.5d.

### M0-05 · Base components
- [ ] `CTA`, `Badge`, `Card`, `Input`, `Select`, `Checkbox`, `Switch`, `Pill`, `Topbar`, `BottomTab`, `Sheet`, `Drawer`, `EmptyState`, `Avatar`, `StatusPill`.
- [ ] Each component has a Storybook (or `app/_dev/`) playground page.
- [ ] Icons map ported from `theme.jsx` to `components/icon.tsx`.
- **DoD:** All 15 components render at 390 / 768 / 1280 px.
- **Owner:** FE. **Est:** 3d.

### M0-06 · i18n scaffold
- [ ] `next-intl` installed, middleware adds `/[locale]` prefix.
- [ ] Three catalog files stubbed (key parity required).
- [ ] Default locale `kz`. Sticky cookie `NEXT_LOCALE`.
- [ ] Helper hooks: `useT()`, `useLocale()`.
- **DoD:** Visiting `/` redirects to `/kz`. Visiting `/ru` and `/kr` works. Toggle works.
- **Owner:** FE. **Est:** 1.5d.

### M0-07 · PWA manifest + icons
- [ ] `next-pwa` configured.
- [ ] App icons (192 / 512 / maskable).
- [ ] `start_url` and `theme_color` set.
- **DoD:** Chrome on Android shows "Install app" affordance.
- **Owner:** FE. **Est:** 1d.

## Risks

- Supabase region decision (open question #1) blocks M0-03 in production. Locally OK to start.
