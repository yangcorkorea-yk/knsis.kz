import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

// Pretendard Variable, self-hosted (decision B7 of the M0 PR description).
// The full variable axis (100–900) ships in one woff2 (~2 MB).
// Licence: SIL Open Font License 1.1, https://github.com/orioncactus/pretendard.
const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "knsis.kz",
  description: "K-Beauty consultation platform for Kazakhstan customers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="kk" className={pretendard.variable}>
      <body>{children}</body>
    </html>
  );
}
