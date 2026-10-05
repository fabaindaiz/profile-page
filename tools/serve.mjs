#!/usr/bin/env node
/**
 * Serve a build folder the way the target host does: a path is served from the file itself,
 * `<path>.html` or `<path>/index.html`, a page asked for with a trailing slash is redirected to the
 * path without it (`drop-trailing-slash` in wrangler.jsonc), and anything else is a 404
 * (`404.html` when the build has one). Text is gzip-compressed when the client accepts it, as the
 * host compresses it, so measured bytes are bytes on the wire. With `spa`, any extension-less path
 * falls back to `index.html`, as a single-page host does. The build's `_headers` file is applied as
 * the host applies it (a pattern is a path with at most one `*`), so its CSP is enforced locally.
 *
 *   node tools/serve.mjs [DIST] [--spa] [--port N]      (npm run preview)
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { createGzip } from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const DEFAULT_DIST = 'dist/profile-page/browser';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain', '.xml': 'application/xml',
};

/** The file a URL path is served from, or null. */
export function resolveFile(dist, urlPath) {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]).replace(/\/+$/, '') || '/';
  const base = join(dist, clean);
  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const COMPRESSED = /^(text\/|application\/(json|xml)|image\/svg)/;

/** The rules of a `_headers` file: [pattern as a RegExp, { header: value }]. */
function headerRules(dist) {
  const file = join(dist, '_headers');
  if (!existsSync(file)) return [];
  const rules = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim().split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      rules.push([new RegExp(`^${pattern}$`), {}]);
    } else if (rules.length) {
      const at = line.indexOf(':');
      rules[rules.length - 1][1][line.slice(0, at).trim().toLowerCase()] = line.slice(at + 1).trim();
    }
  }
  return rules;
}

function send(req, res, status, file, rules) {
  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  const gzip = COMPRESSED.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
  const path = req.url.split(/[?#]/)[0];
  const extra = Object.assign({}, ...rules.filter(([re]) => re.test(path)).map(([, h]) => h));
  res.writeHead(status, { ...extra, 'content-type': type, ...(gzip ? { 'content-encoding': 'gzip' } : {}) });
  const body = createReadStream(file);
  (gzip ? body.pipe(createGzip()) : body).pipe(res);
}

/** An HTTP server over `dist`, not yet listening. */
export function siteServer(dist, { spa = false } = {}) {
  const rules = headerRules(dist);
  return createServer((req, res) => {
    const path = req.url.split(/[?#]/)[0];
    if (path !== '/' && path.endsWith('/') && resolveFile(dist, path)) {
      res.writeHead(307, { location: `${path.replace(/\/+$/, '')}${req.url.slice(path.length)}` });
      return res.end();
    }
    const file = resolveFile(dist, req.url) ?? (spa && !extname(path) ? join(dist, 'index.html') : null);
    if (!file) {
      const notFound = join(dist, '404.html');
      if (existsSync(notFound)) return send(req, res, 404, notFound, rules);
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('not found');
    }
    send(req, res, 200, file, rules);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const portAt = args.indexOf('--port');
  const port = portAt >= 0 ? Number(args[portAt + 1]) : 4300;
  const dist = args.find((a, i) => !a.startsWith('--') && i !== portAt + 1) ?? DEFAULT_DIST;
  if (!existsSync(dist)) {
    console.error(`serve: ${dist} does not exist; build first`);
    process.exit(2);
  }
  siteServer(dist, { spa: args.includes('--spa') }).listen(port, '127.0.0.1', () => {
    console.log(`serving ${dist} at http://127.0.0.1:${port}/`);
  });
}
