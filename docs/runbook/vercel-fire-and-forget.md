# Vercel serverless — fire-and-forget promises get cut

## The trap

In a Next.js App Router route handler running on Vercel, this
pattern looks correct but silently fails in production:

```ts
export async function POST(req: Request) {
  // ... persist the user-visible result ...
  void someBackgroundWork().catch(() => {});
  return NextResponse.json({ ok: true });
}
```

The intent: "respond fast, do the email send / analytics ping
in the background." The reality: the moment `NextResponse.json`
returns, Vercel's runtime tears down the function context.
Any in-flight promise that wasn't awaited gets cut before its
`await fetch(...)` resolves. The user sees a 200; the
background work never completes; no error appears anywhere
(the `.catch` doesn't fire because the promise simply stops
progressing — it doesn't reject).

The symptom is bizarre because every signal looks healthy:

- Function Invocation panel: `External APIs: No outgoing requests`
- Function logs: `No logs found for this request`
- Resend / Sentry / wherever: zero entries
- HTTP response: clean 200
- Database row: persisted correctly (the awaited write happened
  before the response)

The route did exactly what it returned. The background work
never started its network call.

## What ships in this codebase

M3-03 (`POST /api/leads`) shipped the fire-and-forget pattern
for the PM-alert Resend email:

```ts
if (!result.reused) {
  void notifyPm(result.code, locale, payload).catch(() => {
    // Notification failures are non-fatal — Lead is persisted.
  });
}
return NextResponse.json({ code: result.code });
```

Production smoke matrix surfaced it the moment env vars were
correctly configured. Lead row persisted, response 200, no
email delivered, no error visible.

Fix (M3 hotfix branch):

```ts
if (!result.reused) {
  console.log(`[lead-created] code=${result.code} — sending PM alert`);
  try {
    await notifyPm(result.code, locale, payload);
    console.log(`[lead-created] code=${result.code} — PM alert dispatched`);
  } catch (err) {
    console.error(
      `[lead-created] code=${result.code} — PM alert failed (non-fatal):`,
      err instanceof Error ? err.message : err,
    );
  }
}
return NextResponse.json({ code: result.code });
```

The `await` adds ~300-700 ms to the response (Resend API
round-trip). For lead submit this is invisible — the client is
already mid-redirect to `/consult/done`. The try/catch keeps
"email failure is non-fatal" semantics intact (Lead row is
already in the DB; M5 admin inbox can still surface it).

## The structured-log requirement

The original bug was undetectable from the Vercel panel because
no log statements existed inside `sendLeadCreatedEmail`. Every
function on the email path now logs at entry, at success
(`messageId`), and at every failure mode (`env missing`,
`resend API error`, `resend threw`). When the next smoke
matrix runs, the Function Invocation panel must show the
chain — silence again would mean the bug recurred.

## When to use a real background pattern

The await-everything approach works for MVP scale (low traffic,
non-critical background work). Once any of these are true,
revisit:

- Background work routinely exceeds 2-3 seconds (user
  perceives the latency)
- Background work failure rate matters for the response
  (e.g., billing webhooks where the response shouldn't return
  until the webhook is confirmed queued)
- Concurrent function-instance budget gets tight on Vercel

Options at that point:

- **`unstable_after` from `next/server`** (Next.js 15+) — the
  framework's blessed way to schedule post-response work.
  Vercel keeps the function alive long enough for the
  scheduled task to complete.
- **Vercel's `waitUntil` from `@vercel/functions`** — same
  pattern, available today on Next.js 14 if `unstable_after`
  isn't.
- **Real queue (Inngest / SQS / similar)** — M-POST per
  CLAUDE.md §4. The route enqueues a job; a separate worker
  processes it; the response returns immediately.

For knsis.kz at MVP scale (< 100 leads/day), `await` is the
correct choice.

## Diagnostic checklist when an outbound network call vanishes

Run through in order:

1. Is the call **awaited**? Search for `void`, `then(`,
   `.catch(() =>`, `Promise.allSettled` patterns inside route
   handlers. Any unawaited promise that contains a network
   call is suspect.
2. Are there **logs at the call site**? If not, add them
   immediately. Silence in the function panel is the
   smoking-gun signal here — you literally cannot debug
   without telemetry inside the suspect function.
3. Does the **env config check** short-circuit silently?
   E.g., `if (!apiKey) return { ok: false }` with no log fires
   exactly once — verify env is actually present at the
   function instance via a one-shot log.
4. Is the network library doing its own background retries
   that get cut? (Some SDKs queue retries via `setTimeout`;
   same cut-off applies.)
5. Run the same code in `pnpm dev` locally with the
   production env vars. If it works locally but not on
   Vercel, the function-context teardown is almost certainly
   the cause.

## Related: `Channel.email` writes via `lib/messaging/send.ts`

The fix pattern above applies the same way to M4-04's
transactional email (customer-facing receipts + manager
lead-received). Every `send()` call from the route must be
awaited or it lands in the same trap. The `send.ts` seam
already returns a promise; route handlers consuming it must
await.
