# M3 · Lead capture

> Real consult flow + handoff to managers. Week 4–6.

**Phase done when:** an end-to-end test passes — submit a lead → it appears in the admin inbox with photos.

## Tasks

### M3-01 · Consult form (multi-step)
- [ ] Step 1: Basic info (name, phone, channel pref, language).
- [ ] Step 2: Interest (treatments, region, kind).
- [ ] Step 3: Method (Korea visit / local).
- [ ] Step 4: Photos (optional, up to 3).
- [ ] Step 5: Message (textarea).
- [ ] Step 6: Consents (ToS required, marketing optional).
- [ ] Resumable draft via local-storage.
- [ ] Zod validation client + server.
- **DoD:** A user can complete the form on mobile in 3 languages without overflow.
- **Owner:** FE. **Est:** 3d.

### M3-02 · Photo upload pipeline
- [ ] `POST /api/uploads/sign` issues presigned PUT.
- [ ] Client-side resize to max 2048px long edge.
- [ ] EXIF strip on upload.
- [ ] Private bucket; signed GET with 5-min TTL.
- **DoD:** Photos round-trip; no public URL escapes.
- **Owner:** BE. **Est:** 2d.

### M3-03 · Lead create endpoint
- [ ] `POST /api/leads` with idempotency-key header.
- [ ] Generates `KB-YYYY-####` code.
- [ ] Emits `lead.created` event for Inngest.
- [ ] Returns `{ id, code, status: 'new' }`.
- **DoD:** Insert lands in DB; event fires; idempotent re-submit returns same id.
- **Owner:** BE. **Est:** 1.5d.

### M3-04 · Done / status screen
- [ ] Hero ("Your request was received").
- [ ] Summary block (5 rows).
- [ ] Next-steps timeline (3 items).
- [ ] CTA to Home + Browse more.
- **DoD:** Renders the just-created lead.
- **Owner:** FE. **Est:** 1d.

### M3-05 · Spam & rate-limit
- [ ] Turnstile on the form.
- [ ] Server rate limit per `docs/03-api.md` (1 / 10 min / phone, 5 / day / IP).
- [ ] Soft-block message in UI.
- **DoD:** Simulated abuse blocked within limits.
- **Owner:** BE. **Est:** 1d.
