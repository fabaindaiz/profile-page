# Plan: a faster, current and complete site (2026-10-05)

**Goal, from the owner:** speed, and a site that stays fully static for now. Cloudflare's free plan
does not charge static requests (checked first-hand on its billing pages: "requests to static
assets are free and unlimited", on Workers and on Pages), so fewer requests per page is a speed
target, not a cost one. Any future server code (a contact form, say) is the one thing that would
spend the free quota, and it would be designed so only that endpoint runs code.

**Owner's rulings:** the order is the agent's to choose; build with the Node and npm already on
the machine (Node 26); Angular stays (d-115f49-908ed6), Astro is set aside (i-115f49-a26e87).

## Why this order

Angular 22 supports Node 26; Angular 15 does not list it. So the update comes early, and what does
not depend on the framework comes first, because it removes dependencies every update step would
otherwise drag along (ng-bootstrap moves one major per Angular major; Scully cannot move at all).

## Phases

Each phase ends with the gate green, a build, and the numbers it claims measured on the built site.

1. **Baseline.** Build the current site and measure, per page, the requests and bytes a first visit
   makes, with a headless browser over the built folder. The script stays, as the measurement every
   later phase is compared with.
2. **Request diet that does not depend on the framework** (part of i-115f49-636a4f):
   - content compiled into the bundle instead of fetched (four JSON files, one of them fetched four
     times per page), typed against its models at compile time;
   - icons as inline SVG built from the icon packages, instead of two icon fonts;
   - Nunito served from the site instead of Google Fonts;
   - the one dropdown made native, removing ng-bootstrap, Popper and `@angular/localize`;
   - the blog's markdown converted at build time into the bundle, removing Scully.
3. **Angular 15 → 22** (i-115f49-8c7fbe), one major per step with `ng update`, a commit per step.
   Then the application builder, static prerender with `@angular/ssr` (every route, one file per
   post through `getPrerenderParams`), routes loaded eagerly, zoneless. The specs are fixed first,
   so the test run can join the gate.
4. **Pre-ship verification** (i-115f49-e325d4): a check over the built folder that every internal
   link and fragment resolves to a file, and a request budget per page; both join the gate.
5. **Cloudflare configuration** (i-115f49-ab7102): `wrangler.jsonc` for an assets-only Worker,
   `public/_headers` (the nginx security headers, `immutable` for hashed files), a 404 page,
   no trailing slash. Docker and nginx retired. **No deploy**: production happens only when the owner
   asks, from the owner's Cloudflare account.
6. **Quality** (i-115f49-636a4f): navigation as `<a>`, `alt` text, one `<h1>` per page and no
   duplicated blocks; a title, description and social tags per route, a canonical, a sitemap and
   `robots.txt`, JSON-LD on the about page; lazy images with their dimensions; a CSP.
7. **Content** (i-115f49-d63585): the owner's words. Known gaps: 5 of 12 projects have an image, 4 are
   featured; the only post is a test; there is no contact or CV link. The agent asks; it does not
   write them.

## Targets

| Measure | Baseline | Target |
|---|---|---|
| Requests, first visit to the home page | measured in phase 1 | 5 or fewer, all from the site's own domain |
| Requests, a repeat visit | measured in phase 1 | the HTML only (hashed files cached as `immutable`) |
| Third-party origins | Google Fonts | none |

## Ledger

Rulings taken on the owner's behalf while executing, and results, are appended here as they happen.

### Phase 1 — baseline (2026-10-05)

Measured with `node tools/measure.mjs dist/profile-page --spa --routes ...` on the Angular 15 build
(`ng build`, Node 26.10, which Angular 15 builds on although its table does not list it; Scully's
prerender was not run, because npm 11 blocks the install script that downloads its Chromium, and
it changes no request: the services fetch the same files either way).

| Route | Requests | Own | Third-party | KiB transferred |
|---|---|---|---|---|
| `/` | 22 | 21 | 1 | 1645 |
| `/about` | 14 | 13 | 1 | 1355 |
| `/project` | 21 | 20 | 1 | 3003 |
| `/blog` | 11 | 10 | 1 | 879 |
| `/blog/2023-04-02-blog` | 12 | 11 | 1 | 879 |

On `/`, 11 of the 21 own requests are the same four JSON files fetched again (`about.json` five
times, the other three twice each): every component subscribes to its own copy of the fetch. Four
icon fonts weigh 760 KiB (devicon alone 473 KiB), and the main bundle and the stylesheet 773 KiB.

### Phase 2 — request diet, framework-independent (2026-10-05)

Each step measured with `tools/measure.mjs` on the Angular 15 build, and looked at in screenshots
of every route at desktop and phone widths against the baseline's.

| Step | `/` requests | `/` KiB | Other effect |
|---|---|---|---|
| Baseline | 22 (1 third-party) | 1645 | |
| Inline SVG icons instead of four icon fonts | 18 | 780 | 20 icons generated from the packages |
| Content compiled into the bundle | 7 | 764 | a missing field now fails the build |
| Native menu, ng-bootstrap removed | 7 | 586 | main bundle 126 to 84 kB compressed |
| Nunito served from the site | 7 (0 third-party) | 586 | |
| Posts converted at build time, Scully removed | 7 | 553 | `/blog` 9 to 8 requests |

What remains on `/`: the HTML, `runtime`, `polyfills`, `main`, `styles`, the lazy portfolio
chunk and the font. Phase 3 removes `runtime` (application builder), `polyfills` (zoneless) and the
lazy chunk (routes loaded eagerly).

**Found on the way.** `HeaderService.isHome()` captured its starting value once, so any later
subscriber got the home page's value: fixed (`fix(header)`), found because the new menu subscribes
when it opens. The small-screen menu button lost the caret ng-bootstrap's toggle drew; it has an
accessible name instead. The greeting renders the name without a space ("FabianDiaz."): a template
concatenation, for phase 6.

**Ruling.** The specs are fixed after the update, on the test runner chosen there, not before it:
fixing Karma specs that the update rewrites would be done twice.
