# ProfilePage

A personal portfolio and markdown blog, built with Angular as a static site. Every page a visitor reaches is a file the build wrote, so a broken link only shows in the
built site, never on the development server. Rules, decisions and plans: [`AGENTS.md`](AGENTS.md).

## Commands

The code is Angular 22; build it on the Node in `.nvmrc` (26), after `npm ci`.

#### Gate (no install needed)

```bash
npm run gate
```

Enable the git hooks once per clone: `git config core.hooksPath .githooks`.

#### Build

```bash
npm run build
```

#### Preview the build

```bash
npm run preview
```

#### Unit tests

```bash
npm test
```

#### Deploy

The site is static files on Cloudflare Workers static assets (`wrangler.jsonc`); requests to
static assets are free on every plan. Not deployed from this repository yet. To connect it, in the
Cloudflare dashboard create a Worker from this GitHub repository (Workers Builds) with:

- build command: `npm ci && npm run build`
- deploy command: `npx wrangler@4.147.0 deploy` (pinned: wrangler is not a dependency of the site)

Cloudflare's build image reads `.nvmrc`; if it cannot provide Node 26, set `NODE_VERSION` to a 24.15
or newer release, which Angular 22 also supports. Response headers (CSP, security headers,
immutable caching of hashed files) come from `public/_headers`, completed by `tools/postbuild.mjs`.

The site's address is `https://www.fadiaz.cl` (`src/content/site.json`): every canonical URL, the
sitemap and `robots.txt` name that exact host. Attach it to the Worker as a custom domain; the bare
`fadiaz.cl`, if it is served at all, should redirect to it, which is set up in Cloudflare, not here.
