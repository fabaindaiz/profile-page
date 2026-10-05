# ProfilePage

A personal portfolio and markdown blog, built with Angular and prerendered to static HTML by
Scully. Every page a visitor reaches is a file the build wrote, so a broken link only shows in the
built site, never on the development server. Rules, decisions and plans: [`AGENTS.md`](AGENTS.md).

## Commands

The code is Angular 15 and needs the Node in `.nvmrc` (18); install with `npm ci`.

#### Gate (no install needed)

```bash
npm run gate
```

Enable the git hooks once per clone: `git config core.hooksPath .githooks`.

#### Build

```bash
npm run build
```

#### Preview the prerendered build

```bash
npm run scully:serve
```

#### Unit tests

```bash
npm test
```

#### Deploy

```bash
docker build -t profile-page .
docker run --name profile-page -d -p 8080:80 profile-page
```

## References

#### First steps

- [setup local](https://angular.io/guide/setup-local)
- [angular toh](https://angular.io/tutorial/tour-of-heroes/toh-pt0)

#### Scully

- [portfolio with scully](https://www.digitalocean.com/community/tutorials/how-to-build-a-jamstack-portfolio-with-angular-11-and-scully#step-7-previewing-the-static-site)

#### Libraries

- 