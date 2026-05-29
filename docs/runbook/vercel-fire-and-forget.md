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

## Iteration history

1. **M3-03 ship**: `void notifyPm(...).catch(...)`. Broken on
   Vercel as described above.
2. **M3 hotfix (PR #14)**: `await notifyPm(...)` inside try /
   catch. Works; adds ~300-700 ms to the response (invisible
   during the client's redirect to `/consult/done`).
3. **M3 closure (this codebase)**: `waitUntil(notifyPm(...))`
   from `@vercel/functions`. The runtime keeps the function
   context alive until the registered promise resolves, so the
   user's response returns in <100 ms AND the background work
   actually completes.

Shipped pattern:

```ts
import { waitUntil } from "@vercel/functions";

if (!result.reused) {
  console.log(`[lead-created] code=${result.code} — scheduling PM alert`);
  waitUntil(
    notifyPm(result.code, locale, payload)
      .then(() => {
        console.log(`[lead-created] code=${result.code} — PM alert dispatched`);
      })
      .catch((err) => {
        console.error(
          `[lead-created] code=${result.code} — PM alert failed (non-fatal):`,
          err instanceof Error ? err.message : err,
        );
      }),
  );
}
return NextResponse.json({ code: result.code });
```

The promise is registered with `waitUntil` so the runtime
tracks completion. The `.then` / `.catch` chain preserves the
non-fatal-error semantics (Lead row is already persisted; the
PM still sees it in the M5 admin inbox when M5-03 ships).

**M-POST queue carve preserved**: `@vercel/functions`
`waitUntil` is a runtime helper, not a job queue (Inngest /
SQS class). CLAUDE.md §4 "real queue M-POST" not triggered.
Inngest etc. still defer to M-POST.

## The structured-log requirement

The original bug was undetectable from the Vercel panel because
no log statements existed inside `sendLeadCreatedEmail`. Every
function on the email path now logs at entry, at success
(`messageId`), and at every failure mode (`env missing`,
`resend API error`, `resend threw`). When the next smoke
matrix runs, the Function Invocation panel must show the
chain — silence again would mean the bug recurred.

## When to graduate to a real queue

`waitUntil` covers MVP scale (Resend send, structured logs,
short-lived background work). Once any of these become true,
revisit:

- Background work routinely exceeds **30 seconds** (Vercel's
  function execution cap; `waitUntil` doesn't extend it)
- Failure recovery / retries matter (Resend transient errors,
  webhook retries, etc.) — `waitUntil` doesn't retry
- Background work needs durability across deploys (a long
  task started before a deploy gets killed when the new
  version takes over)
- The same job needs to fire from multiple routes (queue
  centralisation > per-route duplication)

Options at that point — all **M-POST** per CLAUDE.md §4:

- **Inngest** — durable function queue, retry semantics, fan-
  out. The codebase already reserves the env vars
  (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`) under the
  M-POST commented block in `.env.example`.
- **Supabase Edge Function** + cron / pg_cron triggers — for
  scheduled work tied to DB state.
- **Direct queue (SQS / Redis Streams / etc.)** — overkill
  for our profile today.

Note: `unstable_after` from `next/server` (Next.js 15+)
exposes the same `waitUntil` mechanic with framework-blessed
typing. We're on Next.js 14.2.5 so it's not available; if /
when we upgrade, the swap is purely cosmetic (same runtime
behaviour).

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
