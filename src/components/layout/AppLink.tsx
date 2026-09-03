/**
 * A TanStack `Link` that takes a plain `href` string.
 *
 * `src/config/nav.ts` is data, and much of what it points at — `/women`,
 * `/bridal`, `/collections/$slug` — is a Phase 4/5 route that does not exist
 * yet. TanStack types `to` against the generated route tree, so those links
 * would not compile. This wrapper is the single, documented place where that
 * type is widened; when the routes land, nothing here needs to change.
 *
 * Until then a link to an unbuilt route renders the root 404, which is the
 * correct behaviour for a half-built site.
 */

import { Link } from "@tanstack/react-router";
import type { ComponentProps, ComponentType, ReactNode } from "react";

type BaseLinkProps = Omit<ComponentProps<typeof Link>, "to" | "params" | "search" | "children">;

export interface AppLinkProps extends BaseLinkProps {
  href: string;
  children?: ReactNode;
}

const AnyLink = Link as unknown as ComponentType<Omit<AppLinkProps, "href"> & { to: string }>;

export function AppLink({ href, children, ...rest }: AppLinkProps) {
  return (
    <AnyLink {...rest} to={href}>
      {children}
    </AnyLink>
  );
}
