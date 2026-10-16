# 0002. Pull writing from dev.to at build time

- Status: Accepted
- Date: 2026-10-15

## Context

Posts are written and published on dev.to. v2 fetched them in the browser on every visit, which showed spinners, depended on dev.to being up for each visitor, and gave link previews nothing to read.

## Decision

`src/lib/devto.ts` fetches the article list and each article's HTML during `astro build`, paginating and retrying on 429. `/writing` and `/writing/[id]` are generated from it, keyed by the dev.to article id so old `/blog/post/<id>` links can redirect. If the API fails, the build fails rather than shipping an empty or partial writing section.

## Consequences

- Pages are static and fast; dev.to is only contacted at build time.
- A new post appears after the next deploy, not immediately.
- Builds (and therefore `npm test` and CI) need network access to dev.to; a dev.to outage blocks deploys until it recovers.
- Article HTML is rendered with `set:html`; it's the owner's own content, sanitized by dev.to.
