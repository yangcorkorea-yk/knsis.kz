/*
 * lib/admin/leads/queries.ts — read-side fetchers for the admin
 * leads workbench.
 *
 * Lives next to filters.ts so the list page only needs one import
 * to go from parsed URL → rendered rows. Server-only by virtue of
 * the Prisma import — no auth check inside; the (gated) route group
 * is the gate.
 */

import type { LeadKind, LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import {
  buildAdminLeadsWhere,
  orderByFor,
  paginationFor,
  PAGE_SIZE,
  type AdminLeadsFilters,
} from "./filters";

export interface AdminLeadRow {
  id: string;
  code: string;
  status: LeadStatus;
  kind: LeadKind[];
  regions: string[];
  hasPhoto: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
  };
  ownerId: string | null;
}

export interface AdminLeadsPage {
  rows: AdminLeadRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function fetchAdminLeadsPage(filters: AdminLeadsFilters): Promise<AdminLeadsPage> {
  const where = buildAdminLeadsWhere(filters);
  const { skip, take } = paginationFor(filters);
  const orderBy = orderByFor(filters);

  const [rows, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        code: true,
        status: true,
        kind: true,
        regions: true,
        photos: true,
        ownerId: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status,
      kind: r.kind,
      regions: r.regions,
      hasPhoto: r.photos.length > 0,
      createdAt: r.createdAt,
      user: r.user,
      ownerId: r.ownerId,
    })),
    total,
    page: filters.page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export interface StaffOption {
  id: string;
  name: string | null;
  email: string;
}

/**
 * Staff users for the owner filter dropdown + drawer assignment
 * control. Returns active (non-deleted) members of STAFF_ROLES. The
 * caller treats the list as read-only display data — assignment
 * goes through the mutation API.
 */
export async function fetchStaffOptions(): Promise<StaffOption[]> {
  const rows = await prisma.user.findMany({
    where: {
      deletedAt: null,
      role: { in: ["support", "manager", "head", "admin"] },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email ?? "",
  }));
}
