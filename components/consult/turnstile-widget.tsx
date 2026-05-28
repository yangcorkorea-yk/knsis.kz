"use client";

/*
 * components/consult/turnstile-widget.tsx — Cloudflare Turnstile
 * gate for the consult-form submit (M3-05).
 *
 * Loads the Turnstile JS lazily on first render and renders the
 * widget into a div. The widget calls back with a token; the form
 * stores it and sends it via the `cf-turnstile-response` header
 * on POST /api/leads.
 *
 * Dev mock: when `siteKey` is empty (NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * not set), the widget renders nothing and immediately calls
 * `onToken("dev-skip")`. The server's verify path also skips when
 * TURNSTILE_SECRET_KEY is blank, so dev / preview deploys without
 * Cloudflare keys work end-to-end.
 */

import { useEffect, useRef } from "react";

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (
      el: HTMLElement | string,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
        size?: "normal" | "compact";
      },
    ) => string;
    reset: (id?: string) => void;
  };
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

interface Props {
  /** From `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Empty string = dev mock. */
  siteKey: string;
  /** Called with the token on solve; called with "dev-skip" when siteKey is blank. */
  onToken: (token: string) => void;
}

export function TurnstileWidget({ siteKey, onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const calledDevSkip = useRef(false);

  // Dev mock: no site key → emit a sentinel token immediately,
  // never load the script.
  useEffect(() => {
    if (siteKey) return;
    if (calledDevSkip.current) return;
    calledDevSkip.current = true;
    onToken("dev-skip");
  }, [siteKey, onToken]);

  // Production: load the Turnstile script once + render the widget.
  useEffect(() => {
    if (!siteKey) return;
    const w = window as TurnstileWindow;

    function renderWidget() {
      if (!containerRef.current || !w.turnstile) return;
      if (widgetIdRef.current != null) return;
      widgetIdRef.current = w.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
        size: "compact",
      });
    }

    if (w.turnstile) {
      renderWidget();
      return;
    }

    const existing = document.querySelector(
      `script[src^="${SCRIPT_SRC}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", renderWidget, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `${SCRIPT_SRC}?onload=__knsisTurnstileReady`;
    script.async = true;
    script.defer = true;
    (window as unknown as { __knsisTurnstileReady?: () => void }).__knsisTurnstileReady = () =>
      renderWidget();
    document.head.appendChild(script);
  }, [siteKey, onToken]);

  // No DOM rendered in dev-mock mode.
  if (!siteKey) return null;

  return <div ref={containerRef} className="my-2" data-turnstile-mount="true" />;
}
