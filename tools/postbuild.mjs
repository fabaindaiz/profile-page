#!/usr/bin/env node
/**
 * After the build, make the static output ready for the host (Cloudflare static assets):
 *
 * 1. Copy the prerendered /404 page to 404.html, which the host serves with status 404 for any URL
 *    that is not a file (`not_found_handling: "404-page"` in wrangler.jsonc).
 * 2. Fill SCRIPT_HASHES in _headers (copied from public/) with the sha256 of every inline script in
 *    the built HTML, so the Content-Security-Policy allows exactly those and no other inline script.
 * 3. Append one rule per file whose name carries a content hash, caching it for a year as
 *    `immutable`; everything else keeps the host's default (revalidate every time). A pattern per
 *    exact file name, because the host allows only one splat per pattern.
 * 4. Write sitemap.xml, listing every prerendered page that is not `noindex` at the site's address
 *    (src/content/site.json), and robots.txt, which names it. No `lastmod`: search engines use it
 *    only when it is accurate, and nothing here knows when a page's content last changed.
 *
 *   node tools/postbuild.mjs [DIST]      (npm run build runs it)
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dist = process.argv[2] ?? 'dist/profile-page/browser';
const fail = (msg) => {
  console.error(`postbuild: ${msg}`);
  process.exit(1);
};

const SITE = JSON.parse(readFileSync(new URL('../src/content/site.json', import.meta.url), 'utf8')).url;

const notFound = join(dist, '404', 'index.html');
if (!existsSync(notFound)) fail(`${notFound} was not prerendered; is the /404 route still there?`);
copyFileSync(notFound, join(dist, '404.html'));

function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}
const all = files(dist).map((p) => relative(dist, p).split(sep).join('/'));

// Inline scripts: any <script> without src whose type is executable (JSON data is never run).
const hashes = new Set();
for (const page of all.filter((p) => p.endsWith('.html'))) {
  for (const [, attrs, body] of readFileSync(join(dist, page), 'utf8').matchAll(/<script\b([^>]*)>([^]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs) || !body) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  }
}

const headersFile = join(dist, '_headers');
if (!existsSync(headersFile)) fail(`${headersFile} missing: public/_headers was not copied`);
let headers = readFileSync(headersFile, 'utf8');
if ((headers.match(/SCRIPT_HASHES/g) ?? []).length !== 1) fail('_headers must hold the SCRIPT_HASHES placeholder exactly once, in script-src');
headers = headers.replace('SCRIPT_HASHES', [...hashes].sort().join(' '));

const hashed = all.filter((p) => /-[A-Z0-9]{8}\.(js|css|woff2)$/.test(p));
headers += hashed.map((p) => `/${p}\n  Cache-Control: public, max-age=31536000, immutable\n`).join('');
const rules = (headers.match(/^\//gm) ?? []).length;
if (rules > 100) fail(`_headers has ${rules} rules; the host allows 100`);
writeFileSync(headersFile, headers);

const indexable = all
  .filter((p) => p.endsWith('index.html') && !p.endsWith('index.csr.html'))
  .filter((p) => !/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(readFileSync(join(dist, p), 'utf8')))
  .map((p) => `${SITE}/${p.replace(/\/?index\.html$/, '')}`)
  .sort();
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((u) => `  <url><loc>${u}</loc></url>\n`).join('')}</urlset>\n`,
);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`postbuild: 404.html written; sitemap.xml: ${indexable.length} pages; _headers: ${hashes.size} inline script hashes, ${hashed.length} immutable files, ${rules} rules`);
