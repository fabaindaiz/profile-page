<!-- Research for the bootstrap, Phase 2. Written by a delegated research agent on 2026-10-05; each claim cites the source it was read from. Not yet re-checked first-hand: treat as relayed until a decision cites it. -->

# Research: updating profile-page (Angular 15 + Scully) and hosting it on Cloudflare

Date: 2026-10-05. Read-only web research using primary sources (official docs, npm registry, GitHub). Anything not verified is marked **ASSUMPTION**.
The current setup was read (not changed) from the repo: `Dockerfile`, `nginx/nginx.conf`, `nginx/security-headers.conf`, `scully.profile-page.config.ts`, `package.json`.

## TL;DR (decisions for the owner)

1. **Angular 15 has been out of support since May 2024.** The current version is **22.2.1**: v22.0.0 shipped on 2026-06-03 and 22.2.1 on 2026-09-30. Updating means **7 sequential majors** (15→16→…→22), and the Node version has to change along the way.
2. **Scully is abandoned.** Its last release was 2.1.41 (2022-09-21) and the last commit to `main` was on 2022-09-27. It does not work past Angular 15/16 in practice. **Scully has to be replaced before the update can finish.** There are two options:
   - (a) **`@angular/ssr` with `outputMode: "static"`, `getPrerenderParams`, and a Markdown library** such as `ngx-markdown` or `marked`. This is the smallest change and stays on the official toolchain. Recommended.
   - (b) **Analog** (`@analogjs/content`), which has built-in Markdown content routes. It means moving to a Vite meta-framework: a bigger change, but less blog code to write yourself.
3. **Cloudflare tells you to start new projects on Workers (Static Assets), not Pages.** An assets-only Worker is free with unlimited static requests. `_headers` and `_redirects` work the same way as on Pages.
4. **Docker and nginx are no longer needed.** Keeping them on Cloudflare Containers would cost at least the $5/month Workers Paid plan plus usage, and would add nothing for a static site.
5. **Three things will bite:**
   - Angular writes each prerendered route to `route/index.html`. Cloudflare's default `auto-trailing-slash` then 307-redirects `/blog/foo` to `/blog/foo/`. Set `html_handling: "drop-trailing-slash"` to keep today's URLs.
   - Choose between `404-page` and SPA fallback (details in Q4 and Q5).
   - Add your own immutable caching for hashed assets.

---

## 1. Angular

| Finding | Source |
|---|---|
| The latest version is **22.2.1** (2026-09-30). v22.0.0 was released on **2026-06-03**. | https://registry.npmjs.org/@angular/core |
| Supported now: v22 is Active (active support until 2027-06, LTS until 2028-06). v21 is in LTS until 2027-06. v20 is in LTS until 2026-11-28. "Angular versions v2 to v19 are no longer supported." From v22 on, majors come **every 12 months** (6 months before), each with 24 months of support. | https://angular.dev/reference/releases |
| **Angular 15 LTS ended on 2024-05-18** (released 2022-11-16; active support ended 2023-05-03). This is a secondary source; it agrees with the old policy of 18 months of support. The last v15 patch was 15.2.10 on 2023-10-04 (npm). | https://endoflife.date/angular (secondary), npm registry |
| Update path: "If you want to update across multiple major versions, perform each update one major version at a time." The interactive guide at angular.dev/update-guide needs JavaScript and could not be read. **ASSUMPTION:** per-step notes were not reviewed. | https://angular.dev/reference/releases#supported-update-paths |
| **Node/TypeScript per version:** 15 needs Node ^14.20/^16.13/^18.10 and TS 4.8–4.9. 16 needs Node ^16.14/^18.10. 17 needs Node ^18.13/^20.9 and TS 5.2–5.4. 18 and 19 need Node ^18.19.1/^20.11.1/^22. 20 and 21 need Node ^20.19/^22.12/^24 and TS 5.8–5.9. **22 needs Node ^22.22.3/^24.15/>=26 and TS >=6.0 <6.1.** | https://angular.dev/reference/versions |
| v19: "directives, components and pipes are now standalone by default". v20: `ngIf`/`ngFor`/`ngSwitch` are **deprecated** in favour of `@if`/`@for`/`@switch`, and `platform-browser-dynamic` is deprecated. v21: CLI "Applications are zoneless by default" and "configure Vitest for new projects". v22: **components without `changeDetection` are now OnPush by default** (`ng update` adds a migration to `ChangeDetectionStrategy.Eager`), incremental hydration is the default, `HttpClient` uses fetch by default, TS < 6.0 is dropped, and the Hammer.js integration is removed. | https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md |
| CLI v22: "**Webpack builders in build-angular are deprecated.** Use @angular/build builders instead." The experimental Jest and Web Test Runner builders were **removed**. Karma still works (needs `istanbul-lib-instrument` for coverage). | https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md |
| Moving to the `application` builder (esbuild): run `ng update @angular/cli --name use-application-builder`. **Output moves from `dist/<app>` to `dist/<app>/browser`.** "The existing webpack-based build system and `browser` builder are deprecated." | https://angular.dev/tools/cli/build-system-migration |
| Testing: "the default testing setup for new Angular CLI projects ... uses Vitest". "Karma is still supported." Migrating an existing project with `ng g @schematics/angular:refactor-jasmine-vitest` is "**experimental**" and **requires the `application` builder**. | https://angular.dev/guide/testing, https://angular.dev/guide/testing/migrating-to-vitest |
| Built-in SSG: `ng add @angular/ssr`, then set `outputMode: "static"`. This "generates pre-rendered HTML files for each route at build time, but it does not generate a server file". `RenderMode.Prerender` with `getPrerenderParams()` handles routes like `/blog/:slug`. It runs at build time, can call `inject` (synchronously only), and offers `PrerenderFallback.Server` (default), `.Client`, or `.None`. | https://angular.dev/guide/ssr (source: https://raw.githubusercontent.com/angular/angular/main/adev/src/content/guide/ssr.md) |
| Prerender output: each route is written as `<route>/index.html` (`posix.join(route, 'index.html')`). Since CLI v19 with SSR, the CSR shell is emitted as `index.csr.html` instead of `index.html`. | https://raw.githubusercontent.com/angular/angular-cli/main/packages/angular/build/src/utils/server-rendering/prerender.ts, CLI CHANGELOG |

