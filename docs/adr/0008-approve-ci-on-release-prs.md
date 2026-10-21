# 0008. Run CI on release PRs by approving the bot's workflow run

- Status: Accepted (supersedes the CI part of 0007)
- Date: 2026-10-21
- Issue: #50

## Context

ADR 0007 assumed that PRs opened by `github-actions[bot]` (release-please's PRs) get no CI at all, so the release workflow dispatched CI itself. Since June 2026, GitHub instead queues those `pull_request` runs and waits for a maintainer to approve them ([changelog](https://github.blog/changelog/2026-06-11-bot-created-pull-requests-can-run-workflows-if-approved)). On the first release PR (#49) the dispatched CI passed, but the PR stayed blocked while the approval-pending run existed. The dispatch step also failed the Release run once a release was cut, because `pr` was empty.

## Decision

- No dispatch: the release workflow only runs release-please, and CI has no `workflow_dispatch` trigger.
- To release, the owner opens the release PR, approves the pending workflow run ("Approve workflows to run"), lets CI pass and merges.
- No personal access token or GitHub App: the approval is one click per release and keeps a human in the loop for bot-generated changes.

## Consequences

- Release PRs need a manual approval before they can be merged; nothing else changes for normal PRs.
- If the approval step ever becomes a burden, a GitHub App token for release-please would remove it (PRs from a trusted identity run CI without approval).
