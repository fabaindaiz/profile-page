<!-- Research for the bootstrap, Phase 2. Written by a delegated research agent on 2026-10-05; each claim cites the source it was read from. Not yet re-checked first-hand: treat as relayed until a decision cites it. -->

# Verification tooling for a prerendered Angular portfolio + blog (research, 2026-10-05)

Scope: static Angular SPA prerendered with `@angular/ssr` (`outputMode: "static"`), hosted on Cloudflare,
JSON content in `src/assets/json`, markdown posts with front matter. Repo today: no gate, no CI, no lint.

Release and maintenance data below was taken on 2026-10-05 from the GitHub REST API
(`gh api repos/<repo>/releases/latest`) and `npm view` (version, last publish, unpacked size).
Current versions seen: Angular 22.2.1, `@angular/ssr` 22.2.1, `@playwright/test` 1.63.0.

Context fact used throughout (source S12): with `outputMode: "static"` and `RenderMode.Prerender`
the build writes `dist/<app>/browser/<route>/index.html` per route (dynamic routes via
`getPrerenderParams`), servable by any static server. So every check below runs against
`dist/<app>/browser`, the same tree Cloudflare will serve.

---

## 1. Link / route / fragment checking of the built output

| Tool | Status (2026-10) | Local dir / offline | Fragments | CI |
|---|---|---|---|---|
| **lychee** (Rust binary) | v0.24.2 (2026-05-01), pushed 2026-09-28 | `--offline` "only check local files and block network requests"; `--root-dir` resolves root-relative links; `--base-url` | `--include-fragments` (modes anchor-only / text-only / full); "JavaScript-generated anchors cannot be checked" | `lycheeverse/lychee-action@v2` (v2.9.0, 2026-07-09); `--cache` + `actions/cache` |
| **linkinator** (npm) | v8.1.0 (2026-08-29), pushed 2026-09-29; ~184 kB unpacked | Stands up its own static server for a local path; `--recurse` crawls same-origin links | `checkFragments` option validates `#anchor` targets | `JustinBeckwith/linkinator-action@v2` (v2.5.0, 2026-08-29) |

What it confirms: every `<a href>` present in the prerendered HTML (router links, nav, generated
routes, asset URLs, `#fragments` whose `id` is in the prerendered HTML) resolves to a file in the build.

Limits that matter for this repo's bug class:
- Navigation done by `(click)` + `router.navigate()` on a `<button>` produces no `href`: **no static
  link checker sees it**. Either make such buttons `<a routerLink>` (then they are checked) or cover
  them in the e2e smoke (section 5).
- Fragment ids generated in the browser after hydration (e.g. markdown heading ids added client-side)
  are invisible to both tools. ASSUMPTION: if markdown is rendered during prerender, heading ids are
  in the HTML and checkable; verify on the first build.
- ASSUMPTION (not verified in docs read): lychee does not crawl recursively; it checks the files you
  give it (a directory glob covers all prerendered pages anyway). How each tool maps `/about` to
  `about/index.html` must be confirmed on the first run; Cloudflare's own trailing-slash / `index.html`
  behaviour (not researched here) is the reference.

**Recommendation: linkinator** for this repo: it is an npm devDependency, so `npm run check:links`
(`linkinator dist/<app>/browser --recurse --check-fragments --skip '^https?://(?!localhost)'`-style
config, exact flags to be confirmed against its README) runs identically on the laptop and in CI with
no extra binary, and it serves the directory over HTTP, which is closer to "as served".
**lychee** is the stronger choice if external links (social profiles, project URLs) are also to be
checked on a schedule: faster, cached, with an issue-creating action. Middle ground: linkinator offline
in the gate; lychee-action on a weekly cron for external links, non-blocking (`fail: false`).

Repo change: one devDependency + one script + one CI step after `ng build`. Cost: seconds of CI.
Decision for owner: gate on internal links only (recommended) or also on external links (flaky:
third-party sites rate-limit / go down).

## 2. Validating JSON data files against the TS types

Options (one source of truth?):
- **zod v4** (4.6.5, 2026-09-13): schema in TS, type via `z.infer`, and `z.toJSONSchema()` built in
  (Draft 2020-12 default, also Draft 7/4, OpenAPI 3.0) to emit a JSON Schema for editors. One source
  of truth = the zod schema. Unpacked 6.1 MB but only used in a test/build script, not shipped (unless
  you also choose to validate at runtime; `zod/mini` exists for that).
