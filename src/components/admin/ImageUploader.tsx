/**
 * Product photography: drop files, watch them resize, put them in order.
 *
 * THE FIRST IMAGE IS THE PRODUCT. It is the grid thumbnail, the LCP element on
 * the PDP, and the social card. So order is not a nicety here, and the tile
 * that is first says "Cover" on it rather than leaving you to infer it from
 * position.
 *
 * REORDERING IS NOT DRAG-ONLY. Dragging is the fast path and it is here, but a
 * drag is invisible to a keyboard and to a screen reader, and Section 15 does
 * not have an exception for admin screens. Every tile therefore carries Back
 * and Forward buttons that do exactly what a drag does, and they are real
 * buttons in the tab order, not icons with a click handler.
 *
 * WHAT HAPPENS TO A DROPPED FILE. `uploadProductImage` crops it to 3:4 at
 * 1200x1600 and re-encodes it before it leaves the browser — see that file for
 * why. A 6 MB phone photo becomes roughly 150 KB, which is the difference
 * between a product page inside Section 14's budget and one three times over
 * it. The uploads run one at a time on purpose: eight parallel uploads on a
 * Mandi Bahauddin connection all finish slower and none of them show progress
 * that means anything.
 */

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";

import { uploadProductImage } from "@/lib/auth/image-upload";

export interface EditableImage {
  url: string;
  alt: string;
}

interface Props {
  images: EditableImage[];
  onChange: (images: EditableImage[]) => void;
  /** Shapes the storage path, so the bucket stays browsable by product. */
  slug: string;
}

export function ImageUploader({ images, onChange, slug }: Props) {
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function accept(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const list = Array.from(files).slice(0, 8 - images.length);
    if (list.length === 0) {
      setError("Eight photographs is the most a product page shows.");
      return;
    }

    setBusy({ done: 0, total: list.length });
    const added: EditableImage[] = [];

    try {
      for (const [index, file] of list.entries()) {
        setBusy({ done: index, total: list.length });
        const uploaded = await uploadProductImage(file, slug || "product");
        // Alt is left empty here rather than guessed from the filename —
        // "IMG_4821" read aloud is worse than nothing. The form fills it from
        // the product name on save if it is still empty.
        added.push({ url: uploaded.url, alt: "" });
      }
      onChange([...images, ...added]);
    } catch (uploadError) {
      // Whatever uploaded before the failure is kept. Re-uploading four good
      // photos because the fifth failed is a bad way to spend a morning.
      if (added.length > 0) onChange([...images, ...added]);
      setError(uploadError instanceof Error ? uploadError.message : "That upload failed.");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          // A tile being reordered also fires drop here; ignore it.
          if (dragIndex.current !== null) return;
          void accept(event.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragOver ? "border-kc-gold bg-kc-gold/5" : "border-kc-line bg-kc-white"
        }`}
      >
        {busy ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-kc-muted" aria-hidden="true" />
            <p className="mt-2 text-sm text-kc-charcoal" role="status">
              Resizing and uploading {busy.done + 1} of {busy.total}…
            </p>
          </>
        ) : (
          <>
            <ImagePlus className="h-6 w-6 text-kc-muted" aria-hidden="true" />
            <p className="mt-2 text-sm text-kc-charcoal">Drop photographs here</p>
            <p className="mt-1 text-xs text-kc-muted">
              Cropped to 3:4 and resized automatically. Up to eight.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-3 min-h-11 border border-kc-line px-4 text-sm text-kc-ink"
            >
              Choose files
            </button>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => void accept(event.target.files)}
        />
      </div>

      {error ? (
        <p className="mt-2 text-sm text-kc-sale" role="alert">
          {error}
        </p>
      ) : null}

      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={image.url}
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragEnd={() => {
                dragIndex.current = null;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (dragIndex.current !== null) move(dragIndex.current, index);
                dragIndex.current = null;
              }}
              className="border border-kc-line bg-kc-white"
            >
              <div className="relative aspect-[3/4] bg-kc-sand">
                <img
                  src={image.url}
                  alt=""
                  width={300}
                  height={400}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-0 top-0 flex items-center gap-1 bg-kc-ink px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-kc-paper">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    Cover
                  </span>
                ) : null}
              </div>

              <div className="p-2">
                <label className="sr-only" htmlFor={`alt-${index}`}>
                  Describe photograph {index + 1}
                </label>
                <input
                  id={`alt-${index}`}
                  type="text"
                  value={image.alt}
                  onChange={(event) => {
                    const next = [...images];
                    next[index] = { url: image.url, alt: event.target.value };
                    onChange(next);
                  }}
                  placeholder="Describe this photo"
                  className="min-h-9 w-full border border-kc-line px-2 text-xs text-kc-ink"
                />

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      className="flex h-9 w-9 items-center justify-center text-kc-charcoal disabled:opacity-30"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Move photograph {index + 1} earlier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, index + 1)}
                      disabled={index === images.length - 1}
                      className="flex h-9 w-9 items-center justify-center text-kc-charcoal disabled:opacity-30"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Move photograph {index + 1} later</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onChange(images.filter((_, at) => at !== index))}
                    className="flex h-9 w-9 items-center justify-center text-kc-charcoal hover:text-kc-sale"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Remove photograph {index + 1}</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
