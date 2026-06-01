/*
 * lib/messaging/notify-templates.ts — pure formatters for the user-
 * facing notification surface (Notification row title/body Json +
 * matching transactional-email subject/text).
 *
 * Why not next-intl: Notification rows persist for "today / earlier"
 * inbox grouping. We snapshot the rendered strings into the row at
 * write time so the user sees the copy that was current when the
 * event happened, even after we re-translate keys later. Templates
 * here are the snapshot source.
 *
 * Each template:
 *   - returns `{ title: { kz, ru, kr }, body: { kz, ru, kr } }`
 *     for the Notification.title / .body Json columns
 *   - returns `email(locale)` for the matching email subject + text
 *     in the recipient's preferred locale (picked at send time, not
 *     snapshotted — email is point-in-time, not historical)
 *
 * Adding a new event kind = new exported builder + new entry in
 * the `NOTIFY_EVENT_KINDS` union; tests below cover the union.
 */

import type { LeadStatus } from "@prisma/client";

export type NotifyLocale = "kz" | "ru" | "kr";

export interface TrilingualString {
  kz: string;
  ru: string;
  kr: string;
}

export interface NotificationCopy {
  title: TrilingualString;
  body: TrilingualString;
}

export interface EmailCopy {
  subject: string;
  text: string;
}

export interface NotifyTemplate {
  /** What lands in Notification.title / .body Json. */
  notification: NotificationCopy;
  /** What the transactional email leg renders, in the recipient's
   *  locale. */
  email: (locale: NotifyLocale) => EmailCopy;
}

// ── consult.status_changed ──────────────────────────────────────────

const STATUS_LABEL: Record<LeadStatus, TrilingualString> = {
  new: { kz: "Жаңа", ru: "Новая", kr: "신규" },
  contacted: { kz: "Хабарласқан", ru: "На связи", kr: "연락 완료" },
  in_progress: { kz: "Жұмыста", ru: "В работе", kr: "진행 중" },
  scheduled: { kz: "Жоспарланған", ru: "Запланирована", kr: "예약됨" },
  done: { kz: "Аяқталды", ru: "Завершена", kr: "완료" },
  on_hold: { kz: "Кідірісте", ru: "На паузе", kr: "보류" },
};

export interface ConsultStatusChangedInput {
  leadCode: string;
  newStatus: LeadStatus;
}

export function consultStatusChanged(input: ConsultStatusChangedInput): NotifyTemplate {
  const sl = STATUS_LABEL[input.newStatus];
  return {
    notification: {
      title: {
        kz: `Өтінім ${input.leadCode} күйі — ${sl.kz}`,
        ru: `Заявка ${input.leadCode}: ${sl.ru}`,
        kr: `상담 ${input.leadCode}: ${sl.kr}`,
      },
      body: {
        kz: "Менеджер сіздің өтініміңіздің күйін өзгертті.",
        ru: "Менеджер обновил статус вашей заявки.",
        kr: "매니저가 상담 상태를 업데이트했습니다.",
      },
    },
    email: (locale) => {
      const t = STATUS_LABEL[input.newStatus][locale];
      const subjectByLocale: Record<NotifyLocale, string> = {
        kz: `[knsis.kz] ${input.leadCode} күйі — ${t}`,
        ru: `[knsis.kz] ${input.leadCode}: ${t}`,
        kr: `[knsis.kz] ${input.leadCode} 상태: ${t}`,
      };
      const textByLocale: Record<NotifyLocale, string> = {
        kz: `Өтінім ${input.leadCode} күйі ${t} болды.\n\nЖаңартуларды сайтта толық көру үшін кіріңіз.`,
        ru: `Статус заявки ${input.leadCode} обновлён: ${t}.\n\nПодробности — на сайте.`,
        kr: `상담 ${input.leadCode} 상태가 ${t}(으)로 변경되었습니다.\n\n자세한 내용은 사이트에서 확인하세요.`,
      };
      return { subject: subjectByLocale[locale], text: textByLocale[locale] };
    },
  };
}

// ── consult.owner_assigned ──────────────────────────────────────────

export interface ConsultOwnerAssignedInput {
  leadCode: string;
  /** Display name (or email) of the assigned manager. */
  ownerLabel: string;
}

