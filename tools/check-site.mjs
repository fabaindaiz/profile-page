#!/usr/bin/env node
/**
 * Check the built site the way a visitor meets it: every internal `href` and `src` in every HTML
 * file of the build resolves to a file the host would serve (tools/serve.mjs's rules), and every
 * `#fragment` names an `id` on the page it points to. This is the pre-ship check for the bug class
 * the sources cannot show (AGENTS.md): it reads the prerendered output, not the templates. It also
 * checks what tells search engines which pages exist: every indexable page names its own address as
 * its canonical URL, a `noindex` page names none, and sitemap.xml lists exactly the indexable pages,
 * as robots.txt says.
 *
 *   node tools/check-site.mjs [DIST]
 *
 * Not seen: navigation done by script without an `href`, and ids added after the page loads.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DEFAULT_DIST, resolveFile } from './serve.mjs';

const SITE = JSON.parse(readFileSync(new URL('../src/content/site.json', import.meta.url), 'utf8')).url;

const dist = process.argv[2] ?? DEFAULT_DIST;
if (!existsSync(dist)) {
  console.error(`check-site: ${dist} does not exist; build first`);
  process.exit(2);
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? htmlFiles(p) : n.endsWith('.html') ? [p] : [];
  });
}

/** The URL path a page is served at: `about/index.html` -> `/about`, `404.html` -> `/404.html`. */
function urlOf(file) {
  const rel = relative(dist, file).split(sep).join('/');
  return rel === 'index.html' ? '/' : `/${rel.replace(/\/?index\.html$/, '')}`;
}

const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file);
};

const failures = [];
let links = 0;
const pages = htmlFiles(dist).filter((f) => !f.endsWith('index.csr.html'));
for (const file of pages) {
  const page = urlOf(file);
  const html = readFileSync(file, 'utf8');
  // Relative URLs resolve against <base href> when the page declares one, as a browser resolves them.
  const base = html.match(/<base\s+href="([^"]*)"/)?.[1] ?? page.replace(/[^/]*$/, '');
  for (const [, attr, value] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(value)) continue;
    links++;
    const [path, fragment] = value.split('#');
    const absolute = path === '' ? page : path.startsWith('/') ? path : `${base}${path}`;
    const target = resolveFile(dist, absolute);
    if (!target) {
      failures.push(`${page}: ${attr}="${value}" resolves to no file`);
      continue;
    }
    if (fragment && target.endsWith('.html') && !idsOf(target).has(fragment)) {
      failures.push(`${page}: ${attr}="${value}" names #${fragment}, which ${urlOf(target)} has no id for`);
    }
  }
}

// What search engines are told: canonicals, the sitemap, robots.txt.
const indexable = [];
for (const file of pages) {
  const page = urlOf(file);
  const html = readFileSync(file, 'utf8');
  const canonicals = [...html.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/g)].map((m) => m[0].match(/\bhref="([^"]*)"/)?.[1]);
  if (/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html)) {
    if (canonicals.length) failures.push(`${page}: is noindex but names a canonical URL`);
    continue;
  }
  indexable.push(`${SITE}${page}`);
  if (canonicals.length !== 1 || canonicals[0] !== `${SITE}${page}`) {
    failures.push(`${page}: canonical should be ${SITE}${page}, is ${canonicals.length ? canonicals.join(', ') : 'missing'}`);
  }
}
const sitemapFile = join(dist, 'sitemap.xml');
if (!existsSync(sitemapFile)) {
  failures.push('sitemap.xml: missing');
} else {
  const listed = [...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  for (const url of indexable.filter((u) => !listed.includes(u))) failures.push(`sitemap.xml: lacks ${url}`);
  for (const url of listed.filter((u) => !indexable.includes(u))) failures.push(`sitemap.xml: lists ${url}, which is no indexable page`);
}
const robotsFile = join(dist, 'robots.txt');
if (!existsSync(robotsFile) || !readFileSync(robotsFile, 'utf8').includes(`Sitemap: ${SITE}/sitemap.xml`)) {
  failures.push(`robots.txt: missing, or names no Sitemap: ${SITE}/sitemap.xml`);
}

for (const f of failures) console.log(`FAIL      check-site: ${f}`);
console.log(`check-site: ${pages.length} pages, ${links} internal links, ${failures.length} broken`);
process.exit(failures.length ? 1 : 0);
