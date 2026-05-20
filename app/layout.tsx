import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "knsis.kz",
  description: "K-Beauty consultation platform for Kazakhstan customers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="kk">
      <body>{children}</body>
    </html>
  );
}
