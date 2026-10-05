#!/usr/bin/env node
/**
 * Screenshot every prerendered page of the build at a desktop and a phone width, served as the
 * host will (tools/serve.mjs), so a template change can be looked at before it is called done
 * (AGENTS.md, Guardrails). Full-page PNGs, named `<label>-<width>-<route>.png`.
 *
 *   node tools/screenshots.mjs [--out DIR] [--label NAME] [--routes /,/about] [DIST]
 *
 * Defaults: every page, into dist/screenshots (ignored by git), label `shot`.
 */
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DEFAULT_DIST, siteServer } from './serve.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const valued = new Set(['--out', '--label', '--routes'].filter((n) => args.includes(n)).map((n) => args.indexOf(n) + 1));
const dist = args.find((a, i) => !a.startsWith('--') && !valued.has(i)) ?? DEFAULT_DIST;
const out = option('--out', 'dist/screenshots');
const label = option('--label', 'shot');

function pages(dir = dist) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return pages(p);
    if (name !== 'index.html') return [];
    return [`/${relative(dist, join(p, '..')).split(sep).join('/')}`.replace(/\/\.?$/, '') || '/'];
  });
}

const routes = option('--routes', null)?.split(',') ?? pages().sort();
mkdirSync(out, { recursive: true });
const server = siteServer(dist);
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const origin = `http://127.0.0.1:${server.address().port}`;
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
try {
  for (const [width, height] of [[1280, 800], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    for (const route of routes) {
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      const file = join(out, `${label}-${width}-${route.replace(/\W+/g, '_').replace(/^_|_$/g, '') || 'home'}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
