# Planned work

Accepted ideas, not yet built. **Not a promise and not a work order**: this is where each one will
collide, written now while it is clear. Every entry has a state (Planned, Half done, Done, Closed by
measurement, Blocked outside) and is never deleted. Ids come from
`python3 .agents/tools/bundle.py id i "<idea>"`.

## Where we are

2026-10-05. The site is Angular 22, standalone and zoneless, prerendered to static HTML: every page
costs a first visit 4 requests (HTML, script, stylesheet, font), none to another origin. Its address
is `www.fadiaz.cl` (d-115f49-a0fe6e): canonical URLs, `og:url`, a sitemap, `robots.txt` and a
`ProfilePage` on `/about`. The blog is hidden until a post is published (d-115f49-fb5f23). Project
images are WebP and the stylesheet carries only the Bootstrap the templates use: `/project` 252 KiB,
`/` 174 KiB. `npm run check` verifies the built site in CI. It is configured for Cloudflare static
assets and **not deployed**; the owner has the built site as a zip, to upload by hand.

**Waiting on the owner:** the deploy from the Cloudflare account, with `www.fadiaz.cl` as the
Worker's custom domain (`README.md`, *Deploy*); the projects' text (i-115f49-d63585); a real post,
before which the `noindex` fix lands (i-115f49-636a4f).

**Next session, first step:** check that the last CI run on `main` is green; then Dependabot (i-115f49-7fea76), which needs only the
owner's answer on weekly or monthly.

**To continue on another machine:** clone, `git config core.hooksPath .githooks`, Python 3.11+ for
`bundle.py`, the Node in `.nvmrc` (26), `npm ci`, `npx playwright install chromium`, then
`npm run check`.

## Process and tooling

### i-115f49-679bb3 · Gate in CI and stop tracking generated files
**State: Done** (2026-10-05, s-115f49-bc5070). `.github/workflows/ci.yml` runs `npm run gate` on
every push and pull request; generated files are untracked and ignored.
**What is still missing:** `audit:fragments` checks a fragment against every template, not the page
its link opens (the built-site check, `tools/check-site.mjs`, does check the page). Whether the `./`
paths in `.claude/settings.json` deny rules hold for a session started in a subfolder is unverified,
and they do not cover writes made through the shell.

### i-115f49-7fea76 · Dependency updates with Dependabot
**State: Planned.** Dependabot with Angular minor and patch updates grouped, majors ignored.
**What it collides with.** Neither bot runs `ng update` migrations: a bot bumping an Angular major
would skip the code migrations. The update is done (i-115f49-8c7fbe), so nothing blocks it now.
**What must be decided first.** Weekly or monthly; whether patches ever merge on their own.

### i-115f49-03e2ea · A committed script that screenshots every built page at two widths
**State: Done** (2026-10-05, s-115f49-187eff): `tools/screenshots.mjs`.
**What happens now.** Each visual check was a scratch script, rewritten as the build path changed:
build, serve, open each route at 1280 and 390 pixels, save, look.
**Cost.** About a minute to rewrite each time × done after every template change × every session
that touches a page.
**The fix.** `tools/screenshots.mjs` beside `tools/measure.mjs`, reusing `tools/serve.mjs`.
**Seen in.** s-115f49-187eff, more than ten times.

## The framework

### i-115f49-8c7fbe · Update Angular from 15 to the current major and replace Scully
**State: Done** (2026-10-05, s-115f49-187eff). Angular 22.2 by `ng update`, one major per commit;
the application builder; standalone components, no NgModules; zoneless; static prerendering with
`@angular/ssr`; Vitest. Scully was replaced by `tools/posts.mjs`, which converts the posts at build
time. Measured: 4 requests per page, the script 106 kB compressed.
**What is still missing:** the old `*ngIf` style is gone (the control-flow migration ran), but the
components still take their services through constructors, not `inject()`; harmless, and left as
it is.

### i-115f49-394f15 · Evaluate Analog for markdown content routes
**State: Closed by measurement** (2026-10-05). The blog's need, posts converted to HTML and
prerendered one file each, is met by `tools/posts.mjs` (about sixty lines, no request added per
page). Analog would replace that with a move to Vite and file-based routing.
**What would reopen it.** Posts needing what a script is poor at: MDX, embedded components, code
highlighting at scale.

