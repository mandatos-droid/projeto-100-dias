# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Cover each data-source branch wired in a UI island (such as a per-region catalog fetch) with an e2e test that stubs the request, not only the pure function that consumes the data
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ilhas` · harmful: 0
- features: missao3-rumo
- evidence: E4 plataforma/ilhas/rumo/Espacos.tsx:37 (ilhas)
- last seen: 2026-10-23T13:05:19Z

### L-002 - Cover each data-source branch wired in a UI island (such as a per-region catalog fetch) with an e2e test that stubs the request, not only the pure function that consumes the data
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `ilhas` · harmful: 0
- features: missao3-rumo
- evidence: RUM-50.3 (ilhas)
- last seen: 2026-10-23T13:05:19Z

### L-003 - List every alternative of a keyword regex in the test table, one case per alternative, so removing one is detected
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `lib` · harmful: 0
- features: missao3-rumo
- evidence: M28 plataforma/lib/smart.ts:32 (lib)
- last seen: 2026-10-23T13:05:19Z

### L-004 - Give each normalization step for corrupted input (such as dedupe by id) its own test case
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `lib` · harmful: 0
- features: missao3-rumo
- evidence: M34 plataforma/lib/rumo.ts:171 (lib)
- last seen: 2026-10-23T13:05:20Z

### L-005 - Before verifying, confirm committed code does not import untracked files by running tests in a clean worktree of HEAD
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `delivery` · harmful: 0
- features: missao3-rumo
- evidence: G1 plataforma/lib/rumo.ts:4 (delivery)
- last seen: 2026-10-23T13:05:21Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
