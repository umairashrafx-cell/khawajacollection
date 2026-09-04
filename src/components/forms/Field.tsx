/**
 * A labelled form control with its hint and error wired to it.
 *
 * Section 15 — every error is text tied to its input with `aria-describedby`,
 * never a red border alone. Colour is not available to every reader, and a
 * border says "something", not "what".
 *
 * Extracted from checkout when the auth and address forms needed the same
 * thing. Four forms quietly disagreeing about how an error is announced is
 * exactly the accessibility regression Section 15 is trying to prevent.
 */

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  required = false,
  children,
}: {
  label: string;
  // `| undefined` explicitly: with exactOptionalPropertyTypes, react-hook-form's
  // `errors.x?.message` is `string | undefined` and an optional prop alone
  // would not accept it.
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  children: ReactNode;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="block text-sm text-kc-charcoal">
        {label}
        {required ? <span className="text-kc-sale"> *</span> : null}
      </label>
      <div className="mt-1.5">
        {/* Cloned so the label, hint and error all address the real control,
            without every caller having to repeat the id three times. */}
        {isValidElement(children)
          ? cloneElement(children as ReactElement<Record<string, unknown>>, {
              id,
              ...(describedBy ? { "aria-describedby": describedBy } : {}),
              ...(error ? { "aria-invalid": true } : {}),
            })
          : children}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-kc-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-kc-sale">
          {error}
        </p>
      ) : null}
    </div>
  );
}
