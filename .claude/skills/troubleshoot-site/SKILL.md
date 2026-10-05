---
name: troubleshoot-site
description: Diagnose a reported symptom of this site - a section that renders empty, a link or page that 404s, a post missing from the blog, a build or Docker build that fails, tests that fail. Use when something "doesn't show", "is blank", "gives 404", "no carga", "no aparece", "falla el build", or before guessing at a fix.
allowed-tools: Bash, Read, Grep
---

# Troubleshoot the site

Where this knowledge comes from: the git history (a route rename that had to touch five files, three
fixes to the Docker build in one day, a generated routes list that undid a rename) and reading the
code. Lines marked ASSUMPTION are reasoned, not yet seen happen. Run `npm run gate` first: it names
the source-level causes below in seconds.

## A section renders empty, with no error on screen

The content in `src/content/` is compiled into the bundle and typed against `src/app/core/models/`,
so a missing or mistyped field fails `npm run build` (and `audit:data` reports a missing top-level
field before any install). A section that still renders empty has data the model allows but the
template does not show: an empty list, or an optional field left out. Say which it was.

## A link or page gives 404, but works on `npm start`

The development server routes client-side, so it never shows this.
1. `npm run gate`: `audit:routes` reports a link to a route that does not exist (the history's route
   rename was this).
2. If the link resolves: the page was not prerendered, or the host does not fall back. Build with
   `npm run build` (not `ng build` alone, which skips generating icons and posts) and open the URL
   with `npm run preview`.
3. Today's host falls back to `index.html` through nginx's `try_files` (`nginx/nginx.conf`); a host
   without that fallback 404s on every route that was not prerendered.

## A post is missing from the blog

1. Its front matter: `audit:posts` checks `title`, `description` and `published`; a post with
   `published: false` is hidden on purpose.
2. The blog lists what `tools/posts.mjs` generated into the bundle, which only `npm run generate`
   (run by every build, serve and test script) rewrites; `ng build` alone uses the last copy.

## The build fails

1. **Node.** The code is Angular 15: build on the Node in `.nvmrc`. `node:latest` in the
   `Dockerfile` is outside Angular 15's supported range (ASSUMPTION: why a Docker build fails today
   until i-115f49-8c7fbe).
2. **Generation**: `tools/icons.mjs` fails on an icon name with no SVG in the icon packages, and
   `tools/posts.mjs` on a post without its front matter; both name the file.
3. `npm ci` refuses when `package.json` and `package-lock.json` disagree: never edit the lockfile by
   hand.

## The unit tests fail

They are known to fail by reading (i-115f49-8c7fbe): a spec asserts markup the template does not
have, and two specs provide no `HttpClient`. Name that in the report, so it is not taken as new.

## Reporting

The symptom, the cause found (or the two candidates left), the evidence (gate output, a file and
line, what the browser showed), and what was not run. A cause found here that is not in this file is
added to it in the same change.