- **valibot** (1.5.0, 2026-09-09): same model, smaller runtime; JSON Schema via the separate
  `@valibot/to-json-schema` (1.8.0). Equivalent; pick only if runtime bundle size matters.
- **JSON Schema + ajv** (ajv 8.20.0, 2026-04-24): schema is the source; TS types would need a
  generator (json-schema-to-typescript, not researched) or are duplicated by hand. Fine if the owner
  wants language-neutral schemas, but two artefacts to keep in sync.
- **ts-json-schema-generator** (2.9.0 on npm, 2026-10-02): interfaces stay the source; generate
  JSON Schema, then validate with ajv. Keeps existing interfaces untouched; costs a generate step and
  ajv. **typescript-json-schema** says it is "more or less in maintenance mode" and points to
  ts-json-schema-generator: avoid.
- **typia** (15.1.0, 2026-10-02): compile-time transformer; docs now require the TypeScript 7
  transformer path (`ttsc`, or `@ttsc/unplugin` for bundlers) and warn that stock `tsc` does not load
  it. No Angular guidance. Too invasive for an Angular CLI (esbuild) project: avoid.

**Recommendation: zod schemas as the single source of truth**, `type About = z.infer<typeof AboutSchema>`
replacing the hand-written interfaces, plus one test (or `scripts/validate-content.ts`) that parses every
file in `src/assets/json` and every post's front matter. Optionally `z.toJSONSchema()` writes
`schemas/*.schema.json` for the editor. Least-change alternative: keep interfaces, add
ts-json-schema-generator + ajv in the test step.

VS Code wiring (S6): in `.vscode/settings.json`
`"json.schemas": [{ "fileMatch": ["src/assets/json/about.json"], "url": "./schemas/about.schema.json" }]`.
Prefer this over a `$schema` key inside the data file: VS Code docs warn `$schema` "changes the JSON
itself, which systems consuming the JSON might not expect".

What it confirms: a JSON whose shape drifts fails the gate instead of rendering an empty section.
Decision for owner: zod (types derived from schema, interfaces deleted) vs. keep interfaces and generate
schemas (no app-code change, two tools). Also: validate at runtime too (show an error state) or only
at build/test time (recommended: build/test only; content is static and ships with the build).

## 3. Front-matter validation

- `remark-lint-frontmatter-schema` last published 2023 (3.15.4): stale.
- `remark-lint-frontmatter-validation` (1.0.4, 2026-08-20) describes itself as a modern replacement,
  validates YAML/TOML front matter against JSON Schema (source: its GitHub README via search result,
  not read in full: ASSUMPTION on details).
- `gray-matter` (4.0.3) and `front-matter` (4.0.2) parsers have had no release since 2023 but are
  stable; `yaml` (2.9.1, 2026-09) is active.

**Recommendation:** no remark plugin. Reuse the same mechanism as section 2: parse front matter with
whatever the build already uses (or `yaml` on the `---` block) and validate with a zod `PostMetaSchema`
in the same content test; also assert each post's slug appears in the generated routes list and vice
versa (that is the regression this repo had). Cost: zero extra tools if zod is chosen.

## 4. Lighthouse CI and accessibility automation

- **Lighthouse CI** `@lhci/cli` 0.15.1 (2025-06-26; repo pushed 2026-03): maintained but slow-moving.
  `collect.staticDistDir` serves a build dir itself; `numberOfRuns` default 3; assertions per audit,
  e.g. `"categories:performance": ["warn", {"minScore": 0.9}]`,
  `"largest-contentful-paint": ["error", {"maxNumericValue": 2500}]`; `upload.target:
  "temporary-public-storage"` (public URLs: set `filesystem` or omit upload if reports should stay
  private). No official GitHub Action; the documented way is `npm install -g @lhci/cli@0.15.x && lhci autorun`.
- **Thresholds (web.dev, S10)**, evaluated at p75: LCP good <= 2.5 s, poor > 4 s; INP good <= 200 ms,
  poor > 500 ms; CLS good <= 0.1, poor > 0.25. Lab runs cannot measure INP; use TBT as the lab proxy.
  Sensible portfolio budget: error on `categories:accessibility` < 0.95 (or 1.0), LCP > 2500 ms,
  CLS > 0.1; warn on `categories:performance` < 0.9 (CI runners are noisy), `aggregationMethod: "median"`.
- **@axe-core/playwright** 4.13.0 (2026-09): `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa',
  'wcag21a','wcag21aa']).analyze()`; Playwright docs stress that "many accessibility problems can only
  be discovered through manual testing".
