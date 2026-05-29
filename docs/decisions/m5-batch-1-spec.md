# M5-01 + M5-03 mini-spec — admin shell + leads workbench

**Date:** M3 closure · M5 batch-1 prep
**Owner:** Implementer
**Awaiting PM sign-off** on the open questions below before
the first code commit on `claude/m5-admin-leads`.

## Scope (per `MVP Roadmap & WBS.html` §06)

### M5-01 admin shell

> "Sidebar (7 items) + topbar + drawer; route guard
> `requireRole('manager+')`; theme. dep: M1-03. est: 2."

### M5-03 leads list + drawer

> "Table, status pills, owner/clinic assignment, notes,
> activity log; URL-state filters; in-app chat link +
> click-to-call. dep: M5-01, M3-03, M4-02. est: 4."

**Adjustment for Option C sequencing**: `M4-02` (in-app chat)
doesn't exist yet, so the drawer ships without the chat-link
affordance. M4-02 adds it as a one-line drawer enhancement
when it ships. Click-to-call (`tel:`) + WA-link (`https://wa.me/`)

- TG-link (`https://t.me/`) all ship now — those don't depend
  on chat.

## Existing infrastructure (audit, all green)

- **Auth layer** (M1-02 / M1-03): `requireRole(allowed)` returns
  discriminated union (`{ok:true,session}` | `{ok:false,status:401|403}`).
  `STAFF_ROLES` = `support / manager / head / admin`. DB-backed
  sessions, cookie carries session id only.
- **Sign-in endpoint** (M1-02): `POST /api/auth/signin` exists +
  vitest-covered. Just needs an admin-side `/admin/signin` page
  to call it.
- **Schema** (M0-03): `User` / `Lead` / `Note` / `AuditLog` /
  `Session` all in place. **Zero migration needed.**
- **Lead.code** + relations: M3 already populates `idempotencyKey`,
  `whatsappId`, `telegramId`, `preferredLanguage` + `photos[]`
  (Supabase Storage paths).
- **Signed-URL minting**: `lib/uploads/storage.ts`
  `signPhotoReadUrl(path)` returns a 5-min URL. Drawer photo
  gallery uses this directly.

## File structure plan

```
app/admin/[locale]/
├── layout.tsx                  # M5-01 shell (sidebar + topbar + drawer mount)
├── signin/page.tsx             # M5-01 admin sign-in form
├── (gated)/                    # route group — requireRole guard here
│   ├── layout.tsx              # calls requireRole(['support','manager','head','admin']) + redirects /admin/{locale}/signin if 401
│   ├── page.tsx                # default landing → redirect to /admin/{locale}/leads
│   └── leads/
│       ├── page.tsx            # M5-03 list view
│       └── [code]/page.tsx     # drawer-as-route (slide-in animation handled by client wrapper)
app/api/admin/
└── leads/[code]/
    ├── route.ts                # GET single lead (drawer fetch)
    ├── status/route.ts         # PATCH status (status enum mutation)
    ├── owner/route.ts          # PATCH owner (manager assignment)
    ├── clinic/route.ts         # PATCH clinic (clinic assignment)
    └── notes/route.ts          # POST + GET notes
components/admin/
├── admin-shell.tsx             # sidebar (7 items: Dashboard/Leads/Customers/Clinics/Reviews/Managers/B-A) + topbar + sign-out
├── leads-table.tsx             # client island (table sort + URL-state filter sync)
├── lead-status-pill.tsx        # status enum → colored pill primitive
├── lead-drawer.tsx             # drawer client component (the actual drawer; route opens it)
├── lead-drawer-fields.tsx      # all Lead fields rendered (WA/TG links, photos, etc.)
├── lead-status-control.tsx     # status mutation pills with optimistic UI
├── lead-owner-control.tsx      # owner assignment dropdown
├── lead-clinic-control.tsx     # clinic assignment dropdown
├── lead-notes.tsx              # notes composer + list
└── lead-activity-log.tsx       # audit-log rows for this lead, newest first
lib/admin/
├── audit-log.ts                # auditLog({actor, action, entity, entityId, before, after, ip, ua}) helper
├── lead-mutations.ts           # mutation orchestration (lookup → mutate → audit-log in single transaction)
└── filters.ts                  # URL-state filter parse + serialize (mirrors lib/discover/filters.ts pattern)
messages/{kz,ru,kr}.json        # admin.* namespace
```

## Audit-log seam design

`AuditLog` model already exists with the right shape (line 359
of `prisma/schema.prisma`). The helper wraps each mutation:

```ts
// lib/admin/audit-log.ts
export async function auditLog(params: {
  tx: Prisma.TransactionClient; // run inside the mutation's transaction
  actorId: string;
  action: string; // e.g. "lead.status.update", "lead.owner.assign"
  entity: "Lead" | "Clinic" | "Review" | "User";
  entityId: string;
  before: Json | null;
  after: Json | null;
  ip: string | null;
  ua: string | null;
}): Promise<void>;
```

Mutation pattern:

