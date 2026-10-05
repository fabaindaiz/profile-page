#!/usr/bin/env node
/**
 * Check the built site the way a visitor meets it: every internal `href` and `src` in every HTML
 * file of the build resolves to a file the host would serve (tools/serve.mjs's rules), and every
 * `#fragment` names an `id` on the page it points to. This is the pre-ship check for the bug class
 * the sources cannot show (AGENTS.md): it reads the prerendered output, not the templates.
 *
 *   node tools/check-site.mjs [DIST]
 *
 * Not seen: navigation done by script without an `href`, and ids added after the page loads.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DEFAULT_DIST, resolveFile } from './serve.mjs';

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

for (const f of failures) console.log(`FAIL      check-site: ${f}`);
console.log(`check-site: ${pages.length} pages, ${links} internal links, ${failures.length} broken`);
process.exit(failures.length ? 1 : 0);
