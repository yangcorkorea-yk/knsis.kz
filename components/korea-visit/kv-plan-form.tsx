"use client";

/*
 * components/korea-visit/kv-plan-form.tsx — M4-01 multi-step
 * Korea Visit planner.
 *
 * Three steps: Trip → Service → Contact. Each step validates only
 * its own slice via `kvStepSchemas.{trip,service,contact}` so the
 * Next button blocks navigation on local errors but doesn't surface
 * later-step errors prematurely. On submit, the full payload is
 * re-validated via `kvSubmitSchema` (server does the same).
 *
 * State lives in a single record + `errors` per-field. No React-
 * Hook-Form dep — the consult form's pattern proved that React
 * useState scales fine for this surface size.
 *
 * Submit POSTs to /api/korea-visit; success → hard navigate to
 * /[locale]/korea-visit/confirmed?code=…. We use window.location
 * (not router.push) so the back button from `confirmed` returns to
 * the home rather than re-opening a half-filled form.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CTA } from "@/components/ui/cta";
import { Input } from "@/components/ui/input";
import {
  KV_AIRPORTS,
  KV_INTERPRETER_LANGS,
  KV_PREFERRED_LANGS,
  kvStepSchemas,
  kvSubmitSchema,
  type KvAirport,
  type KvInterpreterLang,
  type KvPreferredLang,
} from "@/lib/korea-visit/schema";

export interface KvPlanFormLabels {
  step_progress: string;
  step_trip_title: string;
  step_service_title: string;
  step_contact_title: string;
  back: string;
  next: string;
  submit: string;
  submitting: string;
  fields: {
    date_from_label: string;
    date_to_label: string;
    airport_label: string;
    airport_none: string;
    airport_icn: string;
    airport_gmp: string;
    airport_pus: string;
    airport_cju: string;
    hotel_pref_label: string;
    hotel_pref_placeholder: string;
    interpreter_label: string;
    interpreter_none: string;
    interpreter_kz: string;
    interpreter_ru: string;
    interpreter_kr: string;
    interpreter_en: string;
    aftercare_label: string;
    aftercare_placeholder: string;
    notes_label: string;
    notes_placeholder: string;
    name_label: string;
    name_placeholder: string;
    phone_label: string;
    phone_placeholder: string;
    email_label: string;
    email_placeholder: string;
    whatsapp_label: string;
    telegram_label: string;
    preferred_language_label: string;
    preferred_language_kz: string;
    preferred_language_ru: string;
    preferred_language_kr: string;
    consent_tos_label: string;
    consent_mkt_label: string;
  };
  errors: Record<string, string>;
}

interface FormState {
  dateFrom: string;
  dateTo: string;
  airport: KvAirport | "";
  hotelPref: string;
  interpreter: KvInterpreterLang | "";
  aftercareDays: string;
  notes: string;
  name: string;
  phone: string;
  email: string;
  whatsappId: string;
  telegramId: string;
  preferredLanguage: KvPreferredLang;
  consentTos: boolean;
  consentMkt: boolean;
}

const STEPS = ["trip", "service", "contact"] as const;
type Step = (typeof STEPS)[number];

interface Props {
  locale: string;
  defaultPreferredLanguage: KvPreferredLang;
  labels: KvPlanFormLabels;
}

function emptyState(defaultLang: KvPreferredLang): FormState {
  return {
    dateFrom: "",
    dateTo: "",
    airport: "",
    hotelPref: "",
    interpreter: "",
    aftercareDays: "",
    notes: "",
    name: "",
    phone: "",
    email: "",
    whatsappId: "",
    telegramId: "",
    preferredLanguage: defaultLang,
    consentTos: false,
    consentMkt: false,
  };
}

/** Coerce step state into the wire-shape the schema expects. */
function shapeFor(step: Step, state: FormState) {
  if (step === "trip") {
    return {
      dateFrom: state.dateFrom,
      dateTo: state.dateTo,
      airport: state.airport === "" ? null : state.airport,
    };
  }
  if (step === "service") {
    return {
      hotelPref: state.hotelPref,
      interpreter: state.interpreter === "" ? null : state.interpreter,
      aftercareDays: state.aftercareDays === "" ? null : Number(state.aftercareDays),
      notes: state.notes,
    };
  }
  return {
    name: state.name,
    phone: state.phone,
    email: state.email,
    whatsappId: state.whatsappId,
    telegramId: state.telegramId,
    preferredLanguage: state.preferredLanguage,
    consentTos: state.consentTos,
    consentMkt: state.consentMkt,
  };
}

