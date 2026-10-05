# Plan: ship the site and keep it current (2026-10-05)

**Goal, from the owner:** continue the roadmap. The site update (`2026-10-05-site-update.md`) is
done and merged into `main` locally, not pushed; the owner holds a zip of the built site. What is
left is shipping it, proving it behaves online as it does locally, and keeping it current without
breaking the one invariant (every route, link, fragment and asset resolves as served).

## Where each open item stands

| Item | State | Blocked by |
|---|---|---|
| i-115f49-ab7102 deploy | configured, not deployed | the owner: push, then deploy from the Cloudflare account |
| i-115f49-90d836 check of the deployed site (new) | planned | the deploy |
| i-115f49-097b7e screenshot comparison against a baseline (new) | planned; a scratch version proved the method on 2026-10-05 | nothing |
| i-115f49-ab51be deprecated packages out, Bootstrap 5.3 in (new) | planned | i-115f49-097b7e, as its safety net |
| i-115f49-7fea76 Dependabot | planned | the owner: weekly or monthly |
| i-115f49-636a4f site quality, what remains | the `noindex` fix (done since); Sass 3 | Sass 3's release |
| i-115f49-d63585 content | the projects' text | the owner's words |

Facts this plan rests on, read from the npm registry and the build on 2026-10-05:

- `@angular/animations` (deprecated by Angular in favour of `animate.enter`/`animate.leave`) and
  `@angular/platform-browser-dynamic` are dependencies nothing in `src/` imports.
- Bootstrap 5.3.8 is the latest; the site has 5.2.3. 5.3 still writes its Sass with `@import`.
- `@angular/compiler-cli` 22.2.1 accepts TypeScript `>=6.0 <6.1`; TypeScript 7 is out, so a bot must
  not offer it. Font Awesome 7 is a major; devicon 2.17 and marked 18.1 are minors.
- CI's actions are pinned by SHA, so their updates also need a bot to arrive.

## Phases

Each phase ends with `npm run gate` and `npm run check` green, and its numbers measured on the built
site. Production is touched only where the owner says so.

1. **Push and ship** (i-115f49-ab7102). Push `main`; CI runs both jobs on the merged work for the
   first time. Then the deploy, the owner's: `npx wrangler@4.147.0 deploy` from the repository (it
   reads `wrangler.jsonc`, which a dashboard drag-and-drop of the zip may not; ASSUMPTION, not
   checked), and `www.fadiaz.cl` attached as the Worker's custom domain, the bare domain redirected
   to it.
2. **Check the deployed site** (i-115f49-90d836). `tools/check-live.mjs <origin>`, read-only GET and
   HEAD requests against what the build promised:
   - every URL in `sitemap.xml` answers 200 at exactly that URL, no redirect;
   - `/about/` redirects to `/about` (`drop-trailing-slash`), an unknown URL answers 404 with the
     404 page and its `noindex`;
   - the `_headers` rules arrive on a 200 and on a 404, including the CSP;
   - a hashed file carries `immutable` once, not joined to the host's default `Cache-Control`;
   - `https://fadiaz.cl/` redirects to `https://www.fadiaz.cl/`.
   This answers the roadmap's "unverified until a deploy" list. Run by hand after a deploy; it is
   not in CI, because CI would then depend on production.
3. **Screenshot comparison** (i-115f49-097b7e). `tools/screenshots.mjs --compare <dir>`: every page
   at two widths plus the open menu and a hovered card, compared pixel by pixel with a baseline
   taken from the previous commit's build. Seen to fail on a planted difference, and shown
   deterministic (two captures, zero difference) before it is trusted. Not in CI (a baseline per
   runner's fonts would be needed); a local step for any style or template change.
4. **Dependencies by hand, once** (i-115f49-ab51be): remove the two unused packages; take Bootstrap
   5.3.8, devicon and marked minors, each its own commit, each with the comparison of phase 3 and
   `npm run check`. A changed pixel is looked at, not accepted blindly.
5. **Dependabot** (i-115f49-7fea76): `.github/dependabot.yml` for npm and GitHub Actions. Angular
   packages grouped; majors ignored for Angular (done by `ng update`), TypeScript (bounded by
   Angular) and Font Awesome. No auto-merge: a pull request merges after CI is green and, for a
   style dependency, after phase 3's comparison.
6. **When the owner publishes a real post** (i-115f49-636a4f): first the `noindex` fix for an
   unknown slug, with its test seen to fail; then the blog returns by itself (d-115f49-fb5f23). Its
   post pages join the sitemap through the build; the four skipped tests run again.

**Watched, not planned:** Dart Sass 3 removes `@import`, which Bootstrap 5 needs; `angular.json`
silences the warning. When `@angular/build` moves to Sass 3, the build fails loudly; the answer is
then a Bootstrap with Sass modules, or a stylesheet without Bootstrap.

**Not planned, and why:** `inject()` instead of constructors (harmless, i-115f49-8c7fbe);
`audit:fragments` per page (the built-site check already reads the page a link opens); Lighthouse
(the request budget, axe and the screenshot comparison cover what it would add here, and it is a
dependency).

## Decisions for the owner

1. Push `main` now, so CI verifies the merged work before the deploy.
2. Who runs the deploy: the owner, or the agent with the owner's Cloudflare login on this machine.
3. Dependabot's schedule: weekly or monthly.
4. Bootstrap 5.3: take it now with the comparison, or leave 5.2.3 until there is a reason.

## Ledger

Rulings taken on the owner's behalf while executing, and results, are appended here as they happen.

- 2026-10-05, the owner's answers: merge this plan and push `main`; the owner had already deployed
  the built site by hand, so phase 1 is done and phase 2 is next; **no Dependabot** (phase 5 is
  dropped, i-115f49-7fea76 blocked outside); Bootstrap 5.3 is wanted, in phase 4.
- 2026-10-05, phase 2 done: `tools/check-live.mjs`. Against the live site: 3 failures, all the
  owner's to fix in Cloudflare (a `wrangler deploy` for `drop-trailing-slash`; the bare domain still
  on an nginx server). `tools/serve.mjs` now redirects a trailing slash, as the host does, so the
  check passes against `npm run preview`.
- 2026-10-05, phase 3 done: `tools/screenshots.mjs --compare`, 11 shots, deterministic over two
  runs, a planted style change caught.
- 2026-10-05, phase 4 done, a commit each: the two unused packages out; Bootstrap 5.3.8 with
  `$enable-dark-mode: false`; marked 18.1. Every step: `npm run check` green, 11 screenshots
  identical. Ruling: devicon left at 2.15.1, since 2.17 drops the MySQL icon the about page shows
  and a replacement is a visual choice for the owner. With phase 5 dropped, phase 6 waits for a
  real post; what remains is the owner's (a `wrangler deploy`, the bare domain, the projects' text).
- 2026-10-05, phase 6 prepared without waiting for the post, at the owner's "continue with the next
  phase": the `noindex` fix (`blog/:slug` matches only a published slug, so an unknown one is the
  not-found page). A build with the test post published for the check, not committed, showed the
  blog returns whole. Nothing of this plan is left that is not the owner's.
