import { Link } from "@tanstack/react-router";

export default function SectionHeader({ eyebrow, title, to, linkLabel = "View all" }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
        )}
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl">{title}</h2>
      </div>
      {to && (
        <Link
          to={to}
          className="shrink-0 border-b border-foreground pb-1 text-[11px] uppercase tracking-[0.2em]"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
