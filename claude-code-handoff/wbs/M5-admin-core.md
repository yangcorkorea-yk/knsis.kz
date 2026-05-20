# M5 · Admin core

> Manager workbench (desktop). Week 6–9.

**Phase done when:** a manager can run their whole day inside the admin — triage inbox, assign, send templated message, moderate reviews, manage clinics.

## Tasks

### M5-01 · Admin shell
- [ ] Sidebar (220 px) + topbar + main + right drawer (300 px) at `xl`.
- [ ] Route guard `requirePolicy('leads:view')`.
- [ ] Below `xl`: degraded read-only Leads + "Open on desktop" banner.
- **DoD:** Below 1024 shows the advisory; ≥ 1280 shows full layout.
- **Owner:** FE. **Est:** 2d.

### M5-02 · Dashboard
- [ ] 5 KPI cards.
- [ ] Funnel (5 stages).
- [ ] 7-day bar chart.
- [ ] Channel split.
- [ ] Sources split.
- [ ] Manager load.
- [ ] Activity feed.
- **DoD:** Numbers come from real DB queries (no mock data past M5-02 ship).
- **Owner:** FE. **Est:** 3d.

### M5-03 · Leads list + drawer
- [ ] Table cols per `docs/07-screens.md §23`.
- [ ] URL-state filters (status, owner, channel, kind, region).
- [ ] Status tabs above the table.
- [ ] Detail drawer: header, WA/TG buttons, assign manager, assign clinic, notes, activity log.
- [ ] Bulk-select for status change.
- **DoD:** Filter URL is shareable, drawer keeps state on back-nav.
- **Owner:** FE + BE. **Est:** 4d.

### M5-04 · Customers
- [ ] Segments: All · Active · Repeat · VIP · Dormant.
- [ ] Search by name / phone / code.
- [ ] Profile drawer.
- [ ] Tag editor.
- **DoD:** Tagging a customer updates their segment.
- **Owner:** FE. **Est:** 2.5d.

### M5-05 · Clinics admin
- [ ] Tabs: All · Korea · Local · Pending · Suspended.
- [ ] Card grid.
- [ ] Verify / suspend actions.
- [ ] Full CRUD form.
- [ ] CSV import (re-uses M2-09 pipeline).
- **DoD:** Verify state changes propagate to public list.
- **Owner:** FE + BE. **Est:** 3d.

### M5-06 · Review moderation
- [ ] Tabs: Pending · Flagged · Published · Rejected.
- [ ] Review card with body, photos, consent state, flag reason.
- [ ] Actions: Approve · Request edit · Reject.
- [ ] **Price-keyword scan**: server-side regex flags reviews containing price terms before they reach the queue.
- **DoD:** A review with the word "цена" lands in Flagged with reason.
- **Owner:** FE + BE. **Est:** 2.5d.

### M5-07 · Managers & permissions
- [ ] Team table with presence dot.
- [ ] Invite by email (Resend) with a sign-up token.
- [ ] Role editor (only `admin` can demote `head`).
- [ ] Permission matrix panel (read-only view of `lib/auth/rbac.ts`).
- **DoD:** Invited manager can sign in and reach the inbox.
- **Owner:** FE + BE. **Est:** 2.5d.
