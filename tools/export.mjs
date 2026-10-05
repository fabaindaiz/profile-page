#!/usr/bin/env node
/**
 * Copy the build into a folder ready to upload by hand in Cloudflare's dashboard, where
 * wrangler.jsonc does not apply. The host's default then serves `about/index.html` at `/about/`
 * and redirects `/about` there, away from the canonical URL; it serves `about.html` at `/about`.
 * So each page `<route>/index.html` is written as `<route>.html` (`404/` is dropped: `404.html` is
 * already its copy). Nothing else changes. `npx wrangler deploy` needs none of this.
 *
 *   node tools/export.mjs OUT [DIST]      (after npm run build; OUT must not exist)
 *
 * Check the result as served: `node tools/serve.mjs OUT --port 4300`, then
 * `node tools/check-live.mjs http://127.0.0.1:4300`.
 */
import { cpSync, existsSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { DEFAULT_DIST } from './serve.mjs';

const [out, dist = DEFAULT_DIST] = process.argv.slice(2);
if (!out) {
  console.error('export: name the folder to write');
  process.exit(2);
}
if (!existsSync(join(dist, 'index.html'))) {
  console.error(`export: ${dist} has no index.html; build first`);
  process.exit(2);
}
if (existsSync(out)) {
  console.error(`export: ${out} exists; choose a new folder`);
  process.exit(2);
}
cpSync(dist, out, { recursive: true });

function pages(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? pages(p) : n === 'index.html' && dir !== out ? [p] : [];
  });
}
const moved = [];
for (const page of pages(out)) {
  const route = relative(out, dirname(page)).split(sep).join('/');
  if (route === '404') continue;
  renameSync(page, `${dirname(page)}.html`);
  moved.push(`/${route}`);
  if (!readdirSync(dirname(page)).length) rmSync(dirname(page), { recursive: true });
}
rmSync(join(out, '404'), { recursive: true, force: true });
console.log(`export: ${out}, pages written as <route>.html: ${moved.sort().join(', ') || 'none'}`);
