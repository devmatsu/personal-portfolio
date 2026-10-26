# devmatsu.com — v3

![Portfolio Preview](https://raw.githubusercontent.com/devmatsu/personal-portfolio/main/public/images/page_preview.png)

Personal site of Rodrigo "Matsu" Matagawa, backend engineer. Live at [devmatsu.com](https://devmatsu.com).

## Stack

- [Astro](https://astro.build) 7, static output, TypeScript strict
- React 19 islands only for the interactive widgets
- Geist / Geist Mono (self-hosted via Fontsource)
- Blog posts pulled from the [dev.to API](https://developers.forem.com/api) at build time

## Scripts

Node 22.22.3+ or 24.16+. `.nvmrc` sets the Node line (`nvm use`); CI and Amplify install the newest release of it.

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Dev server at http://localhost:4321               |
| `npm run build`   | `astro check` (types) + static build into `dist/` |
| `npm run preview` | Serve the built `dist/`                           |
| `npm run check`   | Type-check only                                   |
| `npm run lint`    | ESLint (TypeScript, Astro, React hooks)           |
| `npm test`        | Build, serve and run the Playwright tests         |

The build fetches every dev.to article; if the API is down the build fails instead of shipping an empty blog. New posts appear after the next deploy: every day at 06:00 Brasília, `.github/workflows/writing-refresh.yml` compares dev.to with the posts the live site was built with (`/writing/posts.json`) and, if dev.to has a new one, starts an Amplify build through the `AMPLIFY_BUILD_WEBHOOK` secret. To publish a post sooner, run that workflow by hand (Actions → Writing refresh → Run workflow). Before the first `npm test`, install the browser with `npx playwright install chromium`.

CI (`.github/workflows/ci.yml`) runs lint, types, the tests and a Lighthouse audit (`lighthouserc.json`) on every pull request.

Hosting is AWS Amplify (app `d3v7d4x1opg1gm`, `sa-east-1`): every push to `main` deploys, and every pull request gets a preview build at `pr-<number>.d3v7d4x1opg1gm.amplifyapp.com`. The build steps live in `amplify.yml` (they override the console's build settings) and install Node from `.nvmrc`. Response headers come from `customHttp.yml`; unknown URLs are rewritten to `404.html` with a 404 status (Amplify rewrite rule `/<*>` → `/404.html`, `404-200`).

## Releases

Versions follow [semver](https://semver.org) and come from the commit messages ([release-please](https://github.com/googleapis/release-please), ADR 0007): `fix:` bumps the patch, `feat:` the minor, a `!` (e.g. `feat!:`) the major. After each merge to `main`, release-please keeps a release PR open with the next version and the [`CHANGELOG.md`](CHANGELOG.md) entry. Merging it updates `package.json`, tags `vX.Y.Z` and publishes a [GitHub release](https://github.com/devmatsu/personal-portfolio/releases). The footer shows that version and links to its notes. Deploys don't wait for releases: every merge to `main` goes live, and the footer keeps showing the last released version until the next release PR is merged.

To cut a release: open the release PR, approve its pending workflow run (GitHub holds CI on PRs opened by `github-actions[bot]` until a maintainer approves it, ADR 0008), wait for CI, merge. If a feature was reworked before the release, correct its line in the PR's `CHANGELOG.md` and description before merging; the GitHub release is built from the description.

## Working on it

Changes start as an issue and land through a reviewed PR. Coding agents follow [`CLAUDE.md`](CLAUDE.md) (`AGENTS.md` links to it); decisions worth remembering are recorded in [`docs/adr/`](docs/adr/README.md).

## Structure

```
.github/                 CI workflow, Dependabot config, issue and PR templates
.nvmrc                   Node version for local work, CI and Amplify
amplify.yml              Amplify build steps: install Node from .nvmrc, npm ci, npm run build
customHttp.yml           Response headers on Amplify: security headers, long cache for /_astro/ (ADR 0006)
design/ember.dc.html     Design source (Claude artifact, "Ember" direction)
docs/adr/                Architecture decision records
src/data/                Site constants, experience timeline, widget registry
src/layouts/Base.astro   <head>, nav, footer, ⌘K command palette
src/components/home/     Home sections (hero, agent terminal, overview, experience, workflow, contact)
src/lib/devto.ts         dev.to client (paginated, retries on 429, 5xx and network errors)
src/pages/               /, /writing, /writing/[id], /widgets/{rubik,wheel,pomodoro,poker,coin}, 404
src/scripts/             Inline scripts that run before first paint, rendered with a CSP hash (InlineScript.astro)
src/widgets/             React widgets: Rubik's cube timer, decision wheel, Pomodoro, poker odds calculator, coin flip
scripts/                 writing-is-stale.mjs: does dev.to have a post the live site doesn't? (used by the daily refresh)
tests/                   Playwright end-to-end tests, plus poker engine and dev.to client tests (run in Node)
```

Widgets keep their state in `localStorage` (`v3.*` keys). `/blog` links redirect to `/writing`. The site is intentionally hidden from search engines (`noindex`, no sitemap; see ADR 0003).
