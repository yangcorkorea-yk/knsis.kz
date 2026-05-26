/*
 * components/treatments/medical-disclaimer.tsx
 *
 * CLAUDE.md §2 launch hard rule: every treatment page must carry
 * this disclaimer. The copy is provided by the page layer (where
 * `getTranslations` runs) and passed in as props, so this component
 * stays a pure presentation node — synchronously renderable, easy
 * to unit-test with react-dom/server, and the i18n fidelity test
 * lives at the messages-catalog layer instead of being entangled
 * with next-intl runtime here.
 *
 * Visual: matches the prototype `ScreenTreatmentDetail` disclaimer
 * panel (`docs/prototype/screens-a.jsx` line 594) — inset card with
 * shield icon, `bg-ground` panel, `border-line-soft`, rounded-md
 * (11 px to match the prototype). PM picked this treatment over
 * sticky-footer / inline-paragraph alternatives.
 *
 * a11y: `role="note"` + locale-scoped `aria-label` make the panel
 * a discoverable landmark for screen readers; the decorative
 * shield is `aria-hidden`.
 */

import { Shield } from "lucide-react";

interface Props {
  body: string;
  ariaLabel: string;
}

export function MedicalDisclaimer({ body, ariaLabel }: Props) {
  return (
    <aside
      role="note"
      aria-label={ariaLabel}
      className="mx-4 flex items-start gap-2.5 rounded-md border border-line-soft bg-ground p-3.5"
    >
      <Shield
        aria-hidden="true"
        strokeWidth={1.8}
        className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute"
      />
      <p className="text-[11px] leading-relaxed text-ink-body">{body}</p>
    </aside>
  );
}
