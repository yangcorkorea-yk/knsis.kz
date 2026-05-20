# M1 · Auth & Profile

> Real OTP. Consent flow. Basic profile read-only. Week 2–3.

**Phase done when:** a real user can sign in via phone OTP, accept consent, land on `/me`, change locale, and sign out — across all three languages.

## Tasks

### M1-01 · Phone OTP integration
- [ ] Provider abstraction `lib/auth/otp.ts` with `send(phone)` and `verify(phone, code)`.
- [ ] Mobizon for KZ (+7), Twilio Verify for international.
- [ ] 4-digit codes, 5-min TTL.
- [ ] Rate limits per `docs/03-api.md`.
- [ ] Resend after 30 s on FE.
- **DoD:** Real KZ phone receives SMS within 30 s, verify returns a session.
- **Owner:** BE. **Est:** 3d.

### M1-02 · Login → OTP → Consent UI (3 screens)
- [ ] Phone entry screen (country pick, channel pick).
- [ ] OTP screen (auto-advance, paste support).
- [ ] Consent screen (ToS required, marketing + push optional).
- **DoD:** All three render at 390 / 768 / 1280 px and three languages.
- **Owner:** FE. **Est:** 2.5d.

### M1-03 · Session + middleware
- [ ] Better-Auth integration with cookie sessions.
- [ ] `requireSession()` server util.
- [ ] Middleware redirects unauthenticated users from `/me*` to `/login`.
- [ ] Sign-out everywhere on logout.
- **DoD:** Cookie rotation works; CSRF handled.
- **Owner:** BE. **Est:** 1.5d.

### M1-04 · My page (read-only)
- [ ] Profile header (name, phone, locale chip).
- [ ] 3 stats: requests, fav treatments, fav clinics (all 0 for now).
- [ ] Request history (empty state).
- [ ] Favorites (empty state).
- [ ] Settings card link.
- **DoD:** Renders for a signed-in user.
- **Owner:** FE. **Est:** 1.5d.

### M1-05 · RBAC primitives
- [ ] `Role` enum in Prisma.
- [ ] `lib/auth/rbac.ts` with `policies` map (per `docs/05-permissions.md`).
- [ ] `requirePolicy()` server util.
- [ ] Server unit tests for each policy.
- **DoD:** Calling an admin route as a customer returns 403.
- **Owner:** BE. **Est:** 2d.
