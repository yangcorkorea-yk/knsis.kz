"use client";

/*
 * components/consult/consult-form.tsx — M3 single-page consult
 * form (PM redesign at M3 preview sign-off).
 *
 * History:
 *   - Initial (M3-01): 3-step multi-step with per-step trigger().
 *   - Polish (this file): single-page scroll matching the
 *     Kazakhstan-market reference UI. All sections render
 *     inline; one submit button at the bottom. PM hypothesis:
 *     fewer clicks → higher conversion on the mobile-first
 *     surface our users actually live on.
 *
 * Sections (top to bottom):
 *   1. Header — title, subtitle, "you can type in Russian" hint,
 *      Medical Disclaimer.
 *   2. Contact — name * / phone * / WhatsApp / Telegram /
 *      preferred consult language. WA/TG are optional but the
 *      help copy strongly recommends one (Kazakhstan reality:
 *      managers reach users via WhatsApp / Telegram, phone is
 *      the fallback).
 *   3. Goal — treatment multi-select / region multi-select /
 *      kind (korea | local).
 *   4. Extras — photo upload / free-text message / ToS +
 *      marketing consent.
 *   5. Turnstile widget (only renders when site key configured).
 *   6. Submit footer.
 *
 * Resumability: every field is mirrored to sessionStorage on
 * change so refresh / accidental-close doesn't lose typing.
 * Cleared on successful submit.
 *
 * WA / TG / preferredLanguage are sent on POST /api/leads;
 * the manager opens the actual chat outside the platform (hard
 * rule §8 still locks Channel writes to inapp / email).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver, SubmitHandler } from "react-hook-form";
import { CTA } from "@/components/ui/cta";
import { Input } from "@/components/ui/input";
import { TurnstileWidget } from "@/components/consult/turnstile-widget";
import { CITY_SLUGS } from "@/lib/discover/filters";
import { leadSubmitSchema, type LeadSubmit, type PhotoRef } from "@/lib/leads/schema";
import type { Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";
import { cn } from "@/lib/utils";

/** Treatment option passed in from the server page. */
export interface TreatmentOption {
  slug: string;
  title: TrilingualText;
}

export interface Labels {
  /**
   * Form aria-label — typically the page's h1 / title. The form
   * itself doesn't render a visible header (the page does); this
   * label keeps screen-reader semantics intact.
   */
  formAriaLabel: string;
  /**
   * Reassurance copy rendered under the submit button — "manager
   * will contact you via WhatsApp / Telegram within 24h" etc.
   */
  footerNote: string;

  // Section headings
  sectionContact: string;
  sectionGoal: string;
  sectionExtras: string;

  // Contact fields
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phoneHelp: string;
  phonePlaceholder: string;
  whatsappLabel: string;
  whatsappHelp: string;
  whatsappPlaceholder: string;
  whatsappBadge: string;
  telegramLabel: string;
  telegramHelp: string;
  telegramPlaceholder: string;
  telegramBadge: string;
  contactChannelsNote: string;
  languageLabel: string;
  languageHelp: string;
  languageOptions: { kz: string; ru: string; kr: string };

  // Goal fields
  treatmentLabel: string;
  treatmentEmpty: string;
  regionLabel: string;
  kindLabel: string;
  kindKorea: string;
  kindLocal: string;
  areaLabels: Record<string, string>;

  // Extras
  photoLabel: string;
  photoHelp: string;
  photoAddButton: string;
  photoRemoveButton: string;
  photoUploading: string;
  messageLabel: string;
  messageHelp: string;
  messagePlaceholder: string;
  consentTosLabel: string;
  consentMktLabel: string;
  consentRequiredNote: string;

  // Button + errors
  submit: string;
  submitting: string;
  errors: Record<string, string>;
}

interface Props {
  locale: Locale;
  treatments: TreatmentOption[];
  labels: Labels;
  turnstileSiteKey: string;
}

type FormShape = LeadSubmit;

const STORAGE_KEY = "knsis_consult_draft_v2";