```ts
// lib/admin/lead-mutations.ts
export async function updateLeadStatus(deps: {
  actorId: string;
  code: string;
  newStatus: LeadStatus;
  ip: string | null;
  ua: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUniqueOrThrow({
      where: { code: deps.code },
      select: { id: true, status: true },
    });
    if (lead.status === deps.newStatus) return { changed: false };
    await tx.lead.update({
      where: { id: lead.id },
      data: { status: deps.newStatus },
    });
    await auditLog({
      tx,
      actorId: deps.actorId,
      action: "lead.status.update",
      entity: "Lead",
      entityId: lead.id,
      before: { status: lead.status },
      after: { status: deps.newStatus },
      ip: deps.ip,
      ua: deps.ua,
    });
    return { changed: true };
  });
}
```

**Hard rule §5 satisfied**: every admin mutation captures actor

- before + after inside the same transaction. If the audit-log
  insert fails, the mutation rolls back — they cannot drift.

`action` strings are free-form but follow `entity.field.verb`
convention so the activity log reads cleanly:

- `lead.status.update`
- `lead.owner.assign`
- `lead.owner.unassign`
- `lead.clinic.assign`
- `lead.clinic.unassign`
- `lead.note.add`
- (M5-06 future) `review.state.update`

## URL-state filters (M5-03 list view)

Mirror the `lib/discover/filters.ts` pattern that M2-02
established. Filter keys:

- `?status=new,contacted,...` (LeadStatus enum, multi)
- `?locale=kz` (User.locale, single)
- `?kind=korea` or `?kind=local` (Lead.kind, single)
- `?region=seoul` (Lead.regions array contains, single)
- `?hasPhoto=1` (Lead.photos non-empty, bool)
- `?owner=unassigned` or `?owner={userId}` (Lead.ownerId, single + sentinel)
- `?q=...` (substring across `Lead.code` + `User.phone` + `User.name`)
- `?sort=createdAt:desc` (default; `:asc` available)
- `?page=1` (pagination; 50 per page)

State serialised in URL so manager can share a filtered view +
back/forward navigation preserves position.

## i18n keys (admin namespace)

`admin.shell.*` (sidebar items + sign-out + sign-in), `admin.leads.*`
(table headers + filters + drawer fields + status pill labels +
empty state + error messages). KR PM-quality + KZ/RU first-write

- M7 native QA per the i18n-dynamic-content runbook.

## What ships in batch 1 (M5-01 + M5-03)

- ✅ Admin shell with sidebar (7 items pre-populated, only Leads
  link is active; others rendered as disabled placeholders for
  context)
- ✅ Sign-in form at `/admin/{locale}/signin`
- ✅ Leads list at `/admin/{locale}/leads` with URL-state filters
  - pagination + sort
- ✅ Lead drawer at `/admin/{locale}/leads/{code}` (slide-in over
  the list, deep-linkable per spec)
- ✅ Status / owner / clinic mutations (audit-logged)
- ✅ Notes composer (audit-logged on add)
- ✅ Activity log section (reads AuditLog WHERE entity='Lead' AND
  entityId=...)
- ✅ Click-to-call + WA-link + TG-link from drawer
- ✅ Photo gallery (signed URLs minted via existing
  `signPhotoReadUrl`)

## What's deferred (in this batch)

- ❌ Dashboard (M5-02 — batch 2)
- ❌ In-app chat link in drawer (M4-02 dep — adds in batch 2 of M5)
- ❌ Customers / Clinics admin / Review mod / Managers / B-A
  admin (M5-04 / 05 / 06 / 07 / 08 — batch 2)

## Open questions before code

1. **Single staff seed user**: PM is the only staff user
   today. Plan: seed one `User` row with `role=admin` +
   `passwordHash` via a one-shot script. Confirm the seed
   email + a one-time password generation pattern (env var
   set once → script reads → hashes → inserts → done).
2. **`unassigned` sentinel**: owner / clinic dropdowns need
   an "unassigned" option that maps to `null`. Confirm copy:
   KR `"미배정"`, KZ `"Тағайындалмаған"`, RU `"Не назначено"`?
3. **Status mutation guardrails**: any forbidden transitions?
   E.g., `done → new` allowed for the PM to re-open, or
   forbidden? Default: all transitions allowed, audit log
   captures who reverted what.
4. **Activity log scope**: drawer's activity tab — show only
   AuditLog rows on this lead, OR include Note creation + future
   Message events? Default: AuditLog only (Note add IS an
   AuditLog entry by design); Message events join in M4-02.
5. **Phone fields**: should `User.phone` render in the list
   table (PII exposure in the list view) or only inside the
   drawer? Default: drawer only. List shows only the lead
   `code` + status + city + createdAt for quick scan.

## Hard rule check (M5-01 + M5-03)

- ✅ No price field — admin views Lead data only, no monetary
  fields exist on the schema
- ✅ Channel writes locked to `inapp` / `email` — admin
  mutations don't write Messages; M4-02 owns Message writes
- ✅ PII: phone + name + WA/TG IDs encrypted at rest by
  Supabase. Photos via 5-min signed URLs. Admin reads via
  service-role bypass; UI never exposes the URL beyond its
  TTL (refresh on every drawer open)
- ✅ Consent timestamp unchanged
- ✅ **Audit log on every admin mutation** (hard rule §5,
  enforced by the seam pattern above)
- ✅ i18n source of truth — `admin.*` namespace in all three
  locales

## After batch-1 ship

PR title pattern: `feat(M5): admin shell + leads workbench`.
Closes the M3 PM-alert email's `/admin/{locale}/leads/{code}`
admin URL — it stops 404'ing.

Next batch (M4): KV form + in-app chat + transactional email.
Drawer gets the chat-link enhancement at that point.
