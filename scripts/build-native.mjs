#!/usr/bin/env node
/**
 * Builds the bundled native shell for Capacitor.
 *
 * The website is server-rendered, so the normal build has no index.html. The
 * native app cannot ask a server for anything at launch, so we produce a
 * static entry document that boots the client bundle straight from the device
 * and copy the whole client build into `native/www`.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const clientDir = join(root, "dist", "client");
const outDir = join(root, "native", "www");

console.log("> building web client…");
execSync("npx vite build", { stdio: "inherit", env: { ...process.env, NATIVE_BUILD: "1" } });

const assets = readdirSync(join(clientDir, "assets"));
const entry = assets.find((f) => /^client-.*\.js$/.test(f));
const css = assets.filter((f) => f.endsWith(".css"));
if (!entry) throw new Error("Could not find the client entry chunk in dist/client/assets");

const html = `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>SmartyMove</title>
${css.map((f) => `    <link rel="stylesheet" href="/assets/${f}" />`).join("\n")}
  </head>
  <body>
    <script type="module" src="/assets/${entry}"></script>
  </body>
</html>
`;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(clientDir, outDir, { recursive: true });
// A service worker is pointless inside a bundled app and can pin stale files.
for (const f of ["sw.js", "sw-extra.js"]) {
  const p = join(outDir, f);
  if (existsSync(p)) rmSync(p);
}
writeFileSync(join(outDir, "index.html"), html);

console.log(`> native shell ready at native/www (entry: ${entry})`);