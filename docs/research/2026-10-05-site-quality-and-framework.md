<!-- Research for the bootstrap, Phase 2. Written by a delegated research agent on 2026-10-05; each claim cites the source it was read from. Not yet re-checked first-hand: treat as relayed until a decision cites it. -->

# Site quality research: SEO, CSP, weight, accessibility, framework option

Date: 2026-10-05. Scope: what to change on the site itself. Angular upgrade mechanics, the Scully
replacement and Cloudflare hosting are covered elsewhere. Web sources are listed at the end, [S1]..[S18].
Lines marked **ASSUMPTION** were not checked against a primary source. Repository facts come from a
read-only look at `src/`, `angular.json` and `package.json` on branch `chore/agents-bootstrap`.

Versions on the npm registry today: `@angular/core` 22.2.1; `@ng-bootstrap/ng-bootstrap` 21.0.0
(needs Angular ^22, `@angular/localize` ^22 and `@popperjs/core`); `@fortawesome/angular-fontawesome`
5.1.0 (Angular ^22); `@fortawesome/fontawesome-free` 7.3.1 (the repository uses ^6.4); `devicon`
2.17.0; `@analogjs/platform` 2.8.0; `astro` 7.3.5; `@fontsource/nunito` 5.3.0 (OFL-1.1).

---

## 1. SEO and social metadata

