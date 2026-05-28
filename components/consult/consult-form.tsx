"use client";

/*
 * components/consult/consult-form.tsx — M3-01 multi-step consult
 * form (3 steps: contact → goal → photos+consent).
 *
 * Single client component on purpose. The form is one cohesive
 * interaction; splitting per-step into 4 files for 3 transitions
 * + 1 orchestrator is premature abstraction. The step bodies are
 * inline render branches off `currentStep`.
 *
 * State:
 *   - `useForm` (RHF + Zod) holds the merged shape across steps.
 *     Per-step "Next" validates the step's Zod slice (trigger())
 *     and advances; submit validates the merged schema.
 *   - `currentStep` is local state (1 | 2 | 3); going back is
 *     non-destructive (RHF keeps the values).
 *   - In-progress values are mirrored to sessionStorage on every
 *     successful step advance so a refresh / accidental-close
 *     doesn't lose the user's typing (WBS M3-01 "resumable").
 *     Cleared on successful submit.
 *
 * Photo uploader (M3-01 shape, M3-02 backend wire):
 *   - Holds the array of `PhotoRef` ({ path, mime }) returned by
 *     the upload endpoint. Files POST to `/api/uploads` as
 *     multipart/form-data; the endpoint runs sharp to strip EXIF
 *     + re-encode + writes to the private bucket. Until M3-02
 *     lands the endpoint is a stub — the form still renders the
 *     uploader so the structural contract can be tested.
 *
 * Disclaimer: every M2 surface that surfaces medical-adjacent UX
 * (treatments, clinics, reviews, search, gallery) carries the
 * Medical Disclaimer. The consult form is the most committed of
 * those surfaces — the user is submitting their medical context
 * for evaluation. Disclaimer renders above the form per the M2
 * convention.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver, SubmitHandler } from "react-hook-form";
import { CTA } from "@/components/ui/cta";
import { Input } from "@/components/ui/input";
import { MedicalDisclaimer } from "@/components/treatments/medical-disclaimer";
import { TurnstileWidget } from "@/components/consult/turnstile-widget";
import { CITY_SLUGS } from "@/lib/discover/filters";
import {
  leadSubmitSchema,
  type LeadSubmit,
  type PhotoRef,
  stepContactSchema,
  stepGoalSchema,
} from "@/lib/leads/schema";
import type { Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";
import { cn } from "@/lib/utils";

/** Treatment option passed in from the server page. */
export interface TreatmentOption {
  slug: string;
  title: TrilingualText;
}

interface Labels {
  // Page-level
  disclaimerBody: string;
  disclaimerAriaLabel: string;
  /**
   * Pre-formatted step-progress strings, indexed by step-1
   * (i.e. `stepProgressByStep[0]` is the copy for step 1).
   * Server pre-computes via `t("step_progress", …)` because
   * Next.js App Router won't pass functions from a server
   * component to a client component (runtime serialization).
   */
  stepProgressByStep: readonly string[];

  // Step titles
  stepContactTitle: string;
  stepGoalTitle: string;
  stepPhotosTitle: string;

  // Step 1 — contact
  phoneLabel: string;
  phoneHelp: string;
  phonePlaceholder: string;
  nameLabel: string;
  nameHelp: string;
  namePlaceholder: string;

  // Step 2 — goal
  treatmentLabel: string;
  treatmentEmpty: string;
  regionLabel: string;
  kindLabel: string;
  kindKorea: string;
  kindLocal: string;
  areaLabels: Record<string, string>;

  // Step 3 — photos
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

  // Buttons
  back: string;
  next: string;
  submit: string;
  submitting: string;

  // Errors (keyed by the catalog error path; the form maps them)
  errors: Record<string, string>;
}

interface Props {
  locale: Locale;
  treatments: TreatmentOption[];
  labels: Labels;
  /**
   * From NEXT_PUBLIC_TURNSTILE_SITE_KEY. Empty string = dev mock
   * (widget not rendered; server siteverify also skipped via
   * blank TURNSTILE_SECRET_KEY).
   */
  turnstileSiteKey: string;
}

