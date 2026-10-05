# Decisions

Everything settled, with what enforces it. The prose and the measurements live in the document
each row points at; this file is the index that finds them. A decision is made once: reopened with
no new fact, the answer is this file. A row with `—` in the last column can be broken silently.

Ids come from `python3 .agents/tools/bundle.py id d "<decision>"`, are frozen when minted and never
reused. A reversed row says so in place and points at what replaced it.

## The site

| Id | Decision | Why | Enforced in |
|---|---|---|---|
| d-115f49-87d6c2 | Every literal route link and fragment resolves to a route the router defines and an id a template renders | A route rename once had to touch five files by hand, and the tracked routes list regressed it afterwards; a development server hides a broken link because it routes client-side | `audit:routes`, `audit:fragments` |
| d-115f49-9700ab | Files Scully generates are not tracked (`.scully/`, the routes list in `src/assets/`) | A tracked copy is served in place of its source and goes stale silently (card `derived-copy-goes-stale-silently`); the tracked copy also carried a machine-local home path into a public repository | `audit:generated`, `.gitignore` |
| d-115f49-314943 | The site is hosted as Cloudflare Workers static assets with no Worker script: `wrangler.jsonc` and `public/_headers` | Owner's goal, 2026-10-05: fast and static. Static asset requests are free and unlimited on every plan, only a Worker script spends the free quota (Cloudflare's billing pages, read first-hand); Docker and nginx have no role there | `wrangler.jsonc` has no `main`; `tools/measure.mjs --budget 4` fails on any third-party request |
| d-115f49-908ed6 | Angular stays the framework, updated to the current major, without Astro for now; Analog is evaluated as a roadmap item | Owner's decisions, 2026-10-05 (Astro set aside the same day: i-115f49-a26e87); Angular 15 left support in 2024 and Scully does not follow it past 15 (`docs/research/2026-10-05-angular-scully-cloudflare.md`) | — |

## The repository and its process

| Id | Decision | Why | Enforced in |
|---|---|---|---|
| d-115f49-dadcf1 | `AGENTS.md` is the single instruction source; `CLAUDE.md` holds only `@AGENTS.md` | Two instruction files that can disagree will; Claude Code reads `CLAUDE.md`, the other assistants read `AGENTS.md` | `audit:doc-paths` checks both exist; the import line itself is — |
| d-115f49-7161fe | `npm run gate` is the one gate, and it runs without an install | The code's supported Node (18) is out of support and nothing is installed, so a gate that needed a build would not run before the update; one command means one definition of green | `.githooks/pre-commit`, `.github/workflows/ci.yml` |
| d-115f49-7d644b | `npm run check` verifies the built site in CI: tests, the prerendered build, every internal link and fragment in it, and at most 4 non-image requests per page with none to another origin | Broken links were the history's one recurring bug, and they only show in the built output; the budget keeps the request diet from eroding (from 22 requests on `/` to 4) | `.github/workflows/ci.yml` job `site`; `tools/check-site.mjs`; `tools/measure.mjs --budget 4` |
| d-115f49-cad445 | Every commit has one author and no `Co-Authored-By` trailer | Owner's rule for every repository; tools add the trailer by default | `.githooks/commit-msg`; CI checks every commit, for clones without the hook |
| d-115f49-6364c7 | Node is pinned in `.nvmrc` only, at the version the current Angular supports | Two pins drift; CI's `setup-node` and Cloudflare's build image both read `.nvmrc` (`docs/research/2026-10-05-gate-ci-deploy.md`) | `.github/workflows/ci.yml` reads it; the version itself is — |
| d-115f49-c0e193 | Repository documents are written in English; the conversation is in Spanish | Owner's rule; identifiers and commands are English already | — |
| d-115f49-17da15 | No nested `CLAUDE.md` while the repository has one area — *a non-decision, recorded so it is not proposed as a cleanup* | Every rule here applies to all of `src/`; a nested file would repeat the root | — |
