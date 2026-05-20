"use client";

import { Grid3x3, Home, Hospital, Star, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { useNav, type ScreenTarget } from "@/components/nav-provider";
import { cn } from "@/lib/utils";

/*
 * BottomTab — fixed mobile tab bar. Mirrors docs/prototype/theme.jsx
 * BottomTab(). Five tabs, prototype labels live in next-intl catalogs
 * once M0-06 ships; until then English fallbacks are inline.
 */

type Tab = {
  id: ScreenTarget;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const TABS: Tab[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "cat", label: "Categories", Icon: Grid3x3 },
  { id: "cl", label: "Clinics", Icon: Hospital },
  { id: "rv", label: "Reviews", Icon: Star },
  { id: "my", label: "Me", Icon: User },
];

export function BottomTab({ active = "home" }: { active?: ScreenTarget }) {
  const nav = useNav();
  return (
    <nav
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 flex justify-around border-t border-line",
        "bg-paper/95 px-2 pb-[26px] pt-2 backdrop-blur supports-[backdrop-filter]:bg-paper/80",
      )}
      aria-label="Primary"
    >
      {TABS.map(({ id, label, Icon }) => {
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => nav.go(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-[3px] px-2 py-1 transition-transform active:scale-95",
              on ? "text-rose" : "text-ink-mute",
            )}
            aria-current={on ? "page" : undefined}
          >
            <Icon className="h-[22px] w-[22px]" strokeWidth={on ? 1.9 : 1.5} />
            <span
              className={cn("text-[10.5px] tracking-tight", on ? "font-semibold" : "font-medium")}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
