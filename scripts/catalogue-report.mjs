/**
 * Prints a summary of the mock catalogue and exercises the repository.
 *
 *   node scripts/catalogue-report.mjs
 *
 * Loads the TypeScript data layer through Vite's SSR pipeline, so the `@/`
 * alias and the project's own config apply and no extra tooling is needed.
 * Useful as a smoke test after editing src/data/products.ts.
 */

import { createServer } from "vite";

const server = await createServer({
  configFile: "vite.config.ts",
  server: { middlewareMode: true },
  logLevel: "error",
});

try {
  const { productRepository, categoryRepository } = await server.ssrLoadModule(
    "/src/lib/repositories/index.ts",
  );
  const { formatPKR } = await server.ssrLoadModule("/src/lib/format.ts");

  const all = await productRepository.list({ perPage: 1000 });
  const products = all.items;

  const pct = (n) => `${Math.round((n / products.length) * 100)}%`;
  const count = (fn) => products.filter(fn).length;

  console.log(`\nCATALOGUE — ${products.length} products\n${"=".repeat(78)}`);
  console.log(
    `on sale ${count((p) => p.isOnSale)} (${pct(count((p) => p.isOnSale))})  ` +
      `new ${count((p) => p.isNewArrival)} (${pct(count((p) => p.isNewArrival))})  ` +
      `best sellers ${count((p) => p.isBestSeller)} (${pct(count((p) => p.isBestSeller))})  ` +
      `featured ${count((p) => p.isFeatured)}  ` +
      `made to order ${count((p) => p.isMadeToOrder)}`,
  );
  console.log(
    `variants ${products.reduce((n, p) => n + p.variants.length, 0)}  ` +
      `images ${products.reduce((n, p) => n + p.images.length, 0)}  ` +
      `out-of-stock variants ${products.reduce(
        (n, p) => n + p.variants.filter((v) => v.stock === 0).length,
        0,
      )}`,
  );

  const tree = await categoryRepository.tree();
  console.log(`\ncategories: ${tree.map((c) => `${c.name}(${c.children.length})`).join("  ")}\n`);

  /* --- 5 sample products ------------------------------------------------ */
  const pad = (v, n) => String(v).padEnd(n).slice(0, n);
  console.log("SAMPLE PRODUCTS");
  console.log(
    pad("SLUG", 40) + pad("SUBCATEGORY", 22) + pad("PRICE", 12) + pad("SALE", 12) + "SIZES",
  );
  console.log("-".repeat(110));
  for (const p of [products[0], products[12], products[24], products[31], products[44]]) {
    console.log(
      pad(p.slug, 40) +
        pad(p.subcategorySlug, 22) +
        pad(formatPKR(p.price), 12) +
        pad(p.salePrice ? formatPKR(p.salePrice) : "—", 12) +
        [...new Set(p.variants.map((v) => v.size))].join("/"),
    );
  }

  /* --- 3 example queries ------------------------------------------------ */
  const show = async (label, query) => {
    const { items, total, facets } = await productRepository.list(query);
    console.log(`\n${label}`);
    console.log(`  query   ${JSON.stringify(query)}`);
    console.log(`  matched ${total}, showing ${items.length}`);
    for (const p of items.slice(0, 5)) {
      const price = p.salePrice
        ? `${formatPKR(p.salePrice)} (was ${formatPKR(p.price)})`
        : formatPKR(p.price);
      console.log(`    ${pad(p.name, 46)} ${price}`);
    }
    return facets;
  };

  console.log(`\n${"=".repeat(78)}\nEXAMPLE QUERIES`);

  const f1 = await show("1. Filter by size — women, sizes M and L, in stock only", {
    category: "women",
    sizes: ["M", "L"],
    inStockOnly: true,
    perPage: 5,
  });
  console.log(
    `  live facets: colours ${f1.colors
      .slice(0, 4)
      .map((c) => `${c.label}(${c.count})`)
      .join(" ")}`,
  );

  await show("2. Sort by price ascending — everything on sale", {
    onSale: true,
    sort: "price-asc",
    perPage: 5,
  });

  const f3 = await show('3. Text search — "embroidered lawn 3"', {
    q: "embroidered lawn 3",
    perPage: 5,
  });
  console.log(
    `  price range in results: ${formatPKR(f3.priceRange.min)} – ${formatPKR(f3.priceRange.max)}`,
  );

  console.log("");
} finally {
  await server.close();
}
