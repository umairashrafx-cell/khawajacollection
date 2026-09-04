/**
 * The one input shape in the app.
 *
 * Its own module rather than a second export from Field.tsx: a file that
 * exports both a component and a plain function loses React Fast Refresh for
 * that component, which is what `react-refresh/only-export-components` is
 * warning about.
 *
 * Min-height 11 rather than a fixed height so a control that wraps — a select
 * with a long option, a textarea — grows instead of clipping, and still clears
 * the 44px touch target Section 15 asks for at 360px.
 */
export function inputClass(hasError: boolean): string {
  return `min-h-11 w-full border bg-kc-white px-3 text-sm text-kc-ink ${
    hasError ? "border-kc-sale" : "border-kc-line"
  }`;
}
