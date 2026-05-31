/*
 * lib/admin/mutation-helpers.ts — small helpers shared by every
 * admin mutation route handler.
 *
 *   - `EDITOR_ROLES`: the role allow-list for write operations.
 *     `support` is intentionally excluded (read-only view per PM
 *     sign-off).
 *   - `extractClientMeta(req)`: pulls IP + UA out of the request for
 *     the AuditLog row. Mirrors the `app/api/leads/route.ts` pattern.
 *   - `mapMutationError(err)`: turns LeadNotFoundError into a 404.
 */

import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { LeadNotFoundError } from "./lead-mutations";

export const EDITOR_ROLES: readonly Role[] = [Role.manager, Role.head, Role.admin] as const;

export interface ClientMeta {
  ip: string | null;
  ua: string | null;
}

export function extractClientMeta(req: Request): ClientMeta {
  return {
    ip:
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null,
    ua: req.headers.get("user-agent") ?? null,
  };
}

export function mapMutationError(err: unknown): NextResponse | null {
  if (err instanceof LeadNotFoundError) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return null;
}
