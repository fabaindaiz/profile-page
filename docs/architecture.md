# Architecture

## The tree

| Path | Holds |
|---|---|
| `src/app/app-routing.module.ts` | the top routes, each lazily loading a feature module |
| `src/app/core/` | what every page uses: header, footer, the content models (`models/`) and the services that read them (`services/`) |
| `src/app/portfolio/` | home, about, projects and links; routed by `portfolio-routing.module.ts` |
| `src/app/blog/` | the blog landing and a post; routed by `blog-routing.module.ts` |
| `src/assets/json/` | the content: about, projects, stack, social |
| `src/assets/img/` | project images |
| `blog/` | the posts, markdown with front matter |
| `scully.profile-page.config.ts` | which routes Scully prerenders, the blog's content folder among them |
| `Dockerfile`, `nginx/` | today's deploy: build in Node with Chrome, serve with nginx |
| `tools/audit.mjs` | the structural checks the gate runs |

## Layers

Feature modules (`portfolio`, `blog`) depend on `core`; `core` depends on no feature. Checked by
reading on 2026-10-05; not enforced.

## Where a new file goes

- **New content of an existing kind**: an entry in its JSON file, or a post in `blog/`. Nothing else.
- **A new kind of content**: a model in `src/app/core/models/`, a service beside the others that
  reads its JSON (copy `src/app/core/services/social.service.ts`), and a row in `DATA` in
  `tools/audit.mjs`.
- **A new section of a page**: a component in its feature module, exposing the service's
  observable as a `$` field read with the `async` pipe (copy
  `src/app/portfolio/social/social.component.ts`).
- **A new route**: in the feature's routing module, with any link to it written as a literal
  `routerLink` or a `*Path:` field, so `audit:routes` sees it.

## Deliberate deviations

- Responsive layout renders some blocks twice (`respOptions`), one hidden per breakpoint. Recorded
  as it is, not as intended: i-115f49-636a4f replaces it.
