# Architecture

A standalone Angular application: no NgModules, no zone.js, every route loaded with the app. A
first visit fetches the page's HTML, one script, one stylesheet and one font, and nothing else
(`tools/measure.mjs` measures it).

## The tree

| Path | Holds |
|---|---|
| `src/main.ts`, `src/app/app.config.ts` | the bootstrap and its providers: zoneless change detection, the router with anchor scrolling |
| `src/app/app.routes.ts` | every route, flat, each naming its component directly |
| `src/app/core/` | what every page uses: header, footer, the icon component, the content models (`models/`) and the services that serve them (`services/`) |
| `src/app/portfolio/` | home, about, projects and links |
| `src/app/blog/` | the blog landing and a post, routed only while a post is published (`siteRoutes` in `src/app/app.routes.ts`) |
| `src/app/not-found/` | the page for any URL no route matches |
| `src/content/` | the content: about, projects, stack, social, and the site's address (`site.json`); imported into the bundle by the services |
| `src/assets/img/` | project images |
| `blog/` | the posts, markdown with front matter |
| `tools/icons.mjs`, `tools/posts.mjs` | generate the inline icons and the posts into the bundle before every build (`npm run generate`) |
| `tools/serve.mjs`, `tools/measure.mjs` | serve a build as the host will; count each page's requests and bytes |
| `wrangler.jsonc`, `public/_headers`, `tools/postbuild.mjs` | hosting on Cloudflare static assets: the build folder, URL handling, response headers (CSP hashes and immutable caching filled in after each build), `404.html`, `sitemap.xml` and `robots.txt` |
| `tools/audit.mjs` | the structural checks the gate runs |

## Layers

Features (`portfolio`, `blog`, `not-found`) depend on `core`; `core` depends on no feature. Checked by
reading on 2026-10-05; not enforced.

## Where a new file goes

- **New content of an existing kind**: an entry in its file in `src/content/`, or a post in `blog/`.
- **A new kind of content**: a model in `src/app/core/models/`, a service beside the others that
  imports its JSON and assigns it to the model (copy `src/app/core/services/social.service.ts`), and
  a row in `DATA` in `tools/audit.mjs`.
- **A new section of a page**: a standalone component in its feature folder, exposing the service's
  observable as a `$` field read with the `async` pipe (copy
  `src/app/portfolio/social/social.component.ts`).
- **A new page**: a component, and its route in `src/app/app.routes.ts`, with every link to it
  written as a literal `routerLink` or a `*Path:` field, so `audit:routes` sees it.
- **A new icon**: name it (`devicon-<name>-<variant>` or `fa-<style>-<name>`) in a template or in the
  content; `tools/icons.mjs` generates it, and fails the build if the packages have no such SVG.

## Deliberate deviations

- Every route is loaded with the app instead of lazily: the whole site is one small bundle, and a
  lazy chunk would cost every first visit one more request.
