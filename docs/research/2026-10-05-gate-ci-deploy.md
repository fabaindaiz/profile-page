<!-- Research for the bootstrap, Phase 2. Written by a delegated research agent on 2026-10-05; each claim cites the source it was read from. Not yet re-checked first-hand: treat as relayed until a decision cites it. -->

# Research: quality gate, CI and Cloudflare deploy for an Angular static site

Date: 2026-10-05. Scope: lint/format, single gate command, Node pinning, CI-to-Cloudflare deploy,
dependency updates and supply-chain basics. The Angular update path, the Scully replacement, Pages
versus Workers static assets, `_headers` and the test runner are covered by another researcher and
are left out here.
Convention: anything not confirmed in a primary source I opened is marked **ASSUMPTION**.

## 1. Lint and format

**Findings**
- angular-eslint requires ESLint v9+ and supports **flat config only**. It no longer supports
  eslintrc. Install it with `ng add angular-eslint` (current name; the old package was
  `@angular-eslint/schematics`), optionally with `--tseslint-preset=strictTypeChecked`. Its
  major version must match `@angular/cli`'s major. It states it does **not** maintain formatting
  rules and leaves formatting to a separate tool. Source: https://github.com/angular-eslint/angular-eslint
- Prettier has an `angular` parser for templates (https://prettier.io/docs/options#parser). It has
  supported built-in control flow (`@if`/`@for`/`@defer`) since 3.1
  (https://prettier.io/blog/2023/11/13/3.1.0).
- Biome: HTML formatting is still opt-in/experimental. Vue, Svelte and Astro are experimental, and
  **Angular templates are not listed** (https://biomejs.dev/internals/language-support/). Angular
  template syntax support is an open issue (opened 2026-03-16, unassigned, no timeline):
  https://github.com/biomejs/biome/issues/9513.

**Recommendation for 2026:** use angular-eslint (flat config) for TS and template lint rules,
including the template accessibility rules, and Prettier for formatting TS, HTML templates, SCSS
and Markdown. Biome cannot format or lint Angular templates yet. Using it for TS alone would still
leave templates to Prettier, so you would maintain two tools and save nothing.
**ASSUMPTION:** if Prettier and ESLint stylistic rules clash, add `eslint-config-prettier`. The
recommended angular-eslint presets mostly avoid stylistic rules, so this may not be needed.

- *Changes in repo:* adds `eslint.config.js`, `.prettierrc`, `.prettierignore`, an `ng lint` target
  in `angular.json`, and about 5 devDependencies. The first `prettier --write .` touches almost
  every file, so it should go in its own commit.
- *Cost:* about 1 hour, plus fixing the first lint findings, which are usually few in a small app.
- *Decision for owner:* run one mass-format commit before or after the Angular migration? (Doing it
  after the migration is recommended, so the migration diffs stay readable.) Also: the default
  preset or `strictTypeChecked`? (Default is recommended for a portfolio, because the stricter
  preset is noisier.)

## 2. Single gate command

Suggested `package.json` scripts:
```
"format:check": "prettier --check .",
"lint": "ng lint",
"typecheck": "ngc -p tsconfig.app.json --noEmit && tsc -p tsconfig.spec.json --noEmit",
"test:ci": "<runner chosen by the other researcher, headless, single run>",
"check": "npm run format:check && npm run lint && npm run typecheck && npm run test:ci && npm run build"
```
CI and local development both run `npm ci && npm run check`, so there is one definition of
"green". Run the checks in order from cheapest to most expensive so the gate fails fast.

**Typechecking templates without a build:** plain `tsc` does not read templates.
`ngc -p tsconfig.app.json --noEmit` (from `@angular/compiler-cli`) does, and uses the
`strictTemplates` setting. `strictTemplates` is the default in current projects and checks embedded
views and pipe return types: https://angular.dev/tools/cli/template-typecheck. **ASSUMPTION:** I saw
the `ngc --noEmit` behaviour only in third-party issue threads found by search, not in angular.dev,
so try it once after the migration.

Note: `ng build` already type-checks templates (AOT). If `build` is in the gate, `typecheck` adds
little except speed (it is a faster local loop) and coverage of the spec files.

- *Cost:* minutes. *Decision for owner:* include `build` (and prerender) in `check`? Yes is
  recommended, because a static site's build is its real test. The cost is a slower gate.

## 3. Node version pinning

- `actions/setup-node` `node-version-file` reads `.nvmrc`, `.node-version`, `.tool-versions`,
  `mise.toml` or `package.json`. In `package.json` it checks `volta.node`, then
  `devEngines.runtime`, then `engines.node`. It turns on npm caching automatically when
  `packageManager`/`devEngines.packageManager` says npm.
  Source: https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md
- Cloudflare Workers Builds image: reads the `NODE_VERSION` env var or `.nvmrc`/`.node-version`.
  Defaults are Node 24.18.0 and npm 10.9.2. Node 22.23.2 and 24.18.0 are preinstalled.
  Source: https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- Corepack: the Node TSC voted (2025-03-19) to stop bundling it from Node 25 on. It is now a
  separate npm install, so it is not a basis for pinning in 2026:
  https://socket.dev/blog/node-js-tsc-votes-to-stop-distributing-corepack (secondary source
  reporting https://github.com/nodejs/TSC/pull/1697).

**The one place both read: `.nvmrc`.** nvm reads only `.nvmrc`. **ASSUMPTION:** fnm, Volta-less
setups and mise also read it. Optionally mirror the version as `engines.node` (e.g. `">=24 <25"`)
so npm warns locally. That makes two places, so treat `.nvmrc` as the source of truth.
**ASSUMPTION:** Cloudflare accepts a bare major such as `24` in `.nvmrc`. A full version is safest.

- *Changes in repo:* one file, plus `node-version-file: .nvmrc` in the workflow. *Cost:* minutes.
- *Decision for owner:* Node 24 (Active LTS and Cloudflare's default) is recommended over 22.
  Keep or drop the `engines` mirror?

## 4. CI to Cloudflare deploy

**Options**
- **Workers Builds (Cloudflare Git integration):** Cloudflare recommends it for GitHub.com and
  GitLab.com repositories. It recommends external CI only for self-hosted Git or other providers
  (https://developers.cloudflare.com/workers/ci-cd/). Pushes to non-production branches get a
  preview build with a Preview URL, which can be posted as a PR comment. Previews can have their
  own variables, secrets and bindings. The dashboard Worker name must match `name` in the wrangler
  config (https://developers.cloudflare.com/workers/ci-cd/builds/).
  Free plan: **3,000 build min/month, 1 concurrent build, 20 min timeout**
  (https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/).
- **GitHub Actions with `cloudflare/wrangler-action@v4`** (Wrangler v4): needs the
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. Its README shows a per-PR
  preview (`command: preview --name pr-<number>`) and outputs `deployment-url`. It warns about
  `pull_request` runs from forks (https://github.com/cloudflare/wrangler-action).
- Hosting cost: **requests to static assets are free and unlimited**. Only requests that invoke
  Worker code count against the free request quota, and above it they return 429
  (https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/). That only
  matters if `run_worker_first` or a Worker script is used.

**Recommended combination:** use Workers Builds for the deploy and its preview per branch/PR, and
GitHub Actions only for the gate (`npm ci && npm run check` on push/PR, with no Cloudflare
credentials). This keeps **no Cloudflare token in GitHub at all**, which is the best position for a
public repo. Set Workers Builds' build command to `npm ci && npm run check` too, or rely on branch
protection requiring the Actions check. **ASSUMPTION:** Workers Builds does not wait for GitHub
checks before deploying, so a red main could still deploy unless its build command runs the gate.
Choose wrangler-action only if you want deploy to depend on the gate inside one workflow.

**Never expose in a public repo:** API tokens and account IDs as plaintext. Store them in GitHub
Actions secrets or the Cloudflare dashboard. **ASSUMPTION:** the account ID is not strictly a
secret, but keep it out anyway. Also never expose: any `pull_request_target` workflow that checks
out PR code while holding secrets, `.dev.vars`, or `wrangler.toml` `vars` with real secrets.
Scope any API token to "Workers Scripts: Edit" on the one account. Preview URLs are public by
default (**ASSUMPTION**; check the Previews settings if drafts must stay private).
GitHub-hosted runners are free for public repos (**ASSUMPTION**, a well-known policy I did not
fetch).

- *Changes in repo:* remove the Dockerfile and nginx.conf (after the other researcher's hosting
  decision), add `wrangler.jsonc` and `.github/workflows/ci.yml`. *Cost:* about 1-2 hours, plus
  dashboard setup.
- *Decision for owner:* Cloudflare Git integration plus an Actions gate (recommended, no token), or
  wrangler-action for everything (one pipeline, but a token in GitHub)? A middle ground is the Git
  integration with its build command set to `npm ci && npm run check && <build>`, with Actions only
  as a PR status.

## 5. Dependency updates

- Dependabot: `groups` with `patterns: ["@angular/*", "@angular-devkit/*", "angular-eslint", ...]`
  and `update-types: [minor, patch]`. Major updates stay as individual PRs. `cooldown` defaults to
  3 days, configurable per semver level
  (https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/optimizing-pr-creation-version-updates).
- Renovate: `config:recommended` already includes `group:monorepos`, so `group:angularMonorepo`,
  `group:angular-cliMonorepo` and `group:angular-eslintMonorepo` group automatically.
  `config:best-practices` adds a 3-day npm minimum release age (https://docs.renovatebot.com/presets-group/,
  https://docs.renovatebot.com/presets-config/). It needs the Renovate GitHub App (Mend), a third
  party.
- **The `ng update` caveat applies to both:** neither bot runs Angular migration schematics. Majors
  must be done by hand with `ng update @angular/core @angular/cli` (and `angular-eslint`). A bot PR
  that bumps the version numbers on a major would skip the code migrations.

**Recommendation:** Dependabot, because it is native, needs no third-party app and is enough for one
small repo. Group Angular minor/patch, ignore `@angular/*` and `angular-eslint` majors (do them via
`ng update`), use a weekly or monthly schedule and a cooldown of at least 3 days. Add a separate
`github-actions` ecosystem entry to keep action versions fresh.
- *Cost:* one `.github/dependabot.yml`, plus reviewing about 1-4 PRs a month.
- *Decision for owner:* Dependabot or Renovate (Renovate has better presets and a dependency
  dashboard, but needs a third-party app)? Schedule weekly or monthly? Auto-merge patch updates when
  the gate is green? Not recommended at first.

## 6. Supply-chain basics (public JS repo)

- `npm ci` in CI and in the Cloudflare build: it errors if `package.json` and the lockfile disagree,
  never writes the lockfile and starts from a clean `node_modules`. `--ignore-scripts` is available
  (https://docs.npmjs.com/cli/v11/commands/npm-ci). **ASSUMPTION:** `--ignore-scripts` may break
  packages that need postinstall (esbuild binaries in the Angular toolchain), so test it before
  adopting.
- `npm audit`: most findings in an Angular devDependency tree are build-time only and noisy for a
  static site. Better signal comes from `npm audit --omit=dev --audit-level=high`, because a static
  site ships almost no runtime dependencies. `npm audit signatures` verifies registry signatures
  and provenance attestations, so it is cheap and useful in CI
  (https://docs.npmjs.com/cli/v11/commands/npm-audit). Recommended: run it as a non-blocking or
  scheduled CI job, not in the gate, so an upstream advisory does not block a blog post.
- Lockfile linting: `lockfile-lint` (Apache-2.0) enforces allowed hosts and HTTPS, so a PR cannot
  swap a tarball URL to an attacker host. Example:
  `npx lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https`
  (https://github.com/lirantal/lockfile-lint). It is low value for a single-author repo with no
  outside PRs. Optional.
- Floating `^` ranges are fine once `npm ci` and the lockfile are enforced: the lockfile is the
  real pin, and bots move it. **ASSUMPTION:** recent npm 11 releases add a `min-release-age`-style
  config. I did not verify this in the docs I read, and the Dependabot/Renovate cooldown covers the
  same need.
- GitHub Actions: pin third-party actions to a full commit SHA (**ASSUMPTION**, standard GitHub
  hardening guidance I did not fetch), and set `permissions: contents: read` at the workflow level.

- *Cost:* small. *Decision for owner:* make `npm audit` blocking or advisory (advisory is
  recommended)? Adopt lockfile-lint now or only if outside contributions start arriving?

## Sources used (12)
1. https://github.com/angular-eslint/angular-eslint
2. https://biomejs.dev/internals/language-support/ and https://github.com/biomejs/biome/issues/9513
3. https://prettier.io/docs/options#parser and https://prettier.io/blog/2023/11/13/3.1.0
4. https://angular.dev/tools/cli/template-typecheck
5. https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md
6. https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
7. https://developers.cloudflare.com/workers/ci-cd/ and /workers/ci-cd/builds/ and /workers/ci-cd/builds/limits-and-pricing/
8. https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
9. https://github.com/cloudflare/wrangler-action
10. https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/optimizing-pr-creation-version-updates
11. https://docs.renovatebot.com/presets-group/ and https://docs.renovatebot.com/presets-config/
12. https://docs.npmjs.com/cli/v11/commands/npm-ci, /npm-audit; https://github.com/lirantal/lockfile-lint
Secondary: https://socket.dev/blog/node-js-tsc-votes-to-stop-distributing-corepack (Corepack removal).
