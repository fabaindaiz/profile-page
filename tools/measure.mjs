#!/usr/bin/env node
/**
 * Measure what a first visit to each page of the built site costs: requests and bytes, by origin.
 *
 * Serves a build folder the way the target host does (tools/serve.mjs), opens every page in a
 * headless Chromium with an empty cache, and counts every request the page makes until the
 * network is idle. A request to another origin is counted and fetched for real.
 *
 *   node tools/measure.mjs [DIST] [--json] [--budget N] [--spa --routes /,/about,...]
 *
 * --spa serves `index.html` for any path that is not a file, as a single-page host does (the
 * baseline, before every route was prerendered); --routes then names the pages to open.
 *
 * With --budget N it exits 1 when any page makes more than N requests to its own origin besides
 * images (the HTML, scripts, styles and fonts every visit pays for), or any request to another
 * origin. Images are counted and reported, not budgeted: they are content, and load lazily. Needs Playwright's Chromium (`npx playwright install chromium`).
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DEFAULT_DIST, siteServer } from './serve.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const budgetAt = args.indexOf('--budget');
const budget = budgetAt >= 0 ? Number(args[budgetAt + 1]) : null;
const spa = args.includes('--spa');
const routesAt = args.indexOf('--routes');
const routes = routesAt >= 0 ? args[routesAt + 1].split(',') : null;
const skip = new Set([budgetAt + 1, routesAt + 1].filter((i) => i > 0));
const dist = args.find((a, i) => !a.startsWith('--') && !skip.has(i)) ?? DEFAULT_DIST;

if (!existsSync(dist)) {
  console.error(`measure: ${dist} does not exist; build first`);
  process.exit(2);
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

const server = siteServer(dist, { spa });

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
  const fixed = (r) => r.detail.filter((d) => d.own && d.type !== 'image').length;
  const over = results.filter((r) => fixed(r) > budget || r.thirdParty > 0);
  for (const r of over) console.error(`measure: ${r.route} makes ${fixed(r)} own non-image and ${r.thirdParty} third-party requests (budget ${budget}, none third-party)`);
  process.exit(over.length ? 1 : 0);
}