### i-115f49-a26e87 · Evaluate Astro for the site
**State: Blocked outside** (owner's decision, 2026-10-05: keep Angular, no Astro for now).
**What it collides with.** Rewriting the pages as Astro would end d-115f49-908ed6; Astro with
Angular components embedded through Analog's Astro integration would keep Angular but add a second
toolchain.
**What would reopen it.** The owner asking for it again; the facts for that conversation are in
`docs/research/2026-10-05-site-quality-and-framework.md` §5. Do not propose it otherwise.

## Hosting

### i-115f49-ab7102 · Deploy on Cloudflare Workers static assets and retire Docker and nginx
**State: Half done** (2026-10-05, s-115f49-187eff). Configured: `wrangler.jsonc` (static assets
only, `drop-trailing-slash`, `404-page`), `public/_headers` (security headers and a CSP, completed
after each build by `tools/postbuild.mjs`), and the steps in `README.md`. Docker and nginx removed
(d-115f49-314943). **The missing half is the deploy**, from the owner's Cloudflare account.
**What it collides with.** Workers Builds may deploy without waiting for the GitHub check
(unverified), so a red `main` could ship; its build command runs `npm run build`, not the whole
check, because the check needs a browser. Whether Cloudflare's build image provides Node 26 is
unverified; Angular 22 also runs on 24.15 or newer.
**Unverified until a deploy:** how Cloudflare applies `_headers` to `404.html` responses, and whether
a `Cache-Control` from `_headers` replaces its default or joins it; `tools/serve.mjs` lets the last
matching rule win, where Cloudflare may join the values (no two rules overlap today).
**What must be decided first.** When to deploy; the site's address.

## Verification

### i-115f49-e325d4 · Pre-ship verification of the built site
**State: Done** (2026-10-05, s-115f49-187eff). `npm run check` in CI: tests, build,
`tools/check-site.mjs`, `tools/measure.mjs --budget 4` (which also fails on console errors and CSP
violations) and `tools/a11y.mjs` (axe, WCAG 2.1 AA). Each was seen to fail on a planted fault.
Content schemas were not needed: the content is typed against its models at compile time.
**What is still missing:** pages are screenshotted (`tools/screenshots.mjs`) but compared by eye,
not against a stored baseline; Lighthouse was not added.

## The site

### i-115f49-636a4f · Site quality: accessibility, SEO, weight and CSP
**State: Half done** (2026-10-05, s-115f49-187eff). Done: one render per block, `<a>` navigation,
one `<h1>` per page, accessible names, lazy images; a title, description and social tags per page;
self-hosted font and inline icons; a CSP.
Then, with the address (d-115f49-a0fe6e): a canonical URL and `og:url` per indexable page,
`sitemap.xml` and `robots.txt` written by `tools/postbuild.mjs`, and a schema.org `ProfilePage` on
`/about`, all checked on the built pages by `tools/check-site.mjs`. The project images are WebP at
600 pixels wide with their dimensions, converted once with no dependency added (owner's choice):
`/project`'s first visit went from 1705 to 269 KiB (`tools/measure.mjs`, 2026-10-05, local build).
Bootstrap trimmed to the parts the templates use (`src/bootstrap.scss`): the stylesheet went from
196.5 to 68 kB raw (20.8 to 8.1 kB compressed, the build's estimate) and the initial bundle from
524 to 397 kB, under `angular.json`'s 500 kB warning; 13 screenshots (every page at two widths, the
open menu, a hovered card and button) were pixel-identical before and after (2026-10-05, local
build).
**What is still missing:** Bootstrap 5 is written with Sass `@import`, which Dart Sass 3 removes;
`angular.json` silences that deprecation, so the build will fail when `@angular/build` ships Sass 3,
unless Bootstrap has moved to modules first. On an unknown post slug the client drops the 404
page's `noindex` (the response stays a 404); deferred while the blog is hidden (d-115f49-fb5f23),
and **to be fixed before the first real post is published**, which reopens the blog's routes.
`tools/check-site.mjs` reads neither `srcset` nor HTML entities in links; no page uses them yet.

### i-115f49-d63585 · Update the site content
**State: Half done** (2026-10-05). The owner's answers to the plan's phase 7: the blog is hidden
until a real post exists (d-115f49-fb5f23: the test post is `published: false`, and the blog's
routes and menu item exist only while a post is published); no contact or CV link beyond the
current social links; the address is `www.fadiaz.cl` (d-115f49-a0fe6e).
**What is still missing:** the projects, the owner's to write: which to update, add or feature.
One entry carries a stray top-level `color` that no model declares (`audit:data` advisory), and one
description still says the site uses Scully.
**What must be decided first.** The owner's text.

## Closed by measurement

- i-115f49-394f15 (Analog): the blog works without it, at no request per page.

## What each one costs the invariant

| Idea | Does it break "every route, link, fragment and asset resolves as served"? |
|---|---|
| i-115f49-8c7fbe | It did, and `npm run check` showed it held after: every route prerendered, every link checked. |
| i-115f49-394f15 | Yes: routing would move to files, so every route is redefined. |
| i-115f49-a26e87 | Yes: every page is rewritten. |
| i-115f49-ab7102 | Not if `drop-trailing-slash` stays: the links are written without a slash. |
| i-115f49-e325d4 | No: it is the check of the invariant against the built output. |
| i-115f49-636a4f | No, and it helped: `<a>` links became visible to the link check. |
| i-115f49-d63585 | No. |
| i-115f49-7fea76 | No. |
| i-115f49-03e2ea | No. |
