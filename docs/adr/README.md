# Architecture decision records

Short notes on decisions that shape this site, so the reasoning survives after the change merges.

Write one when a change picks between reasonable options or adds a constraint future work must respect: a new dependency, a route scheme, a data source, a trade-off. Skip it for routine features and fixes.

Copy `0000-template.md` to `NNNN-short-title.md` with the next number. Records aren't edited after they're accepted; a later record supersedes them and both link to each other.

| #                                              | Decision                                       | Status   |
| ---------------------------------------------- | ---------------------------------------------- | -------- |
| [0001](0001-astro-static-with-react-islands.md) | Static Astro site, React only for widgets      | Accepted |
| [0002](0002-devto-at-build-time.md)             | Writing comes from dev.to at build time        | Accepted |
| [0003](0003-hidden-from-search.md)              | Hidden from search engines, no sitemap         | Accepted |
| [0004](0004-widget-state-in-localstorage.md)    | Widget state in localStorage, storage optional | Accepted |
| [0005](0005-email-out-of-html.md)               | Email address kept out of the HTML             | Accepted |
| [0006](0006-csp-and-response-headers.md)        | Hash-based CSP, response headers from the repo | Accepted |
| [0007](0007-semver-with-release-please.md)      | Semver from commit messages via release-please | Accepted |
| [0008](0008-approve-ci-on-release-prs.md)       | CI on release PRs after a maintainer approves  | Accepted |
