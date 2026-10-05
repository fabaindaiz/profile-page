#!/usr/bin/env node
/**
 * Check the repository against the rules it writes down about itself.
 *
 * Every rule below is stated in AGENTS.md or docs/decisions.md, which cite each check by its
 * name as `audit:<name>`. If a rule changes there, change it here too; if a check here has no
 * rule, it should not be failing the build (the `enforcers` check reports both directions).
 *
 * Node only, no dependencies: it runs before `npm install`, on Node 12.17 or newer.
 * Failures stop the gate; advisories are printed every run and stop nothing.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'src/app');

const failures = [];
const advisories = [];
const fail = (check, msg) => failures.push(`audit:${check}: ${msg}`);
const advise = (check, msg) => advisories.push(`audit:${check}: ${msg}`);
const rel = (p) => relative(ROOT, p);
const read = (p) => readFileSync(p, 'utf8');

function walk(dir, keep) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p, keep) : keep(p) ? [p] : [];
  });
}

function tracked(...paths) {
  const out = execFileSync('git', ['ls-files', '--', ...paths], { cwd: ROOT, encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

// ---------------------------------------------------------------------------------------------
// routes: every literal link resolves to a route the router defines.

const stripComments = (src) => src.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Redirect targets, checked as links once every route is known. */
const redirects = [];

/** Route patterns as segment arrays, following loadChildren into the feature routing module. */
function routePatterns(routingFile, prefix = []) {
  if (!existsSync(routingFile)) {
    fail('routes', `routing module not found: ${rel(routingFile)}`);
    return [];
  }
  const src = stripComments(read(routingFile));
  if (/\bchildren\s*:/.test(src)) {
    // Fail closed: nested routes would be read at the wrong level, so a broken link could pass.
    fail('routes', `${rel(routingFile)} declares children routes, which this check does not model yet`);
  }
  const patterns = [];
  for (const [obj] of src.matchAll(/\{[^{}]*\bpath:\s*'[^']*'[^{}]*\}/g)) {
    const path = obj.match(/\bpath:\s*'([^']*)'/)[1];
    const segs = [...prefix, ...path.split('/').filter(Boolean)];
    const redirect = obj.match(/\bredirectTo:\s*'([^']*)'/);
    if (redirect) {
      const target = redirect[1].startsWith('/') ? redirect[1] : `/${[...prefix, redirect[1]].join('/')}`;
      redirects.push([routingFile, target]);
    }
    const lazy = obj.match(/loadChildren:[^]*?import\('([^']+)'\)/);
    if (lazy) {
      // Convention checked here: ./x/x.module is routed by ./x/x-routing.module.ts beside it.
      const moduleFile = join(dirname(routingFile), `${lazy[1]}.ts`);
      const child = join(dirname(moduleFile), basename(moduleFile).replace(/\.module\.ts$/, '-routing.module.ts'));
      patterns.push(...routePatterns(child, segs));
    } else {
      patterns.push(segs);
    }
  }
  return patterns;
}

function matches(pattern, segs) {
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '**') return true;
    if (i >= segs.length) return false;
    if (!pattern[i].startsWith(':') && pattern[i] !== segs[i]) return false;
  }
  return pattern.length === segs.length;
}

/** A route parameter whose values are files: the link must name one that exists. */
const PARAM_FILES = { 'blog/:slug': (slug) => join(ROOT, 'blog', `${slug}.md`) };

/**
 * Literal links: `routerLink` (quoted either way, or bound to a string literal) and internal
 * `href="/..."` in templates, `*Path:` values in component code, and internal links in posts.
 * Not seen: links computed at runtime.
 */
