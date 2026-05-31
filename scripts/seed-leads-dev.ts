/*
 * scripts/seed-leads-dev.ts — populate the Leads workbench with
 * fixture data for the M5-03 visual matrix.
 *
 * **DEV / PREVIEW ONLY.** Guards against NODE_ENV === "production"
 * at the top of main() and refuses to run. The fixtures use
 * obviously-fake names and `@example.test` emails so a production
 * accident still wouldn't leak real PII into the audit surface,
 * but the env-var guard is the primary defence.
 *
 * What it seeds (25 leads):
 *
 *   - Status distribution covers every LeadStatus enum value, with
 *     `new` over-weighted (real inbox shape: lots of unprocessed).
 *       new: 6, contacted: 5, in_progress: 5, scheduled: 4,
 *       done: 3, on_hold: 2.
 *   - Owner: ~half assigned to existing staff (rotates through
 *     whatever roles are seeded), ~half left unassigned so the
 *     `?owner=unassigned` sentinel filter has hits.
 *   - Clinic: ~half assigned (rotates through existing Clinic rows)
 *     so the `?clinic=...` axis (drawer dropdown) has things to
 *     pick. Skipped silently if no clinics seeded yet.
 *   - Regions / kind / preferredLanguage: cycle for variety.
 *   - Photos: 10 of the 25 leads carry a 1×1 PNG placeholder
 *     uploaded to the LEAD_PHOTOS_BUCKET so the `?hasPhoto=1`
 *     filter has hits + the drawer photo gallery has signed URLs
 *     to mint.
 *
 * Idempotent: re-running with a fresh DB upserts the same 25
 * fixtures by code (sequential `KB-{year}-DEV0001..DEV0025`). The
 * DEV prefix makes them obvious in the audit log and easy to clean
 * out (`DELETE FROM "Lead" WHERE code LIKE 'KB-%-DEV%'`).
 *
 * Runs the photo upload only if SUPABASE_SERVICE_ROLE_KEY is set;
 * otherwise the script logs a warning and skips photo seeding (the
 * fixture leads still get the path strings — list filter behaves
 * realistically but the drawer gallery will render the "URL
 * unavailable" tile for those entries).
 */

import { Locale, LeadKind, LeadStatus, PrismaClient, Role } from "@prisma/client";
import { uploadPhotoBuffer } from "@/lib/uploads/storage";

const prisma = new PrismaClient();

// 1×1 transparent PNG (67 bytes). Smallest valid PNG payload — enough
// to round-trip through Supabase Storage + signed-URL minting without
// shipping real imagery into the dev bucket.
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);

interface FixtureSpec {
  index: number;
  status: LeadStatus;
  kind: LeadKind[];
  regions: string[];
  preferredLanguage: Locale | null;
  whatsapp: string | null;
  telegram: string | null;
  message: string | null;
  photoCount: number;
  ownerOffset: number | null;
  clinicOffset: number | null;
  name: string;
  phone: string;
  email: string;
  userLocale: Locale;
}

const STATUS_DIST: LeadStatus[] = [
  ...Array(6).fill(LeadStatus.new),
  ...Array(5).fill(LeadStatus.contacted),
  ...Array(5).fill(LeadStatus.in_progress),
  ...Array(4).fill(LeadStatus.scheduled),
  ...Array(3).fill(LeadStatus.done),
  ...Array(2).fill(LeadStatus.on_hold),
];

const NAME_POOL = [
  "Айгерим Бекова",
  "Дина Сулейменова",
  "Алия Жумабаева",
  "Гульназ Тлеубаева",
  "Жанар Касенова",
  "Сабина Нурланова",
  "Камила Ахметова",
  "Зарина Турганбаева",
  "Анна Семёнова",
  "Мария Иванова",
  "Екатерина Кузнецова",
  "Полина Смирнова",
  "Наталья Орлова",
  "Юлия Морозова",
  "Алёна Соколова",
  "박지민",
  "이수연",
  "최서윤",
  "정하늘",
  "강은비",
  "Aigerim T.",
  "Dana K.",
  "Madina S.",
  "Inna V.",
  "Olga R.",
];

const REGION_POOL = ["seoul", "busan", "almaty", "astana"];
const LOCALE_POOL: Locale[] = [Locale.kz, Locale.ru, Locale.kr];

