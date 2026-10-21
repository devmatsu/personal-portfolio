# CLAUDE.md

Instructions for coding agents working on devmatsu.com. `AGENTS.md` is a link to this file.

## How work flows

1. Every change starts as a GitHub issue that says what done means.
2. Read this file and the relevant records in `docs/adr/` before planning. Propose a plan; the owner picks the direction.
3. Implement on a branch, scoped to the plan. Don't add features, refactors or dependencies the plan didn't ask for.
4. If the change makes a decision someone would later ask "why?" about (new dependency, new route scheme, a trade-off between two reasonable options), add an ADR (see `docs/adr/README.md`).
5. Run the checks below, then open a PR using the template. Amplify builds a preview of the PR (`pr-<number>.d3v7d4x1opg1gm.amplifyapp.com`); check the change there. The owner reviews and merges; agents never merge.

## Checks

All of these run in CI (`.github/workflows/ci.yml`) and must pass locally before a PR:

| Command         | What                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| `npm run lint`  | ESLint (TypeScript, Astro, React hooks)                                  |
| `npm run check` | `astro check`, TypeScript strict                                         |
| `npm test`      | Builds, serves `dist/` and runs every Playwright spec in `tests/`         |

CI also runs Lighthouse against the built pages (`lighthouserc.json`). First run of the tests needs `npx playwright install chromium`. The build fetches dev.to, so it needs network access.

## Project map

- `src/pages/`: routes. `/`, `/writing`, `/writing/[id]`, `/widgets`, `/widgets/<slug>`, `404`.
- `src/components/home/`: one component per homepage section; `src/pages/index.astro` wires them and owns the section scrolling.
- `src/layouts/Base.astro`: `<head>`, nav, footer, command palette, toast. Every page uses it.
- `src/data/`: content and constants (site, experience timeline, widget registry, contact). Edit content here, not in components.
- `src/lib/devto.ts`: dev.to client used at build time.
- `src/widgets/<name>/`: React widgets, each with a CSS module. Pure logic sits in plain `.ts` files next to the component.
- `src/styles/global.css`: design tokens (`--accent`, `--surface`, …) and base styles. Use the tokens; don't introduce new colors.
- `design/ember.dc.html`: the design source. Match it for anything visual.

## Conventions

- Astro components by default. React only for interactive widgets, mounted with `client:only="react"` and a reserved `min-height` on the wrapper so the page doesn't shift (ADR 0001).
- Widget state lives in `localStorage` under `v3.*` keys. Storage is optional: every read and write is wrapped in `try`, and a widget must keep working when storage throws (ADR 0004).
- Page-wide keyboard shortcuts go through `src/widgets/shortcuts.ts` so they never steal keys from text fields, focused controls or the open command palette.
- New widget: add it to `src/data/widgets.ts`, create `src/pages/widgets/<slug>.astro` following the existing pages, and add Playwright coverage.
- Changed or removed URL: add a redirect in `astro.config.mjs` so old links keep working.
- The site is hidden from search on purpose: keep `noindex` and don't add a sitemap (ADR 0003).
- Content-Security-Policy (ADR 0006): no inline event handlers or `style` attributes in markup, and no third-party resources unless the policy is extended. A script that must run before first paint goes in `src/scripts/` and renders through `InlineScript.astro`; everything else uses normal Astro `<script>` tags. Response headers live in `customHttp.yml`.
- Respect `prefers-reduced-motion` for every animation.
- Accessibility is part of done: keyboard reachable, visible focus, correct ARIA, labelled controls.

## Tests

- Specs in `tests/` run against the production build in Chromium. Test behavior a visitor can see, not implementation details.
- Pure logic (e.g. the poker engine) is tested directly in `tests/*-engine.spec.ts`, checked against an independent reference where one exists.
- A bug fix comes with a test that fails before the fix.
- Page transitions (cross-document view transitions in `global.css`) can't be judged locally: Chrome skips them on `astro preview`, and Playwright's Chromium runs with paint holding disabled. Check them on the PR's Amplify preview in a real browser. Keep the old and new page animations at the same duration and easing so they cross-fade; a fade-out followed by a delayed fade-in blinks.

## Commits and PRs

- Conventional commits with a scope where it helps: `feat(home): …`, `fix: …`, `test: …`, `docs: …`, `chore: …`. Present tense, describes the visible effect.
- One logical change per commit. PR description: what changed, why, how it was verified, and the issue it closes.
- Commit types decide the next version (ADR 0007): `feat` → minor, `fix`/`perf` → patch, `!` after the type → major; `docs`, `test`, `refactor`, `chore` and `ci` don't release and stay out of the changelog. Pick the type for what a visitor would notice.
- Don't edit the version in `package.json` or `CHANGELOG.md` by hand; release-please owns both. The owner merges the release PR when they want to cut a release.
