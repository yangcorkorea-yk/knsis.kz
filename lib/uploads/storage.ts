/*
 * lib/uploads/storage.ts — thin Supabase Storage client wrapper.
 *
 * MVP scope: write processed photos to the private `lead-photos`
 * bucket (env: LEAD_PHOTOS_BUCKET), mint 5-minute signed read
 * URLs when the admin inbox needs to display them.
 *
 * Uses the SERVICE ROLE key — server-side only, never imported
 * from a client component. The admin token bypasses RLS by
 * design; consult-form uploads route through this layer so RLS
 * rules don't need to model anonymous-guest upload permissions.
 *
 * Bucket lifecycle:
 *   - Create the bucket as PRIVATE in the Supabase dashboard
 *     (Storage → New bucket → Public: off).
 *   - Default file size limit: 5 MB (matches MAX_PHOTO_BYTES).
 *   - No public CDN — every read is a 5-min signed URL.
 *
 * Returns a typed result (no thrown Supabase errors) so the
 * route can map them to clean 4xx / 5xx responses.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SIGNED_URL_TTL_SECONDS = 5 * 60;

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase Storage requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

function getBucket(): string {
  return process.env.LEAD_PHOTOS_BUCKET ?? "lead-photos";
}

export type UploadResult = { ok: true; path: string } | { ok: false; error: string };

/**
 * Upload a processed photo buffer. Caller passes the
 * pre-computed path (see `buildPhotoPath`) + the final mime
 * (`image/jpeg` | `image/png`) — no content-type sniffing on
 * the server side.
 */
export async function uploadPhotoBuffer(
  path: string,
  body: Buffer,
  contentType: "image/jpeg" | "image/png",
): Promise<UploadResult> {
  const supabase = getClient();
  const { error } = await supabase.storage.from(getBucket()).upload(path, body, {
    contentType,
    upsert: false,
    cacheControl: "private, max-age=0, must-revalidate",
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, path };
}

/**
 * Mint a short-lived signed URL for a stored photo. Used by
 * the M5 admin inbox; tests don't exercise this, but the seam
 * exists so M5 can wire it without touching this file.
 */
export async function signPhotoReadUrl(path: string): Promise<{ url: string } | { error: string }> {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(getBucket())
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    return { error: error?.message ?? "signed url generation failed" };
  }
  return { url: data.signedUrl };
}

export const __testing__ = {
  SIGNED_URL_TTL_SECONDS,
};
