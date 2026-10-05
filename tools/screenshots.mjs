#!/usr/bin/env node
/**
 * Screenshot every prerendered page of the build at a desktop and a phone width, served as the
 * host will (tools/serve.mjs), so a template change can be looked at before it is called done
 * (AGENTS.md, Guardrails). Full-page PNGs, named `<label>-<width>-<route>.png`, and three states
 * a page load does not show: the small-screen menu open, a project card and a button hovered.
 *
 *   node tools/screenshots.mjs [--out DIR] [--label NAME] [--routes /,/about] [--compare DIR] [DIST]
 *
 * Defaults: every page, into dist/screenshots (ignored by git), label `shot`. With `--compare`,
 * each screenshot is compared pixel by pixel with the one of the same name in DIR, a baseline taken
 * the same way from the build before the change (i-115f49-097b7e); it exits 1 if any differs or is
 * missing there. A baseline is only valid on the machine that took it: fonts render differently
 * elsewhere.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DEFAULT_DIST, siteServer } from './serve.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const valued = new Set(['--out', '--label', '--routes', '--compare'].filter((n) => args.includes(n)).map((n) => args.indexOf(n) + 1));
const dist = args.find((a, i) => !a.startsWith('--') && !valued.has(i)) ?? DEFAULT_DIST;
const out = option('--out', 'dist/screenshots');
const label = option('--label', 'shot');
const baseline = option('--compare', null);

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
const name = (width, what) => join(out, `${label}-${width}-${what}.png`);
const shots = [];
const shoot = async (page, file, fullPage) => {
  await page.screenshot({ path: file, fullPage });
  shots.push(file);
  console.log(file);
};
let differing = 0;
try {
  for (const [width, height] of [[1280, 800], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    for (const route of routes) {
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await shoot(page, name(width, route.replace(/\W+/g, '_').replace(/^_|_$/g, '') || 'home'), true);
    }
    if (width === 390 && routes.includes('/')) {
      await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
      await page.click('button[aria-controls="site-menu"]');
      await page.waitForSelector('#site-menu');
      await page.waitForTimeout(300); // the button's .15s transition
      await shoot(page, name(width, 'state_menu_open'), false);
    }
    if (width === 1280 && routes.includes('/project')) {
      await page.goto(`${origin}/project`, { waitUntil: 'networkidle' });
      const card = page.locator('.project-card', { has: page.locator('img') }).first();
      await card.scrollIntoViewIfNeeded();
      await card.hover();
      await page.waitForTimeout(800); // the overlay's .5s transition
      await shoot(page, name(width, 'state_card_hover'), false);
      await page.locator('.btn').first().hover();
      await page.waitForTimeout(300);
      await shoot(page, name(width, 'state_button_hover'), false);
    }
    await page.close();
  }
  if (baseline) {
    const page = await browser.newPage();
    for (const file of shots) {
      const before = join(baseline, file.split(/[\\/]/).pop());
      if (!existsSync(before)) {
        console.log(`DIFF      ${file}: no baseline at ${before}`);
        differing++;
        continue;
      }
      const result = await page.evaluate(diffPixels, [readFileSync(before).toString('base64'), readFileSync(file).toString('base64')]);
      if (result !== 0) {
        console.log(`DIFF      ${file}: ${typeof result === 'number' ? `${result} pixels differ` : result}`);
        differing++;
      }
    }
    console.log(`screenshots: ${shots.length} compared with ${baseline}, ${differing} differ`);
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(differing ? 1 : 0);

/** Run in the browser: how many pixels differ between two PNGs, or why they cannot be compared. */
async function diffPixels([a, b]) {
  const load = async (data) => {
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    return img;
  };
  const [x, y] = [await load(a), await load(b)];
  if (x.width !== y.width || x.height !== y.height) return `size ${x.width}x${x.height} became ${y.width}x${y.height}`;
  const pixels = (img) => {
    const ctx = new OffscreenCanvas(img.width, img.height).getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height).data;
  };
  const [p, q] = [pixels(x), pixels(y)];
  let n = 0;
  for (let i = 0; i < p.length; i += 4) if (p[i] !== q[i] || p[i + 1] !== q[i + 1] || p[i + 2] !== q[i + 2]) n++;
  return n;
}
