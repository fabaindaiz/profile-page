#!/usr/bin/env node
/**
 * After the build: copy the prerendered /404 page to 404.html at the root of the build, which the
 * host serves, with status 404, for any URL that is not a file (Cloudflare's `404-page` handling).
 */
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist/profile-page/browser';
const page = join(dist, '404', 'index.html');
if (!existsSync(page)) {
  console.error(`not-found: ${page} was not prerendered; is the /404 route still there?`);
  process.exit(1);
}
copyFileSync(page, join(dist, '404.html'));
console.log(`not-found: ${page} copied to ${join(dist, '404.html')}`);
