/**
 * Sign in. docs/BUILD-SPEC.pdf Phase 8 item 5.
 *
 * noindex, like every account page (Section 7). A sign-in form is also the one
 * page on a shop worth impersonating, so keeping it out of search results is
 * worth a line of markup.
 *
 * Redirecting away when a session already exists is handled by an effect
 * rather than a loader on purpose: the session lives in browser storage, so
 * the server that runs loaders cannot see it. See session-store.ts.
 */

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthLink, AuthShell, FormError, SubmitButton } from "@/components/account/AuthShell";
import { safeNext } from "@/lib/auth/safe-next";
import { Field } from "@/components/forms/Field";
import { inputClass } from "@/components/forms/input-class";
import { signIn } from "@/lib/auth/actions";
import { signInSchema, type SignInInput } from "@/lib/auth/schema";
import { useAuth } from "@/lib/auth/session-store";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search["next"] === "string" ? search["next"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in | Khawaja Collection" },
      { name: "description", content: "Sign in to your Khawaja Collection account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const destination = safeNext(next);
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  useEffect(() => {
    if (ready && user) void navigate({ to: destination });
  }, [ready, user, destination, navigate]);

  async function onSubmit(values: SignInInput) {
    setServerError(null);
    const result = await signIn(values.email, values.password);
    if (!result.ok) {
      setServerError(result.error ?? "Sign-in failed.");
      return;
    }
    void navigate({ to: destination });
  }

  return (
    <AuthShell
      title="Sign in"
      intro="Your saved pieces and your order history, on every device you use."
      footer={
        <p className="text-kc-charcoal">
          New here? <AuthLink href="/register">Create an account</AuthLink>
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

        <Field label="Password" error={errors.password?.message} required>
          <input
            type="password"
            autoComplete="current-password"
            className={inputClass(!!errors.password)}
            {...register("password")}
          />
        </Field>

        <SubmitButton busy={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</SubmitButton>

        <p className="text-center text-sm">
          <AuthLink href="/forgot-password">Forgotten your password?</AuthLink>
        </p>
      </form>
    </AuthShell>
  );
}
