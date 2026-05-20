# 01 · Responsive strategy

> Mobile-first for the end-user surface. Desktop-first for the admin. Tablet is a real breakpoint.

## Breakpoint contract

| Token | Min width | Behavior |
|---|---|---|
| (none) | 0 | Mobile column, designs anchored to 390 px. |
| `sm` | 640 px | Large mobile / small tablet portrait — public app centered, optional side gutter. |
| `md` | 768 px | Tablet portrait — public app stays in a centered 440 px column with marketing aside. |
| `lg` | 1024 px | Tablet landscape — admin sidebar appears, but admin still shows "best on desktop" advisory below 1280. |
| `xl` | 1280 px | **Desktop admin baseline.** Sidebar (220 px) + main + detail drawer (300 px). |
| `2xl` | 1536 px | Admin gets an extra activity-feed column. |

## Per-surface

### Public mobile suite (20 screens)
- Onboarding, Home, Categories, Treatment, Clinics, Reviews, Form, Done, MyPage, Korea Visit (3), Login (3), Before/After, Notifications, Chat, Search, Settings.
- **Strategy:** mobile-first. Above `md`, center the content in a `max-w-[440px]` column. Use the gutter for ambient gradient artwork or, on Home/KV only, a small marketing aside showing language switcher + a featured clinic.
- 44 px minimum hit target. Safe-area padding via `env(safe-area-inset-*)`.
- Bottom tab bar is `position: fixed; bottom: 0; z-index: 5;` with backdrop blur.

### Admin desktop suite (10 screens)
- Dashboard, Leads, Lead detail, Customers, Clinics (admin), Clinics detail, Review moderation, Managers, Notif templates, Automation, Send log, B/A admin.
- **Strategy:** desktop-first at `xl`. Below `xl`, render a sticky banner with "Open on desktop for full features" plus a degraded read-only Leads list so a manager can triage from an iPad.
- Three-column shell: sidebar + main + drawer. Drawer collapses below `lg`.

## Component contracts

- **Top app bar** — sticky on scroll, blurred background, used by every mobile screen.
- **Bottom tab bar** — fixed on the 5 root mobile routes (Home, Categories, Clinics, Reviews, Me). Hidden inside flows (form, KV, login, chat).
- **CTA button** — full-width primary on mobile; auto-width above `md` if inline.
- **Cards** — `rounded-2xl`, hairline border, soft shadow. Padding scales by breakpoint.

## Don't-do list

- ❌ No `vh` units in scrollable containers — iOS Safari makes that a pain.
- ❌ No `position: fixed` on admin drawers (use `sticky`); they stack badly with the topbar.
- ❌ No infinite scroll on the public Reviews feed; use pagination so screenshots stay reproducible.
- ❌ No horizontal scroll except on intentional pill rails (chip groups, filter rails).
