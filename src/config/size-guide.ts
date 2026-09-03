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

export const howToMeasure = [
  "Chest: around the fullest part, keeping the tape level under the arms.",
  "Waist: around the natural waist, where the body bends to the side.",
  "Hip: around the fullest part, roughly eight inches below the waist.",
];

export const sizeGuideNote =
  "Measurements are indicative and taken flat, in inches. Cut varies between pieces, so check the Details tab on each product. Unstitched cloth is sold by length, not by size.";
