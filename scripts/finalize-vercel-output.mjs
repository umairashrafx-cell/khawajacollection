/**
 * Completes the Vercel Build Output after `vite build`.
 *
 * WHY THIS EXISTS
 * On Vercel, nitro correctly targets the `vercel` preset and emits
 * `.vercel/output/functions/__server.func` plus the prerendered static tree.
 * But the two small JSON files that make that tree a *valid* Build Output API
 * v3 deployment never arrive:
 *
 *   .vercel/output/config.json                        — the routing table
 *   .vercel/output/functions/__server.func/.vc-config.json — the function config
 *
 * Nitro writes both into its own output directory; the Lovable vite config
 * relocates `functions/` and `static/` into `.vercel/output` afterwards and
 * does not carry the config files across. Without them Vercel has a function
 * it cannot invoke and no routes, so every request falls through to a
 * platform-level 404 — which is exactly what khawajacollection.com served.
 *
 * This script writes only those two files. It touches nothing else, and it
 * exits quietly when there is no `.vercel/output`, so a Cloudflare or local
 * build is unaffected.
 *
 * Remove it once the upstream relocation carries the config through.
 */

import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUTPUT_DIR = ".vercel/output";
const FUNCTION_DIR = join(OUTPUT_DIR, "functions", "__server.func");

if (!existsSync(OUTPUT_DIR)) {
  console.log("[vercel] no .vercel/output — not a Vercel build, nothing to finalize.");
  process.exit(0);
}

if (!existsSync(join(FUNCTION_DIR, "index.mjs"))) {
  console.error(`[vercel] expected a handler at ${FUNCTION_DIR}/index.mjs but found none.`);
  process.exit(1);
}

/**
 * Vercel runs the build on the same Node major it gives the function, so
 * deriving it here is right on Vercel — but a local build on a version Vercel
 * does not offer would emit a runtime that fails to deploy. Fall back to the
 * current LTS in that case.
 */
const SUPPORTED_NODE_RUNTIMES = new Set(["18", "20", "22"]);
const nodeMajor = process.versions.node.split(".")[0] ?? "22";
const runtime = `nodejs${SUPPORTED_NODE_RUNTIMES.has(nodeMajor) ? nodeMajor : "22"}.x`;

/** Matches the config nitro's own vercel preset generates for this handler. */
const functionConfig = {
  runtime,
  handler: "index.mjs",
  launcherType: "Nodejs",
  shouldAddHelpers: false,
  supportsResponseStreaming: true,
};

writeFileSync(
  join(FUNCTION_DIR, ".vc-config.json"),
  `${JSON.stringify(functionConfig, null, 2)}\n`,
);

/**
 * Static first, then everything else to the SSR function.
 *
 * `handle: filesystem` is what lets the 87 prerendered pages be served as
 * static files while /cart, /api/* and any product page that was not
 * prerendered still reach the server.
 */
const routingConfig = {
  version: 3,
  routes: [
    // Hashed build assets are immutable; everything else revalidates normally.
    {
      src: "/assets/(.*)",
      headers: { "cache-control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/__server" },
  ],
};

writeFileSync(join(OUTPUT_DIR, "config.json"), `${JSON.stringify(routingConfig, null, 2)}\n`);

const staticDir = join(OUTPUT_DIR, "static");
const staticEntries = existsSync(staticDir) ? readdirSync(staticDir).length : 0;

console.log(
  `[vercel] wrote config.json and .vc-config.json ` +
    `(runtime ${functionConfig.runtime}, ${staticEntries} static entries).`,
);