export function consultOwnerAssigned(input: ConsultOwnerAssignedInput): NotifyTemplate {
  return {
    notification: {
      title: {
        kz: `Өтінім ${input.leadCode}: жауапты менеджер`,
        ru: `Заявка ${input.leadCode}: назначен менеджер`,
        kr: `상담 ${input.leadCode}: 매니저 배정`,
      },
      body: {
        kz: `${input.ownerLabel} сіздің өтініміңізбен жұмыс істейді.`,
        ru: `Ваш менеджер — ${input.ownerLabel}.`,
        kr: `담당 매니저는 ${input.ownerLabel}입니다.`,
      },
    },
    email: (locale) => {
      const subjectByLocale: Record<NotifyLocale, string> = {
        kz: `[knsis.kz] ${input.leadCode} — менеджер тағайындалды`,
        ru: `[knsis.kz] ${input.leadCode}: назначен менеджер`,
        kr: `[knsis.kz] ${input.leadCode}: 매니저 배정`,
      };
      const textByLocale: Record<NotifyLocale, string> = {
        kz: `Сіздің өтінімңізге жауапты менеджер — ${input.ownerLabel}.`,
        ru: `Ваш менеджер по заявке: ${input.ownerLabel}.`,
        kr: `상담 담당 매니저: ${input.ownerLabel}`,
      };
      return { subject: subjectByLocale[locale], text: textByLocale[locale] };
    },
  };
}

// ── consult.clinic_assigned ─────────────────────────────────────────

export interface ConsultClinicAssignedInput {
  leadCode: string;
  clinicLabel: string;
}

export function consultClinicAssigned(input: ConsultClinicAssignedInput): NotifyTemplate {
  return {
    notification: {
      title: {
        kz: `Өтінім ${input.leadCode}: клиника таңдалды`,
        ru: `Заявка ${input.leadCode}: подобрана клиника`,
        kr: `상담 ${input.leadCode}: 클리닉 매칭`,
      },
      body: {
        kz: `${input.clinicLabel} клиникасы сіздің сұранысыңызға сәйкес.`,
        ru: `Подобрана клиника: ${input.clinicLabel}.`,
        kr: `매칭된 클리닉: ${input.clinicLabel}`,
      },
    },
    email: (locale) => {
      const subjectByLocale: Record<NotifyLocale, string> = {
        kz: `[knsis.kz] ${input.leadCode} — клиника таңдалды`,
        ru: `[knsis.kz] ${input.leadCode}: подобрана клиника`,
        kr: `[knsis.kz] ${input.leadCode}: 클리닉 매칭`,
      };
      const textByLocale: Record<NotifyLocale, string> = {
        kz: `Сіздің өтінімңізге ${input.clinicLabel} клиникасы таңдалды.`,
        ru: `Для вашей заявки подобрана клиника ${input.clinicLabel}.`,
        kr: `상담을 위해 ${input.clinicLabel} 클리닉이 매칭되었습니다.`,
      };
      return { subject: subjectByLocale[locale], text: textByLocale[locale] };
    },
  };
}

// ── union & switch helper ───────────────────────────────────────────

/** Inbox tab the event surfaces in (Notification.kind column). */
export const NOTIFY_KIND_BY_EVENT = {
  "consult.status_changed": "consult",
  "consult.owner_assigned": "consult",
  "consult.clinic_assigned": "consult",
} as const;

export type NotifyEventName = keyof typeof NOTIFY_KIND_BY_EVENT;

/**
 * Tagged union of event input shapes. Adding a kind = extend
 * NOTIFY_KIND_BY_EVENT + extend NotifyEvent + add a `buildTemplate`
 * branch. Typescript catches missed cases.
 */
export type NotifyEvent =
  | { name: "consult.status_changed"; input: ConsultStatusChangedInput }
  | { name: "consult.owner_assigned"; input: ConsultOwnerAssignedInput }
  | { name: "consult.clinic_assigned"; input: ConsultClinicAssignedInput };

export function buildTemplate(event: NotifyEvent): NotifyTemplate {
  switch (event.name) {
    case "consult.status_changed":
      return consultStatusChanged(event.input);
    case "consult.owner_assigned":
      return consultOwnerAssigned(event.input);
    case "consult.clinic_assigned":
      return consultClinicAssigned(event.input);
  }
}
