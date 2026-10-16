# 0001. Build a static Astro site, with React only for widgets

- Status: Accepted
- Date: 2026-10-15

## Context

v2 was a Vite + React single-page app: every page shipped the whole React runtime, routes only existed client-side, and content pages had no real HTML for link previews. Most of the site is static text; only the widgets (Rubik timer, roulette, Pomodoro, poker odds) need client-side state.

## Decision

Rebuild on Astro with static output. Pages and homepage sections are `.astro` components with small inline scripts where needed. Widgets stay React and are mounted with `client:only="react"`, inside a wrapper with a reserved `min-height` so nothing shifts when they appear.

## Consequences

- Content pages ship almost no JavaScript; React loads only on `/widgets/<slug>`.
- Every route is a real HTML file, so old URLs need explicit redirects in `astro.config.mjs` when they change.
- `client:only` means widgets render nothing on the server. They can read `localStorage` during render without hydration mismatches, but they need the reserved height and show nothing without JavaScript.
