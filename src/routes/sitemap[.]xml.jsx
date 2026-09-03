import { createFileRoute } from "@tanstack/react-router";
import { allProducts } from "@/services/catalogService";
import { categories } from "@/data/legacy/categories";

function buildXml(origin) {
  const urls = [
    "/",
    "/track-order",
    ...categories.flatMap((c) => [
      `/category/${c.slug}`,
      ...c.children.map((s) => `/category/${s.slug}`),
    ]),
    ...allProducts().map((p) => `/product/${p.slug}`),
  ];
  const body = urls
    .map((u) => `  <url><loc>${origin}${u}</loc><changefreq>weekly</changefreq></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const host = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
        const origin = host ? `https://${host}` : url.origin;
        return new Response(buildXml(origin), {
          headers: { "Content-Type": "application/xml" },
        });
      },
    },
  },
});
