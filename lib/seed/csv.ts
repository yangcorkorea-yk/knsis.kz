/*
 * lib/seed/csv.ts — tiny RFC-4180-ish CSV parser for seed files.
 *
 * Scope: enough to handle our /seed/*.csv content. Supports:
 *   - LF (`\n`) line endings
 *   - Comma separators (no other delimiters)
 *   - Double-quoted fields, with `""` escape for embedded quotes
 *   - Embedded newlines inside quoted fields
 *   - Trailing empty lines are skipped
 *
 * Does NOT support: CR/CRLF normalisation, semicolon/tab variants,
 * BOM stripping, header-less files. The Out-File `-Encoding ascii`
 * note in docs/runbook/powershell.md keeps the BOM problem at bay.
 *
 * Reusable for the M2-09 seed loader and any future fixture import.
 * Plenty of edge-case test coverage in csv.test.ts.
 */

export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const rows = parseRows(text);
  if (rows.length === 0) return [];
  const headerRow = rows[0];
  if (!headerRow) return [];
  const header = headerRow;
  return rows.slice(1).map((row) => {
    const out: CsvRow = {};
    for (let i = 0; i < header.length; i++) {
      out[header[i]!] = row[i] ?? "";
    }
    return out;
  });
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      // Skip trailing blank lines (a CSV ending in `\n` is the
      // common case — we don't want a row of empty strings).
      if (!(row.length === 1 && row[0] === "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  // Final line without trailing newline
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
  }
  return rows;
}
