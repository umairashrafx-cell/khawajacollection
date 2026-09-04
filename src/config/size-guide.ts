/**
 * Size guide. See docs/BUILD-SPEC.pdf Phase 5 and Section 16.
 *
 * Ready-to-wear runs XS–XXL. Measurements are in inches, which is how
 * Pakistani ready-to-wear is sold and how customers measure at home.
 *
 * INDICATIVE ONLY, and labelled as such everywhere it renders. These are
 * conventional ready-to-wear ranges, not measurements taken from KC garments.
 * Umair must confirm them against the real cut before launch — a size chart
 * that does not match the stitching is a returns problem, not a copy problem.
 */

export interface SizeRow {
  size: string;
  chest: string;
  waist: string;
  hip: string;
}

export const womensSizes: SizeRow[] = [
  { size: "XS", chest: "32", waist: "26", hip: "35" },
  { size: "S", chest: "34", waist: "28", hip: "37" },
  { size: "M", chest: "36", waist: "30", hip: "39" },
  { size: "L", chest: "38", waist: "32", hip: "41" },
  { size: "XL", chest: "40", waist: "34", hip: "43" },
  { size: "XXL", chest: "42", waist: "36", hip: "45" },
];

export const mensSizes: SizeRow[] = [
  { size: "S", chest: "38", waist: "32", hip: "39" },
  { size: "M", chest: "40", waist: "34", hip: "41" },
  { size: "L", chest: "42", waist: "36", hip: "43" },
  { size: "XL", chest: "44", waist: "38", hip: "45" },
  { size: "XXL", chest: "46", waist: "40", hip: "47" },
];

/**
 * BEDDING IS A DIFFERENT KIND OF SIZE and needs a different table. A bedsheet
 * has no chest, waist or hip, and showing the ready-to-wear chart beside
 * Single / Double / Queen / King would be worse than showing nothing: it looks
 * authoritative and answers a question nobody asked.
 *
 * These are the flat-sheet and mattress dimensions the sizes are cut to.
 * INDICATIVE, exactly like the garment chart above, and for the same reason —
 * they are conventional Pakistani bedding sizes, not measurements taken from
 * KC stock. Umair must confirm them against the real cut before launch.
 */
export interface BedSizeRow {
  size: string;
  /** The mattress the size is meant for, in inches. */
  mattress: string;
  /** The flat sheet as sold, in inches. Larger, to allow a tuck. */
  flatSheet: string;
  pillowcases: string;
}

export const bedSizeRows: BedSizeRow[] = [
  { size: "Single", mattress: "36 x 75", flatSheet: "63 x 96", pillowcases: "1" },
  { size: "Double", mattress: "54 x 75", flatSheet: "90 x 102", pillowcases: "2" },
  { size: "Queen", mattress: "60 x 78", flatSheet: "96 x 104", pillowcases: "2" },
  { size: "King", mattress: "72 x 78", flatSheet: "108 x 108", pillowcases: "2" },
];

export const howToMeasureBed = [
  "Measure the mattress across its width and along its length, ignoring the bed frame.",
  "Then measure its depth. A deeper mattress needs more sheet to tuck under.",
  "If a measurement falls between two sizes, take the larger one.",
];

export const bedSizeGuideNote =
  "Measurements are indicative and taken flat, in inches. Sheets are cut oversized so they still tuck after washing; expect a little shrinkage on the first wash.";

export const howToMeasure = [
  "Chest: around the fullest part, keeping the tape level under the arms.",
  "Waist: around the natural waist, where the body bends to the side.",
  "Hip: around the fullest part, roughly eight inches below the waist.",
];

export const sizeGuideNote =
  "Measurements are indicative and taken flat, in inches. Cut varies between pieces, so check the Details tab on each product. Unstitched cloth is sold by length, not by size.";
