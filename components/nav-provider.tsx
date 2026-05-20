"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, type ReactNode } from "react";

/*
 * NavProvider — keeps the prototype's `nav.go(target)` / `nav.back()` API
 * so screens ported from docs/prototype/screens-*.jsx can drop in.
 *
 * In the prototype `go(target)` jumps to a string id ('home', 'cat', …).
 * In production we resolve those ids to real route paths.
 */

export type ScreenTarget =
  | "home"
  | "cat" // categories
  | "cl" // clinics list
  | "rv" // reviews
  | "my" // me / my page
  | (string & {});

const TARGET_TO_PATH: Record<string, string> = {
  home: "/",
  cat: "/categories",
  cl: "/clinics",
  rv: "/reviews",
  my: "/me",
};

export interface NavContextValue {
  go: (target: ScreenTarget) => void;
  back: () => void;
  current?: ScreenTarget;
}

const NavCtx = createContext<NavContextValue>({
  go: () => {},
  back: () => {},
});

export function useNav(): NavContextValue {
  return useContext(NavCtx);
}

export function NavProvider({
  children,
  current,
}: {
  children: ReactNode;
  current?: ScreenTarget;
}) {
  const router = useRouter();
  const value = useMemo<NavContextValue>(
    () => ({
      go: (target) => router.push(TARGET_TO_PATH[target] ?? target),
      back: () => router.back(),
      current,
    }),
    [router, current],
  );
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}
