import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 2.5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Persist an uploaded product image.
 * Prefer writing under public/uploads (served as static files).
 * Fall back to a data URL stored in the DB when the filesystem is read-only.
 */
export async function saveProductImage(
  file: File,
): Promise<{ imageUrl: string } | { error: string }> {
  if (!file || file.size === 0) {
    return { error: "No image selected" };
  }
  if (!ALLOWED.has(file.type)) {
    return { error: "Use a JPEG, PNG, WebP, or GIF image" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be 2.5 MB or smaller" };
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  try {
    const dir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return { imageUrl: `/uploads/products/${filename}` };
  } catch (error) {
    console.warn("Filesystem upload failed, storing as data URL:", error);
    // Persist across deploys on ephemeral hosts (Render free) via DB column
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    return { imageUrl: dataUrl };
  }
}

export function isHttpImageUrl(url: string | null | undefined): boolean {
  return Boolean(url && /^https?:\/\//i.test(url));
}
