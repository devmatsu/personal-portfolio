# 0003. Keep the site out of search engines, with no sitemap

- Status: Accepted
- Date: 2026-10-15

## Context

The site is shared directly (CV, LinkedIn, messages) rather than found through search. The owner doesn't want it indexed. v3 briefly shipped a sitemap alongside `noindex`, which contradicted itself.

## Decision

Every page sends `<meta name="robots" content="noindex, nofollow">` from `Base.astro`. There is no sitemap integration and no `robots.txt` pointing at one. Open Graph tags and canonical URLs stay, because link previews are how the site is shared.

## Consequences

- Search engines that respect the tag won't list the site.
- Lighthouse's SEO category would flag `noindex`, so CI doesn't assert on it (`lighthouserc.json`).
- Making the site searchable later means removing the meta tag, adding the sitemap back and superseding this record.
