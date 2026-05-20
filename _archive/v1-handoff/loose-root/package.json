# 08 · Design tokens

> Lift these into `tailwind.config.ts`. The prototype's `theme.jsx` is the source-of-truth — these tables mirror it.

## Color palette

### Brand · Rose (primary)

| Token | Hex | Tailwind alias |
|---|---|---|
| `--rose` | `#E8607A` | `rose-DEFAULT` |
| `--rose-deep` | `#C84365` | `rose-deep` |
| `--rose-soft` | `#FCE7EC` | `rose-soft` |
| `--rose-tint` | `#FDF1F4` | `rose-tint` |

### Brand · Accents

| Token | Hex |
|---|---|
| `--lavender` | `#B8A4D4` |
| `--lavender-soft` | `#EFE8F8` |
| `--beige` | `#D4B896` |
| `--beige-soft` | `#F5EFE6` |

### Neutrals

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1A1A1A` | Headlines, primary text |
| `--ink-2` | `#3A3A3A` | Body, table cells |
| `--text` | `#5A5A5A` | Secondary text |
| `--text-mute` | `#8A8A8A` | Muted, captions |
| `--border` | `#ECE8E3` | Hairline borders |
| `--border-soft` | `#F2EEEA` | Dividers inside cards |
| `--bg` | `#FFFFFF` |  |
| `--bg-warm` | `#FBF8F5` |  |
| `--bg-soft` | `#F7F4F0` |  |

### State

| Token | Hex |
|---|---|
| `--success` | `#2F9E6A` |
| `--warn` | `#D08A2C` |
| `--danger` | `#A04432` |

## Lead status pill palette (admin)

| Status | bg | fg |
|---|---|---|
| New | `#FCE7EC` | `#C84365` |
| Contacted | `#E5F4EC` | `#1F7A4D` |
| In progress | `#FFF5E1` | `#A07012` |
| Scheduled | `#EAE4F5` | `#5E4B82` |
| Done | `#F0EDE8` | `#5A5A5A` |
| On hold | `#FDE8E4` | `#A04432` |

## Typography

Single family: **Pretendard Variable** (loaded once via CDN). System fallback chain handles rare Kazakh extended glyphs.

```css
font-family: "Pretendard Variable", "Pretendard",
             -apple-system, BlinkMacSystemFont,
             "Apple SD Gothic Neo", "Noto Sans KR",
             system-ui, sans-serif;
```

| Style | Size · Weight | Notes |
|---|---|---|
| Display | 30+ · 700 | `letter-spacing: -0.04em` |
| Title | 22 · 700 | `letter-spacing: -0.3px` |
| Section | 15 · 700 |  |
| Body | 13 · 400 | Default mobile |
| Body-lg | 14–15 · 400 | Default desktop |
| Caption | 11 · 500 |  |
| Mono (codes, IDs) | 10–11 · 700 | `ui-monospace, "JetBrains Mono"` |

## Radii

| Token | Px |
|---|---|
| `--r-sm` | 6 |
| `--r` | 8 |
| `--r-md` | 11 |
| `--r-lg` | 14 |
| `--r-xl` | 16 |
| `--r-2xl` | 18 |
| `--r-full` | 999 |

## Shadows

- Card: `0 1px 2px rgba(0,0,0,0.04)`.
- CTA: `0 4px 14px rgba(232,96,122,0.32)`.
- Sheet: `0 -8px 24px rgba(0,0,0,0.08)`.

## Spacing scale

Tailwind default `0.25rem` step. Cards default to `p-4` (mobile) / `p-5` (desktop). Section gutter `px-4` mobile, `px-6` md, `px-8` lg.

## Icons

- Stroke-based 24×24, stroke width 1.6, round caps. See `theme.jsx`'s `Icons` map for the exact path data.
- Lift into a `<Icon name="bell" size={20} />` component that reads from the same map.

## Components to ship by M0-05

`CTA`, `Badge`, `Card`, `Input`, `Select`, `Checkbox`, `Switch`, `Pill`, `Topbar`, `BottomTab`, `Sheet`, `Drawer`, `EmptyState`, `Avatar`, `StatusPill`.
