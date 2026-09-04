/**
 * Uploading product photography.
 *
 * TWO THINGS HAPPEN HERE, AND THE FIRST IS THE IMPORTANT ONE.
 *
 * 1. EVERY PHOTO IS RESIZED AND CROPPED IN THE BROWSER BEFORE IT IS SENT.
 *    A phone camera produces a 4–8 MB JPEG several thousand pixels wide. Put
 *    that on a product page and Section 14's budget is gone — the LCP image
 *    alone would be twenty times the 180 KB allowance, on a connection where
 *    that is seconds. Canvas gives us a resize and a re-encode for free, with
 *    no image library and so no new dependency (Hard Rule 7).
 *
 *    It also CROPS to 3:4. That ratio is not decoration: the storefront
 *    reserves a 3:4 box for every product image to stop the grid reflowing
 *    when photos land, and `SupabaseProductRepository` declares 900×1200 for
 *    exactly that reason. An upload of another shape would silently make that
 *    declaration a lie and reintroduce the layout shift. Cropping on the way in
 *    keeps the guarantee true rather than hoping whoever took the photo framed
 *    it correctly.
 *
 * 2. It uploads straight from the browser to Supabase Storage, not through our
 *    own server. A serverless function's request-body limit is well under the
 *    size of a photograph, and 0005_product_images_storage.sql already
 *    restricts writes to the `admins` table — proxying megabytes through a
 *    function to re-check something the database enforces would be slower and
 *    no safer.
 */

import { browserClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

/** 3:4, matching the frame the storefront reserves. */
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 1600;

/**
 * WebP where the browser can encode it, JPEG otherwise. WebP is roughly 30%
 * smaller at the same quality, and every browser that can run this admin can
 * encode it — but the fallback costs one line and avoids uploading a PNG-sized
 * file if one ever cannot.
 */
function pickFormat(): { type: string; extension: string } {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const webp = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  return webp
    ? { type: "image/webp", extension: "webp" }
    : { type: "image/jpeg", extension: "jpg" };
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("That file could not be read as an image."));
      image.src = url;
    });
    return image;
  } finally {
    // Revoked once decoding is done; the bitmap survives the URL.
    URL.revokeObjectURL(url);
  }
}

/**
 * Cover-crop to 3:4 and re-encode. "Cover" rather than "contain" because
 * letterboxing a garment inside white bars looks like a mistake, whereas
 * trimming the edges of an over-wide photo rarely loses the piece.
 */
async function normalise(file: File): Promise<{ blob: Blob; extension: string }> {
  const image = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot process images.");

  // White rather than transparent: WebP and JPEG treat transparency
  // differently and a PNG with an alpha channel would otherwise go black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  const scale = Math.max(TARGET_WIDTH / image.width, TARGET_HEIGHT / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    (TARGET_WIDTH - drawWidth) / 2,
    (TARGET_HEIGHT - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );

  const { type, extension } = pickFormat();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82));
  if (!blob) throw new Error("That image could not be converted.");

  return { blob, extension };
}

function safeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "product"
  );
}

export interface UploadedImage {
  url: string;
  /** The storage path, so the image can be deleted later. */
  path: string;
}

/**
 * Normalises and uploads one photograph, returning its public URL.
 *
 * `productSlug` only shapes the storage path, so the bucket stays browsable by
 * a human looking for a particular product's photos.
 */
export async function uploadProductImage(file: File, productSlug: string): Promise<UploadedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  const { blob, extension } = await normalise(file);
  const supabase = await browserClient();

  // Random suffix so re-uploading a photo with the same name never overwrites
  // the one already on a live product page.
  const path = `${safeSlug(productSlug)}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    // A year: the path is unique per upload, so the bytes at it never change.
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    // The most likely cause by far, and the least obvious from the raw message.
    if (/row-level security|Unauthorized/i.test(error.message)) {
      throw new Error("Only an administrator can upload images.");
    }
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
