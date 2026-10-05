# Agent changelog

One entry per session that changes the repository, **newest on top, directly below this
paragraph**. Sessions cannot see each other: this file is how the next one learns what this one
changed, broke, or could not verify. Start an entry with
`python3 .agents/tools/bundle.py new entry "<title>" --write`. The format reference is at the end
of the file.

---

## 2026-10-05 · s-115f49-187eff — Optimise the static build and update Angular to 22

**What.** Executed `docs/plans/2026-10-05-site-update.md`, phases 1 to 6: a measured baseline; the
request diet (inline SVG icons generated from the icon packages, content compiled into the bundle,
a native menu instead of ng-bootstrap, the font served from the site, posts converted at build time
instead of Scully); Angular 15 to 22 by `ng update`, the application builder, standalone, zoneless,
static prerendering with `@angular/ssr`; a Vitest suite; `npm run check` in CI (tests, build, link
and fragment check of the built HTML, request budget, console and CSP errors, axe); Cloudflare
static-assets configuration with a CSP, and Docker and nginx removed; accessibility and SEO fixes.

**Areas.** `src/`, `tools/`, `public/`, `wrangler.jsonc`, `angular.json`, `package.json`,
`tsconfig*.json`, `.nvmrc`, `.github/workflows/ci.yml`, `.vscode/launch.json`, `AGENTS.md`,
`README.md`, `docs/`, `.claude/skills/`.

**Why.** The owner asked to optimise the static build for the fewest requests per page, because of
Cloudflare's free plan, and for a plan to improve and complete the site; then: the goal is speed and
a static site, follow every step in the order chosen, use the npm already on the machine. The free
plan turned out not to charge static requests (read first-hand), so the diet is for speed.

**Architecture.** ✅ Complies. d-115f49-908ed6 held (Angular); new decisions d-115f49-7d644b (the
built-site check) and d-115f49-314943 (hosting).

**Cards relied on, and the checks that ran.** `a-check-must-be-seen-to-fail`: the content typing
(a removed field failed the build), the `isHome` regression test (failed against the old code),
`tools/check-site.mjs` (three planted breaks), the CSP check (a planted inline script) and
`tools/a11y.mjs` (two planted violations) were each seen red. `derived-copy-goes-stale-silently`:
the generated icons and posts are untracked and regenerated before every build, serve and test.
`unrunnable-system-moves-the-gate`: no longer applies; the site builds and runs here, and the gate
gained the built-site level.

**Review.** At the close, in a fresh context (a delegated reviewer, read-only; a clean `npm ci`
and build in a worktree, the CSP hashes recomputed, planted CSP and link faults, the 404 flow). No
blocker. Should-fix, all fixed before the merge: the `verify` skill and `AGENTS.md` still said the
built output was unchecked; the CI file's header said it installed nothing; `wrangler` was used
unpinned. Nits fixed: the `npm test` command line, `*ngIf` in a standard, the generated-files
decision's wording, the home page's `/blog#` link. Deferred to the roadmap: `_headers` merge
semantics and 404-response headers on Cloudflare, `noindex` lost on a client-side unknown slug,
`srcset` and entities unread by `check-site`, the bundle-size warning.

**What went wrong on the way.**
- The new menu exposed a latent bug: `HeaderService.isHome()` gave late subscribers the home
  page's value. Fixed with its own regression test.
- The first icon pass broke one icon, whose content name carried an extra `colored` word, and made
  the icon circles 75 px tall. Both were caught by measuring the boxes in a browser.
- `<a>` links in a flex row wrapped their arrow on phones, where the old `<button>`s had not; the
  screenshot caught it.
- Probes read the DOM right after a click, and zoneless renders a tick later. Two false failures
  ("Escape does not close") were cleared by waiting.
- Three tool hiccups:
  - `npm run build`'s grep missed Angular 17's new casing.
  - A JSON loader choked on a commented `tsconfig`.
  - The `_headers` placeholder was first replaced inside its own comment.
- Two doc paths went stale twice (`404.html`, a renamed script); `audit:doc-paths` refused the
  commit both times.

**What was left undone.** Phase 7 (content) and the domain-dependent SEO wait on the owner. The
deploy is configured, not done. Project images are still PNG. Bootstrap is untrimmed. Dependabot is
not set up. A committed screenshot script (i-115f49-03e2ea).

**Not verified.** Anything on Cloudflare: whether its build image provides Node 26, whether Workers
Builds waits for GitHub checks, how a repeat visit caches. The new CI job has not run (not pushed).

