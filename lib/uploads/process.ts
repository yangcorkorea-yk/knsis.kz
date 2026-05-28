/*
 * lib/uploads/process.ts — pure photo-processing pipeline for
 * the consult-form upload endpoint (M3-02).
 *
 * Flow:
 *   1. Validate (size ≤ 5 MB, mime in jpeg/png/heic/heif).
 *   2. Read into sharp.
 *   3. `.rotate()` to bake the EXIF orientation into pixels.
 *   4. Re-encode to jpeg (quality 82, drops EXIF) OR png (lossless,
 *      drops EXIF) depending on the input format. HEIC always
 *      converts to jpeg (the photoRefSchema only accepts
 *      jpeg/png mimes).
 *   5. Resize down so the longest edge is ≤ 2048 px (saves
 *      storage + bandwidth; the manager doesn't need 50 MP).
 *   6. Return `{ buffer, mime, extension }` — the caller writes
 *      it to Supabase Storage and returns the path to the client.
 *
 * EXIF strip is implicit in step 3 + 4: sharp's re-encode emits a
 * fresh image stream that doesn't carry the source EXIF block.
 * The rotate-first step ensures the orientation EXIF tag (the
 * one tag we actually need to honour) is applied to pixels
 * before it's dropped. Hard rule satisfied: location metadata
 * (GPSInfo IFD) never persists to storage.
 *
 * No Supabase imports here — that layer composes this output with
 * the storage client. Lets the processing pipeline be vitest-
 * tested without a Storage stub.
 */

import sharp from "sharp";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_LONG_EDGE_PX = 2048;
export const ACCEPTED_INPUT_MIMES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
] as const;

export type AcceptedInputMime = (typeof ACCEPTED_INPUT_MIMES)[number];

export class UploadValidationError extends Error {
  readonly code: "photo_size" | "photo_mime" | "photo_empty" | "photo_decode_failed";
  constructor(
    code: "photo_size" | "photo_mime" | "photo_empty" | "photo_decode_failed",
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "UploadValidationError";
  }
}

export interface ValidationInput {
  size: number;
  mime: string;
}

/**
 * Pre-flight check. Pulled out so the route can reject before
 * the sharp work runs (saves CPU on the obviously-bad cases).
 */
export function validateUploadHeader(input: ValidationInput): void {
  if (input.size <= 0) {
    throw new UploadValidationError("photo_empty", "empty file");
  }
  if (input.size > MAX_PHOTO_BYTES) {
    throw new UploadValidationError("photo_size", `file exceeds ${MAX_PHOTO_BYTES} bytes`);
  }
  if (!(ACCEPTED_INPUT_MIMES as readonly string[]).includes(input.mime)) {
    throw new UploadValidationError("photo_mime", `unsupported mime ${input.mime}`);
  }
}

export interface ProcessedPhoto {
  buffer: Buffer;
  /** Final stored mime — jpeg/png after re-encode. */
  mime: "image/jpeg" | "image/png";
  /** Final stored extension (without dot). */
  extension: "jpg" | "png";
}

/**
 * Read → rotate (bake orientation) → resize → re-encode. The
 * re-encode is what drops the EXIF block (sharp never persists
 * source metadata unless `.withMetadata()` is called, which
 * this pipeline deliberately doesn't).
 *
 * Input mime decides the output mime:
 *   jpeg / heic / heif → jpeg (quality 82)
 *   png               → png  (lossless, palettisation off)
 */
export async function processPhoto(
  input: Buffer,
  mime: AcceptedInputMime,
): Promise<ProcessedPhoto> {
  let img: sharp.Sharp;
  try {
    img = sharp(input).rotate();
  } catch {
    throw new UploadValidationError("photo_decode_failed", "sharp could not decode input");
  }

  // Best-effort decode probe — surfaces a friendlier error than
  // letting the toBuffer() call below throw on a corrupt file.
  try {
    await img.metadata();
  } catch {
    throw new UploadValidationError("photo_decode_failed", "sharp could not read metadata");
  }

  img = img.resize({
    width: MAX_LONG_EDGE_PX,
    height: MAX_LONG_EDGE_PX,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (mime === "image/png") {
    const buffer = await img.png({ compressionLevel: 9, palette: false }).toBuffer();
    return { buffer, mime: "image/png", extension: "png" };
  }

  const buffer = await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return { buffer, mime: "image/jpeg", extension: "jpg" };
}

/**
 * Build the Supabase Storage path for a processed photo.
 * Scoped per user so an attacker who guesses one path can't
 * walk into another user's leads. The collision space is
 * (timestamp ms × random uuid) which is way below MVP scale.
 */
export function buildPhotoPath(opts: {
  userId: string;
  extension: "jpg" | "png";
  /** UUID-style suffix to avoid collisions on rapid successive uploads. */
  randomId: string;
}): string {
  // Path shape: leads/{userId}/{epoch}-{rand}.{ext}
  // - userId first → admin tooling can list all photos for one user
  // - epoch prefix → newest sorts last under default ordering
  const ts = Date.now();
  return `leads/${opts.userId}/${ts}-${opts.randomId}.${opts.extension}`;
}
