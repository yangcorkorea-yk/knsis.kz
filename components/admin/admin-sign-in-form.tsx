"use client";

/*
 * components/admin/admin-sign-in-form.tsx — M5-01 admin sign-in.
 *
 * Posts email + password to `POST /api/auth/signin` (built in M1-02).
 * The route returns 200 + Set-Cookie on success, 401 with no `reason`
 * leak otherwise — the form maps both 401 and "malformed body" 400
 * to the same `invalid_credentials` copy per the M1-02 design (no
 * enumeration). Other unexpected errors map to `unknown`.
 *
 * On success the route also clears the guest cookie, then this form
 * redirects to `/admin/{locale}` (the gated layout will route on to
 * `/leads`).
 */

import { useState } from "react";
import { CTA } from "@/components/ui/cta";
import { Input } from "@/components/ui/input";

interface Labels {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  submit: string;
  submitting: string;
  errorInvalid: string;
  errorUnknown: string;
}

interface Props {
  locale: string;
  labels: Labels;
}

export function AdminSignInForm({ locale, labels }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<
    { kind: "idle" } | { kind: "submitting" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitState({ kind: "submitting" });
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        // Hard navigation so the new staff cookie is in flight for
        // the gated layout's requireRole() check.
        window.location.assign(`/admin/${locale}`);
        return;
      }
      if (res.status === 400 || res.status === 401) {
        setSubmitState({ kind: "error", message: labels.errorInvalid });
        return;
      }
      setSubmitState({ kind: "error", message: labels.errorUnknown });
    } catch {
      setSubmitState({ kind: "error", message: labels.errorUnknown });
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-signin-email" className="text-sm font-medium text-ink">
          {labels.emailLabel}
        </label>
        <Input
          id="admin-signin-email"
          type="email"
          autoComplete="username"
          required
          placeholder={labels.emailPlaceholder}
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-signin-password" className="text-sm font-medium text-ink">
          {labels.passwordLabel}
        </label>
        <Input
          id="admin-signin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
        />
      </div>
      {submitState.kind === "error" && (
        <p className="text-sm text-rose-deep" role="alert">
          {submitState.message}
        </p>
      )}
      <CTA type="submit" size="lg" fullWidth disabled={submitState.kind === "submitting"}>
        {submitState.kind === "submitting" ? labels.submitting : labels.submit}
      </CTA>
    </form>
  );
}
