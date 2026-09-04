/**
 * Saved delivery addresses. docs/BUILD-SPEC.pdf Section 11.6. noindex.
 *
 * THE ONLY PAGE IN THE APP THAT WRITES TO POSTGRES FROM THE BROWSER, and the
 * only one that should. There is no API route in front of it because there is
 * nothing for one to add: 0003_accounts.sql gives `addresses` four RLS
 * policies, every one of them `auth.uid() = user_id`, so the database refuses
 * to return or accept a row belonging to anybody else. A server route here
 * would be a second copy of a rule Postgres is already enforcing, and the
 * second copy is the one that eventually drifts.
 *
 * Contrast the order pages, which do go through a server route: `orders` has
 * no anon policy at all by design (0002_rls.sql), because guest tracking needs
 * a lookup that RLS cannot express safely.
 */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Trash2 } from "lucide-react";

import { FormError } from "@/components/account/AuthShell";
import { Field } from "@/components/forms/Field";
import { inputClass } from "@/components/forms/input-class";
import { provinces } from "@/config/site";
import { useUser } from "@/lib/auth/session-store";
import { normalizePakistaniPhone } from "@/lib/format";
import { browserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/account/addresses")({
  head: () => ({
    meta: [
      { title: "Your addresses | Khawaja Collection" },
      { name: "description", content: "Delivery addresses saved to your account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/account/addresses" }],
  }),
  component: AddressesPage,
});

interface AddressRow {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postal_code: string | null;
  is_default: boolean;
}

const BLANK = {
  label: "",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  province: provinces[0] ?? "",
  postalCode: "",
};

function AddressesPage() {
  const userId = useUser()?.id ?? null;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ ...BLANK });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["addresses", userId],
    enabled: userId !== null,
    queryFn: async (): Promise<AddressRow[]> => {
      // No `.eq("user_id", …)`: RLS already scopes this to the caller, and a
      // filter here would imply the row is reachable without one.
      const { data: rows, error } = await browserClient()
        .from("addresses")
        .select("id, label, name, phone, line1, line2, city, province, postal_code, is_default")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (rows ?? []) as AddressRow[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["addresses", userId] });

  const add = useMutation({
    mutationFn: async () => {
      const phone = normalizePakistaniPhone(draft.phone);
      // Section 16 — stored in one shape so tracking and delivery agree.
      if (!phone) throw new Error("Enter a Pakistani mobile number, like 0300 1234567.");
      if (!draft.name.trim() || !draft.line1.trim() || !draft.city.trim()) {
        throw new Error("Name, address and city are all needed.");
      }

      const { error } = await browserClient()
        .from("addresses")
        .insert({
          user_id: userId,
          label: draft.label.trim() || null,
          name: draft.name.trim(),
          phone,
          line1: draft.line1.trim(),
          line2: draft.line2.trim() || null,
          city: draft.city.trim(),
          province: draft.province,
          postal_code: draft.postalCode.trim() || null,
          // The first address saved becomes the default; after that the
          // customer chooses. A partial unique index keeps it to one.
          is_default: (data?.length ?? 0) === 0,
        });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setDraft({ ...BLANK });
      setFormError(null);
      void invalidate();
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await browserClient().from("addresses").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const makeDefault = useMutation({
    mutationFn: async (id: string) => {
      const supabase = browserClient();
      // Cleared first: the partial unique index rejects a second default, so
      // setting before clearing would fail rather than swap.
      const { error: clearError } = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("is_default", true);
      if (clearError) throw new Error(clearError.message);

      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl">Saved addresses</h2>

        {isPending ? <p className="mt-5 text-sm text-kc-muted">Loading…</p> : null}

        {data && data.length === 0 ? (
          <div className="mt-5 border border-kc-line bg-kc-white p-6">
            <MapPin className="h-5 w-5 text-kc-muted" aria-hidden="true" />
            <p className="mt-3 text-sm text-kc-charcoal">
              No addresses saved yet. Add one below and it will be ready at checkout.
            </p>
          </div>
        ) : null}

        {data && data.length > 0 ? (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {data.map((address) => (
              <li key={address.id} className="border border-kc-line bg-kc-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-kc-ink">
                    {address.label || address.name}
                    {address.is_default ? (
                      <span className="ml-2 border border-kc-gold px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-kc-gold">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove.mutate(address.id)}
                    aria-label={`Delete address for ${address.name}`}
                    className="shrink-0 p-1 text-kc-muted transition-colors hover:text-kc-sale"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <address className="mt-2 text-xs not-italic leading-relaxed text-kc-charcoal">
                  {address.name}
                  <br />
                  {address.line1}
                  {address.line2 ? (
                    <>
                      <br />
                      {address.line2}
                    </>
                  ) : null}
                  <br />
                  {address.city}, {address.province}
                  {address.postal_code ? ` ${address.postal_code}` : ""}
                  <br />
                  {address.phone}
                </address>

                {!address.is_default ? (
                  <button
                    type="button"
                    onClick={() => makeDefault.mutate(address.id)}
                    className="mt-3 text-xs text-kc-charcoal underline underline-offset-4 hover:text-kc-gold"
                  >
                    Make default
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <h2 className="font-display text-xl">Add an address</h2>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            add.mutate();
          }}
          noValidate
          className="mt-5 max-w-md space-y-5"
        >
          <FormError message={formError} />

          <Field label="Label" hint="Optional — Home, Office, Ammi's.">
            <input
              type="text"
              value={draft.label}
              onChange={(event) => setDraft({ ...draft, label: event.target.value })}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Recipient name" required>
            <input
              type="text"
              autoComplete="name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Mobile number" hint="03xx xxxxxxx" required>
            <input
              type="tel"
              autoComplete="tel"
              value={draft.phone}
              onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Address line 1" required>
            <input
              type="text"
              autoComplete="address-line1"
              value={draft.line1}
              onChange={(event) => setDraft({ ...draft, line1: event.target.value })}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Address line 2">
            <input
              type="text"
              autoComplete="address-line2"
              value={draft.line2}
              onChange={(event) => setDraft({ ...draft, line2: event.target.value })}
              className={inputClass(false)}
            />
          </Field>

          <Field label="City" required>
            <input
              type="text"
              autoComplete="address-level2"
              value={draft.city}
              onChange={(event) => setDraft({ ...draft, city: event.target.value })}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Province" required>
            <select
              value={draft.province}
              onChange={(event) => setDraft({ ...draft, province: event.target.value })}
              className={inputClass(false)}
            >
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Postal code" hint="Optional — many addresses do not need one.">
            <input
              type="text"
              autoComplete="postal-code"
              value={draft.postalCode}
              onChange={(event) => setDraft({ ...draft, postalCode: event.target.value })}
              className={inputClass(false)}
            />
          </Field>

          <button
            type="submit"
            disabled={add.isPending}
            className="min-h-11 bg-kc-ink px-6 text-sm tracking-wide text-kc-white disabled:opacity-60"
          >
            {add.isPending ? "Saving…" : "Save address"}
          </button>
        </form>
      </section>
    </div>
  );
}
