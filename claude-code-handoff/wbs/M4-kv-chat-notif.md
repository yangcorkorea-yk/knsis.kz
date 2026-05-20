# M4 · Korea Visit · Chat · Notifications

> The high-touch user surface. Week 5–7. Can be parallelized after M3.

**Phase done when:** the full VIP path works end-to-end — submit a lead, switch to chat, plan a Korea visit, see notifications, change settings.

## Tasks

### M4-01 · Korea Visit flow (3 screens)
- [ ] Landing (`/kv`) with value props.
- [ ] Plan form (`/kv/plan`): dates, airport, hotel pref, interpreter language, aftercare days.
- [ ] Confirmation (`/kv/ok`): itinerary card, what-to-bring, contact card.
- [ ] Creates a `KoreaVisit` record attached to a Lead.
- **DoD:** End-to-end submits a KV plan.
- **Owner:** FE. **Est:** 3d.

### M4-02 · In-app chat
- [ ] Supabase Realtime channel per lead.
- [ ] Bubble list, manager left, user right rose.
- [ ] Rich card messages (clinic preview).
- [ ] Typing indicator.
- [ ] Read receipts.
- [ ] Quick-reply chips above input.
- [ ] Attach / camera / send row.
- **DoD:** Two browsers see each other type and send in < 500 ms.
- **Owner:** FE + BE. **Est:** 4d.

### M4-03 · Notifications inbox
- [ ] Tabs: All · Consult · Review · Promo.
- [ ] Today / Earlier groups.
- [ ] Unread row indicator.
- [ ] "Mark all read".
- **DoD:** Sending a message via chat creates an inbox row for the recipient.
- **Owner:** FE. **Est:** 2d.

### M4-04 · Web push
- [ ] VAPID keys + service worker.
- [ ] Permission prompt placed on Settings (not blocking).
- [ ] Per-channel toggle stored in DB.
- **DoD:** Sending a push reaches an Android Chrome install.
- **Owner:** FE + BE. **Est:** 2d.

### M4-05 · Settings
- [ ] Language picker (3 cards) — instantly switches locale.
- [ ] Profile rows.
- [ ] Notification channel toggles.
- [ ] Privacy rows (consent state, photo consent, download my data, delete account).
- [ ] Support rows + version footer.
- **DoD:** Each toggle round-trips to DB.
- **Owner:** FE. **Est:** 2d.
