# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

### L-019 - Isolate each guard flag in its own test by satisfying the other guards, so a redundant guard cannot mask its removal.
- signal: `surviving_mutant` · recurrence: 2 feature(s) · scope: `e2e` · harmful: 0
- features: painel-admin, acesso-equipe-convites
- evidence: ilhas/ponte.tsx:137 (mutante E14, ADM-14.4) (e2e) (+3 more)
- last seen: 2026-11-06T16:18:18Z

### L-032 - When a UI pre-check depends on data that may fail to load, test the action with that load failed, so the fallback branch is pinned.
- signal: `surviving_mutant` · recurrence: 2 feature(s) · scope: `e2e` · harmful: 0
- features: acesso-equipe-convites, primeiro-acesso-google
- evidence: U12 plataforma/app/mandato/equipe/SairDoMandato.tsx:23 (e2e) (+1 more)
- last seen: 2026-11-10T11:18:08Z

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

### L-014 - Assert that a call did not happen only after a barrier request or a wait longer than the code could delay it, never right after a UI assertion.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: painel-admin
- evidence: e2e/admin-acesso.spec.ts:30 (mutantes EA2 e EB) (e2e)
- last seen: 2026-11-06T04:46:46Z

### L-015 - Wait for the loaded rows, not only the page title, before changing mocked server state in an e2e test.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: painel-admin
- evidence: e2e/admin-equipe.spec.ts:221 (ADM-03, intermitente 4 em 57) (e2e)
- last seen: 2026-11-06T04:46:46Z

### L-016 - Test each privileged gate with every lower role that can reach the same row, not only with an outsider.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: painel-admin
- evidence: 20261105140000_admin_mandatos_gestao.sql:21 (mutante V5, ADM-02.7) (sql)
- last seen: 2026-11-06T04:46:46Z

### L-017 - Assert through the catalog that every security definer function sets an empty search_path and has execute revoked from public and anon.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: painel-admin
- evidence: 20261105120000_admin_equipe.sql:172 (mutante M13) (sql)
- last seen: 2026-11-06T04:46:46Z

### L-018 - Use the paged reader, or record the row cap, in every REST read that feeds a full list.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: painel-admin
- evidence: app/admin/page.tsx:33 (ADM-05, teto de 1.000 linhas sem registro) (routes)
- last seen: 2026-11-06T04:46:47Z

### L-020 - Give a forbidden-field scanner in a test helper its own self-test with a polluted fixture.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: painel-admin
- evidence: e2e/admin-api.ts:34 (mutantes E8 e E10) (e2e)
- last seen: 2026-11-06T04:46:47Z

### L-021 - Block API updates to any column that another policy or function trusts as authority, such as a creator id, and test the escalation through it.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: acesso-equipe-convites
- evidence: ACE-03.6 sonda S-1; plataforma/supabase/migrations/20261106120000_convites_equipe.sql:44 (sql)
- last seen: 2026-11-06T15:40:31Z

### L-022 - When a feature adds roles, route every existing policy and function that grants power by ownership through the new role check.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: acesso-equipe-convites
- evidence: ACE-03.2 sonda S-2; plataforma/supabase/migrations/20261020130000_excluir_mandato.sql:14 (sql)
- last seen: 2026-11-06T15:40:31Z

### L-023 - When code compares a flag with strict equality to true, add a test case with a truthy non-boolean value so the strictness is pinned.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `lib` · harmful: 0
- features: acesso-equipe-convites
- evidence: T12 plataforma/lib/convites/missoes.ts:15 (lib)
- last seen: 2026-11-06T15:40:32Z

### L-024 - When a criterion depends on concurrent transactions, plan a two-connection test on real Postgres instead of matching the lock in the function source.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: acesso-equipe-convites
- evidence: ACE-02.12, ACE-03.8 plataforma/tests/sql-convites.test.ts:775 (sql)
- last seen: 2026-11-06T15:40:32Z

### L-025 - Define in the spec which request header identifies the client for a rate limit and whether the client can forge it.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: acesso-equipe-convites
- evidence: ACE-02.14 plataforma/supabase/migrations/20261106120000_convites_equipe.sql:394 (spec)
- last seen: 2026-11-06T15:40:32Z

### L-026 - List in the spec every existing path that removes a member, account deletion included, when a criterion protects a minimum membership.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: acesso-equipe-convites
- evidence: ACE-03.7 excluir_meus_dados (spec)
- last seen: 2026-11-06T15:40:32Z

### L-027 - When a role can be lowered or removed, re-check the issuer's current role whenever something it issued, such as a pending invite, is used, and test demote-then-reuse.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: acesso-equipe-convites
- evidence: ACE-03.5, ACE-03.6 sonda V-1; plataforma/supabase/migrations/20261106120000_convites_equipe.sql:475 (sql)
- last seen: 2026-11-06T16:18:18Z

### L-028 - When an authorization check matches a membership by scope, test an actor who holds the required role in another scope so the scope filter is pinned.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: acesso-equipe-convites
- evidence: A01 plataforma/supabase/migrations/20261106140000_convites_autoridade.sql:25 (sql)
- last seen: 2026-11-06T19:36:38Z

