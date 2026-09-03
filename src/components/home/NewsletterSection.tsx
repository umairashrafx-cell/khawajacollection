/**
 * Newsletter sign-up. See docs/BUILD-SPEC.pdf Section 11.1 item 11.
 *
 * Posts to /api/newsletter. Result is announced through an aria-live region
 * rather than a toast alone (Section 15), and the error is tied to the input
 * with aria-describedby and rendered as text, not just a red border.
 */

import { useState } from "react";

import { newsletter } from "@/config/home";

type Status = "idle" | "submitting" | "done" | "error";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.error ?? "That did not go through. Please try again.");
        return;
      }

      setStatus("done");
      setMessage("Thank you. You are on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("That did not go through. Please try again.");
    }
  }

  return (
    <section className="bg-kc-sand">
      <div className="mx-auto max-w-[1440px] px-4 py-14 text-center md:px-6 md:py-20 lg:px-10">
        <p className="kc-eyebrow text-kc-muted">{newsletter.eyebrow}</p>
        <h2 className="mt-3 font-display text-[26px] leading-tight text-kc-ink md:text-[36px]">
          {newsletter.headline}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-kc-charcoal">{newsletter.body}</p>

        <form onSubmit={onSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your email address"
            aria-describedby="newsletter-privacy newsletter-status"
            aria-invalid={status === "error"}
            className="min-h-11 flex-1 border border-kc-line bg-kc-white px-4 text-sm text-kc-ink placeholder:text-kc-muted"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="min-h-11 bg-kc-ink px-7 text-[12px] font-medium uppercase tracking-[0.08em] text-kc-paper transition-colors hover:bg-kc-charcoal disabled:opacity-60"
          >
            {status === "submitting" ? "Sending" : newsletter.cta}
          </button>
        </form>

        <p
          id="newsletter-status"
          role="status"
          aria-live="polite"
          className={`mt-3 min-h-5 text-sm ${status === "error" ? "text-kc-sale" : "text-kc-success"}`}
        >
          {message}
        </p>

        <p id="newsletter-privacy" className="mt-1 text-xs text-kc-muted">
          {newsletter.privacy}
        </p>
      </div>
    </section>
  );
}
