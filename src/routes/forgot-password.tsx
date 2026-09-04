/**
 * Request a password reset link. docs/BUILD-SPEC.pdf Phase 8 item 5.
 * noindex per Section 7.
 *
 * The confirmation is identical whether or not an account exists — see the
 * note in src/lib/auth/actions.ts. A form that says "no account with that
 * email" is a free membership check for anyone holding a list of addresses,
 * and the customer who genuinely mistyped their address is helped just as well
 * by "if that address has an account, the link is on its way".
 */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";

import { AuthLink, AuthShell, FormError, SubmitButton } from "@/components/account/AuthShell";
import { Field } from "@/components/forms/Field";
import { inputClass } from "@/components/forms/input-class";
import { requestPasswordReset } from "@/lib/auth/actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/auth/schema";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password | Khawaja Collection" },
      { name: "description", content: "Request a password reset link." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/forgot-password" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const result = await requestPasswordReset(values.email);
    // Only a misconfigured deployment produces an error here.
    if (!result.ok) {
      setServerError(result.error ?? "That did not work.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Check your inbox">
        <div className="flex gap-4 border border-kc-line bg-kc-white p-5">
          <MailCheck className="h-5 w-5 shrink-0 text-kc-gold" aria-hidden="true" />
          <p className="text-sm text-kc-charcoal">
            If that address has an account, a reset link is on its way. It works once and expires
            after an hour.
          </p>
        </div>
        <p className="mt-6 text-sm">
          <AuthLink href="/login">Back to sign in</AuthLink>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      intro="Enter the email address on your account and we will send you a link."
      footer={
        <p className="text-kc-charcoal">
          Remembered it? <AuthLink href="/login">Sign in</AuthLink>
        </p>
      }
    >
      <FormError message={serverError} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Email" error={errors.email?.message} required>
          <input
            type="email"
            autoComplete="email"
            className={inputClass(!!errors.email)}
            {...register("email")}
          />
        </Field>

        <SubmitButton busy={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
