"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNav } from "@/components/nav-provider";
import { cn } from "@/lib/utils";

/*
 * TopBar — sticky mobile app bar. Mirrors docs/prototype/theme.jsx TopBar().
 *
 *   <TopBar title="Treatments" back sub="Almaty" right={<Notifs />} />
 */

export interface TopBarProps {
  title: ReactNode;
  sub?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
  className?: string;
}

export function TopBar({ title, sub, back, onBack, right, transparent, className }: TopBarProps) {
  const nav = useNav();
  return (
    <div
      className={cn(
        "sticky top-0 z-40 flex min-h-12 items-center gap-2.5 px-4 py-2.5 backdrop-blur",
        transparent
          ? "bg-transparent"
          : "border-b border-line-soft bg-paper/90 supports-[backdrop-filter]:bg-paper/75",
        className,
      )}
    >
      {back && (
        <button
          type="button"
          aria-label="Back"
          className="-ml-1 p-1 transition-transform active:scale-95"
          onClick={onBack ?? nav.back}
        >
          <ChevronLeft className="h-[22px] w-[22px] text-ink" strokeWidth={1.6} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold tracking-tight text-ink">{title}</div>
        {sub && <div className="mt-px truncate text-[11px] text-ink-mute">{sub}</div>}
      </div>
      {right}
    </div>
  );
}
