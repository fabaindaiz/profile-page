---
name: state-review
description: Review whether this repository's instruction system is still true - documents, enforcers, decisions, roadmap, budget and the bundle's version - and report what drifted. Use on request, before starting a large piece of work, after the Angular update steps, and when asked for a "state review", "health check of the docs", "revisión de estado" or "¿qué quedó desactualizado?".
allowed-tools: Bash, Read, Grep
---

# State review

Read-only. Findings go to `docs/roadmap.md` (or a decision row) only after the user agrees; this
skill changes nothing by itself.

## Run

```bash
npm run gate
python3 .agents/tools/bundle.py changelog --since "$(grep -m1 '^version' .agents/README.md | cut -d'"' -f2)"
wc -l AGENTS.md
```

## Answer each, with evidence

1. Does every document the map in `AGENTS.md` names exist, and is every claim in it still true?
   (`audit:doc-paths` covers existence; truth is read.)
2. Does every rule still have an enforcer, and did any of them fire since the last review? Search
   `.claude/logs/agent-changelog.md` for `audit:`.
3. What changed that should have become a row in `docs/decisions.md` and did not?
4. What in `docs/roadmap.md` is now closed — built, or retired by a measurement — and does
   *Where we are* still describe today?
5. Is `AGENTS.md` still under 200 lines, and which section grew?
6. Which rules are still prose only (`—` in `docs/decisions.md`) and could cheaply move into
   `tools/audit.mjs`?
7. Which friction is recorded more than once and not yet fixed? Count with
   `python3 .agents/tools/bundle.py count "<symptom>" .claude/logs/agent-changelog.md`, price each,
   and rank it against the site work.
8. What did this repository learn that the method does not know? Apply the generality test in
   `.agents/method/prompt-context.md` §*Improving the method, and distributing it*; name only what survives it.
9. Is `.agents/` behind the latest release? If so, run the update before the next significant work.

## Reporting

One line per question: the answer, the evidence, and the proposed entry if any.
