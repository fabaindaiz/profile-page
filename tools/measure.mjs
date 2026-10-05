#!/usr/bin/env node
/**
 * Measure what a first visit to each page of the built site costs: requests and bytes, by origin.
 *
 * Serves a build folder the way the target host does (a path is served from `<path>/index.html`,
 * `<path>.html` or the file itself, with no trailing-slash redirect), opens every page in a
 * headless Chromium with an empty cache, and counts every request the page makes until the
 * network is idle. A request to another origin is counted and fetched for real.
 *
 *   node tools/measure.mjs [DIST] [--json] [--budget N] [--spa --routes /,/about,...]
 *
 * --spa serves `index.html` for any path that is not a file, as a single-page host does (the
 * baseline, before every route was prerendered); --routes then names the pages to open.
 *
 * With --budget N it exits 1 when any page makes more than N requests to its own origin, or any
 * request to another origin. Needs Playwright's Chromium (`npx playwright install chromium`).
 */
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, sep } from 'node:path';

const args = process.argv.slice(2);
const json = args.includes('--json');
const budgetAt = args.indexOf('--budget');
const budget = budgetAt >= 0 ? Number(args[budgetAt + 1]) : null;
const spa = args.includes('--spa');
const routesAt = args.indexOf('--routes');
const routes = routesAt >= 0 ? args[routesAt + 1].split(',') : null;
const skip = new Set([budgetAt + 1, routesAt + 1].filter((i) => i > 0));
const dist = args.find((a, i) => !a.startsWith('--') && !skip.has(i)) ?? 'dist/profile-page/browser';

if (!existsSync(dist)) {
  console.error(`measure: ${dist} does not exist; build first`);
  process.exit(2);
}

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain', '.xml': 'application/xml',
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]).replace(/\/+$/, '') || '/';
  const base = join(dist, clean);
  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every page the build wrote: each `index.html`, by the URL it is served at. */
function pages(dir = dist) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return pages(p);
    if (name !== 'index.html') return [];
    const route = `/${relative(dist, join(p, '..')).split(sep).join('/')}`.replace(/\/$/, '') || '/';
    return [route === '/.' ? '/' : route];
  });
}

const server = createServer((req, res) => {
  const file = resolveFile(req.url) ?? (spa && !extname(req.url.split(/[?#]/)[0]) ? join(dist, 'index.html') : null);
  const notFound = join(dist, '404.html');
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/html' });
    return existsSync(notFound) ? createReadStream(notFound).pipe(res) : res.end('not found');
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const origin = `http://127.0.0.1:${server.address().port}`;
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
const results = [];

try {
  for (const route of routes ?? pages().sort()) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const requests = [];
    page.on('requestfinished', async (request) => {
      const sizes = await request.sizes().catch(() => ({ responseBodySize: 0, responseHeadersSize: 0 }));
      const url = new URL(request.url());
      requests.push({
        url: url.origin === origin ? url.pathname : request.url(),
        own: url.origin === origin,
        type: request.resourceType(),
        bytes: sizes.responseBodySize + sizes.responseHeadersSize,
      });
    });
    page.on('requestfailed', (request) => requests.push({ url: request.url(), own: false, type: 'failed', bytes: 0 }));
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    await context.close();
    const own = requests.filter((r) => r.own);
    results.push({
      route,
      requests: requests.length,
      own: own.length,
      thirdParty: requests.length - own.length,
      kib: Math.round(requests.reduce((s, r) => s + r.bytes, 0) / 1024),
      detail: requests,
    });
  }
} finally {
  await browser.close();
  server.close();
}

if (json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log('route'.padEnd(28) + 'requests  own  third-party  KiB');
  for (const r of results) {
    console.log(`${r.route.padEnd(28)}${String(r.requests).padStart(8)}  ${String(r.own).padStart(3)}  ${String(r.thirdParty).padStart(11)}  ${String(r.kib).padStart(5)}`);
  }
}

if (budget !== null) {
  const over = results.filter((r) => r.own > budget || r.thirdParty > 0);
  for (const r of over) console.error(`measure: ${r.route} makes ${r.own} own and ${r.thirdParty} third-party requests (budget ${budget}, none third-party)`);
  process.exit(over.length ? 1 : 0);
}