type FormShape = LeadSubmit;

const STORAGE_KEY = "knsis_consult_draft_v1";
const TOTAL_STEPS = 3;

export function ConsultForm({ locale, treatments, labels, turnstileSiteKey }: Props) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
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
      phone: "",
      name: "",
      treatmentSlugs: [],
      regions: [],
      kind: [],
      photos: [],
      message: "",
      consentTos: false as unknown as true,
      consentMkt: false,
    },
  });
  const { register, handleSubmit, control, trigger, setValue, formState, watch } = form;

  // Restore in-progress draft from sessionStorage (resumability).
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
      // Corrupt draft — ignore and start fresh.
    }
  }, [setValue]);

  // Mirror current state to sessionStorage on every change.
  const watched = watch();
  useEffect(() => {
    if (!restoredOnce.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...watched, _photos: photos }));
    } catch {
      // Quota / disabled — best-effort only.
    }
  }, [watched, photos]);

  async function goNext() {
    const stepFields: (keyof FormShape)[] =
      currentStep === 1 ? ["phone", "name"] : ["treatmentSlugs", "regions", "kind"];
    const ok = await trigger(stepFields);
    if (!ok) return;
    setCurrentStep((s) => (s === 1 ? 2 : 3));
  }

  function goBack() {
    setCurrentStep((s) => (s === 3 ? 2 : 1));
  }

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
      className="flex flex-col gap-5"
      aria-label={
        currentStep === 1
          ? labels.stepContactTitle
          : currentStep === 2
            ? labels.stepGoalTitle
            : labels.stepPhotosTitle
      }
    >
      <MedicalDisclaimer body={labels.disclaimerBody} ariaLabel={labels.disclaimerAriaLabel} />

      <p className="text-xs text-ink-mute" aria-live="polite">
        {labels.stepProgressByStep[currentStep - 1] ?? ""}
      </p>

      {currentStep === 1 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">{labels.stepContactTitle}</h2>
          <Field
            id={`${formId}-phone`}
            label={labels.phoneLabel}
            help={labels.phoneHelp}
            error={err(e.phone?.message as string | undefined)}
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
            id={`${formId}-name`}
            label={labels.nameLabel}
            help={labels.nameHelp}
            error={err(e.name?.message as string | undefined)}
          >
            <Input
              id={`${formId}-name`}
              type="text"
              autoComplete="name"
              placeholder={labels.namePlaceholder}
              {...register("name")}
            />
          </Field>
        </section>
      )}

      {currentStep === 2 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">{labels.stepGoalTitle}</h2>
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
      )}

      {currentStep === 3 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">{labels.stepPhotosTitle}</h2>
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
                "w-full rounded-md border border-line bg-ground px-3 py-2 text-sm text-ink",
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
      )}

      {currentStep === 3 && (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={handleTurnstileToken} />
      )}

      {submitState.kind === "error" && (
        <p className="text-sm text-rose-deep" role="alert">
          {labels.errors[submitState.message] ?? submitState.message}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        {currentStep > 1 && (
          <CTA type="button" variant="outline" size="md" fullWidth={false} onClick={goBack}>
            {labels.back}
          </CTA>
        )}
        {currentStep < 3 && (
          <CTA type="button" size="md" fullWidth={true} onClick={goNext}>
            {labels.next}
          </CTA>
        )}
        {currentStep === 3 && (
          <CTA
            type="submit"
            size="md"
            fullWidth={true}
            disabled={
              submitState.kind === "submitting" ||
              uploadingCount > 0 ||
              (!!turnstileSiteKey && !turnstileToken)
            }
          >
            {submitState.kind === "submitting" ? labels.submitting : labels.submit}
          </CTA>
        )}
      </div>
    </form>
  );
}

// ── small helpers, kept in-file because they're form-internal ────────

function Field({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
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

// ── photo uploader ──────────────────────────────────────────────────

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
