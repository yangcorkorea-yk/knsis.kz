/*
 * lib/uploads/process.test.ts — pin the photo-processing pipeline.
 *
 * Sharp is real (no mock) — these tests build tiny PNG / JPEG
 * fixtures in-memory and run them through processPhoto so the
 * EXIF-strip + re-encode contract is verified end-to-end at the
 * library boundary. Network / Storage layers are not exercised
 * here; that's the route test's job in M3-03.
 */

import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  buildPhotoPath,
  MAX_LONG_EDGE_PX,
  MAX_PHOTO_BYTES,
  processPhoto,
  UploadValidationError,
  validateUploadHeader,
} from "./process";

// Tiny in-memory PNG: 100×60 solid red.
async function makePng(width = 100, height = 60): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 230, g: 60, b: 80 },
    },
  })
    .png()
    .toBuffer();
}

// Tiny in-memory JPEG with a fake EXIF block injected via
// withMetadata. We inject a non-trivial orientation hint
// (orientation: 6 = rotate 90 CW) so we can prove processPhoto
// honoured it before stripping.
async function makeJpegWithExifOrientation(): Promise<Buffer> {
  return sharp({
    create: { width: 100, height: 60, channels: 3, background: "#fff" },
  })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
}

describe("validateUploadHeader", () => {
  it("accepts a valid jpeg under the size cap", () => {
    expect(() => validateUploadHeader({ size: 1024, mime: "image/jpeg" })).not.toThrow();
  });

  it("rejects an empty file", () => {
    expect(() => validateUploadHeader({ size: 0, mime: "image/jpeg" })).toThrow(
      UploadValidationError,
    );
  });

  it("rejects a file over MAX_PHOTO_BYTES", () => {
    expect(() => validateUploadHeader({ size: MAX_PHOTO_BYTES + 1, mime: "image/jpeg" })).toThrow(
      UploadValidationError,
    );
  });

  it("rejects unsupported mime types", () => {
    expect(() => validateUploadHeader({ size: 1024, mime: "image/webp" })).toThrow(
      UploadValidationError,
    );
    expect(() => validateUploadHeader({ size: 1024, mime: "application/pdf" })).toThrow(
      UploadValidationError,
    );
  });

  it("accepts heic + heif as input mimes (server re-encodes to jpeg)", () => {
    expect(() => validateUploadHeader({ size: 1024, mime: "image/heic" })).not.toThrow();
    expect(() => validateUploadHeader({ size: 1024, mime: "image/heif" })).not.toThrow();
  });

  it("surfaces a typed error with a stable code", () => {
    try {
      validateUploadHeader({ size: 0, mime: "image/jpeg" });
    } catch (e) {
      expect(e).toBeInstanceOf(UploadValidationError);
      expect((e as UploadValidationError).code).toBe("photo_empty");
    }
  });
});

describe("processPhoto", () => {
  it("re-encodes a PNG input to a PNG output (lossless format preservation)", async () => {
    const input = await makePng();
    const result = await processPhoto(input, "image/png");
    expect(result.mime).toBe("image/png");
    expect(result.extension).toBe("png");

    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("png");
  });

  it("re-encodes a JPEG input to a JPEG output", async () => {
    const input = await makeJpegWithExifOrientation();
    const result = await processPhoto(input, "image/jpeg");
    expect(result.mime).toBe("image/jpeg");
    expect(result.extension).toBe("jpg");

    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("jpeg");
  });

  it("strips EXIF metadata on re-encode", async () => {
    const input = await makeJpegWithExifOrientation();
    const inputMeta = await sharp(input).metadata();
    // The source has orientation=6 baked in.
    expect(inputMeta.orientation).toBe(6);

    const result = await processPhoto(input, "image/jpeg");
    const outMeta = await sharp(result.buffer).metadata();

    // After processPhoto: no orientation EXIF on the output.
    // Sharp's `rotate()` baked the rotation into pixels then the
    // re-encode dropped the EXIF block entirely.
    expect(outMeta.orientation).toBeUndefined();
    // exif buffer should not exist in the re-encoded output.
    expect(outMeta.exif).toBeUndefined();
  });

  it("does NOT enlarge a sub-2048 input", async () => {
    const input = await makePng(640, 480);
    const result = await processPhoto(input, "image/png");
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(640);
    expect(meta.height).toBe(480);
  });

  it("resizes a large input so the long edge is ≤ MAX_LONG_EDGE_PX", async () => {
    const input = await makePng(3000, 1500);
    const result = await processPhoto(input, "image/png");
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBeLessThanOrEqual(MAX_LONG_EDGE_PX);
    expect(meta.height).toBeLessThanOrEqual(MAX_LONG_EDGE_PX);
    // Aspect ratio preserved (≈ 2:1).
    expect((meta.width ?? 0) / (meta.height ?? 1)).toBeCloseTo(2, 1);
  });

  it("returns a typed UploadValidationError on a non-image input", async () => {
    const bogus = Buffer.from("not an image", "utf-8");
    await expect(processPhoto(bogus, "image/jpeg")).rejects.toBeInstanceOf(UploadValidationError);
  });
});

describe("buildPhotoPath", () => {
  it("scopes the path under the user id", () => {
    const path = buildPhotoPath({
      userId: "11111111-1111-1111-1111-111111111111",
      extension: "jpg",
      randomId: "abc",
    });
    expect(path.startsWith("leads/11111111-1111-1111-1111-111111111111/")).toBe(true);
    expect(path.endsWith("-abc.jpg")).toBe(true);
  });

  it("encodes the extension into the filename", () => {
    const png = buildPhotoPath({ userId: "u", extension: "png", randomId: "r" });
    expect(png.endsWith(".png")).toBe(true);
    const jpg = buildPhotoPath({ userId: "u", extension: "jpg", randomId: "r" });
    expect(jpg.endsWith(".jpg")).toBe(true);
  });

  it("two calls in the same millisecond with different randomIds collide on neither", () => {
    const a = buildPhotoPath({ userId: "u", extension: "jpg", randomId: "aaa" });
    const b = buildPhotoPath({ userId: "u", extension: "jpg", randomId: "bbb" });
    expect(a).not.toBe(b);
  });
});