### L-029 - When a rule says only current members may act, test a former member acting on something they created before leaving.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: acesso-equipe-convites
- evidence: R-X01 plataforma/supabase/migrations/20261106120000_convites_equipe.sql:373 (sql)
- last seen: 2026-11-06T19:36:38Z

### L-030 - When a quota excludes items that lost validity, fill the whole quota with such items in a test so the exclusion is pinned.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: acesso-equipe-convites
- evidence: A07 plataforma/supabase/migrations/20261106140000_convites_autoridade.sql:58 (sql)
- last seen: 2026-11-06T19:36:39Z

### L-031 - When two unwanted-behavior criteria can hold at once, state in the spec which response wins.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: acesso-equipe-convites
- evidence: ACE-02.13, ACE-02.16 sonda N-9 (spec)
- last seen: 2026-11-06T19:36:39Z

### L-033 - When an e2e mocks refusals that a backend returns as data, reproduce the backend check order for a brand-new account, not each refusal alone.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: primeiro-acesso-google
- evidence: PAG-02.1; plataforma/supabase/migrations/20261109120000_perfis.sql:157-162; plataforma/app/convite/Convite.tsx:135 (e2e)
- last seen: 2026-11-10T03:08:53Z

### L-034 - When a feature adds a precondition to join a resource, apply it to every policy and function that inserts into the same table, not only the main entry paths.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: primeiro-acesso-google
- evidence: PAG-02.2; sonda S1; plataforma/supabase/migrations/20261106130000_papeis_blindagem.sql:46-54 (sql)
- last seen: 2026-11-10T03:08:53Z

### L-035 - Specify whether categorical distributions list categories with zero count.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: primeiro-acesso-google
- evidence: PAG-06.3 SP-1; plataforma/tests/admin-perfil.test.ts:70 (spec)
- last seen: 2026-11-10T03:08:54Z

### L-036 - Specify the rounding rule for integer percentages and whether they must sum to 100.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: primeiro-acesso-google
- evidence: PAG-06.3 SP-2; plataforma/lib/admin/perfil.ts:39 (spec)
- last seen: 2026-11-10T03:08:54Z

### L-037 - Specify what the user sees and how to retry when a gating lookup fails, not only where the user must not be sent.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: primeiro-acesso-google
- evidence: PAG-02.1 SP-3; plataforma/public/legacy/acesso.js:56-60 (spec) (+1 more)
- last seen: 2026-11-10T11:18:09Z

### L-038 - Test that an unrecognized filter value is ignored and returns the unfiltered set, not only that recognized values filter
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `sql` · harmful: 0
- features: admin-usuarios
- evidence: M9 plataforma/supabase/migrations/20261110120000_admin_usuarios.sql:41 (USR-04.2) (sql)
- last seen: 2026-11-10T15:57:35Z

### L-039 - State in the spec whether combined filters must hold on the same related row or on any related row
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: admin-usuarios
- evidence: SP-1 USR-04.5 spec.md (spec)
- last seen: 2026-11-10T15:57:35Z

### L-040 - Test numeric thresholds at both sides of the spec boundary, not at a point far from it
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `legacy-screen` · harmful: 0
- features: resumo-reestruturado
- evidence: W2/W3 resumo-tela.js:106 e2e/resumo-estrutura.spec.ts:71 (legacy-screen)
- last seen: 2026-11-10T19:53:31Z

### L-041 - Cover every fallback branch the spec names, not only the primary source
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `islands` · harmful: 0
- features: resumo-reestruturado
- evidence: I4 ilhas/ResumoRetrato.tsx:50 RES-06.1 (islands)
- last seen: 2026-11-10T19:53:31Z

### L-042 - Assert the stored items of grouped rows, not only the row labels, and test inputs with missing optional fields
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `lib` · harmful: 0
- features: resumo-reestruturado
- evidence: S3/S4 lib/resumoSocial.ts:115-116 RES-08.2 (lib)
- last seen: 2026-11-10T19:53:32Z

### L-043 - Update spec.md when implementation deviates from a stated data source, not only tasks.md
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: resumo-reestruturado
- evidence: SPEC_DEVIATION ilhas/ResumoRetrato.tsx:13 (T5) (spec)
- last seen: 2026-11-10T19:53:32Z

### L-044 - Do not specify UI groups whose data the product cannot yet write; name the data source in the spec
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: resumo-reestruturado
- evidence: SPEC_DEVIATION tasks.md T8 lib/types.ts:37 (spec)
- last seen: 2026-11-10T19:53:32Z

### L-043 - When a criterion gains an explicit exception, update every absolute statement of the old rule in assumptions, independent tests and success criteria.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: area-do-mandato
- evidence: .specs/features/area-do-mandato/spec.md:181 (N-1, rodada 2) (spec)
- last seen: 2026-11-10T20:55:53Z

### L-041 - Seed every enumerated category or state in tests of duplicated render code, so renaming or reordering any one of them fails a test
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `legacy` · harmful: 0
- features: m1-reestruturacao
- evidence: mutants N8/N12 public/legacy/novos.js:164-165 (legacy)
- last seen: 2026-11-11T06:10:01Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