**What this means for the current setup:**
- `node:latest` in the Dockerfile is already outside Angular 15's supported Node range. **ASSUMPTION:** `node:latest` is Node 26 today.
- The `browser` builder, Karma/Jasmine, NgModules, `*ngIf` and zone.js all still work, but every one of them is either deprecated or no longer the default.

**Decisions:**
- **Node during the update:** use Node 18.19 for 15→16→17, then Node 22.22.3+ (or 24.15+) for 18→22.
- **Tests:** keep Karma (still supported), or move to Vitest after switching builders (experimental migration).
- **Optional modernisation:** decide whether to also migrate to standalone, control flow and zoneless. Schematics exist for each, and none is required to run on v22 except dealing with the OnPush default.

## 2. Scully

| Finding | Source |
|---|---|
| `@scullyio/scully` `latest` is **2.1.41, published 2022-09-21**. Nothing newer has been published as `latest`. `3.1.0-beta.0` (2023-07-19, peer `@angular/core >=15`) is the last pre-release. The 2.1.41 package depends on `@angular/core` **12.2.6**. | https://registry.npmjs.org/@scullyio/scully |
| The GitHub repo is not archived, but the **last commit on `main` was 2022-09-27** ("bump version ... 2.1.42"); the last push to any branch was 2023-08-31. 121 issues are open. | `gh api repos/scullyio/scully` (https://github.com/scullyio/scully) |
| There is no official deprecation statement (none found). Unanswered issues include #1678 "**Cannot upgrade to Angular 16. Is Scully still actively maintained?**" (2024-09; the only reply is "I'm guessing the answer is no?") and #1677 "Angular 17 Detected Routes but not rendering them". In #1677 a community member recommends **Analog** as the replacement. | https://github.com/scullyio/scully/issues/1678, https://github.com/scullyio/scully/issues/1677 |
| Replacement (b): Analog content routes use `provideContent(withMarkdownRenderer())`, `injectContentFiles()` and `injectContent()`. Prerendering uses `prerender.routes` with `{ contentDir: 'src/content/blog', transform: f => '/blog/' + slug }`. `static: true` produces static-only output in `dist/analog/public`. `@analogjs/content` 2.8.0 (2026-10-01) has peer `@angular/core` ^17–^22. | https://analogjs.org/docs/features/routing/content, https://analogjs.org/docs/features/server/static-site-generation, npm registry |
| Replacement (a): `@angular/ssr` (22.2.1) for prerendering plus `ngx-markdown` 22.1.0 (peer `@angular/core ^22`, `marked ^17 \|\| ^18`) for rendering. | npm registry |

**What this means for the current setup:** the Scully `contentFolder` route `/blog/:slug`, puppeteer, and Chrome in the Docker image all go away.

**Decision:** option (a) or (b), as described in the TL;DR.

**ASSUMPTION (not verified):** with option (a) you have to produce the slug list and the Markdown text at build time yourself. One way is a small prebuild script that writes `blog/index.json`, read inside `getPrerenderParams`. Another is importing the `.md` files with the esbuild `loader: {".md": "text"}` option. Fetching assets with relative-URL `HttpClient` calls during prerender was not verified.

## 3. ng-bootstrap

The README compatibility table:

| ng-bootstrap | Angular | Bootstrap CSS |
|---|---|---|
| 14 | ^15 | 5.2.3 |
| 15 | ^16 | 5.2.3 |
| 16 | ^17 | 5.3.2 |
| 17 | ^18 | 5.3.2 |
| 18 | ^19 | 5.3.3 |
| 19 | ^20 | 5.3.6 |
| 20 | ^21 | 5.3.8 |
| **21** | **^22** | **5.3.8** |

All versions use Popper ^2.11.x. **ng-bootstrap 21.0.0** was released 2026-06-22. Its peers are `@angular/core ^22`, **`@angular/localize ^22`** and `@popperjs/core ^2.11.8`.

Sources: https://github.com/ng-bootstrap/ng-bootstrap#dependencies, https://registry.npmjs.org/@ng-bootstrap/ng-bootstrap

**Decision:** bump ng-bootstrap one major at each Angular step, and move Bootstrap from 5.2 to 5.3.x.

## 4. Cloudflare hosting

| Finding | Source |
|---|---|
| The Pages docs say: "Workers supports most Pages use cases and offers a broader feature set. It is Cloudflare's primary platform for building applications. **Start new projects with Workers.**" Pages is not deprecated. A Pages Angular guide still exists. | https://developers.cloudflare.com/pages/, https://developers.cloudflare.com/pages/framework-guides/deploy-an-angular-site/ |
| An assets-only Worker needs just `{"name", "compatibility_date", "assets": {"directory": "..."}}`. Leave out `binding` when there is no Worker script. `_headers` and `_redirects` are supported. | https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/ |
| `not_found_handling` can be `"none"` (default), `"404-page"` or `"single-page-application"`. `html_handling` can be `"auto-trailing-slash"` (default), `"force-trailing-slash"`, `"drop-trailing-slash"` or `"none"`. | https://developers.cloudflare.com/workers/wrangler/configuration/ |
| SPA mode serves `/index.html` with **200** for unmatched paths. `404-page` serves the **nearest `404.html`** with status **404**. | https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/, https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/ |
| Pages behaves differently: it serves the nearest `404.html`, and **if there is no top-level `404.html` it assumes a SPA** and serves `/`. It strips `.html`, and `/about/index.html` is served at `/about/`. | https://developers.cloudflare.com/pages/configuration/serving-pages/ |
| `_headers`: a plain file in the assets directory. Each block is a URL pattern followed by indented headers. Limits: 100 rules and 2,000 characters per line, one splat per pattern. Matching rules are merged, and `! Header` removes a header. Headers are **not** applied to responses from Worker code. Defaults are `Cache-Control: public, max-age=0, must-revalidate` plus an ETag. The docs give `public, max-age=31556952, immutable` as an example for fingerprinted assets. | https://developers.cloudflare.com/workers/static-assets/headers/ |
| `_redirects`: up to 2,000 static and 100 dynamic rules; the default status is 302. | https://developers.cloudflare.com/workers/static-assets/redirects/ |
| Static asset requests are "**free and unlimited**". Limits: 20,000 files per version (Free) or 100,000 (Paid); 25 MiB per file. | https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/, https://developers.cloudflare.com/workers/platform/limits/ |
| **Workers Builds** image: Ubuntu 24.04, default **Node 24.18.0** (22.23.2 is also preinstalled). Override with `NODE_VERSION`, `.nvmrc` or `.node-version`. Limits: 20-minute timeout, 8 GB RAM, 20 GB disk, 3,000 build minutes/month on Free. **Pages** build image v3 uses Node 22.16.0 by default, with the same override options. Neither document mentions headless Chrome. | https://developers.cloudflare.com/workers/ci-cd/builds/build-image/, https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/, https://developers.cloudflare.com/pages/configuration/build-image/ |
| Workers has an Angular guide (`npm create cloudflare@latest -- --framework=angular`). It deploys as static assets with `assets.directory: dist/browser`. | https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/angular/ |
| **Containers** require Workers Paid at **$5/month**; there is no free tier. Included each month: 25 GiB-hours of memory, 375 vCPU-minutes and 200 GB-hours of disk. The smallest instance ("lite") has 1/16 vCPU and 256 MiB. A Worker has to sit in front of the container. | https://developers.cloudflare.com/containers/pricing/ |

**Porting nginx to `_headers`** (`dist/<app>/browser/_headers`, for example copied from `public/` by the application builder):

```
/*
  Strict-Transport-Security: max-age=31449600; includeSubDomains
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin
  Permissions-Policy: microphone=(), geolocation=(), camera=()
/*.js
  Cache-Control: public, max-age=31536000, immutable
/*.css
  Cache-Control: public, max-age=31536000, immutable
```

- `Feature-Policy` has been replaced by `Permissions-Policy`, so drop it.
- There is no Content-Security-Policy today. This is an optional decision.
- **ASSUMPTION:** a splat placed mid-pattern like `/*.js` is allowed (the docs only say "single splat"). Check this with `curl -I` after deploying.
- **ASSUMPTION:** HSTS can also be turned on at zone level in the Cloudflare dashboard. Pick one place to set it so the header is not sent twice.

**Draft `wrangler.jsonc`:**

```jsonc
{
  "name": "profile-page",
  "compatibility_date": "2026-10-05",
  "assets": {
    "directory": "./dist/profile-page/browser",
    "html_handling": "drop-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

**What this means for the current setup:**
- The Dockerfile (node:latest + Chrome, then nginx:alpine) and nginx.conf have no role on Workers Static Assets.
- Keeping the image means running it on Containers: at least $5/month plus a Worker in front, for a static site that otherwise costs $0.
- **ASSUMPTION:** a lite instance running nonstop would go beyond the included memory and vCPU quota. This was not calculated precisely.

**Decisions:**
- Workers, which Cloudflare recommends, or Pages, which also works.
- Build in Workers Builds (Git integration) or in GitHub Actions with `wrangler deploy`.
- Delete the Docker/nginx files, or keep them only for local preview.

## 5. Things that bite

1. **Trailing slashes.** Angular writes `/blog/foo/index.html`. With Workers' default `auto-trailing-slash`, a request for `/blog/foo` gets a **307 to `/blog/foo/`**. With `drop-trailing-slash`, `/blog/foo` is served with 200 and `/blog/foo/` gets a 307 to `/blog/foo`. That second behaviour matches the Angular router's URLs and today's nginx `try_files $uri $uri/`. Pages always uses the trailing-slash form for `index.html`, which is another reason to prefer Workers. Source: https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/
2. **SPA fallback versus prerendered pages.**
   - Today nginx falls back to `/index.html` (Scully's prerendered home page).
   - Cloudflare's SPA mode does the same: it always serves `/index.html`, and with SSG that file is the **prerendered home page, not the `index.csr.html` shell**.
   - **ASSUMPTION:** this would make Angular hydrate home-page markup on another route, causing a mismatch or flicker.
   - If every route is prerendered, use `404-page` and emit a `404.html`. For example, prerender a `/404` route and copy `404/index.html` to `404.html` after the build (**ASSUMPTION:** this step was not verified).
   - On Pages, adding a top-level `404.html` also turns off its automatic SPA mode.
3. **Cache headers.**
   - nginx today gives JS/CSS `max-age=86400` and HTML `max-age=86400` (only `/index.html` and `*.json` are no-cache). That means blog pages can be up to a day stale.
   - Cloudflare's defaults are `max-age=0, must-revalidate` plus an ETag for every file, so HTML is always fresh.
   - Add `immutable` only for the hashed JS/CSS. Never add it for HTML or for the unhashed files in `public/`.
4. **Output path change.** With the `application` builder, Angular writes the site to `dist/profile-page/browser`, not `dist/profile-page` (that's where the Dockerfile and Scully's `outDir` look today). The Cloudflare config has to point at the new folder.
5. **Node on the build host.** The Workers Builds default (Node 24.18) satisfies Angular 22 (^24.15). It does **not** satisfy any intermediate step before v20. Pin the version with `.nvmrc`.
6. **The Workers Builds image does not document headless Chrome.** This is another reason Scully and puppeteer cannot simply move to Cloudflare's builders. **ASSUMPTION:** it was not tested.

## Sources used (15 that change a decision)

1. https://angular.dev/reference/releases
2. https://angular.dev/reference/versions
3. https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md
4. https://raw.githubusercontent.com/angular/angular-cli/main/CHANGELOG.md
5. https://angular.dev/tools/cli/build-system-migration
6. https://angular.dev/guide/testing/migrating-to-vitest
7. https://angular.dev/guide/ssr
8. https://registry.npmjs.org/@scullyio/scully, plus https://github.com/scullyio/scully/issues/1678 and /1677
9. https://analogjs.org/docs/features/server/static-site-generation
10. https://github.com/ng-bootstrap/ng-bootstrap#dependencies
11. https://developers.cloudflare.com/pages/
12. https://developers.cloudflare.com/workers/wrangler/configuration/ and …/static-assets/routing/advanced/html-handling/
13. https://developers.cloudflare.com/workers/static-assets/headers/
14. https://developers.cloudflare.com/workers/ci-cd/builds/build-image/ and …/limits-and-pricing/
15. https://developers.cloudflare.com/containers/pricing/

Secondary source: https://endoflife.date/angular (only for the Angular 15 LTS end date).
