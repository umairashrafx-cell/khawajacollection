/**
 * Choose a new password, after arriving from the emailed link.
 * docs/BUILD-SPEC.pdf Phase 8 item 5. noindex per Section 7.
 *
 * HOW THIS PAGE GETS ITS AUTHORITY. The reset link carries a token in the URL
 * fragment. `detectSessionInUrl` (src/lib/supabase/client.ts) consumes it on
 * load and turns it into a real, short-lived session, which is why the form
 * below just calls `updateUser` with no token of its own — by the time it
 * renders, the visitor is already signed in as the account being recovered.
 *
 * So the page waits for the session rather than assuming it. Arriving here
 * directly, without a link, gives no session and the form is never shown;
 * offering it anyway would be a password field that silently does nothing.
 */

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthLink, AuthShell, FormError, SubmitButton } from "@/components/account/AuthShell";
import { Field } from "@/components/forms/Field";
import { inputClass } from "@/components/forms/input-class";
import { updatePassword } from "@/lib/auth/actions";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/auth/schema";
import { useAuth } from "@/lib/auth/session-store";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password | Khawaja Collection" },
      { name: "description", content: "Set a new password for your account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (!done) return;
    // Long enough to read the confirmation, short enough not to feel stuck.
    const timer = setTimeout(() => void navigate({ to: "/account" }), 1500);
    return () => clearTimeout(timer);
  }, [done, navigate]);

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const result = await updatePassword(values.password);
    if (!result.ok) {
      setServerError(result.error ?? "That did not work.");
      return;
    }
    setDone(true);
  }

  if (!ready) {
    return (
      <AuthShell title="Choose a new password">
        <p className="text-sm text-kc-muted">Checking your link…</p>
      </AuthShell>
    );
  }

  if (!user) {
    return (
      <AuthShell
        title="That link is not valid"
        intro="Reset links work once and expire after an hour. Request a fresh one and use it straight away."
      >
        <p className="text-sm">
          <AuthLink href="/forgot-password">Send another link</AuthLink>
        </p>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password changed">
        <p className="text-sm text-kc-charcoal">
          Your new password is saved. Taking you to your account…
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      intro={`Signed in as ${user.email ?? "your account"}.`}
    >
      <FormError message={serverError} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field
          label="New password"
          hint="At least 8 characters."
          error={errors.password?.message}
          required
        >
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass(!!errors.password)}
            {...register("password")}
          />
        </Field>

        <Field label="Confirm password" error={errors.confirm?.message} required>
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass(!!errors.confirm)}
            {...register("confirm")}
          />
        </Field>

        <SubmitButton busy={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save new password"}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
