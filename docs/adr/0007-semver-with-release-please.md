# 0007. Version the site with semver, generated from commit messages

- Status: Accepted
- Date: 2026-10-16
- Issue: #47

## Context

The footer showed `v3.0.0` while 15 PRs (27 features, 22 fixes) shipped after it. The version was typed by hand in two places, with no tags, releases or changelog, so it meant nothing. Every commit already follows Conventional Commits.

## Decision

- release-please (`.github/workflows/release-please.yml`, `release-please-config.json`, `.release-please-manifest.json`) reads the commits since the last release and keeps a release PR open with the next version and its `CHANGELOG.md` entry: `fix`/`perf` → patch, `feat` → minor, `!` → major. Docs, tests, refactors, chores and CI changes don't trigger a release and are hidden from the changelog.
- Merging the release PR bumps `package.json`, tags `vX.Y.Z` and publishes a GitHub release. `package.json` is the only place the version lives; the footer reads it and links to the release notes.
- `v3.0.0` is the v3 rebuild (#18); later versions are generated.
- A PR opened with `GITHUB_TOKEN` doesn't trigger other workflows, so the release workflow starts CI on the release PR through `workflow_dispatch` (the one event `GITHUB_TOKEN` may trigger). That way the release PR passes the `main` ruleset without a personal access token.

## Consequences

- Each version, and its changelog, reflects what changed for visitors.
- Commit types matter: a user-visible change committed as `chore:` won't appear in a release.
- Deploys and releases are separate. Every merge to `main` deploys, but the footer shows the last released version until the release PR is merged, so the owner decides when to cut a release.
- Repository setting "Allow GitHub Actions to create and approve pull requests" must stay on, or release-please can't open its PR.