function literalLinks() {
  const links = [];
  for (const f of walk(APP, (p) => p.endsWith('.html'))) {
    const src = read(f);
    for (const m of src.matchAll(/(?<![[\w-])routerLink=(["'])(.*?)\1/g)) links.push([f, m[2]]);
    for (const m of src.matchAll(/\[routerLink\]="'([^']*)'"/g)) links.push([f, m[1]]);
    for (const m of src.matchAll(/(?<![[\w-])href="(\/(?!\/)[^"]*)"/g)) links.push([f, m[1]]);
  }
  for (const f of walk(APP, (p) => p.endsWith('.ts') && !p.endsWith('.spec.ts') && !p.includes('routing'))) {
    for (const m of read(f).matchAll(/\b\w*Path:\s*(["'])(.*?)\1/g)) links.push([f, m[2]]);
  }
  for (const f of walk(join(ROOT, 'blog'), (p) => p.endsWith('.md'))) {
    for (const m of read(f).matchAll(/\]\((\/(?!\/)[^)\s]*)\)/g)) links.push([f, m[1]]);
  }
  return links;
}

function checkRoutes() {
  const patterns = routePatterns(join(APP, 'app.routes.ts'));
  for (const [file, link] of [...literalLinks(), ...redirects]) {
    if (!link.startsWith('/')) {
      fail('routes', `${rel(file)}: link "${link}" is relative; write it from the root`);
      continue;
    }
    const segs = link.split(/[?#]/)[0].split('/').filter(Boolean);
    // A wildcard route accepts anything, so it cannot vouch for a link: match concrete routes only.
    const route = patterns.find((p) => !p.includes('**') && matches(p, segs));
    if (!route) {
      fail('routes', `${rel(file)}: link "${link}" matches no route`);
      continue;
    }
    const fileFor = PARAM_FILES[route.join('/')];
    if (fileFor && !existsSync(fileFor(segs[segs.length - 1]))) {
      fail('routes', `${rel(file)}: link "${link}" names no ${rel(fileFor(segs[segs.length - 1]))}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// fragments: every literal fragment names an element id some template renders.
// Not seen: whether that template is the one rendered at the link's route.

function checkFragments() {
  const ids = new Set();
  const used = [];
  for (const f of walk(APP, (p) => p.endsWith('.html'))) {
    const src = read(f);
    for (const m of src.matchAll(/(?<![[\w-])id="([^"]+)"/g)) ids.add(m[1]);
    for (const m of src.matchAll(/(?<![[\w-])fragment="([^"]*)"/g)) used.push([f, m[1]]);
  }
  for (const f of walk(APP, (p) => p.endsWith('.ts') && !p.endsWith('.spec.ts'))) {
    for (const m of read(f).matchAll(/\bfragment:\s*'([^']*)'/g)) used.push([f, m[1]]);
  }
  for (const [file, frag] of used) {
    if (frag && !ids.has(frag)) fail('fragments', `${rel(file)}: fragment "${frag}" has no element with that id`);
  }
}

// ---------------------------------------------------------------------------------------------
// data: every content file parses and carries the required fields of its interface.
// Interim: the roadmap replaces this with schemas the types are derived from.

const DATA = {
  'about.json': ['about.ts', 'About'],
  'projects.json': ['project.ts', 'Project'],
  'social.json': ['social.ts', 'Social'],
  'stack.json': ['stack.ts', 'Stack'],
};

/** Top-level fields of `export interface name`, as [field, optional]. Nested types are not read. */
function interfaceFields(file, name) {
  const src = read(file);
  const start = src.indexOf(`export interface ${name} {`);
  if (start < 0) return null;
  let depth = 0;
  let line = '';
  const fields = [];
  for (const ch of src.slice(src.indexOf('{', start))) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) break;
    if (depth === 1 && (ch === '\n' || ch === ';' || ch === ',')) {
      const m = line.match(/^\s*(\w+)(\?)?\s*:/);
      if (m) fields.push([m[1], Boolean(m[2])]);
      line = '';
    } else if (depth === 1) {
      line += ch;
    }
  }
  return fields;
}

function checkData() {
  const dir = join(ROOT, 'src/content');
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    if (!DATA[name]) {
      fail('data', `src/content/${name} has no interface mapped in tools/audit.mjs DATA`);
      continue;
    }
    const [modelFile, iface] = DATA[name];
    const fields = interfaceFields(join(APP, 'core/models', modelFile), iface);
    if (!fields) {
      fail('data', `interface ${iface} not found in src/app/core/models/${modelFile}`);
      continue;
    }
    let value;
    try {
      value = JSON.parse(read(join(dir, name)));
    } catch (e) {
      fail('data', `src/content/${name} does not parse: ${e.message}`);
      continue;
    }
    const items = Array.isArray(value) ? value : [value];
    items.forEach((item, i) => {
      const where = Array.isArray(value) ? `${name}[${i}]` : name;
      for (const [field, optional] of fields) {
        if (!optional && !(field in item)) fail('data', `${where} lacks required field "${field}" of ${iface}`);
      }
      for (const key of Object.keys(item)) {
        if (!fields.some(([f]) => f === key)) advise('data', `${where} has "${key}", which ${iface} does not declare`);
      }
    });
  }
}

// ---------------------------------------------------------------------------------------------
// posts: every blog post's front matter carries what the blog landing renders.

function checkPosts() {
  for (const f of walk(join(ROOT, 'blog'), (p) => p.endsWith('.md'))) {
    const fm = read(f).replace(/\r\n/g, '\n').match(/^---\n([^]*?)\n---/);
    if (!fm) {
      fail('posts', `${rel(f)} has no front matter`);
      continue;
    }
    for (const key of ['title', 'description', 'published']) {
      if (!new RegExp(`^${key}:`, 'm').test(fm[1])) fail('posts', `${rel(f)} front matter lacks "${key}"`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// doc-paths: every repository path the instruction documents name exists.

const INSTRUCTION_DOCS = () => [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  ...walk(join(ROOT, 'docs'), (p) => p.endsWith('.md') && dirname(p) === join(ROOT, 'docs')).map(rel),
  ...walk(join(ROOT, '.claude/skills'), (p) => /(SKILL|LOCAL)\.md$/.test(p)).map(rel),
];

/** Paths named that do not exist on purpose, each with its reason. */
const PATH_EXEMPT = {
  'dist/profile-page': 'build output, created by the build',
  'dist/profile-page/browser': 'build output of the application builder, after the migration',
  'node_modules': 'created by npm install',
  '404.html': 'build output, copied from the prerendered /404 page by tools/not-found.mjs',
  'tools/screenshots.mjs': 'planned by i-115f49-03e2ea',
  'robots.txt': 'planned by i-115f49-636a4f; needs the site address',
  'sitemap.xml': 'planned by i-115f49-636a4f; needs the site address',
  '.claude/settings.local.json': 'machine-local, never committed',
  '~/.config/agent-guides/carriers.toml': 'machine-local manifest, outside the repository',
  '~/.config/agent-guides/private-terms.txt': 'machine-local, outside the repository',
};

function checkDocPaths() {
  const trackedNames = new Set(tracked('.').map((p) => basename(p)));
  for (const doc of INSTRUCTION_DOCS()) {
    const file = join(ROOT, doc);
    if (!existsSync(file)) {
      fail('doc-paths', `instruction document missing: ${doc}`);
      continue;
    }
    const src = read(file);
    const tokens = [
      ...[...src.matchAll(/`([^`\s]+)`/g)].map((m) => m[1]),
      ...[...src.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]),
    ];
    for (const token of tokens) {
      const path = token.replace(/#.*$/, '').replace(/\/$/, '').replace(/:\d+$/, '');
      if (/[<>*$(){}|=]|^https?:|^\.\.?$|^-/.test(path) || PATH_EXEMPT[path]) continue;
      if (path.includes('/')) {
        if (!/^[\w.~-]+(\/[\w.@-]+)+$/.test(path)) continue;
        if (!existsSync(join(ROOT, path))) fail('doc-paths', `${doc} names \`${token}\`, which does not exist`);
      } else if (/^[\w.-]+\.(md|json|jsonc|ts|mjs|js|yml|yaml|toml|conf|html|sh|py|css|txt)$/.test(path)) {
        if (!existsSync(join(ROOT, path)) && !trackedNames.has(path)) {
          fail('doc-paths', `${doc} names \`${token}\`, which no file in the repository is called`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// generated: a copy a build derives is not tracked, or it is served stale in place of its source.

const GENERATED = ['src/app/core/icons/icons.generated.ts', 'src/app/blog/posts.generated.ts'];

function checkGenerated() {
  for (const p of tracked(...GENERATED)) fail('generated', `${p} is generated by the build and must not be tracked`);
}

// ---------------------------------------------------------------------------------------------
// enforcers: every `audit:<name>` the documents cite is a check here, and every check is cited.

const CHECKS = {
  routes: checkRoutes,
  fragments: checkFragments,
  data: checkData,
  posts: checkPosts,
  'doc-paths': checkDocPaths,
  generated: checkGenerated,
  enforcers: checkEnforcers,
};

function checkEnforcers() {
  const cited = new Set();
  for (const doc of INSTRUCTION_DOCS().filter((d) => existsSync(join(ROOT, d)))) {
    for (const m of read(join(ROOT, doc)).matchAll(/\baudit:([a-z-]+)/g)) {
      cited.add(m[1]);
      if (!CHECKS[m[1]]) fail('enforcers', `${doc} cites audit:${m[1]}, which tools/audit.mjs does not define`);
    }
  }
  for (const name of Object.keys(CHECKS)) {
    if (!cited.has(name)) advise('enforcers', `audit:${name} is cited by no document: a check with no rule`);
  }
}

for (const check of Object.values(CHECKS)) check();

for (const a of advisories) console.log(`advisory  ${a}`);
for (const f of failures) console.log(`FAIL      ${f}`);
console.log(
  `audit: ${failures.length} failure(s), ${advisories.length} advisory(ies) across ${Object.keys(CHECKS).length} checks`,
);
process.exit(failures.length ? 1 : 0);