**Measured.** First visit, own requests besides images: 22 → 4 on `/`, 4 on every page; third-party
requests 1 → 0; `/` 190 KiB compressed. Script 106 kB and stylesheet 28 kB compressed. 20 tests;
`check-site` 88 internal links, 0 broken; axe 0 violations at two widths.

**Learned.** General: before optimising for a provider's limits, read the provider's billing page;
the premise here (free-plan request counts) did not hold for static assets, and the work changed
from cost to speed. General: an end-to-end probe of a zoneless app must wait for the DOM, not read
it right after the event. Local: the screenshot procedure, repeated more than ten times, is
i-115f49-03e2ea. Captured: 2 learnings, 5 frictions (scratch screenshot scripts, >10; output
format greps, 1; JSONC parsing, 1; placeholder in a comment, 1; zoneless timing in probes, 2).
Waiting on the owner: the domain, the content questions, the deploy, the merge.

## 2026-10-05 · s-115f49-818e9f — Finish the bootstrap checklist and delete ANGULAR.md

**What.** Walked the method's bootstrap checklist and added what was missing: the
`troubleshoot-site` skill, built from the git history and the code; the *What changed → what must
move* table and the engineering standards in `AGENTS.md`; and, in the roadmap, that the deploy does
not ship before the built-site check. Deleted `ANGULAR.md`, the Angular CLI's boilerplate, which
repeated `README.md` and described an e2e command that does not exist.

**Areas.** `AGENTS.md`, `.claude/skills/troubleshoot-site/`, `docs/roadmap.md`, `ANGULAR.md`.

**Why.** The owner approved deleting `ANGULAR.md` and asked to finish the bootstrap if anything was
missing.

**Architecture.** ✅ Complies.

**Cards relied on, and the checks that ran.** `unrunnable-system-moves-the-gate`: the ship-blocking
check for the invisible bug class cannot run until the site builds, so it is a precondition of the
deploy item rather than a check written now. `npm run gate` passed.

**Review.** none.

**What was left undone.** From the checklist: the ship-blocking check on the built output
(i-115f49-e325d4, needs a build); `.editorconfig` alignment waits for a linter, which arrives with
i-115f49-8c7fbe; the standards on navigation as `<a>` and `alt` text are unenforced
(i-115f49-636a4f).

**Not verified.** The troubleshooting entries marked ASSUMPTION were reasoned, not reproduced.

**Learned.** Captured: 0 learnings, 0 frictions. Nothing needs you.

## 2026-10-05 · s-115f49-aa8e47 — Keep Angular and set Astro aside

**What.** Recorded the owner's decision to keep Angular without Astro for now: i-115f49-a26e87 is
blocked outside until the owner asks again, and d-115f49-908ed6 says so.

**Areas.** `docs/roadmap.md`, `docs/decisions.md`.

**Why.** The owner answered the open question from s-115f49-bc5070 after asking what Astro is.

**Architecture.** ✅ Complies.

**Cards relied on, and the checks that ran.** none.

**Review.** none.

**Learned.** Captured: 0 learnings, 0 frictions. Nothing needs you.

## 2026-10-05 · s-115f49-bc5070 — Bootstrap the agent-guides method and the CI gate

**What.** Installed the agent-guides bundle 0.0.26 (carrier `r-115f49`) and wrote the instruction
system: `AGENTS.md` as the single source with `CLAUDE.md` importing it, `docs/` (decisions,
references, roadmap, architecture), four dated research files, the `verify` and `state-review`
skills plus the bundle's `close`, the `knowledge-reviewer` subagent, permissions, and
`tools/audit.mjs` behind `npm run gate`, with git hooks for the gate and the single-author rule.
Roadmap item i-115f49-679bb3: CI runs the gate on every push, and the files Scully generates are no
longer tracked. The `Project` model now marks `sourceUrl` and `previewUrl` optional, as the data and
the template already treated them.

**Areas.** `.agents/`, `.claude/`, `.githooks/`, `.github/workflows/`, `docs/`, `tools/`,
`AGENTS.md`, `CLAUDE.md`, `README.md`, `.nvmrc`, `.gitignore`, `package.json`,
`src/app/core/models/project.ts`, `.scully/` and `src/assets/scully-routes.json` (untracked).

**Why.** The owner asked to initialise `.agents` from agents-knowledge, then to include the
bootstrap and roadmap item 1 in this session, and to update the site in a later one: Angular is
updated (d-115f49-908ed6), Analog and Astro become roadmap items.

**Architecture.** ✅ Complies. The model change aligns the type with the data and the template's
`*ngIf` guards; no behaviour changes.