export function ConsultForm({ locale, treatments, labels, turnstileSiteKey }: Props) {
  const [photos, setPhotos] = useState<PhotoRef[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [submitState, setSubmitState] = useState<
    { kind: "idle" } | { kind: "submitting" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const idempotencyKey = useRef<string>(crypto.randomUUID());
  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token || null);
  }, []);
  const restoredOnce = useRef(false);
  const formId = useId();

  const form = useForm<FormShape>({
    resolver: zodResolver(leadSubmitSchema) as Resolver<FormShape>,
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      whatsappId: "",
      telegramId: "",
      preferredLanguage: locale,
      treatmentSlugs: [],
      regions: [],
      kind: [],
      photos: [],
      message: "",
      consentTos: false as unknown as true,
      consentMkt: false,
    },
  });
  const { register, handleSubmit, control, setValue, formState, watch } = form;

  // Restore in-progress draft from sessionStorage.
  useEffect(() => {
    if (restoredOnce.current) return;
    restoredOnce.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<FormShape> & { _photos?: PhotoRef[] };
      for (const [k, v] of Object.entries(draft)) {
        if (k === "_photos") continue;
        if (v !== undefined) setValue(k as keyof FormShape, v as never);
      }
      if (draft._photos?.length) {
        setPhotos(draft._photos);
        setValue("photos", draft._photos);
      }
    } catch {
      // Corrupt draft — ignore.
    }
  }, [setValue]);

  // Mirror state to sessionStorage on every change.
  const watched = watch();
  useEffect(() => {
    if (!restoredOnce.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...watched, _photos: photos }));
    } catch {
      // Quota / disabled — best-effort.
    }
  }, [watched, photos]);

  const onSubmit: SubmitHandler<FormShape> = async (values) => {
    setSubmitState({ kind: "submitting" });
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey.current,
      };
      if (turnstileToken) headers["cf-turnstile-response"] = turnstileToken;
      const res = await fetch("/api/leads", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...values, photos }),
      });
      if (res.status === 429) {
        setSubmitState({ kind: "error", message: "submit_rate_limited" });
        return;
      }
      if (!res.ok) {
        setSubmitState({ kind: "error", message: "submit_failed" });
        return;
      }
      const data = (await res.json()) as { code: string };
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      window.location.assign(`/${locale}/consult/done?code=${encodeURIComponent(data.code)}`);
    } catch {
      setSubmitState({ kind: "error", message: "submit_failed" });
    }
  };

  const e = formState.errors;
  const err = (key: string | undefined): string | undefined =>
    key ? (labels.errors[key] ?? key) : undefined;

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
      aria-label={labels.formAriaLabel}
    >
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-mute">
          {labels.sectionContact}
        </h2>
        <Field
          id={`${formId}-name`}
          label={labels.nameLabel}
          error={err(e.name?.message as string | undefined)}
          required
        >
          <Input
            id={`${formId}-name`}
            type="text"
            autoComplete="name"
            placeholder={labels.namePlaceholder}
            {...register("name")}
          />
        </Field>
        <Field
          id={`${formId}-phone`}
          label={labels.phoneLabel}
          help={labels.phoneHelp}
          error={err(e.phone?.message as string | undefined)}
          required
        >
          <Input
            id={`${formId}-phone`}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder={labels.phonePlaceholder}
            {...register("phone")}
          />
        </Field>
        <Field
          id={`${formId}-whatsapp`}
          label={labels.whatsappLabel}
          help={labels.whatsappHelp}
          error={err(e.whatsappId?.message as string | undefined)}
          badge={labels.whatsappBadge}
        >
          <Input
            id={`${formId}-whatsapp`}
            type="text"
            placeholder={labels.whatsappPlaceholder}
            {...register("whatsappId")}
          />
        </Field>
        <Field
          id={`${formId}-telegram`}
          label={labels.telegramLabel}
          help={labels.telegramHelp}
          error={err(e.telegramId?.message as string | undefined)}
          badge={labels.telegramBadge}
        >
          <Input
            id={`${formId}-telegram`}
            type="text"
            placeholder={labels.telegramPlaceholder}
            {...register("telegramId")}
          />
        </Field>
        <p className="text-[11px] text-rose-deep">{labels.contactChannelsNote}</p>
        <Field
          id={`${formId}-language`}
          label={labels.languageLabel}
          help={labels.languageHelp}
          error={err(e.preferredLanguage?.message as string | undefined)}
          required
        >
          <select
            id={`${formId}-language`}
            className={cn(
              "flex h-11 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink",
              "focus-visible:border-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-soft",
            )}
            {...register("preferredLanguage")}
          >
            <option value="kz">{labels.languageOptions.kz}</option>
            <option value="ru">{labels.languageOptions.ru}</option>
            <option value="kr">{labels.languageOptions.kr}</option>
          </select>
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-mute">
          {labels.sectionGoal}
        </h2>
        <CheckboxGroup
          legend={labels.treatmentLabel}
          error={err(e.treatmentSlugs?.message as string | undefined)}
          empty={treatments.length === 0 ? labels.treatmentEmpty : null}
          control={control}
          name="treatmentSlugs"
          options={treatments.map((t) => ({ value: t.slug, label: tr(t.title, locale) }))}
        />
        <CheckboxGroup
          legend={labels.regionLabel}
          error={err(e.regions?.message as string | undefined)}
          empty={null}
          control={control}
          name="regions"
          options={CITY_SLUGS.map((slug) => ({
            value: slug,
            label: labels.areaLabels[slug] ?? slug,
          }))}
        />
        <CheckboxGroup
          legend={labels.kindLabel}
          error={err(e.kind?.message as string | undefined)}
          empty={null}
          control={control}
          name="kind"
          options={[
            { value: "korea", label: labels.kindKorea },
            { value: "local", label: labels.kindLocal },
          ]}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-mute">
          {labels.sectionExtras}
        </h2>
        <PhotoUploader
          photos={photos}
          setPhotos={(next) => {
            setPhotos(next);
            setValue("photos", next, { shouldValidate: true });
          }}
          uploadingCount={uploadingCount}
          setUploadingCount={setUploadingCount}
          labels={{
            photoLabel: labels.photoLabel,
            photoHelp: labels.photoHelp,
            photoAddButton: labels.photoAddButton,
            photoRemoveButton: labels.photoRemoveButton,
            photoUploading: labels.photoUploading,
            errors: labels.errors,
          }}
        />
        <Field
          id={`${formId}-message`}
          label={labels.messageLabel}
          help={labels.messageHelp}
          error={err(e.message?.message as string | undefined)}
        >
          <textarea
            id={`${formId}-message`}
            rows={4}
            maxLength={2000}
            placeholder={labels.messagePlaceholder}
            className={cn(
              "w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink",
              "placeholder:text-ink-mute focus-visible:border-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-soft",
            )}
            {...register("message")}
          />
        </Field>

        <fieldset className="flex flex-col gap-3 rounded-md border border-line p-3">
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-line text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-soft"
              {...register("consentTos")}
            />
            <span>{labels.consentTosLabel}</span>
          </label>
          {e.consentTos?.message && (
            <p className="text-xs text-rose-deep" role="alert">
              {err(e.consentTos.message as string)}
            </p>
          )}
          <label className="flex items-start gap-2 text-sm text-ink-body">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-line text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-soft"
              {...register("consentMkt")}
            />
            <span>{labels.consentMktLabel}</span>
          </label>
          <p className="text-[11px] text-ink-mute">{labels.consentRequiredNote}</p>
        </fieldset>
      </section>

      <TurnstileWidget siteKey={turnstileSiteKey} onToken={handleTurnstileToken} />

      {submitState.kind === "error" && (
        <p className="text-sm text-rose-deep" role="alert">
          {labels.errors[submitState.message] ?? submitState.message}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <CTA
          type="submit"
          size="lg"
          fullWidth
          icon={<PaperPlaneIcon />}
          disabled={
            submitState.kind === "submitting" ||
            uploadingCount > 0 ||
            (!!turnstileSiteKey && !turnstileToken)
          }
        >
          {submitState.kind === "submitting" ? labels.submitting : labels.submit}
        </CTA>
        <p className="text-center text-[11px] text-ink-mute">{labels.footerNote}</p>
      </div>
    </form>
  );
}

