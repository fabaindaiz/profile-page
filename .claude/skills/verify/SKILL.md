---
name: verify
description: Run this repository's gate and report honestly what passed and what was never run. Use before any commit or deploy, after touching routes, links, templates or the JSON content, and whenever asked to "check", "verify", "validate", "run the gate", "is this ready", "revisa", "verifica" or "¿está listo?".
allowed-tools: Bash, Read
---

# Verify

The site's one invariant is that every route, link, fragment and asset resolves in the static
output as served, and the development server hides breaking it. The gate checks the sources for it;
nothing yet checks the built output.

## The gate

```bash
npm run gate
```

It runs `tools/audit.mjs` (`audit:routes`, `audit:fragments`, `audit:data`, `audit:posts`,
`audit:doc-paths`, `audit:generated`, `audit:enforcers`), then `bundle.py verify` and `bundle.py
ids`. It installs nothing and builds nothing.

## If `src/` changed

The gate cannot see these; run what the machine allows and say which ran:

```bash
npm ci               # with the Node in .nvmrc
npm run build           # generate icons and posts, then prerender every route
npm run preview         # then open every page the change touched
node tools/measure.mjs  # requests and compressed bytes per page
```

Open the page, do not infer it: a section whose JSON lost a field renders empty with no error.

## Reporting

Say what passed and what did not, with the output. Name every step above that was not run as
**not verified**, and write it under *Not verified* in the changelog entry. Never call something
verified that was not run.