| # | Finding | Source | Confirms / contradicts in the current site | Decision it raises |
|---|---|---|---|---|
| 1.1 | Each route can set a `title` (a string or a `ResolveFn`). A custom `TitleStrategy` can add a suffix in one place ("Page · Name"). | [S1] | Today `index.html` has a single `<title>`. Every prerendered page has the same title. | Use route `title` plus a `TitleStrategy`. The same strategy, or a small service, can call `Meta.updateTag` for `description`, `og:title`, `og:description`, `og:image`, `og:url` and `twitter:card`, taking the values from route `data`. Prerendering writes them into each page's HTML. |
| 1.2 | Canonical: put `<link rel="canonical">` in `<head>` with an **absolute** URL. Include a self-referencing canonical. Don't let different methods give different canonicals for the same page. "make sure that JavaScript doesn't change the canonical link element." Redirects are a stronger signal than `rel=canonical`, which is stronger than the sitemap. | [S2] | No canonical exists today. | Write the canonical at prerender time and never change it on the client. Angular has no canonical service, so you inject a `<link>` through `DOCUMENT` (**ASSUMPTION**: no built-in API found). |
| 1.3 | Trailing slash on Cloudflare static assets: the default `auto-trailing-slash` serves `/about/index.html` at `/about/` and answers `/about` with a **307** redirect to `/about/`. `/about.html` is served at `/about`. `drop-trailing-slash` and `force-trailing-slash` make every URL consistent. | [S3] | Angular prerender writes `route/index.html` (**ASSUMPTION**, check the build output). `routerLink` makes `/about` without a slash. On a hard load, each internal URL would then go through a 307 to a different URL. | Pick one URL form and use it for the canonical, the sitemap, `og:url` and the Cloudflare `html_handling` setting. The fewest moving parts is probably `drop-trailing-slash` plus slash-less canonicals, since that matches `routerLink`. The other researcher owns the Cloudflare setting. |
| 1.4 | Sitemap: absolute URLs. `<lastmod>` is used only if it is "consistently and verifiably accurate". Google **ignores** `<priority>` and `<changefreq>`. Recommended at the site root, and can be referenced from robots.txt with `Sitemap: https://…/sitemap.xml`. A site of about 500 pages or fewer that is linked from the home page "may not need" one, though most sites benefit. | [S4][S5] | No sitemap or robots.txt today. The site is small, so a sitemap is optional. Blog posts are the main reason to have one. | Angular CLI has no sitemap generator ([S6] doesn't mention one). Options: a short Node script after the build that reads the prerendered route list or the `dist` HTML files and writes `sitemap.xml` with `lastmod` from post front-matter or the git date, plus a static `robots.txt` in `public/`. Analog and Astro have this built in (section 5). |
| 1.5 | ProfilePage structured data: `mainEntity` (a Person) and `name` are required. `sameAs`, `image`, `description` and `alternateName` are recommended. Valid examples include a blog's "About Me" page. Google "does not guarantee" rich results. | [S7] | No JSON-LD today. The `/about` page fits the "About Me" example. Whether a combined home page qualifies is unclear. The page says store home pages are invalid, and treating a mixed portfolio home page the same way is my reading, not Google's words. | Put `ProfilePage` + `Person` JSON-LD (with `sameAs` = GitHub and LinkedIn) on `/about`, and optionally a plain `Person` or `WebSite` on `/`. Note that a JSON-LD `<script>` is inline, so a hash-based CSP must cover it (section 2). JSON-LD is not executed, so check how hash-based CSP treats it (**ASSUMPTION**). Expect better understanding by Google, not a guaranteed rich result. |

## 2. Content Security Policy and headers

| # | Finding | Source | Confirms / contradicts | Decision |
|---|---|---|---|---|
| 2.1 | Angular `security.autoCsp: true` hashes every inline script in `index.html` at build time and adds a policy like `script-src 'strict-dynamic' 'sha256-…' https: 'unsafe-inline'; object-src 'none'; base-uri 'self';`. Quoted limits: "It only covers scripts. You must configure `style-src` separately." It "cannot be used with server-side rendering". In a `<meta>` policy, browsers ignore `frame-ancestors`, `report-uri` and `sandbox`. | [S8] | There is no CSP today. | autoCsp is described for `index.html`. Whether it also hashes the scripts in **prerendered** pages (hydration and event-replay inline scripts) is not documented (**ASSUMPTION**, test it). The fallback is a post-build script that hashes the inline `<script>` blocks in each `dist/**/*.html` and writes one CSP header (by route or merged) into the host's header config. `frame-ancestors` has to be sent as an HTTP header anyway. |
| 2.2 | Inline styles: Angular emulated encapsulation adds `<style>` elements at runtime, and inlining critical CSS adds a `<style>` to `index.html`. The documented ways around this are a **per-request nonce** (`ngCspNonce` / `CSP_NONCE`), which a static host can't provide without an edge function, or `style-src 'unsafe-inline'`. | [S8]; secondary: search result summarising angular/angular-cli discussions | Static Cloudflare plus Angular means `style-src 'self' 'unsafe-inline'` in practice. That is a much smaller risk than allowing inline script. | Accept `'unsafe-inline'` for styles only, or add an edge function that injects nonces (more cost and complexity). |
| 2.3 | autoCsp used to break the critical-CSS loader `media="print" onload="this.media='all'"` because the inline handler was blocked. Fixed (issue closed, PR #29638). | [S9] | Applies once the site is on a recent CLI with `inlineCritical` turned on. | Check the CLI version includes the fix, or turn off `inlineCritical` if a CSP violation appears. |
| 2.4 | A workable strict policy for this site. All images are local (`assets/img/*`). The only third-party origins are Google Fonts and outbound links. With **self-hosted fonts**: `default-src 'self'; script-src 'self' 'sha256-…'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`. **With Google Fonts**, add `https://fonts.googleapis.com` to `style-src` and `https://fonts.gstatic.com` to `font-src`. | built from [S8]+[S10]; **ASSUMPTION** that no other runtime origin exists (check the browser console) | Self-hosting fonts makes the policy `'self'`-only. | Roll it out first as `Content-Security-Policy-Report-Only`, then enforce. |
| 2.5 | OWASP: "CSP frame-ancestors directive obsoletes X-Frame-Options for supporting browsers", and keeps `X-Frame-Options: DENY` as a fallback. It recommends `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (e.g. `geolocation=(), camera=(), microphone=()`), HSTS `max-age=63072000; includeSubDomains; preload`, `nosniff`, `Cross-Origin-Opener-Policy: same-origin`, and `X-XSS-Protection: 0` or omitting it. MDN does not mark X-Frame-Options as deprecated (only its `ALLOW-FROM` value is obsolete) and points to `frame-ancestors` as the more complete option. | [S10][S11] | Today: `Referrer-Policy: strict-origin` is valid but stricter than the OWASP default. Sending both Feature-Policy and Permissions-Policy is redundant. MDN lists `Permissions-Policy` itself as "Experimental" and not Baseline [S12], and Feature-Policy is its predecessor. | Drop `Feature-Policy`. Keep `Permissions-Policy` (unsupported browsers ignore it). Add a CSP header with `frame-ancestors 'none'` and keep `X-Frame-Options: DENY` (cheap and harmless). Add COOP. Use `preload` in HSTS only if every subdomain is HTTPS. The headers move from nginx to Cloudflare config (other researcher). |

## 3. Weight and Core Web Vitals

Measured from jsDelivr today (raw / gzip). FA = FontAwesome free 6.x, which the repository uses.

| Asset | Raw | gzip |
|---|---|---|
| FA `all.min.css` | 74 KB | 21 KB |
| FA solid / brands / regular woff2 | 158 / 119 / 25 KB | (already compressed) |
| devicon `devicon.min.css` 2.17 | 130 KB | 19 KB |
| devicon font: the CSS lists **`devicon.ttf` before `woff`**, `font-display:block` | **1.5 MB** ttf (woff 1.5 MB) | ~0.8 MB if served gzipped |
| Bootstrap 5 `bootstrap.min.css` | 232 KB | 31 KB |
| Project images `src/assets/img/*.png` (repository) | ~1.5 MB in total (`game1.png` 862 KB) | n/a |

Usage in the repository: about 7 distinct FontAwesome icons (`fa-angle-right`, `fa-eye`, `fa-newspaper`, `fa-github-alt`, `fa-bars`, plus size classes) and 15 distinct `devicon-*` classes.

| # | Finding | Source | Confirms / contradicts | Decision |
|---|---|---|---|---|
| 3.1 | angular-fontawesome imports single icons (`import { faX } from '@fortawesome/free-solid-svg-icons'`, `<fa-icon [icon]="faX" />`), so only the icons used get bundled. Versions follow Angular: 5.x for Angular 22, 4.x for 21, 3.x for 20. FA 5, 6 and 7 work. | [S13] | Today two full font files (about 280 KB of woff2 plus 21 KB of CSS) are loaded for about 7 glyphs. | Option A: angular-fontawesome (a dependency tied to the Angular version). Option B: copy the 7 SVGs inline or into a sprite (no dependency, CSP-neutral). The FA Free icons are CC BY 4.0 and the code MIT (**ASSUMPTION**, check FA's LICENSE.txt before copying). angular-fontawesome adds its own `<style>` at runtime, which is covered by `style-src 'unsafe-inline'` (**ASSUMPTION**). |
| 3.2 | Devicon supports individual SVGs (via `<img>` from jsDelivr or copying the SVG) as well as the font. MIT licence, but brand logos stay "property of their respective owners". | [S14] | The biggest single cost on the site: about 1.5 MB for 15 icons, and `font-display:block` hides icon text for up to 3 s. | Copy the 15 SVGs into `assets/` (self-hosted, so no CDN in the CSP). The brand-policy caveat is unchanged from today. |
| 3.3 | Fonts: `font-display: optional` is the most CLS-safe and `swap` shows text soonest. Use WOFF2 only, and subset. Self-hosted and third-party fonts perform about the same, so speed is not the main argument. | [S15] | Today Nunito 200/400/800 comes from Google with `display=swap`. | Self-host with `@fontsource/nunito` (OFL-1.1). Import only the 3 weights and the latin subset. Fontsource cites privacy, version locking and no extra connection [S16]. |
| 3.4 | LG München, 20 Jan 2022, 3 O 17493/20: loading Google Fonts from Google's servers without consent sent the visitor's IP address to Google and broke the GDPR. The court awarded €100 and rejected "legitimate interest" because the fonts can be self-hosted. | [S17] (law-firm summary, not the judgment text) | The site loads `fonts.googleapis.com` and `fonts.gstatic.com`. Whether the GDPR applies to a site run from outside the EU depends on whether it targets EU visitors (**ASSUMPTION**, not legal advice). | Self-hosting removes the question at no real cost, and also simplifies the CSP (2.4). |
| 3.5 | ng-bootstrap 21 requires Angular ^22 plus `@angular/localize` and `@popperjs/core` as peer dependencies (npm registry). The repository uses only `ngbDropdown` (the mobile menu in `header.component.html`), yet imports the whole `NgbModule` in two modules. | npm registry; repository | Every Angular major means a matching ng-bootstrap major, plus a localize and Popper dependency, for one dropdown. | Options, from cheapest: (a) a native `<details>`/`<summary>` menu or a button with `aria-expanded` and about 20 lines of component code, no dependency; (b) Bootstrap's own dropdown JS (`bootstrap.bundle`, about 24 KB gzip, works outside Angular, so be careful with SSR); (c) keep ng-bootstrap and import only `NgbDropdownModule`. Keyboard and Escape behaviour has to be rebuilt in (a) (**ASSUMPTION** on effort). |
| 3.6 | Bootstrap CSS is about 31 KB gzip in full. Partial Sass imports can cut it (**ASSUMPTION**, not measured). | measured | Minor compared with devicon and the images. | Low priority. Converting the ~1.5 MB of PNGs to WebP or AVIF with `width`/`height` set (Angular `NgOptimizedImage`) probably helps LCP more (**ASSUMPTION**, not measured). |

## 4. Accessibility (WCAG 2.2 AA)

WCAG 2.2 adds AA criteria 2.4.11 Focus Not Obscured (Minimum), 2.5.7 Dragging Movements, 2.5.8 Target Size (Minimum) and 3.3.8 Accessible Authentication, and removes 4.1.1 Parsing [S18].

| # | Finding | Source | What the repository shows | Decision |
|---|---|---|---|---|
| 4.1 | `display:none` "will remove it from the accessibility tree", so screen readers don't announce it. | [S19] | `home`, `about`, `social`, `project` and `blog-landing` each render their content **twice**, once with `d-none d-md-flex` and once with `d-flex d-md-none`. `about.component.html` nests the same `respOptions` loop inside itself, giving **4 copies** with one visible. When CSS loads, screen readers hear only the visible copy, so the duplication is **not** a screen-reader bug in itself. The real costs: twice the DOM and change detection; several `<h1>` in the prerendered HTML that crawlers and reader modes see (**ASSUMPTION** about how Google weights hidden duplicates); the risk of duplicate `id`s; and everything appears twice if CSS fails to load. | Replace the duplicates with one copy using responsive classes (`display-3` from a breakpoint, e.g. Bootstrap's responsive font sizes or `clamp()`). Also fixes heading misuse (4.4). |
| 4.2 | Angular: re-use native `<button>`/`<a>` "rather than re-implementing well-supported behaviors". Use `RouterLinkActive` `ariaCurrentWhenActive` for the current page. Move focus deliberately after navigation (`NavigationEnd`). | [S20] | `header.component.html:2` and `footer.component.html:2` put `routerLink="/"` on a `<div>`. That is not focusable and has no keyboard access, so it fails 2.1.1 Keyboard (A). Several **`<button routerLink>`** elements (home, project) navigate: they work by keyboard but say "button" for what is navigation, and they render no `href` in the prerendered HTML, so crawlers can't follow them (**ASSUMPTION**: `RouterLink` on a non-`<a>` element sets no href). | Use `<a routerLink>` for every navigation, styled as a button if needed. Add `ariaCurrentWhenActive="page"` to the nav. |
| 4.3 | 1.1.1 Non-text Content (A). | [S18] | `project.component.html:22`: `<img src="{{project.imageUrl}}">` has **no `alt`**. Stack icons in `about` are `<i class="devicon-…">` with no text, so screen readers get nothing for "my stack". Decorative FA `<i>` inside text buttons have no `aria-hidden`. | `alt` from the project data (e.g. `alt=""` if the title sits next to it). Give each stack icon a visible label or `aria-label` / `role="img"` on an SVG. Mark decorative icons `aria-hidden="true"`. |
| 4.4 | 1.3.1 Info and Relationships (A): headings must show structure. | [S18] | Intro and about paragraphs are rendered as `<h2>`, `<h4>` or `<h5>` depending on viewport. The home page has several `<h1>` (hero, About, Projects…). | Paragraphs as `<p>` styled large. One `<h1>` per page, sections as `<h2>`. |
| 4.5 | 1.4.3 Contrast (AA) 4.5:1 for text; 1.4.11 Non-text Contrast 3:1 for graphics needed to understand content. | [S18] | The theme is mostly Bootstrap `dark` / `outline-dark` on white, which likely passes (**ASSUMPTION**, not measured). Stack icons use colours from data (`stack.color.icon` on `stack.color.background`), so each pair needs checking. | Run axe or Lighthouse on the prerendered pages and check the icon colour pairs. 2.5.8 Target Size: icon-only links (social, menu) need a target of at least 24×24 CSS px. |

## 5. Framework option (facts only, the owner decides)

| | Stay on Angular (upgrade + built-in prerender) | Analog.js | Astro |
|---|---|---|---|
| What it is | Angular CLI `outputMode: "static"` / `RenderMode.Prerender`, with `getPrerenderParams` for dynamic routes such as `blog/:slug` [S6] | Vite-based Angular meta-framework, `@analogjs/platform` 2.8.0, supports Angular 20 to 22 | Content-first framework, 7.3.5. Ships zero JavaScript by default. The Astro company joined Cloudflare in Jan 2026; it stays MIT-licensed and not tied to one host [S21] |
| Markdown blog | Not built in. You have to write a markdown loader, front-matter parser and highlighter yourself (replaces Scully's `<scully-content>`) | Built in: `src/content/*.md` with front-matter, `injectContentFiles()` / `injectContent()`, PrismJS or Shiki, Mermaid [S22] | Built in: Content Collections, markdown/MDX, Shiki (**ASSUMPTION** on details, docs not fetched) |
| Sitemap | Your own script | Built in: `prerender.sitemap.host`, plus `contentDir` route generation and `static: true` [S23] | `@astrojs/sitemap` (needs `site`, writes `sitemap-index.xml`) [S24] |
| Migrating ~10 components | Smallest: same code, an upgrade from 15 to 22 (the other researcher prices this) | Medium: components stay Angular, but routing becomes file-based (`src/app/pages`) and the build moves to Vite. Analog also needs the Angular upgrade first (Angular ≥20) | Largest: rewrite templates as `.astro` (HTML plus front-matter script). The stack filter on `/project` and the menu need a small client island in plain JS or a UI framework. `@analogjs/astro-angular` can embed Angular components, but that keeps the Angular toolchain |
| Cloudflare static | Static `dist/.../browser` folder (other researcher) | Documented Cloudflare Pages preset; output `dist/analog/public` [S25] | Documented: static sites need no adapter, `astro build && wrangler deploy` with `assets.directory: ./dist` [S26] |
| Upkeep | Angular major every ~6 months, plus ng-bootstrap and angular-fontawesome majors in lockstep (3.1, 3.5) | Angular's cadence plus Analog's (a smaller project with a smaller team; **ASSUMPTION** on bus factor) | Astro majors also come about yearly (7.x today); a plain-HTML portfolio has few dependencies to bump (**ASSUMPTION**) |
| JavaScript shipped | Full Angular runtime and hydration on every page | Same as Angular | None by default; only the interactive islands |
| Fit with sections 1 to 4 | `TitleStrategy`/`Meta` plus your own scripts; CSP needs hashes of the prerendered inline scripts | Same as Angular for CSP; meta from front-matter is built in | Head tags written straight into the HTML; no hydration scripts, so a hash or `'self'`-only CSP is simpler (**ASSUMPTION**) |

Key trade-off: Angular and Analog keep the owner's Angular skills, and the portfolio stays a
showcase of Angular. Astro sheds most of the runtime and upkeep, but the site is rewritten and stops
being Angular code.

---

## Sources (fetched 2026-10-05)

- [S1] Angular, Define routes (route `title`, `TitleStrategy`): https://angular.dev/guide/routing/define-routes
- [S2] Google Search Central, Consolidate duplicate URLs: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- [S3] Cloudflare Workers static assets, HTML handling: https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/
- [S4] Google Search Central, Build and submit a sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- [S5] Google Search Central, Sitemaps overview: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- [S6] Angular, Server and hybrid rendering (prerender, `getPrerenderParams`): https://angular.dev/guide/ssr
- [S7] Google Search Central, ProfilePage structured data: https://developers.google.com/search/docs/appearance/structured-data/profile-page
- [S8] Angular, Security (CSP, autoCsp, nonce): https://angular.dev/best-practices/security
- [S9] angular/angular-cli issue #29603 (autoCsp vs critical CSS onload): https://github.com/angular/angular-cli/issues/29603
- [S10] OWASP HTTP Headers Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
- [S11] MDN, X-Frame-Options: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
- [S12] MDN, Permissions-Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy
- [S13] FortAwesome/angular-fontawesome README: https://github.com/FortAwesome/angular-fontawesome
- [S14] devicons/devicon README: https://github.com/devicons/devicon
- [S15] web.dev, Best practices for fonts: https://web.dev/articles/font-best-practices
- [S16] Fontsource introduction: https://fontsource.org/docs/getting-started/introduction
- [S17] activeMind.legal, LG München 3 O 17493/20 summary: https://www.activemind.legal/guides/ruling-google-fonts/
- [S18] W3C WAI, What's new in WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- [S19] MDN, CSS `display` (accessibility notes): https://developer.mozilla.org/en-US/docs/Web/CSS/display
- [S20] Angular, Accessibility best practices: https://angular.dev/best-practices/a11y
- [S21] Cloudflare blog, Astro is joining Cloudflare: https://blog.cloudflare.com/astro-joins-cloudflare/
- [S22] Analog, Content routes: https://analogjs.org/docs/features/routing/content
- [S23] Analog, Static site generation: https://analogjs.org/docs/features/server/static-site-generation
- [S24] Astro, @astrojs/sitemap: https://docs.astro.build/en/guides/integrations-guide/sitemap/
- [S25] Analog, Deployment providers: https://analogjs.org/docs/features/deployment/providers
- [S26] Astro, Deploy to Cloudflare: https://docs.astro.build/en/guides/deploy/cloudflare/
- Plus the npm registry (`registry.npmjs.org/<pkg>/latest`) for versions and peer dependencies, and jsDelivr for asset sizes.

Over the ~15 cap: S21 to S26 are short single-fact checks for section 5. Drop them if the cap is
strict, and section 5 keeps only the npm-registry facts.
Not fetched: the Open Graph / X card specifications (the tag names in 1.1 are standard; **ASSUMPTION**),
the WCAG "Understanding" pages, and the Astro content-collections docs.
