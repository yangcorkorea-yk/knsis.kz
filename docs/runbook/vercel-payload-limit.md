# Vercel function payload limit — 4.5 MB hard cap + server-side processing trap

## The trap

Vercel serverless functions on Node runtime have a **4.5 MB
request body cap** (5 MB on Edge, but our Prisma routes can't
use Edge). Any `POST` with a body bigger than that is rejected
by Vercel's edge layer before the function code runs — the
error surfaces as a generic `FUNCTION_PAYLOAD_TOO_LARGE` /
HTTP 413, or sometimes a connection reset depending on the
proxy path.

Routes that accept raw user files run into this constantly:

- M3-02 `POST /api/uploads` — single-image multipart upload
- (future) any CSV import / video / large doc upload route

A typical mid-range Android phone produces 5-8 MB JPEGs at
default settings. iPhone JPEG (HEIC disabled) lands at 4-7 MB.
iPhone HEIC is actually usually smaller (1.5-2.5 MB for a 12 MP
shot) because HEIC is more efficient than JPEG.

## What ships in this codebase

M3-02's photo upload pipeline chose **server-side sharp** over
the WBS-suggested **presigned PUT to Supabase Storage** for
hard rule §3 reasons — see `docs/decisions/photo-upload-strategy.md`.
Server-side processing guarantees the EXIF strip (location-leak
prevention) at the API boundary; presigned PUT defers the
processing to a webhook or accepts the EXIF risk.

That choice locks every raw upload through the Vercel function.
M3 production smoke surfaced the consequence: 5-8 MB Android
JPEGs failed with an opaque "upload failed" message before
sharp ever ran.

## The fix — client-side compression

Client-side preprocess shrinks the file before it crosses the
Vercel boundary. The EXIF strip stays server-side (sharp
re-encode); the client just trims byte size.

`components/consult/consult-form.tsx` `compressIfNeeded`:

```ts
async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= 2 * 1024 * 1024) return file;     // <2 MB: skip
  if (!COMPRESSIBLE_MIMES.has(file.type)) return file; // HEIC/HEIF: skip

  // FileReader → <img> → <canvas> → toBlob(jpeg, 0.85)
  // Resize so longest edge ≤ 2048 px (matches the server's
  // sharp resize, so we don't waste bytes the server discards)
  ...
}
```

Why Canvas API + zero deps over a library (`browser-image-compression` etc.):

- **HEIC / HEIF isn't a real problem.** iPhone HEIC originals
  fit under the Vercel limit; the server's `sharp` (libheif)
  handles decode + re-encode. We don't need `heic2any`
  (+220 KB) on the client.
- **JPEG / PNG is all we have to compress.** Canvas API handles
  both natively across iOS 12+ / Android Chrome / desktop.
  Roughly 30 lines, no maintenance surface.
- **Compression target matches the server's resize**
  (2048 px longest edge, JPEG quality 0.85). The client and
  server agree on the final output shape; the only difference
  is _who_ does the work.

## What stays server-side

The hard-rule guarantees do not move client-ward:

- **EXIF strip** (GPSInfo location-leak protection) — sharp
  re-encode on the server. Client compression is a payload-size
  fix only; the server still gets the final say on what's
  persisted.
- **Mime validation** — `lib/uploads/process.ts`
  `validateUploadHeader` still rejects non-jpeg/png/heic input.
- **Size validation** — server caps at 5 MB. Client compresses
  > 2 MB jpeg/png down well below that, and HEIC/HEIF pass
  > through small. The 5 MB server cap stays as defense-in-depth.

## Diagnostic checklist

When an upload fails opaquely:

1. **Inspect the raw network response.** A `413` / "request
   entity too large" / `FUNCTION_PAYLOAD_TOO_LARGE` is the
   smoking gun for the Vercel payload trap.
2. **Check the client file size before upload.** If `file.size
   > 4 _ 1024 _ 1024`, the Vercel proxy probably rejected
   > before the function ran.
3. **Look for a route-handler log.** If the function never
   logged, the request didn't reach the function — Vercel
   edge rejected it.
4. **Bypass to test.** Submit a smaller file (e.g. 500 KB).
   If that succeeds, payload size is the cause.

## When to revisit (move to presigned PUT)

The current pattern (client compress → server-side sharp) holds
through MVP. Revisit if any of these become true:

- Average daily upload count exceeds ~5,000 (Vercel function
  cost starts to matter; presigned PUT bypasses our compute)
- Files larger than 20 MB become common (e.g. RAW or video
  modes); client-side Canvas decode of >20 MB images can
  blow the browser tab's memory
- Multi-file uploads at once become common (>3 in one submit)

At that point, swap to **presigned PUT + post-upload sharp
trigger** (Supabase Storage webhook → Edge Function). The
form's `PhotoRef` shape (`{ path, mime }`) doesn't change.

## Related — Edge runtime caveat

If a route is small enough, switching it to `export const
runtime = "edge"` raises the body cap from 4.5 MB to 5 MB.
**Not applicable to `/api/uploads`** because:

- Edge can't run sharp (native module, Node-only)
- Edge can't use the Prisma client (the version we ship)
- The 5 MB cap is only marginally higher — the real fix is
  client preprocessing
