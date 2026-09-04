/**
 * Profile — the landing page of the account area.
 * docs/BUILD-SPEC.pdf Section 11.6. noindex.
 *
 * Deliberately thin. There is no profile *editing* here beyond the name,
 * because everything else a shop would put on this page is either somewhere
 * better (addresses have their own page, the wishlist has its own page) or is
 * a business fact this project is not allowed to invent — Hard Rule 9. A
 * marketing-preferences toggle that saves nowhere is worse than no toggle.
 */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, PackageSearch } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import { FormError } from "@/components/account/AuthShell";
import { Field } from "@/components/forms/Field";
import { inputClass } from "@/components/forms/input-class";
import { useAuth } from "@/lib/auth/session-store";
import { browserClient } from "@/lib/supabase/client";
import { useWishlistCount, useWishlistHydrated } from "@/store/wishlist-store";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Profile | Khawaja Collection" },
      { name: "description", content: "Your Khawaja Collection profile." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/account" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const savedCount = useWishlistCount();
  const hydrated = useWishlistHydrated();

  const [name, setName] = useState(
    (user?.user_metadata?.["full_name"] as string | undefined) ?? "",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus("saving");

    // user_metadata, not a profiles table: Section 8.3 does not define one, and
    // a whole table for a single display name would be a schema the spec did
    // not ask for. If profiles grow beyond this, that is the moment to add it.
    const { error: updateError } = await browserClient().auth.updateUser({
      data: { full_name: name.trim() },
    });

    if (updateError) {
      setStatus("idle");
      setError(updateError.message);
      return;
    }
    setStatus("saved");
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl">Your details</h2>

        <form onSubmit={save} noValidate className="mt-5 max-w-md space-y-5">
          <FormError message={error} />

          <Field label="Full name">
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setStatus("idle");
              }}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Email" hint="Changing your email is not available yet — write to us.">
            <input
              type="email"
              value={user?.email ?? ""}
              readOnly
              className={`${inputClass(false)} bg-kc-sand text-kc-muted`}
            />
          </Field>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={status === "saving"}
              className="min-h-11 bg-kc-ink px-6 text-sm tracking-wide text-kc-white disabled:opacity-60"
            >
              {status === "saving" ? "Saving…" : "Save"}
            </button>
            {/* Polite, not assertive: a save confirmation should not interrupt
                whatever a screen reader is already saying. */}
            <p aria-live="polite" className="text-sm text-kc-muted">
              {status === "saved" ? "Saved." : ""}
            </p>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display text-xl">Shortcuts</h2>
        <ul className="mt-5 space-y-4">
          <li>
            <AppLink
              href="/account/orders"
              className="flex items-center gap-4 border border-kc-line bg-kc-white p-5 transition-colors hover:border-kc-ink"
            >
              <PackageSearch className="h-5 w-5 shrink-0 text-kc-muted" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-medium text-kc-ink">Orders</span>
                <span className="block text-xs text-kc-muted">
                  Everything you have ordered with this account
                </span>
              </span>
            </AppLink>
          </li>
          <li>
            <AppLink
              href="/wishlist"
              className="flex items-center gap-4 border border-kc-line bg-kc-white p-5 transition-colors hover:border-kc-ink"
            >
              <Heart className="h-5 w-5 shrink-0 text-kc-muted" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-medium text-kc-ink">Wishlist</span>
                <span className="block text-xs text-kc-muted">
                  {hydrated
                    ? savedCount === 0
                      ? "Nothing saved yet"
                      : `${savedCount} ${savedCount === 1 ? "piece" : "pieces"} saved`
                    : "Saved to your account"}
                </span>
              </span>
            </AppLink>
          </li>
        </ul>
      </section>
    </div>
  );
}
