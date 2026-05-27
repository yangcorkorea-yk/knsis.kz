/*
 * lib/search/highlight.ts — split a source string into alternating
 * text / mark segments around case-insensitive matches of a query.
 *
 * The output is a plain data structure (segment array). The
 * consumer (<HighlightedText>) renders text segments as React
 * text nodes and mark segments as <mark>. **No HTML is constructed
 * here and the caller MUST NOT use dangerouslySetInnerHTML** —
 * the user-controllable inputs (query + body text from a review)
 * would otherwise be an XSS gun pointed at every visitor. React's
 * text-node escape is the gun safety.
 *
 * Algorithm: linear scan with String.prototype.indexOf on the
 * lowercased value (avoids regex + the need for special-char
 * escaping). Original casing of the matched substring is
 * preserved so the highlight reads naturally.
 */

export type HighlightSegment = { kind: "text"; value: string } | { kind: "mark"; value: string };

export function splitForHighlight(value: string, query: string): HighlightSegment[] {
  const q = query.trim();
  if (q.length === 0) {
    return value.length > 0 ? [{ kind: "text", value }] : [];
  }
  if (value.length === 0) return [];

  const lowerValue = value.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const segments: HighlightSegment[] = [];

  let i = 0;
  while (i <= value.length) {
    const idx = lowerValue.indexOf(lowerQuery, i);
    if (idx === -1) {
      if (i < value.length) segments.push({ kind: "text", value: value.slice(i) });
      break;
    }
    if (idx > i) segments.push({ kind: "text", value: value.slice(i, idx) });
    segments.push({ kind: "mark", value: value.slice(idx, idx + q.length) });
    i = idx + q.length;
  }
  return segments;
}
