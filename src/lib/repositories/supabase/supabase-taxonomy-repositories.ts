/**
 * The taxonomy, read from Postgres.
 *
 * WHY THIS EXISTS NOW AND NOT IN PHASE 8. Categories were the one part of the
 * catalogue still served from `src/data/categories.ts` under both repository
 * settings, and that was fine while the taxonomy only changed when someone
 * edited a file and deployed. It stops being fine the moment the admin can
 * create a category: a row written to Postgres that the site never reads is
 * not a feature, it is a lie on a form.
 *
 * READS USE THE ANON KEY. 0002_rls.sql makes the whole taxonomy publicly
 * readable — a category name is on the nav of every page — so nothing here
 * needs privilege. Writing is the opposite: there is no write policy at all,
 * so `saveCategory` goes through the service role, exactly like `saveProduct`.
 *
 * ONE CACHE, DELIBERATELY. Every page load asks for the tree (breadcrumbs,
 * the PLP header, the sitemap), and the taxonomy changes about as often as a
 * deployment. Reading fifteen rows on every request would be a needless round
 * trip on the critical path, so the list is held for a minute and dropped
 * whenever `saveCategory` writes. A minute is short enough that a shopkeeper
 * who adds a category sees it on the next page, and long enough that the
 * common case costs nothing.
 */

import { browserClient, serviceClient } from "@/lib/supabase/client";
import type { Category } from "@/types";
import type { CategoryInput, CategoryNode, CategoryRepository } from "../product-repository";

interface Row {
  slug: string;
  name: string;
  parent_slug: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
}

const SELECT = "slug, name, parent_slug, description, image_url, sort_order";

/** Category cards are 4:5 everywhere they appear (Section 6.4). */
const CARD_WIDTH = 960;
const CARD_HEIGHT = 1200;

function toCategory(row: Row): Category {
  return {
    slug: row.slug,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    ...(row.parent_slug ? { parentSlug: row.parent_slug } : {}),
    ...(row.image_url
      ? {
          image: {
            url: row.image_url,
            // The table stores a URL and nothing else, so the alt is composed
            // rather than read. An empty alt on a category card is a Section 15
            // failure, and "Bedsheets" is what a person would say out loud.
            alt: row.name,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          },
        }
      : {}),
    sortOrder: row.sort_order ?? 0,
  };
}

const TTL = 60_000;

let cache: { at: number; items: Category[] } | null = null;

export class SupabaseCategoryRepository implements CategoryRepository {
  async list(): Promise<Category[]> {
    if (cache && Date.now() - cache.at < TTL) return cache.items;

    const { data, error } = await (
      await browserClient()
    )
      .from("categories")
      .select(SELECT)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(`Supabase category query failed: ${error.message}`);

    const items = ((data ?? []) as Row[]).map(toCategory);
    cache = { at: Date.now(), items };
    return items;
  }

  async tree(): Promise<CategoryNode[]> {
    const all = await this.list();
    const bySort = (a: Category, b: Category) => a.sortOrder - b.sortOrder;
    return all
      .filter((category) => category.parentSlug == null)
      .sort(bySort)
      .map((parent) => ({
        ...parent,
        children: all.filter((child) => child.parentSlug === parent.slug).sort(bySort),
      }));
  }

  async getBySlug(slug: string): Promise<Category | null> {
    const all = await this.list();
    return all.find((category) => category.slug === slug) ?? null;
  }

  /** `/women/unstitched` → the category whose slug is `women-unstitched`. */
  async getSubcategory(parentSlug: string, segment: string): Promise<Category | null> {
    const all = await this.list();
    const slug = `${parentSlug}-${segment}`;
    return all.find((c) => c.slug === slug && c.parentSlug === parentSlug) ?? null;
  }

  /**
   * Create or rename a category. Service role: 0002_rls.sql gives the taxonomy
   * no write policy, for the same reason the catalogue has none.
   *
   * THE SLUG IS NEVER CHANGED BY AN EDIT. It is the primary key, it is in the
   * URL of the listing page, and `products.category_slug` points at it — so
   * moving it would 404 the page and orphan every product on it at once. An
   * edit therefore only ever touches name, description and order, and the API
   * refuses a slug that does not match the row being edited.
   */
  async saveCategory(input: CategoryInput): Promise<Category> {
    const supabase = await serviceClient();

    const { data, error } = await supabase
      .from("categories")
      .upsert(
        {
          slug: input.slug,
          name: input.name,
          parent_slug: input.parentSlug,
          description: input.description,
          image_url: input.imageUrl,
          sort_order: input.sortOrder,
        },
        { onConflict: "slug" },
      )
      .select(SELECT)
      .maybeSingle();

    if (error || !data) {
      if (error?.message.includes("categories_parent_slug_fkey")) {
        throw new Error("That parent category does not exist.");
      }
      throw new Error(`Could not save the category: ${error?.message ?? "no row returned"}`);
    }

    // The list is now wrong in every isolate that holds it, but only this one
    // can be told. The TTL covers the rest, which is why it is a minute.
    cache = null;

    return toCategory(data as Row);
  }
}