**Cards relied on, and the checks that ran.** `a-check-must-be-seen-to-fail`: each of the 7 audit
checks was planted with one violation in a scratch copy and each failed with exactly one finding of
its own; the commit-msg hook refused a commit with a trailer, and the pre-commit hook refused one with
a red gate. `derived-copy-goes-stale-silently`: the tracked routes list was a derived copy served in
place of the router, and it had regressed a route rename; it is untracked (d-115f49-9700ab).
`unrunnable-system-moves-the-gate`: the code cannot be built here, so the gate names what it does not
see (`AGENTS.md` §Verification).

**Review.** At the close, in a fresh context (a delegated reviewer, read-only, faults planted in a
scratch clone), over everything but `.agents/` and `docs/research/`. No blocker. Should-fix, all
fixed in this session and each re-planted to fail: `audit:routes` read commented routes, children
at the wrong level and redirects without their target, accepted any blog slug, and missed
single-quoted, bound-literal, double-quoted `*Path:`, internal `href` and post links;
`audit:doc-paths` skipped anchors, markdown links and some extensions; the interface parser took one
field per line; the pre-commit hook gated the disk, not the index (it now gates a copy of the index: seen to refuse a fault present only in the index, and to pass one present only on disk); the single-author rule had no
check outside the hook; the roadmap's Node ranges were wrong. Deferred, in the roadmap: fragments
are checked against every template, not the linked page; nested fields are not checked; the
settings deny paths' anchoring is unverified and shell writes are not covered. Nits fixed: CRLF
front matter, the Node floor of the audit, two `git` allows that could write a file.

**What went wrong on the way.** The first gate run failed on a path `AGENTS.md` named that does not
exist (a skill's `LOCAL.md`), caught by `audit:doc-paths`. Running a command stored in a shell
variable failed in zsh, which does not split words, three times in this session; a function worked. The
first commit swept in deletions already staged for another commit; it was split before any push.
A commit with a pathspec ran the pre-commit hook against a temporary index, and the gate failed on
it. The audit as first written passed 13 planted faults the review found: the plant-and-watch at
the time had seeded one fault per check, which proves a check can fail, not that it sees every form.
The roadmap stated Angular's Node ranges from the relayed research; npm's `engines` disagreed.

**What was left undone.** The build and the unit tests are not in the gate: they need Node 18 and an
install, and the specs fail by reading (i-115f49-8c7fbe). Whether to delete `ANGULAR.md`, the CLI's
boilerplate, is open with the owner. The stray top-level `color` in one project entry stays: it is
the owner's content (i-115f49-d63585). Which Astro option the owner means is open (i-115f49-a26e87).

**Not verified.** The `Project` change was not compiled: nothing was installed or built. That Scully
regenerates `.scully/` and its routes list on every build, so untracking them breaks no build, is an
ASSUMPTION until the next build. The CI workflow ran once, on the push of this session's work, and passed. That the `./` path
form in `.claude/settings.json` deny rules resolves from the repository root is an ASSUMPTION. That
`setup-node` reads a bare `18` from `.nvmrc` is an ASSUMPTION.

**Measured.** Review plants: 13 of 13 false greens fail after the fixes; an unchanged tree and a
CRLF post give 0 failures. First audit run, before any document existed: 16 failures in 3 checks. 12 were real
data-contract violations (all 12 project entries lacked a field the `Project` interface declared
required), 2 were tracked generated files, and 2 were the missing instruction documents. Routes and
fragments: 0 violations in the sources. Planted violations: 7 of 7 checks fired.

**Learned.** General: a field the template guards with a presence check but the type declares
required is a type that lies, and a fetch typed by cast hides it until something compares the data
with the declared type. General, second: one planted fault per check proves the check can go red, not that it covers the
forms the rule names; plant one per form the documentation promises. Local: routed into `audit:data`
and the `Project` model, and into the review plants above. Captured: 2 learnings, 4 frictions (shell
word splitting, 3 in this session; a commit sweeping staged files, 1; a pathspec commit gating a
temporary index, 1; a skill installed mid-session not loadable until the next, 1). Two questions wait
on the owner: the Astro option (i-115f49-a26e87) and `ANGULAR.md`.

## Format reference

Each entry: `## YYYY-MM-DD · s-<repo6>-<content6> — <title>`, then **What**, **Areas**, **Why**,
**Architecture** (✅ complies · ⚠️ deviation · REVIEW), **Cards relied on, and the checks that
ran**, **Review**, **What went wrong on the way**, **What was left undone**, **Deviation from the
plan**, **Not verified**, **Measured**, **Learned** (ending with `Captured: N learnings, M
frictions (…). Nothing needs you.`). The full format is `.agents/method/prompt-context.md`,
artifact 5.
