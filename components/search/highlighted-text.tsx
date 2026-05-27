/*
 * components/search/highlighted-text.tsx
 *
 * Renders a string with the query token wrapped in <mark>.
 * Pure presentation. Both inputs (text + query) are
 * user-controllable, so the XSS guard lives at the *render*
 * level — we map the splitForHighlight segments to React text
 * nodes and <mark> elements; React's text-node escape is what
 * keeps `<script>` in a query from executing. Never use
 * dangerouslySetInnerHTML with the output.
 */

import { Fragment } from "react";
import { splitForHighlight } from "@/lib/search/highlight";

interface Props {
  text: string;
  query: string;
  className?: string;
}

export function HighlightedText({ text, query, className }: Props) {
  const segments = splitForHighlight(text, query);
  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.kind === "mark" ? (
          <mark key={i} className="rounded-sm bg-rose-soft px-0.5 text-rose-deep">
            {seg.value}
          </mark>
        ) : (
          <Fragment key={i}>{seg.value}</Fragment>
        ),
      )}
    </span>
  );
}
