# Planned work

Accepted ideas, not yet built. **Not a promise and not a work order**: this is where each one will
collide, written now while it is clear. Every entry has a state (Planned, Half done, Done, Closed by
measurement, Blocked outside) and is never deleted. Ids come from
`python3 .agents/tools/bundle.py id i "<idea>"`.

## Where we are

2026-10-05. The site is Angular 15 with Scully, unchanged since 2023, deployed by a Docker image
with nginx; whether that image runs anywhere today is unknown. Angular 15's supported Node range
ends at 18; on this machine's Node 26 it is untested, and nothing has been installed or built yet.
The agent method is installed (`.agents/`, carrier `r-115f49`), the gate runs on sources only, and
CI runs it and the single-author check on every push. The owner's next step is updating the site:
i-115f49-8c7fbe first.

**Waiting on the owner:** nothing.

**To continue on another machine:** clone, `git config core.hooksPath .githooks`, Python 3.11+ for
`bundle.py`, Node 12.17 or newer for `npm run gate`; the Node in `.nvmrc` to build the code.
First step: `nvm use` (Node 18), `npm ci`, `npm run build`, and record what fails.

## Process and tooling

### i-115f49-679bb3 · Gate in CI and stop tracking generated files
**State: Done** (2026-10-05, s-115f49-bc5070). `.github/workflows/ci.yml` runs `npm run gate` on
every push and pull request; `.scully/` and the routes list Scully writes into `src/assets/` are
untracked and ignored.
**What is still missing:** the gate builds nothing and runs no test (d-115f49-7161fe); a build and
the test run join it in i-115f49-8c7fbe. `audit:fragments` checks a fragment against every
template, not the page its link opens. Whether the `./` paths in `.claude/settings.json` deny rules
hold for a session started in a subfolder is unverified, and they do not cover writes made through
the shell.

### i-115f49-7fea76 · Dependency updates with Dependabot
**State: Planned.** Dependabot with Angular minor and patch updates grouped, majors ignored.
**What it collides with.** Neither bot runs `ng update` migrations: a bot bumping an Angular major
would skip the code migrations. Turning it on before i-115f49-8c7fbe would open PRs against a
version line that is about to be replaced.
**What must be decided first.** Weekly or monthly; whether patches ever merge on their own.

## The framework

### i-115f49-8c7fbe · Update Angular from 15 to the current major and replace Scully
**State: Planned.** Decided: Angular stays (d-115f49-908ed6).
**What it collides with.** Scully does not run past Angular 15–16, so it must go before or during
the first steps; the blog's `<scully-content>` and `ScullyRoutesService` have no drop-in
replacement. The supported Node changes at 16→17, 19→20 and 21→22 (`docs/references.md`): Node 18
serves 15 to 19, and Node 22.22.3 or newer serves 18 to 22, so `.nvmrc` can move once, at 18, or
twice; it moves with the step, never ahead (d-115f49-6364c7). The output folder moves to `dist/profile-page/browser`
with the application builder. ng-bootstrap moves one major per Angular major.
**What is already in its favour.** About ten components; strict TypeScript and strict templates
already on; content already separated into JSON and markdown.
**What must be decided first.** The prerender path for the blog (`@angular/ssr` with a markdown
library, or Analog: i-115f49-394f15); whether to also migrate to standalone components, control
flow and zoneless during the update or after; Karma or Vitest. The specs are known to fail by
reading (`app.component.spec.ts` asserts markup the template does not have; header and project specs
provide no `HttpClient`): fix or replace them in the first step, so the test run can join the gate.

### i-115f49-394f15 · Evaluate Analog for markdown content routes
**State: Planned** (owner's request, 2026-10-05).
**What it collides with.** Analog moves the build to Vite and routing to files, which d-115f49-908ed6
does not rule out but i-115f49-8c7fbe would have to absorb; it needs Angular 20 or newer first.
**What is already in its favour.** It keeps Angular components as they are and brings markdown
content routes, front matter and a sitemap built in.
**What must be decided first.** Whether Analog replaces the hand-built markdown path inside
i-115f49-8c7fbe, or is evaluated after it.

### i-115f49-a26e87 · Evaluate Astro for the site
**State: Blocked outside** (owner's decision, 2026-10-05: keep Angular, no Astro for now).
**What it collides with.** Rewriting the pages as Astro would end d-115f49-908ed6; Astro with
Angular components embedded through Analog's Astro integration would keep Angular but add a second
toolchain.
**What would reopen it.** The owner asking for it again; the facts for that conversation are in
`docs/research/2026-10-05-site-quality-and-framework.md` §5. Do not propose it otherwise.

## Hosting

### i-115f49-ab7102 · Deploy on Cloudflare Workers static assets and retire Docker and nginx
**State: Planned.** Recommended by the research: a Worker with only static assets
(`wrangler.jsonc`), `html_handling: "drop-trailing-slash"`, `not_found_handling: "404-page"`, the
nginx security headers moved to `public/_headers`, and Cloudflare's Git integration building
previews, so no Cloudflare token lives in GitHub.
**What it collides with.** d-115f49-87d6c2: Cloudflare's default trailing-slash handling redirects
every internal link once. **It does not ship before i-115f49-e325d4**: the gate checks sources only,
and the check that blocks a broken built site is that item; a deploy before it ships the bug class
nobody here can see. Workers Builds may deploy without waiting for the GitHub check, so its
build command should run the gate too (unverified).
**What must be decided first.** Workers or Pages; whether Docker and nginx are deleted or kept for
local preview; whether to add a Content-Security-Policy.

## Verification

### i-115f49-e325d4 · Pre-ship verification of the built site
**State: Planned.** Content schemas the types derive from (replacing `audit:data` and `audit:posts`),
a link and fragment check over the built folder, and a smoke test with an accessibility check that
visits every route.
**What it collides with.** Links made by `<button routerLink>` render no `href`, so a link checker
cannot see them; they become `<a>` (i-115f49-636a4f) or the smoke test covers them.
**What must be decided first.** Which tools (the research recommends zod, linkinator and Playwright
with axe); whether Lighthouse blocks or only reports.

## The site

### i-115f49-636a4f · Site quality: accessibility, SEO, weight and CSP
**State: Planned.** Navigation as `<a>`, alt text, one `<h1>` per page and no duplicated content;
a title, description and social tags per route, a canonical and a sitemap; self-hosted fonts, the
icon font replaced by the icons used; a CSP.
**What it collides with.** Nothing settled; most of it is easier after i-115f49-8c7fbe.
**What must be decided first.** Order against the update.

### i-115f49-d63585 · Update the site content
**State: Planned.** Bio, projects and posts are the owner's to write; the only post is a test.
One project entry carries a stray top-level `color` that no model declares (`audit:data` advisory).
**What must be decided first.** The owner's text.

## Closed by measurement

None yet.

## What each one costs the invariant

| Idea | Does it break "every route, link, fragment and asset resolves as served"? |
|---|---|
| i-115f49-8c7fbe | Yes, during the update: every route is re-prerendered by a different tool and the output folder moves. |
| i-115f49-394f15 | Yes: routing moves to files, so every route is redefined. |
| i-115f49-a26e87 | Yes: every page is rewritten. |
| i-115f49-ab7102 | Yes, unless trailing-slash handling matches the links. |
| i-115f49-e325d4 | No: it is the check of the invariant against the built output. |
| i-115f49-636a4f | No, and it helps: `<a>` links become visible to link checkers. |
| i-115f49-d63585 | No. |
| i-115f49-7fea76 | No. |
