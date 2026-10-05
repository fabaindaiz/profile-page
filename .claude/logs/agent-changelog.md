# Agent changelog

One entry per session that changes the repository, **newest on top, directly below this
paragraph**. Sessions cannot see each other: this file is how the next one learns what this one
changed, broke, or could not verify. Start an entry with
`python3 .agents/tools/bundle.py new entry "<title>" --write`. The format reference is at the end
of the file.

---

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
ASSUMPTION until the next build. The CI workflow has not run: nothing is pushed. That the `./` path
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
