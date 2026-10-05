#!/usr/bin/env node
/**
 * Run axe-core's WCAG 2.1 A and AA rules on every prerendered page of the build, at a desktop and a
 * phone width, served as the host will (tools/serve.mjs). Exits 1 on any violation. Automated rules
 * find a share of accessibility problems, not all of them: keyboard use and reading order still
 * need a person.
 *
 *   node tools/a11y.mjs [DIST]
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DEFAULT_DIST, siteServer } from './serve.mjs';

const dist = process.argv[2] ?? DEFAULT_DIST;
const { chromium } = await import('@playwright/test');
const { default: AxeBuilder } = await import('@axe-core/playwright');

function pages(dir = dist) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return pages(p);
    if (name !== 'index.html') return [];
    const route = `/${relative(dist, join(p, '..')).split(sep).join('/')}`.replace(/\/\.?$/, '');
    return [route || '/'];
  });
}

const server = siteServer(dist);
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let violations = 0;
try {
  for (const [width, height] of [[1280, 800], [390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    for (const route of pages().sort()) {
      const page = await context.newPage();
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      for (const v of result.violations) {
        violations++;
        console.log(`FAIL      a11y: ${route} @${width}px ${v.id} (${v.impact}): ${v.help}; ${v.nodes.length} node(s), first: ${v.nodes[0]?.target.join(' ')}`);
      }
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`a11y: ${violations} violation(s)`);
process.exit(violations ? 1 : 0);
