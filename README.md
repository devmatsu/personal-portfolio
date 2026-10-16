# devmatsu.com — v3

![Portfolio Preview](https://raw.githubusercontent.com/devmatsu/personal-portfolio/main/public/images/page_preview.png)

Personal site of Rodrigo "Matsu" Matagawa, backend engineer. Live at [devmatsu.com](https://devmatsu.com).

## Stack

- [Astro](https://astro.build) 7, static output, TypeScript strict
- React 19 islands only for the interactive widgets
- Geist / Geist Mono (self-hosted via Fontsource)
- Blog posts pulled from the [dev.to API](https://developers.forem.com/api) at build time

## Scripts

Node 22.22.3+ or 24.16+.

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Dev server at http://localhost:4321               |
| `npm run build`   | `astro check` (types) + static build into `dist/` |
| `npm run preview` | Serve the built `dist/`                           |
| `npm run check`   | Type-check only                                   |
| `npm run lint`    | ESLint (TypeScript, Astro, React hooks)           |
| `npm test`        | Build, serve and run the Playwright tests         |

The build fetches every dev.to article; if the API is down the build fails instead of shipping an empty blog. New posts appear after the next deploy. Before the first `npm test`, install the browser with `npx playwright install chromium`.

CI (`.github/workflows/ci.yml`) runs lint, types, the tests and a Lighthouse audit (`lighthouserc.json`) on every pull request.

## Working on it

Changes start as an issue and land through a reviewed PR. Coding agents follow [`CLAUDE.md`](CLAUDE.md) (`AGENTS.md` links to it); decisions worth remembering are recorded in [`docs/adr/`](docs/adr/README.md).

## Structure

```
.github/                 CI workflow, Dependabot config, issue and PR templates
design/ember.dc.html     Design source (Claude artifact, "Ember" direction)
docs/adr/                Architecture decision records
src/data/                Site constants, experience timeline, widget registry
src/layouts/Base.astro   <head>, nav, footer, ⌘K command palette
src/components/home/     Home sections (hero, agent terminal, overview, experience, workflow, contact)
src/lib/devto.ts         dev.to client (paginated, retries on 429)
src/pages/               /, /writing, /writing/[id], /widgets/{rubik,roulette,pomodoro,poker,coin}, 404
src/widgets/             React widgets: Rubik's cube timer, roulette picker, Pomodoro, poker odds calculator, coin flip
tests/                   Playwright end-to-end tests and the poker engine tests (run in Node)
```

Widgets keep their state in `localStorage` (`v3.*` keys). `/blog` links redirect to `/writing`. The site is intentionally hidden from search engines (`noindex`, no sitemap; see ADR 0003).