- **pa11y-ci** 4.1.1 (2026-05): URL list or sitemap (`--sitemap-find/replace` to point at localhost),
  runs its own Puppeteer Chrome; Node >= 20.

**Recommendation:** if Playwright is adopted (section 5), do a11y with `@axe-core/playwright` inside
the same smoke specs (one browser install, one job); skip pa11y-ci. Add LHCI as a separate,
optional job (warn-level performance, error-level a11y/CLS/LCP) on `staticDistDir`. Cost: LHCI ~1-3 min
per run for a handful of URLs x 3 runs (ASSUMPTION, not measured). Decision for owner: whether
Lighthouse blocks merges or only reports, and whether reports may go to public temporary storage.

## 5. Smoke / e2e

- Angular CLI (S11): `ng e2e` prompts to install one of Cypress, Nightwatch, WebdriverIO, Playwright,
  Puppeteer; there is no single official default.
- **Playwright** `@playwright/test` 1.63.0 (published 2026-10-05): `webServer: { command, url,
  reuseExistingServer: !process.env.CI }` + `use.baseURL` serves the static build (e.g.
  `npx serve dist/<app>/browser` or `http-server`) before tests; axe integration documented on
  playwright.dev.
- **Cypress** 16.1.1 (2026-09-29): actively maintained; component testing supports Angular ^21 and
  ^22, zoneless without zone.js since 16.0.0, but still requires `@angular-devkit/build-angular`
  installed even on `@angular/build` projects. Unpacked 4.6 MB npm package plus its own binary.

**Recommendation: Playwright**, Chromium only, against the served static build: visit every route in the
generated routes list, assert HTTP 200, a non-empty main section per JSON-driven section (catches the
empty-section failure end-to-end), click each nav item and each button that navigates, and run axe.
This covers what link checkers cannot (button navigation, client-side fragments, hydration errors via
`page.on('console')`). Cost: `npx playwright install --with-deps chromium` ~1 min in CI (cacheable,
ASSUMPTION); tests seconds. Decision for owner: Playwright vs Cypress (recommended Playwright: lighter
setup, no devkit dependency, axe and webServer built into docs); one browser or three.

---

## What this adds to a repo with no gate today (proposed order, each step reversible)

1. `npm run validate:content` (zod over JSON + front matter + routes-list consistency) in the unit test
   run. Cheapest, catches the silent-empty-section class.
2. `ng build` then `npm run check:links` (linkinator offline over `dist/<app>/browser`).
3. Playwright smoke + axe over every prerendered route.
4. Optional: LHCI job; weekly lychee-action for external links.

A single `npm run gate` chaining 1-3 is the local equivalent of CI. One GitHub Actions job on
`ubuntu-latest`: install, build, gate; estimated 3-5 CI minutes per push (ASSUMPTION, not measured).

## Sources (read for this report)

- S1 lychee README: https://github.com/lycheeverse/lychee
- S2 lychee fragments recipe: https://lychee.cli.rs/recipes/anchors/
- S3 lychee-action: https://github.com/lycheeverse/lychee-action
- S4 linkinator README: https://github.com/JustinBeckwith/linkinator
- S5 Zod JSON Schema: https://zod.dev/json-schema
- S6 VS Code JSON: https://code.visualstudio.com/docs/languages/json
- S7 typescript-json-schema README (maintenance note): https://github.com/YousefED/typescript-json-schema ; typia setup: https://typia.io/docs/setup/
- S8 Lighthouse CI getting started: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md ; configuration: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
- S9 Playwright a11y: https://playwright.dev/docs/accessibility-testing ; webServer: https://playwright.dev/docs/test-webserver
- S10 web.dev CWV thresholds: https://web.dev/articles/defining-core-web-vitals-thresholds (and https://web.dev/articles/vitals)
- S11 Angular e2e: https://angular.dev/tools/cli/end-to-end ; Cypress Angular CT: https://docs.cypress.io/app/component-testing/angular/overview ; pa11y-ci: https://github.com/pa11y/pa11y-ci
- S12 Angular SSR / prerender: https://angular.dev/guide/ssr
- Front-matter linters seen only via web search result snippets (ASSUMPTION on details):
  https://github.com/Nick2bad4u/remark-lint-frontmatter-validation , https://github.com/JulianCataldo/remark-lint-frontmatter-schema
- Versions/dates: GitHub REST API releases endpoint and `npm view`, queried 2026-10-05.

Note: pages were read through a summarising fetcher; quoted flags and snippets should be re-checked
against the page when wiring them in.
