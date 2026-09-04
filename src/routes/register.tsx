/**
 * Create an account. docs/BUILD-SPEC.pdf Phase 8 item 5. noindex per Section 7.
 *
 * Whether a new account is signed in immediately or has to confirm an email
 * first is a Supabase project setting, not something this page decides. Both
 * outcomes are handled: a session means straight to the account, no session
 * means "check your inbox". Assuming either one would break the moment that
 * setting is toggled.
 */

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";

import { AuthLink, AuthShell, FormError, SubmitButton } from "@/components/account/AuthShell";
import { Field } from "@/components/forms/Field";
import { inputClass } from "@/components/forms/input-class";
import { register as createAccount } from "@/lib/auth/actions";
import { registerSchema, type RegisterInput } from "@/lib/auth/schema";
import { useAuth } from "@/lib/auth/session-store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create an account | Khawaja Collection" },
      { name: "description", content: "Create your Khawaja Collection account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/register" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    // Not while the confirmation notice is showing: signUp can leave a session
    // behind and bouncing away would hide the message the customer needs.
    if (ready && user && !checkInbox) void navigate({ to: "/account" });
  }, [ready, user, checkInbox, navigate]);

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const result = await createAccount(values.email, values.password, values.fullName);

    if (!result.ok) {
      setServerError(result.error ?? "That did not work.");
      return;
    }
    if (result.needsEmailConfirmation) {
      setCheckInbox(true);
      return;
    }
    void navigate({ to: "/account" });
  }

  if (checkInbox) {
    return (
      <AuthShell title="Check your inbox">
        <div className="flex gap-4 border border-kc-line bg-kc-white p-5">
          <MailCheck className="h-5 w-5 shrink-0 text-kc-gold" aria-hidden="true" />
          <p className="text-sm text-kc-charcoal">
            We have sent you a link to confirm your email address. Open it and you will be signed
            in. The link works once and expires after an hour.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create an account"
      intro="Keep your wishlist and your order history in one place."
      footer={
        <p className="text-kc-charcoal">
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </p>
      }
    >
      <FormError message={serverError} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Full name" error={errors.fullName?.message} required>
          <input
            type="text"
            autoComplete="name"
            className={inputClass(!!errors.fullName)}
            {...register("fullName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} required>
          <input
            type="email"
            autoComplete="email"
            className={inputClass(!!errors.email)}
            {...register("email")}
          />
        </Field>

        <Field
          label="Password"
          hint="At least 8 characters. Length matters more than symbols."
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

        <SubmitButton busy={isSubmitting}>
          {isSubmitting ? "Creating your account…" : "Create account"}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
