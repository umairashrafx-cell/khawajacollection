/**
 * Breadcrumb trail. See docs/BUILD-SPEC.pdf Sections 11.2 and 11.3.
 * The matching BreadcrumbList JSON-LD is emitted by the route's head().
 */

import { ChevronRight } from "lucide-react";

import { AppLink } from "@/components/layout/AppLink";
import type { Crumb } from "@/lib/catalog-page";

export function Breadcrumbs({
  crumbs,
  tone = "default",
}: {
  crumbs: Crumb[];
  tone?: "default" | "inverse";
}) {
  const inverse = tone === "inverse";
  const muted = inverse ? "text-kc-paper/60" : "text-kc-muted";
  const active = inverse ? "text-kc-paper" : "text-kc-ink";

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-xs">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className={`h-3 w-3 ${muted}`} aria-hidden="true" />
              ) : null}
              {last ? (
                <span className={active} aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <AppLink
                  href={crumb.href}
                  // Section 15 wants a 44px target on mobile. The row
                  // itself stays visually compact because the extra
                  // height is centred padding, not a taller line box.
                  className={`${muted} inline-flex min-h-11 min-w-11 items-center hover:underline lg:min-h-0 lg:min-w-0`}
                >
                  {crumb.label}
                </AppLink>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