function buildFixtures(): FixtureSpec[] {
  return STATUS_DIST.map((status, i) => ({
    index: i,
    status,
    kind:
      i % 3 === 0
        ? [LeadKind.korea, LeadKind.local]
        : i % 2 === 0
          ? [LeadKind.korea]
          : [LeadKind.local],
    regions:
      i % 4 === 0
        ? [REGION_POOL[0]!, REGION_POOL[2]!]
        : i % 4 === 1
          ? [REGION_POOL[1]!]
          : i % 4 === 2
            ? [REGION_POOL[2]!]
            : [REGION_POOL[3]!],
    preferredLanguage: i % 3 === 0 ? Locale.kz : i % 3 === 1 ? Locale.ru : Locale.kr,
    whatsapp: i % 2 === 0 ? `+7 70${1 + (i % 9)} ${100 + i} ${1000 + i}` : null,
    telegram: i % 3 === 0 ? `@kbeauty_dev_${(i + 1).toString().padStart(2, "0")}` : null,
    message:
      i % 4 === 0
        ? "Visiting Seoul next month — interested in a quick consult before the trip."
        : i % 4 === 1
          ? "Алматыдағы жергілікті клиникадан кеңес алғым келеді."
          : null,
    photoCount: i < 10 ? (i % 3) + 1 : 0,
    // Owner: rotate among staff; first ~12 unassigned so the sentinel
    // has hits.
    ownerOffset: i >= 12 ? i - 12 : null,
    // Clinic: rotate among clinics for indices 5..18 so there's a mix.
    clinicOffset: i >= 5 && i < 19 ? i - 5 : null,
    name: NAME_POOL[i] ?? `Dev User ${i + 1}`,
    phone: `+7 70${(i % 9) + 1} ${(100 + i).toString().padStart(3, "0")} ${(1000 + i)
      .toString()
      .padStart(4, "0")}`,
    email: `dev-lead-${(i + 1).toString().padStart(2, "0")}@example.test`,
    userLocale: LOCALE_POOL[i % 3]!,
  }));
}

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[seed-leads-dev] refusing to run with NODE_ENV=production. This script seeds dev fixtures only.",
    );
  }

  const fixtures = buildFixtures();
  console.log(`[seed-leads-dev] preparing ${fixtures.length} fixture leads.`);

  const staff = await prisma.user.findMany({
    where: { role: { in: [Role.support, Role.manager, Role.head, Role.admin] } },
    orderBy: { email: "asc" },
    select: { id: true, email: true, role: true },
  });
  const clinics = await prisma.clinic.findMany({
    where: { deletedAt: null },
    orderBy: { slug: "asc" },
    select: { id: true, slug: true },
  });
  console.log(
    `[seed-leads-dev]   staff seeded: ${staff.length}, clinics seeded: ${clinics.length}`,
  );

  if (staff.length === 0) {
    console.warn(
      "[seed-leads-dev]   no staff users found — every fixture will be left unassigned. Run pnpm db:seed:staff first for richer matrix.",
    );
  }
  if (clinics.length === 0) {
    console.warn(
      "[seed-leads-dev]   no clinics found — every fixture will be left clinic-null. Run pnpm db:seed first for richer matrix.",
    );
  }

  const photosBucketReady = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!photosBucketReady) {
    console.warn(
      "[seed-leads-dev]   SUPABASE_SERVICE_ROLE_KEY not set — photo bytes will NOT upload. Path strings still wired to test signed-URL minting failure path in the drawer.",
    );
  }

  const year = new Date().getFullYear();
  let created = 0;
  let upserted = 0;

  for (const f of fixtures) {
    const code = `KB-${year}-DEV${(f.index + 1).toString().padStart(4, "0")}`;

    // Upsert the guest User backing this lead. Stable email keeps it
    // idempotent across re-runs.
    const user = await prisma.user.upsert({
      where: { email: f.email },
      create: {
        email: f.email,
        name: f.name,
        phone: f.phone,
        role: Role.guest,
        locale: f.userLocale,
        consentTos: true,
        consentedAt: new Date(),
      },
      update: { name: f.name, phone: f.phone, locale: f.userLocale },
      select: { id: true },
    });

    const photos: string[] = [];
    for (let p = 0; p < f.photoCount; p++) {
      const path = `${code}/${p}.png`;
      photos.push(path);
      if (photosBucketReady) {
        const res = await uploadPhotoBuffer(path, PIXEL_PNG, "image/png");
        if (!res.ok && !res.error.toLowerCase().includes("already exists")) {
          console.warn(`[seed-leads-dev]   photo upload failed for ${path}: ${res.error}`);
        }
      }
    }

    const ownerId =
      f.ownerOffset !== null && staff.length > 0 ? staff[f.ownerOffset % staff.length]!.id : null;
    const clinicId =
      f.clinicOffset !== null && clinics.length > 0
        ? clinics[f.clinicOffset % clinics.length]!.id
        : null;

    const existing = await prisma.lead.findUnique({ where: { code }, select: { id: true } });
    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          status: f.status,
          kind: f.kind,
          regions: f.regions,
          photos,
          whatsappId: f.whatsapp,
          telegramId: f.telegram,
          preferredLanguage: f.preferredLanguage,
          message: f.message,
          ownerId,
          clinicId,
        },
      });
      upserted++;
    } else {
      await prisma.lead.create({
        data: {
          code,
          userId: user.id,
          status: f.status,
          kind: f.kind,
          regions: f.regions,
          photos,
          whatsappId: f.whatsapp,
          telegramId: f.telegram,
          preferredLanguage: f.preferredLanguage,
          message: f.message,
          ownerId,
          clinicId,
          channelPref: "inapp",
        },
      });
      created++;
    }
  }

  console.log(`[seed-leads-dev] done — created=${created}, updated=${upserted}.`);
}

seed()
  .catch((err) => {
    console.error("[seed-leads-dev] failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
