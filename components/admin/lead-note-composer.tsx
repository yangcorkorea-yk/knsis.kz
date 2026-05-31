"use client";

/*
 * components/admin/lead-note-composer.tsx — textarea + submit for
 * adding a note. POSTs to /api/admin/leads/{code}/notes →
 * router.refresh() so the notes list + activity log pick up the
 * new row.
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Props {
  code: string;
  labels: { placeholder: string; submit: string; submitting: string };
}

export function LeadNoteComposer({ code, labels }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${code}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) {
        setError(String(res.status));
        return;
      }
      setBody("");
      startTransition(() => router.refresh());
    } catch {
      setError("network");
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || pending;

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={labels.placeholder}
        rows={3}
        maxLength={2000}
        className="resize-y rounded-md border border-line bg-paper p-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-rose-tint"
        disabled={busy}
      />
      <div className="flex items-center justify-end gap-2">
        {error && <span className="text-xs text-rose-deep">!{error}</span>}
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="rounded-md bg-rose-deep px-3 py-1 text-xs font-medium text-paper hover:opacity-90 disabled:opacity-50"
        >
          {busy ? labels.submitting : labels.submit}
        </button>
      </div>
    </form>
  );
}
