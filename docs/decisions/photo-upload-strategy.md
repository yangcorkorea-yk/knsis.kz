# Decision: Server-side sharp instead of presigned PUT (M3-02)

**Date:** M3 build
**Decided by:** Implementer call · awaiting PM sign-off
**Status:** Shipped in PR for M3

## What the WBS says

`MVP Roadmap & WBS.html` §06 M3-02:

> Photo upload pipeline — Presigned PUT to Supabase Storage;
> client-side resize; EXIF strip.

This describes the _deliverable_ (photo lands in private bucket,
EXIF stripped, reasonable size). The implementation suggestion
(presigned PUT + client-side processing) optimises for one
specific concern — large-file traffic not flowing through our
serverless function quota.

## What we shipped

Server-side single-trip via `/api/uploads`:

1. Client POSTs `multipart/form-data` to the route.
2. Route validates header (size ≤ 5 MB, mime in jpeg / png /
   heic / heif).
3. Route runs sharp:
   - `.rotate()` to bake EXIF orientation into pixels
   - `.resize({ width: 2048, height: 2048, fit: "inside",
withoutEnlargement: true })`
   - `.jpeg({ quality: 82, mozjpeg: true })` OR `.png()`
4. Route writes the processed buffer to the private Supabase
   Storage bucket via the service-role key.
5. Route returns `{ path, mime }` — the client stores these on
   the form state and sends them on lead submit.

EXIF strip is implicit in step 3+4: sharp's re-encode emits a
fresh image stream that doesn't carry the source EXIF block.
The rotate-first step ensures the orientation tag (the one
EXIF tag we actually need to honour) gets applied before it's
discarded. GPSInfo IFD — the location-leak vector — never
makes it past sharp.

## Why we deviated

| Concern              | Presigned PUT + client resize                                                                                                                                                | Server-side sharp (chosen)                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| EXIF strip guarantee | Depends on client-side library — canvas re-encode works for jpeg/png but HEIC needs `heic2any` (~220 KB) and the surface area for a bug that leaves GPSInfo in place is real | Single library (sharp) handles all four input mimes uniformly; hard-rule compliance is provable at the API boundary  |
| HEIC support         | `heic2any` adds 220 KB to the consult-form JS bundle                                                                                                                         | Native via libheif (bundled in `sharp` 0.34 npm package) — zero client JS cost                                       |
| Latency              | Direct upload to Supabase CDN (fast for the client)                                                                                                                          | Single round-trip via our function (~300-700 ms extra at MVP scale)                                                  |
| Function quota       | Photos never touch our compute                                                                                                                                               | 5 MB × 3 photos × per consult ≈ 15 MB through the function per submit — negligible at MVP scale (< 100 consults/day) |
| Code complexity      | Client + server both need work (presign endpoint, upload UX with progress, error retry for partial uploads)                                                                  | One client `fetch`, one server route, sharp does the heavy lifting                                                   |
| Auditability         | Server doesn't see the bytes — can't reject corrupted files, can't enforce content moderation later                                                                          | Server has the buffer in hand — easy to add NSFW detection / virus scan in M5+                                       |

For the MVP traffic profile (low volume, photos optional on
most leads, strict privacy guarantee required) the
server-side path wins on every axis except raw latency, and
the latency cost (sub-second) is invisible during the
already-multi-step consult flow.

## When to revisit

Switch to presigned PUT if any of the following becomes true:

- Daily upload volume crosses ~5,000 photos and the function
  cost starts to matter.
- Vercel function memory limits get tight (sharp at 5 MB
  input + resize can spike to ~150 MB heap; we're well
  inside the 1024 MB default today).
- Client-side EXIF strip becomes provably bulletproof
  (e.g. a small WASM library that handles all four mimes
  with no GPSInfo leak risk).

The swap path is local: replace `/api/uploads` with
`/api/uploads/presign` (returns a signed PUT URL), move the
sharp pipeline into a post-upload trigger (Supabase Storage
webhook → Edge Function → re-upload processed buffer). The
form's `PhotoRef` shape (`{ path, mime }`) doesn't change.

## Bucket configuration (Supabase dashboard)

- **Name:** `lead-photos` (or override via `LEAD_PHOTOS_BUCKET`
  env var)
- **Public:** off (private)
- **File size limit:** 5 MB
- **Allowed mime types:** leave default (the route enforces)
- **RLS:** the server-side service-role key bypasses RLS by
  design; no policies needed for the MVP flow. M5 admin
  inbox calls `signPhotoReadUrl` which also runs under the
  service role.

## Hard rules satisfied

- ✅ No price field in payload (schema doesn't accept one)
- ✅ EXIF stripped before storage (location-leak protection)
- ✅ Photos served via 5-minute signed URLs at read time
- ✅ Private bucket — no public CDN exposure
- ✅ Consent timestamped per Lead row on M3-03 submit