// ── small helpers, kept in-file ──────────────────────────────────────

function Field({
  id,
  label,
  help,
  error,
  badge,
  required,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  badge?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-ink">
        <span>
          {label}
          {required && <span className="ml-0.5 text-rose-deep">*</span>}
        </span>
        {badge && (
          <span className="rounded bg-rose-tint px-1.5 py-0.5 text-[10px] font-semibold text-rose-deep">
            {badge}
          </span>
        )}
      </label>
      <div aria-describedby={[helpId, errId].filter(Boolean).join(" ") || undefined}>
        {children}
      </div>
      {help && (
        <p id={helpId} className="text-[11px] text-ink-mute">
          {help}
        </p>
      )}
      {error && (
        <p id={errId} className="text-xs text-rose-deep" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function CheckboxGroup<TName extends "treatmentSlugs" | "regions" | "kind">({
  legend,
  error,
  empty,
  control,
  name,
  options,
}: {
  legend: string;
  error?: string;
  empty: string | null;
  control: ReturnType<typeof useForm<FormShape>>["control"];
  name: TName;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      {empty ? (
        <p className="text-xs text-ink-mute">{empty}</p>
      ) : (
        <Controller
          control={control}
          name={name}
          render={({ field }) => {
            const current = (field.value as string[] | undefined) ?? [];
            const toggle = (v: string) => {
              if (current.includes(v)) field.onChange(current.filter((x) => x !== v));
              else field.onChange([...current, v]);
            };
            return (
              <div className="flex flex-wrap gap-2">
                {options.map((o) => {
                  const active = current.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(o.value)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2",
                        active
                          ? "bg-rose text-white"
                          : "border border-line bg-paper text-ink hover:bg-ground",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            );
          }}
        />
      )}
      {error && (
        <p className="text-xs text-rose-deep" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIMES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

function PhotoUploader({
  photos,
  setPhotos,
  uploadingCount,
  setUploadingCount,
  labels,
}: {
  photos: PhotoRef[];
  setPhotos: (next: PhotoRef[]) => void;
  uploadingCount: number;
  setUploadingCount: (n: number) => void;
  labels: {
    photoLabel: string;
    photoHelp: string;
    photoAddButton: string;
    photoRemoveButton: string;
    photoUploading: string;
    errors: Record<string, string>;
  };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    const slotsLeft = MAX_PHOTOS - photos.length;
    if (slotsLeft <= 0) {
      setError(labels.errors.photo_count ?? "photo_count");
      return;
    }
    const list = Array.from(files).slice(0, slotsLeft);
    for (const file of list) {
      if (file.size > MAX_PHOTO_BYTES) {
        setError(labels.errors.photo_size ?? "photo_size");
        continue;
      }
      if (!ACCEPTED_MIMES.includes(file.type)) {
        setError(labels.errors.photo_mime ?? "photo_mime");
        continue;
      }
      setUploadingCount(uploadingCount + 1);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        if (!res.ok) throw new Error("upload failed");
        const data = (await res.json()) as PhotoRef;
        setPhotos([...photos, data]);
      } catch {
        setError(labels.errors.photo_upload_failed ?? "photo_upload_failed");
      } finally {
        setUploadingCount(Math.max(0, uploadingCount - 1));
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink">{labels.photoLabel}</p>
      <p className="text-[11px] text-ink-mute">{labels.photoHelp}</p>

      <ul className="flex flex-col gap-1">
        {photos.map((p, i) => (
          <li
            key={p.path}
            className="flex items-center justify-between rounded border border-line bg-paper px-3 py-2 text-xs text-ink"
          >
            <span className="truncate">{p.path.split("/").pop() ?? p.path}</span>
            <button
              type="button"
              onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
              className="text-xs text-rose-deep underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
            >
              {labels.photoRemoveButton}
            </button>
          </li>
        ))}
      </ul>

      {photos.length < MAX_PHOTOS && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIMES.join(",")}
            multiple
            className="sr-only"
            id="consult-photo-input"
            onChange={(ev) => ev.target.files && handleFiles(ev.target.files)}
          />
          <label
            htmlFor="consult-photo-input"
            className="inline-flex cursor-pointer items-center rounded-md border border-line bg-paper px-3 py-2 text-xs font-medium text-ink hover:bg-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
          >
            {uploadingCount > 0 ? labels.photoUploading : labels.photoAddButton}
          </label>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-deep" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PaperPlaneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
