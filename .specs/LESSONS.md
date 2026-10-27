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

### L-006 - When a spec assumption names word variants (diário, diariamente), assert the full outcome of each variant, not only the one in the example
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `lib` · harmful: 0
- features: missao3-rumo
- evidence: smart.ts:34 / spec Assumptions (diariamente) (lib)
- last seen: 2026-10-23T13:52:14Z

### L-007 - Assert that read-only accessors leave the input data deeply unchanged, comparing a before/after snapshot on a non-empty case
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `lib` · harmful: 0
- features: missao5-avanco
- evidence: mutant7 lib/ciclos.ts:151 (lib)
- last seen: 2026-10-27T22:16:52Z

### L-008 - Define in the spec which status values count as achieved when a criterion says a ratio of achieved items
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: missao5-avanco
- evidence: M5-02.5 lib/sucessos.ts:48 (spec)
- last seen: 2026-10-27T22:16:53Z

### L-009 - State in the acceptance criterion which field values copied records get, not only which fields are dropped
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: missao5-avanco
- evidence: M5-30.4 lib/ciclos.ts:133 (spec)
- last seen: 2026-10-27T22:16:55Z

### L-010 - Test the limit constant that the route itself wires (export it from lib and assert its value), not only the limiter class built with its own argument.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: missao4-capital-politico
- evidence: M2 plataforma/app/api/clipping/route.ts:143 (routes)
- last seen: 2026-10-27T23:20:07Z

### L-011 - When an e2e stubs an authenticated API call, assert the auth header the client sends, not only the stubbed response.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: missao4-capital-politico
- evidence: E2 plataforma/ilhas/capital/Clipping.tsx:54 (e2e)
- last seen: 2026-10-27T23:20:07Z

### L-012 - Put every limit and bound the tests assert (min, max, window sizes) in the spec acceptance criteria, not only in the design.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: missao4-capital-politico
- evidence: G1 Matriz AC6 prazo (design.md:64) (spec)
- last seen: 2026-10-27T23:20:07Z

### L-013 - Number each acceptance criterion with its own requirement id (CAP-NN.k) so test references resolve.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: missao4-capital-politico
- evidence: G2 spec.md traceability CAP-11.x (spec)
- last seen: 2026-10-27T23:20:07Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
