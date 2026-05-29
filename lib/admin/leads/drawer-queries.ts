/*
 * lib/admin/leads/drawer-queries.ts — server fetchers for the
 * lead-drawer route. Returns the full read shape: lead fields,
 * resolved treatments/clinic/owner, notes, audit-log rows, signed
 * photo URLs.
 *
 * Photos: signed URLs are minted server-side per drawer render and
 * embedded in the SSR HTML. They expire in 5 minutes; the URL is
 * never exposed beyond that TTL (refresh on every drawer reopen).
 */

import type { LeadStatus, LeadKind, Locale } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { signPhotoReadUrl } from "@/lib/uploads/storage";

export interface LeadDrawerLeadView {
  id: string;
  code: string;
  status: LeadStatus;
  kind: LeadKind[];
  regions: string[];
  message: string | null;
  whatsappId: string | null;
  telegramId: string | null;
  preferredLanguage: Locale | null;
  channelPref: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    locale: Locale;
  };
  owner: { id: string; name: string | null; email: string | null } | null;
  clinic: { id: string; slug: string; name: Record<string, string> | null } | null;
  treatments: { id: string; slug: string; title: Record<string, string> | null }[];
  /** Pre-signed photo URLs (5-min TTL). Indexed by the original Storage path. */
  photoUrls: { path: string; url: string | null }[];
}

export interface LeadDrawerNote {
  id: string;
  body: string;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: Date;
}

export interface LeadDrawerAuditRow {
  id: string;
  action: string;
  before: unknown;
  after: unknown;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: Date;
}

export interface LeadDrawerPayload {
  lead: LeadDrawerLeadView;
  notes: LeadDrawerNote[];
  audit: LeadDrawerAuditRow[];
}

function isJsonRecord(v: unknown): v is Record<string, string> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function fetchLeadDrawerByCode(code: string): Promise<LeadDrawerPayload | null> {
  const lead = await prisma.lead.findUnique({
    where: { code },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true, locale: true } },
      owner: { select: { id: true, name: true, email: true } },
      clinic: { select: { id: true, slug: true, name: true } },
    },
  });
  if (!lead) return null;

  const [treatments, notes, audit] = await Promise.all([
    lead.treatmentIds.length > 0
      ? prisma.treatment.findMany({
          where: { id: { in: lead.treatmentIds } },
          select: { id: true, slug: true, title: true },
        })
      : Promise.resolve([]),
    prisma.note.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { entity: "Lead", entityId: lead.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        action: true,
        before: true,
        after: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
    }),
  ]);

  const photoUrls = await Promise.all(
    lead.photos.map(async (path) => {
      const signed = await signPhotoReadUrl(path);
      return { path, url: "url" in signed ? signed.url : null };
    }),
  );

  return {
    lead: {
      id: lead.id,
      code: lead.code,
      status: lead.status,
      kind: lead.kind,
      regions: lead.regions,
      message: lead.message,
      whatsappId: lead.whatsappId,
      telegramId: lead.telegramId,
      preferredLanguage: lead.preferredLanguage,
      channelPref: lead.channelPref,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      user: lead.user,
      owner: lead.owner,
      clinic: lead.clinic
        ? {
            id: lead.clinic.id,
            slug: lead.clinic.slug,
            name: isJsonRecord(lead.clinic.name) ? lead.clinic.name : null,
          }
        : null,
      treatments: treatments.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: isJsonRecord(t.title) ? t.title : null,
      })),
      photoUrls,
    },
    notes: notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt,
      authorName: n.author.name,
      authorEmail: n.author.email,
    })),
    audit: audit.map((a) => ({
      id: a.id,
      action: a.action,
      before: a.before,
      after: a.after,
      createdAt: a.createdAt,
      actorName: a.actor.name,
      actorEmail: a.actor.email,
    })),
  };
}
