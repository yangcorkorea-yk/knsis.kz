/*
 * middleware.test.ts — regression lock on the next-intl matcher.
 *
 * The matcher in middleware.ts excludes:
 *   - /api/*    (route handlers — never rewrite)
 *   - /admin/*  (parallel root with its own /admin/[locale] segment,
 *               M5-01 — would rewrite /admin/kz/sign-in to
 *               /kz/admin/kz/sign-in → 404 without this exclusion)
 *   - /_next/*  (build assets)
 *   - /_vercel/*  (Vercel internals)
 *   - anything with a dot in the last segment (static files)
 *
 * Everything else passes through to next-intl's locale resolver.
 */

import { describe, expect, it } from "vitest";
import { config } from "./middleware";

const [PATTERN] = config.matcher;
const RE = new RegExp(`^${PATTERN}$`);

describe("middleware matcher", () => {
  it("matches marketing routes (next-intl applies)", () => {
    expect(RE.test("/")).toBe(true);
    expect(RE.test("/kz")).toBe(true);
    expect(RE.test("/kz/home")).toBe(true);
    expect(RE.test("/ru/treatments/lift")).toBe(true);
    expect(RE.test("/kr/consult")).toBe(true);
  });

  it("excludes the admin tree (parallel root, M5-01)", () => {
    expect(RE.test("/admin/kz/sign-in")).toBe(false);
    expect(RE.test("/admin/ru/sign-in")).toBe(false);
    expect(RE.test("/admin/kr/sign-in")).toBe(false);
    expect(RE.test("/admin/kz")).toBe(false);
    expect(RE.test("/admin/kz/leads")).toBe(false);
  });

  it("excludes API routes, Next internals, Vercel internals, and static files", () => {
    expect(RE.test("/api/auth/signin")).toBe(false);
    expect(RE.test("/api/leads")).toBe(false);
    expect(RE.test("/_next/static/chunks/main.js")).toBe(false);
    expect(RE.test("/_vercel/insights/script.js")).toBe(false);
    expect(RE.test("/manifest.webmanifest")).toBe(false);
    expect(RE.test("/favicon.ico")).toBe(false);
  });
});