function wholePayload(state: FormState) {
  return {
    ...shapeFor("trip", state),
    ...shapeFor("service", state),
    ...shapeFor("contact", state),
  };
}

export function KvPlanForm({ locale, defaultPreferredLanguage, labels }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => emptyState(defaultPreferredLanguage));
  const [step, setStep] = useState<Step>("trip");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<
    { kind: "idle" } | { kind: "submitting" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    if (errors[key as string]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key as string];
        return next;
      });
    }
  }

  function translateError(key: string): string {
    return labels.errors[key] ?? key;
  }

  function validateStep(currentStep: Step): boolean {
    const schema = kvStepSchemas[currentStep];
    const result = schema.safeParse(shapeFor(currentStep, state));
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path[0];
      if (typeof path === "string" && !next[path]) {
        next[path] = translateError(issue.message);
      }
    }
    setErrors(next);
    return false;
  }

  function goNext() {
    if (!validateStep(step)) return;
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]!);
    }
  }

  function goBack() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]!);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep("contact")) return;
    const parsed = kvSubmitSchema.safeParse(wholePayload(state));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !next[path]) {
          next[path] = translateError(issue.message);
        }
      }
      setErrors(next);
      return;
    }
    setSubmitState({ kind: "submitting" });
    try {
      const res = await fetch("/api/korea-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        setSubmitState({ kind: "error", message: translateError("submit_failed") });
        return;
      }
      const { code } = (await res.json()) as { code: string };
      window.location.assign(`/${locale}/korea-visit/confirmed?code=${encodeURIComponent(code)}`);
    } catch {
      setSubmitState({ kind: "error", message: translateError("submit_failed") });
    }
  }

  const stepIndex = STEPS.indexOf(step) + 1;
  const isLast = step === "contact";
  const f = labels.fields;
  const busy = submitState.kind === "submitting";

  return (
    <form onSubmit={submit} noValidate aria-busy={busy} className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-mute">
          {labels.step_progress
            .replace("{current}", String(stepIndex))
            .replace("{total}", String(STEPS.length))}
        </p>
        <h2 className="break-keep text-lg font-extrabold tracking-display text-ink">
          {step === "trip"
            ? labels.step_trip_title
            : step === "service"
              ? labels.step_service_title
              : labels.step_contact_title}
        </h2>
      </header>

      {step === "trip" && (
        <fieldset className="flex flex-col gap-4" disabled={busy}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={f.date_from_label} error={errors.dateFrom} htmlFor="kv-from">
              <Input
                id="kv-from"
                type="date"
                value={state.dateFrom}
                onChange={(e) => set("dateFrom", e.target.value)}
                required
              />
            </Field>
            <Field label={f.date_to_label} error={errors.dateTo} htmlFor="kv-to">
              <Input
                id="kv-to"
                type="date"
                value={state.dateTo}
                onChange={(e) => set("dateTo", e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label={f.airport_label} htmlFor="kv-airport">
            <select
              id="kv-airport"
              value={state.airport}
              onChange={(e) => set("airport", (e.target.value as KvAirport) || "")}
              className="h-10 rounded-md border border-line bg-paper px-3 text-sm text-ink"
            >
              <option value="">{f.airport_none}</option>
              {KV_AIRPORTS.map((a) => (
                <option key={a} value={a}>
                  {f[`airport_${a.toLowerCase()}` as keyof typeof f] as string}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>
      )}

      {step === "service" && (
        <fieldset className="flex flex-col gap-4" disabled={busy}>
          <Field label={f.hotel_pref_label} htmlFor="kv-hotel">
            <Input
              id="kv-hotel"
              value={state.hotelPref}
              onChange={(e) => set("hotelPref", e.target.value)}
              placeholder={f.hotel_pref_placeholder}
              maxLength={200}
            />
          </Field>
          <Field label={f.interpreter_label} htmlFor="kv-interp">
            <select
              id="kv-interp"
              value={state.interpreter}
              onChange={(e) => set("interpreter", (e.target.value as KvInterpreterLang) || "")}
              className="h-10 rounded-md border border-line bg-paper px-3 text-sm text-ink"
            >
              <option value="">{f.interpreter_none}</option>
              {KV_INTERPRETER_LANGS.map((l) => (
                <option key={l} value={l}>
                  {f[`interpreter_${l}` as keyof typeof f] as string}
                </option>
              ))}
            </select>
          </Field>
          <Field label={f.aftercare_label} htmlFor="kv-after">
            <Input
              id="kv-after"
              type="number"
              min={0}
              max={60}
              value={state.aftercareDays}
              onChange={(e) => set("aftercareDays", e.target.value)}
              placeholder={f.aftercare_placeholder}
            />
          </Field>
          <Field label={f.notes_label} htmlFor="kv-notes">
            <textarea
              id="kv-notes"
              value={state.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder={f.notes_placeholder}
              maxLength={2000}
              rows={3}
              className="resize-y rounded-md border border-line bg-paper p-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-rose-tint"
            />
          </Field>
        </fieldset>
      )}

      {step === "contact" && (
        <fieldset className="flex flex-col gap-4" disabled={busy}>
          <Field label={f.name_label} error={errors.name} htmlFor="kv-name">
            <Input
              id="kv-name"
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={f.name_placeholder}
              required
              maxLength={80}
            />
          </Field>
          <Field label={f.phone_label} error={errors.phone} htmlFor="kv-phone">
            <Input
              id="kv-phone"
              type="tel"
              value={state.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder={f.phone_placeholder}
              required
            />
          </Field>
          <Field label={f.email_label} error={errors.email} htmlFor="kv-email">
            <Input
              id="kv-email"
              type="email"
              value={state.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder={f.email_placeholder}
              autoComplete="email"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={f.whatsapp_label} htmlFor="kv-wa">
              <Input
                id="kv-wa"
                value={state.whatsappId}
                onChange={(e) => set("whatsappId", e.target.value)}
                maxLength={64}
              />
            </Field>
            <Field label={f.telegram_label} htmlFor="kv-tg">
              <Input
                id="kv-tg"
                value={state.telegramId}
                onChange={(e) => set("telegramId", e.target.value)}
                maxLength={64}
              />
            </Field>
          </div>
          <Field label={f.preferred_language_label} htmlFor="kv-lang">
            <select
              id="kv-lang"
              value={state.preferredLanguage}
              onChange={(e) => set("preferredLanguage", e.target.value as KvPreferredLang)}
              className="h-10 rounded-md border border-line bg-paper px-3 text-sm text-ink"
            >
              {KV_PREFERRED_LANGS.map((l) => (
                <option key={l} value={l}>
                  {f[`preferred_language_${l}` as keyof typeof f] as string}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-start gap-2 text-sm text-ink-body">
            <input
              type="checkbox"
              checked={state.consentTos}
              onChange={(e) => set("consentTos", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-rose-deep focus:ring-rose-tint"
              required
            />
            <span>{f.consent_tos_label}</span>
          </label>
          {errors.consentTos && (
            <p className="text-xs text-rose-deep" role="alert">
              {errors.consentTos}
            </p>
          )}
          <label className="flex items-start gap-2 text-sm text-ink-body">
            <input
              type="checkbox"
              checked={state.consentMkt}
              onChange={(e) => set("consentMkt", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-rose-deep focus:ring-rose-tint"
            />
            <span>{f.consent_mkt_label}</span>
          </label>
        </fieldset>
      )}

      {submitState.kind === "error" && (
        <p className="text-sm text-rose-deep" role="alert">
          {submitState.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        {step !== "trip" ? (
          <button
            type="button"
            onClick={goBack}
            disabled={busy}
            className="rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-body hover:bg-ground disabled:opacity-50"
          >
            {labels.back}
          </button>
        ) : (
          <span />
        )}
        {isLast ? (
          <CTA type="submit" size="lg" disabled={busy}>
            {busy ? labels.submitting : labels.submit}
          </CTA>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={busy}
            className="rounded-md bg-rose-deep px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
          >
            {labels.next}
          </button>
        )}
      </div>
    </form>
  );
  void router;
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium uppercase tracking-wide text-ink-mute"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-rose-deep" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
