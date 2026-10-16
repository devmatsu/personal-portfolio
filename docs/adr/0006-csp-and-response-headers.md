# 0006. Hash-based Content-Security-Policy, and response headers from the repo

- Status: Accepted
- Date: 2026-10-16
- Issue: #26

## Context

Production (Amplify Hosting) sent no security headers, and content-hashed assets under `/_astro/` were served with `max-age=0`, so browsers revalidated them on every visit. The site has a few inline scripts that must run before first paint: the `data-js` flag, the page-transition direction and the ⌘K/Ctrl K label. A CSP that allows `'unsafe-inline'` would protect little.

## Decision

- **CSP:** Astro's `security.csp` puts a `<meta>` policy on every page. Same-origin only, and `script-src`/`style-src` list the SHA-256 of every inline script and style. Astro hashes what it bundles itself. Inline scripts live in `src/scripts/*.js`, are imported with `?raw` and rendered through `InlineScript.astro`, which registers each one's hash from its exact text. An inline script rendered in `<body>` has its hash registered in `Base.astro`'s frontmatter, because the `<meta>` is already written by then. No inline event handlers (`onclick="…"`) and no `style` attributes in markup.
- **Response headers** live in `customHttp.yml`, which Amplify applies on deploy: HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options` plus a header CSP with `frame-ancestors 'none'` (a `<meta>` CSP can't forbid framing). `/_astro/*` is cached for a year with `immutable`; HTML keeps Amplify's default.
- `tests/csp.spec.ts` loads every page type and exercises each widget, failing on any CSP violation.

## Consequences

- An injected inline script, or a third-party one, is blocked.
- Third-party scripts, styles, images or embeds (analytics, fonts from a CDN, iframes) need the policy extended first. Shiki syntax highlighting stays off, because it uses inline styles.
- Editing an inline script keeps working automatically, because the hash is recomputed at build time. Adding one means using `InlineScript.astro`, and `tests/csp.spec.ts` catches a forgotten one.
- `customHttp.yml` overrides headers set in the Amplify console, so header changes go through the repo.
