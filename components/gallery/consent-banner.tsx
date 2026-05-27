/*
 * components/gallery/consent-banner.tsx — top-of-page notice
 * that every B/A image on the surface is published with the
 * patient's explicit consent. Pure server-rendered text panel;
 * no dismiss state (M2-07 PM decision — every visit shows it).
 *
 * Distinct from <MedicalDisclaimer>: this banner is about
 * publishing consent (legal / ethical framing) while the
 * disclaimer is about medical advice. Both appear on the page
 * in sequence: banner first (patient privacy), disclaimer next
 * (medical context), then the gallery.
 */

import { ShieldCheck } from "lucide-react";

interface Props {
  body: string;
}

export function ConsentBanner({ body }: Props) {
  return (
    <aside
      role="note"
      className="mx-4 flex items-start gap-2.5 rounded-md border border-line-soft bg-paper p-3.5"
    >
      <ShieldCheck
        aria-hidden="true"
        strokeWidth={1.8}
        className="mt-0.5 h-4 w-4 shrink-0 text-success"
      />
      <p className="text-[11px] leading-relaxed text-ink-body">{body}</p>
    </aside>
  );
}
