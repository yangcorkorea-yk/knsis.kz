# 05 · Permissions matrix (RBAC)

> Encode this in `lib/auth/rbac.ts`. Server middleware applies it; FE hides UI that the user can't reach.

## Roles

| Role | Description |
|---|---|
| `customer` | End user. No admin surface. Self-service routes only. |
| `support` | Junior agent. Triage and respond to reviews. |
| `manager` | Standard manager. Handles leads, customers, templates. |
| `head` | Senior manager. Superset of manager. Full team visibility. |
| `admin` | Platform admin. Everything. |

## Matrix

| Area | Customer | Support | Manager | Head | Admin |
|---|---|---|---|---|---|
| Public site | View | View | View | View | View |
| Own profile / leads | Edit own | Edit own | Edit own | Edit own | Edit own |
| Leads (admin) | — | View | Edit | Edit | Edit |
| Customers | — | View | Edit | Edit | Edit |
| Clinics | — | View | View | Edit | Edit |
| Templates | — | — | Edit | Edit | Edit |
| Automation | — | — | View | Edit | Edit |
| Review moderation | — | Edit | Edit | Edit | Edit |
| Send log | — | View | View | View | Edit |
| Managers (team) | — | — | — | View | Edit |
| B/A admin | — | — | Edit | Edit | Edit |
| Audit log | — | — | — | View | View |

`Edit` implies `View`. `Admin` here means "platform admin", not "role of value `admin`" — both `head` and `admin` get most edit rights; only `admin` can demote a `head` or rotate platform secrets.

## Enforcement

```ts
// lib/auth/rbac.ts
export const policies = {
  'leads:edit':  ['manager', 'head', 'admin'],
  'leads:view':  ['support', 'manager', 'head', 'admin'],
  'team:edit':   ['admin'],
  'team:view':   ['head', 'admin'],
  // …
} as const;

export function requirePolicy(p: keyof typeof policies) {
  return (session: Session) => {
    if (!policies[p].includes(session.role)) {
      throw new ForbiddenError(p);
    }
  };
}
```

Every admin route handler starts with `await requirePolicy('leads:edit')(session)`.

## Audit log

Every `Edit` action writes an `AuditLog` row with:

- `actorId`, `actorRole`
- `action` (`lead.update`, `template.save`, etc.)
- `entity` + `entityId`
- `before` + `after` JSON (diffed in UI)
- `ip`, `userAgent`, `ts`
