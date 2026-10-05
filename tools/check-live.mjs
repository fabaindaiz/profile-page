#!/usr/bin/env node
/**
 * Check a deployed copy of the site against what the build promised, with read-only requests:
 *
 * - every URL in its sitemap.xml answers 200 at exactly that path, with no redirect, and names
 *   itself as its canonical URL;
 * - the same path asked for with a trailing slash redirects to it (`drop-trailing-slash`);
 * - an unknown path answers 404 with the 404 page, which carries `noindex` (`404-page`);
 * - the headers `public/_headers` sets for every path arrive on a page and on the 404;
 * - a hashed file is cached as `immutable`, and its Cache-Control was not joined to the host's
 *   default (one `max-age`, no `must-revalidate`);
 * - with `--apex <origin>`, another host redirects to the site's root (the site has none today:
 *   it is served at its address only, d-115f49-a0fe6e).
 *
 *   node tools/check-live.mjs [ORIGIN] [--apex ORIGIN]
 *
 * ORIGIN defaults to the site's address (src/content/site.json); give a local one to check
 * `npm run preview`. Run by hand after a deploy (i-115f49-90d836): not in CI, which would then
 * depend on production. Not seen: how a browser caches on a repeat visit.
 */
import { readFileSync } from 'node:fs';

const SITE = JSON.parse(readFileSync(new URL('../src/content/site.json', import.meta.url), 'utf8')).url;
const args = process.argv.slice(2);
const apexAt = args.indexOf('--apex');
const apex = apexAt >= 0 ? args[apexAt + 1] : null;
const origin = (args.find((a, i) => !a.startsWith('--') && (apexAt < 0 || i !== apexAt + 1)) ?? SITE).replace(/\/$/, '');

const failures = [];
const fail = (msg) => failures.push(msg);
const get = (path, base = origin) => fetch(`${base}${path}`, { redirect: 'manual' });

/** The headers `public/_headers` sets on `/*`, lower-cased, without the CSP's filled-in hashes. */
function everyPathHeaders() {
  const lines = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8').split('\n');
  const start = lines.findIndex((l) => l.trim() === '/*');
  const headers = {};
  for (const line of lines.slice(start + 1)) {
    if (!/^\s+\S/.test(line)) break;
    const at = line.indexOf(':');
    headers[line.slice(0, at).trim().toLowerCase()] = line.slice(at + 1).trim();
  }
  return headers;
}
const EXPECTED = everyPathHeaders();

function checkHeaders(label, res) {
  for (const [name, value] of Object.entries(EXPECTED)) {
    const got = res.headers.get(name);
    if (got === null) fail(`${label}: no ${name} header`);
    else if (name === 'content-security-policy') {
      const [before, after] = value.split('SCRIPT_HASHES');
      if (!got.startsWith(before.trim()) || !got.endsWith(after.trim())) fail(`${label}: ${name} is not the one _headers sets`);
    } else if (got !== value) fail(`${label}: ${name} is "${got}", _headers sets "${value}"`);
  }
}

const sitemap = await get('/sitemap.xml');
if (sitemap.status !== 200) {
  fail(`/sitemap.xml answers ${sitemap.status}`);
} else {
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) fail('/sitemap.xml lists no URL');
  for (const url of urls) {
    const path = new URL(url).pathname;
    const res = await get(path);
    if (res.status !== 200) {
      fail(`${path} answers ${res.status}${res.headers.get('location') ? ` → ${res.headers.get('location')}` : ''}, not 200`);
      continue;
    }
    const canonical = (await res.text()).match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0].match(/href="([^"]*)"/)?.[1];
    if (canonical !== url) fail(`${path}: canonical is ${canonical ?? 'missing'}, the sitemap says ${url}`);
    if (path === '/') {
      checkHeaders('/', res);
    } else {
      const slashed = await get(`${path}/`);
      const to = slashed.headers.get('location');
      if (![301, 302, 307, 308].includes(slashed.status) || new URL(to ?? '', `${origin}/`).pathname !== path) {
        fail(`${path}/ answers ${slashed.status}${to ? ` → ${to}` : ''}, not a redirect to ${path}`);
      }
    }
  }
}

const home = await (await get('/')).text();
const missing = await get(`/check-live-${Date.now()}`);
const missingBody = await missing.text();
if (missing.status !== 404) fail(`an unknown path answers ${missing.status}, not 404`);
if (!/<meta name="robots" content="noindex">/.test(missingBody)) fail('the 404 response is not the noindex 404 page');
checkHeaders('the 404', missing);

const hashed = home.match(/\bsrc="\/?([^"]*-[A-Z0-9]{8}\.js)"/)?.[1];
if (!hashed) {
  fail('the home page names no hashed script');
} else {
  const cache = (await get(`/${hashed}`)).headers.get('cache-control') ?? '';
  if (!/\bimmutable\b/.test(cache) || (cache.match(/max-age/g) ?? []).length !== 1 || /must-revalidate/.test(cache)) {
    fail(`/${hashed}: Cache-Control is "${cache}", not one immutable rule`);
  }
}

if (apex) {
  const res = await get('/', apex.replace(/\/$/, ''));
  const to = res.headers.get('location');
  if (![301, 302, 307, 308].includes(res.status) || new URL(to ?? '', `${apex}/`).href !== `${SITE}/`) {
    fail(`${apex}/ answers ${res.status}${to ? ` → ${to}` : ''}, not a redirect to ${SITE}/`);
  }
}

for (const f of failures) console.log(`FAIL      check-live: ${f}`);
console.log(`check-live: ${origin}, ${failures.length} failure(s)`);
process.exit(failures.length ? 1 : 0);
