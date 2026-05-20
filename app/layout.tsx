import type { ReactNode } from "react";

/*
 * Root layout is intentionally minimal — <html>, <body>, font wiring,
 * and the NextIntlClientProvider live in app/[locale]/layout.tsx so
 * the lang attribute reflects the active locale. Next.js still
 * requires a root layout file to exist; this one just passes children
 * through.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
