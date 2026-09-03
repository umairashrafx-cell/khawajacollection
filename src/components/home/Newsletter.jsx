import { useState } from "react";
import { toast } from "sonner";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setEmail("");
    toast.success("You're on the list", { description: "Look out for first access to new edits." });
  };

  return (
    <section className="bg-sand">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center lg:py-20">
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">The KC List</p>
        <h2 className="mt-3 font-serif text-2xl sm:text-3xl">
          First access to new edits and private sales
        </h2>
        <form onSubmit={submit} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
          />
          <button
            type="submit"
            className="bg-foreground px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-background"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
