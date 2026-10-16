# 0005. Keep the email address out of the HTML

- Status: Accepted
- Date: 2026-10-15

## Context

Contact needs a visible, copyable email. Addresses written into static HTML are collected by scrapers.

## Decision

`src/data/contact.ts` stores the address in parts and joins them at runtime. The Contact section and the command palette fill in the link and copy action from a client script; the built HTML never contains the address.

## Consequences

- Simple scrapers that read the HTML don't see the address; visitors with JavaScript do.
- Without JavaScript the email isn't shown, so the other contact links (LinkedIn, GitHub) must stay in the HTML.
