/*
 * POST /api/uploads — M3-02 photo upload endpoint.
 *
 * Single multipart/form-data file per request (field name: "file").
 * Pipeline: validate header → ensureGuestUser → read into buffer →
 * processPhoto (sharp re-encode, EXIF strip, resize) → upload to
 * Supabase Storage private bucket → return `{ path, mime }`.
 *
 * Response shape (deliberately minimal):
 *   200 { path, mime }                — happy path
 *   400 { ok: false, code }           — validation failure (size /
 *                                       mime / empty / decode)
 *   410 { ok: false, code: "bot" }    — UA matched the bot regex
 *   500 { ok: false, code: "internal" } — Supabase / sharp surprise
 *
 * Bot guard runs early so we don't burn sharp CPU on crawlers.
 * IP-based rate limit lands in M3-05 alongside the lead one.
 */

import { NextResponse } from "next/server";
import { ensureGuestUserFromRequest } from "@/lib/auth/ensure-guest-user";
import {
  buildPhotoPath,
  processPhoto,
  UploadValidationError,
  validateUploadHeader,
  type AcceptedInputMime,
} from "@/lib/uploads/process";
import { uploadPhotoBuffer } from "@/lib/uploads/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const ensured = await ensureGuestUserFromRequest();
  if (ensured.kind === "bot") {
    return NextResponse.json({ ok: false, code: "bot" }, { status: 410 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, code: "photo_decode_failed" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, code: "photo_empty" }, { status: 400 });
  }

  try {
    validateUploadHeader({ size: file.size, mime: file.type });
  } catch (e) {
    if (e instanceof UploadValidationError) {
      return NextResponse.json({ ok: false, code: e.code }, { status: 400 });
    }
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500 });
  }

  let buffer: Buffer;
  try {
    const arr = await file.arrayBuffer();
    buffer = Buffer.from(arr);
  } catch {
    return NextResponse.json({ ok: false, code: "photo_decode_failed" }, { status: 400 });
  }

  let processed;
  try {
    processed = await processPhoto(buffer, file.type as AcceptedInputMime);
  } catch (e) {
    if (e instanceof UploadValidationError) {
      return NextResponse.json({ ok: false, code: e.code }, { status: 400 });
    }
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500 });
  }

  const path = buildPhotoPath({
    userId: ensured.userId,
    extension: processed.extension,
    randomId: crypto.randomUUID(),
  });

  const upload = await uploadPhotoBuffer(path, processed.buffer, processed.mime);
  if (!upload.ok) {
    return NextResponse.json({ ok: false, code: "internal" }, { status: 500 });
  }

  return NextResponse.json({ path: upload.path, mime: processed.mime });
}
