/**
 * Shrink a photo in the browser before it is uploaded.
 *
 * Why: uploads travel through the Next.js proxy (/api/backend/*), which runs on Vercel.
 *  - Vercel Functions reject request bodies over 4.5 MB, so large phone photos would fail.
 *  - Every uploaded byte counts toward the plan's Fast Origin Transfer.
 * A 4000 px phone photo (4–8 MB) becomes ~200–500 KB at 1920 px with no visible loss on the site.
 * Re-encoding also drops EXIF metadata such as GPS position, which keeps givers' homes private.
 *
 * Never fails: if the browser can't decode or encode the image, the original file is returned.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1920, quality = 0.82, skipBelowBytes = 300 * 1024 }: { maxDimension?: number; quality?: number; skipBelowBytes?: number } = {},
): Promise<File> {
  if (typeof window === "undefined" || typeof createImageBitmap === "undefined") return file;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= skipBelowBytes) return file;

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);

    // PNGs may be transparent (logos, category art): keep transparency with WebP, or leave as is.
    const targetType = file.type === "image/png" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, targetType, quality));

    // Some browsers fall back to PNG when they can't encode WebP; then keep the original.
    if (!blob || blob.type !== targetType || blob.size >= file.size) return file;

    const extension = targetType === "image/webp" ? "webp" : "jpg";
    const name = `${file.name.replace(/\.[^.]+$/, "") || "photo"}.${extension}`;
    return new File([blob], name, { type: targetType, lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}

/** Largest upload that fits through a Vercel Function with room for the form fields. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Largest original we try to shrink; anything bigger is almost certainly not a photo worth sending. */
export const MAX_ORIGINAL_BYTES = 30 * 1024 * 1024;
