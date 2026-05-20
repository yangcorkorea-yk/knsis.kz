# M7 · Hardening & launch

> Perf · a11y · i18n QA · security · soft launch → GA. Week 10–12.

**Phase done when:** GA — DNS cut over to `knsis.kz`, status page live, runbook in `docs/runbook.md`, on-call rota live.

## Tasks

### M7-01 · Perf budget
- [ ] Lighthouse CI on PR for 6 key pages.
- [ ] LCP < 2.5 s, CLS < 0.1, TBT < 200 ms, JS ≤ 130 KB/route.
- [ ] Image optimization audit (every `<img>` is `next/image`).
- **DoD:** CI fails on regression.
- **Owner:** FE. **Est:** 3d.

### M7-02 · A11y sweep (WCAG 2.1 AA)
- [ ] axe-core in CI for all public routes.
- [ ] Manual screen-reader pass (NVDA + VoiceOver).
- [ ] Focus visible everywhere; skip-link on every page.
- [ ] Contrast audit on rose-on-tint chips.
- **DoD:** Zero serious / critical axe issues on public routes.
- **Owner:** FE + QA. **Est:** 3d.

### M7-03 · i18n QA pass
- [ ] Native KZ reviewer walks every screen.
- [ ] Native KR reviewer walks every screen.
- [ ] RU is checked against KZ master.
- [ ] Date / number / plural locale-format verified.
- **DoD:** Sign-off on a shared QA spreadsheet.
- **Owner:** QA. **Est:** 2d.

### M7-04 · Security review
- [ ] OWASP top 10 walk-through.
- [ ] Penetration test (light, internal).
- [ ] Rate limits verified on every mutating route.
- [ ] PII encryption checks.
- [ ] Audit log spot-check.
- **DoD:** No high-severity findings open at sign-off.
- **Owner:** BE. **Est:** 3d.

### M7-05 · Playwright e2e suite
- [ ] J1: sign in.
- [ ] J2: browse → consult form → done.
- [ ] J3: KV plan.
- [ ] J4: admin inbox triage + WA send.
- [ ] J5: review moderation.
- **DoD:** All five run green on PR in < 4 min.
- **Owner:** QA. **Est:** 3d.

### M7-06 · Soft launch
- [ ] 50 invited users.
- [ ] 5 managers on rotation.
- [ ] 7-day window.
- [ ] Daily 15-min triage standup.
- **DoD:** ≤ 5 P1 bugs at end of window (slip GA if more).
- **Owner:** OPS. **Est:** 5d.

### M7-07 · GA — public launch
- [ ] DNS cutover to `knsis.kz`.
- [ ] Status page at `status.knsis.kz`.
- [ ] On-call rota live.
- [ ] Marketing handoff (assets, channels).
- **DoD:** Public traffic served; no rollbacks within 48 h.
- **Owner:** OPS. **Est:** 2d.
