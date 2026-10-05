# External information worth knowing

Not a link list: every entry says what it contributes **to this project**, and when it contradicts
something already decided, it says that too. Something enters when it changed or confirmed a
decision, not because it is well written. The full findings, each with its source, are the dated
files in `docs/research/`; every new one gets a row here.

The four files of 2026-10-05 were written by delegated research agents and are relayed: the
Angular, Scully and ng-bootstrap versions and the Node range of Angular 22 were re-checked
first-hand on npm the same day; the rest is to be re-read at its source before a decision cites it.

## Research files

| Date | File | Answers |
|---|---|---|
| 2026-10-05 | `docs/research/2026-10-05-angular-scully-cloudflare.md` | Angular update path, Scully's state and replacement, ng-bootstrap versions, Cloudflare static hosting |
| 2026-10-05 | `docs/research/2026-10-05-gate-ci-deploy.md` | Lint and format, the gate command, Node pinning, deploy from CI, dependency updates, supply chain |
| 2026-10-05 | `docs/research/2026-10-05-pre-ship-verification.md` | Link checking of the built site, content validation, end-to-end and accessibility checks |
| 2026-10-05 | `docs/research/2026-10-05-site-quality-and-framework.md` | SEO, CSP and headers, page weight, accessibility, Angular vs Analog vs Astro |

## Angular and Scully

- **Angular release and version tables** (angular.dev/reference/releases, /versions) — the current
  major is 22; 15 is unsupported; updates go one major at a time, and each step has its own Node
  range.

  **What it confirms:** the update cannot skip steps, so it is a roadmap item of its own.

  **What we do differently, on purpose:** `.nvmrc` stays at 18 until the first step lands, against
  Node's own support schedule, because nothing newer runs Angular 15.

  **Not applied yet:** the whole update, i-115f49-8c7fbe.

  Produced: d-115f49-908ed6, d-115f49-6364c7.

- **Scully on npm and its issue tracker** — no stable release since 2022, built against Angular 12,
  unanswered "is it maintained" issues.

  **What it confirms:** Scully blocks the update; it is replaced, not upgraded.

  **Not applied yet:** the replacement (`@angular/ssr` static prerender, or Analog's content routes),
  i-115f49-8c7fbe and i-115f49-394f15.

  Produced: d-115f49-908ed6, d-115f49-9700ab.

## Gate and CI

- **actions/setup-node and the Cloudflare build image** — both read `.nvmrc`; Corepack is no longer
  bundled from Node 25.

  **What it confirms:** one pin file serves CI and the future host.

  Produced: d-115f49-6364c7.

- **Cloudflare Workers Builds vs `wrangler-action`** — Cloudflare's own Git integration builds and
  previews without a Cloudflare token in GitHub.

  **Not applied yet:** the deploy, i-115f49-ab7102; until then CI only runs the gate.

## What to read first

| If you are about to touch… | Read | And watch out for |
|---|---|---|
| `package.json` versions, the Angular update | `docs/research/2026-10-05-angular-scully-cloudflare.md` §1–3 | one major per step; the Node range changes at 17→18 and 21→22 |
| the blog or prerendering | the same file, §2, and `docs/research/2026-10-05-site-quality-and-framework.md` §5 | Scully's `<scully-content>` has no drop-in replacement |
| hosting, headers, caching | `docs/research/2026-10-05-angular-scully-cloudflare.md` §4–5 | Cloudflare's default trailing-slash redirect; SPA fallback serves the prerendered home |
| CI, lint, the gate | `docs/research/2026-10-05-gate-ci-deploy.md` | Workers Builds may deploy without waiting for GitHub checks (unverified) |
| templates, icons, fonts, SEO | `docs/research/2026-10-05-site-quality-and-framework.md` | a `<button routerLink>` renders no `href`: no link checker sees it |
