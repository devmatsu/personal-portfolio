# 0004. Keep widget state in localStorage, and treat storage as optional

- Status: Accepted
- Date: 2026-10-15

## Context

Widgets are personal tools: solve history, Pomodoro sessions, roulette options, a poker scenario. Visitors expect them to survive a reload, but there are no accounts and no backend. Some browsers throw on any `localStorage` access when site data is blocked.

## Decision

Each widget saves its state in `localStorage` under a `v3.*` key. Every read and write is wrapped in `try`; a read that fails, can't be parsed or lacks the expected shape falls back to defaults, and a write that fails is ignored.

## Consequences

- State is per browser and never leaves the device.
- With storage blocked, widgets still work for the session; they just forget on reload.
- Changing a stored shape needs either validation that rejects the old shape or a new key, so old data can't break the widget.
