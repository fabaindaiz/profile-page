#!/usr/bin/env node
/**
 * Copy the build into a folder ready to upload by hand in Cloudflare's dashboard, where
 * wrangler.jsonc does not apply. The host's default then serves `about/index.html` at `/about/`
 * and redirects `/about` there, away from the canonical URL (seen on 2026-10-05); it serves
 * `about.html` at `/about` (ASSUMPTION, from Cloudflare's documentation:
 * docs/research/2026-10-05-site-quality-and-framework.md row 1.3; not yet seen on the host).
 * So each page `<route>/index.html` is written as `<route>.html` (`404/` is dropped: `404.html` is
 * already its copy). Nothing else changes. `npx wrangler deploy` needs none of this.
 *
 *   node tools/export.mjs OUT [DIST]      (after npm run build; OUT must not exist)
 *
 * Locally, `node tools/serve.mjs OUT --port 4300` and `node tools/check-live.mjs
 * http://127.0.0.1:4300` show the export broke nothing; they cannot show the host's default, since
 * the preview serves both layouts alike. After the upload, `node tools/check-live.mjs` shows it.
 */
import { cpSync, existsSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { DEFAULT_DIST } from './serve.mjs';

const [out, dist = DEFAULT_DIST] = process.argv.slice(2);
const refuse = (msg) => {
  console.error(`export: ${msg}`);
  process.exit(2);
};
if (!out) refuse('name the folder to write');
if (!existsSync(join(dist, 'index.html'))) refuse(`${dist} has no index.html; build first`);
// The 404 page is kept as 404.html only; without it, dropping 404/ would lose it.
if (existsSync(join(dist, '404')) && !existsSync(join(dist, '404.html'))) refuse(`${dist} has 404/ but no 404.html; build with npm run build`);
if (existsSync(out)) refuse(`${out} exists; choose a new folder`);
if (`${resolve(out)}${sep}`.startsWith(`${resolve(dist)}${sep}`)) refuse(`${out} is inside ${dist}; write it elsewhere`);
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
  if (existsSync(`${dirname(page)}.html`)) refuse(`/${route} is both ${route}.html and ${route}/index.html; ${out} is incomplete`);
  renameSync(page, `${dirname(page)}.html`);
  moved.push(`/${route}`);
  if (!readdirSync(dirname(page)).length) rmSync(dirname(page), { recursive: true });
}
rmSync(join(out, '404'), { recursive: true, force: true });
console.log(`export: ${out}, pages written as <route>.html: ${moved.sort().join(', ') || 'none'}`);
