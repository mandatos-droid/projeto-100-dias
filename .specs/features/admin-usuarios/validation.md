# Aba Usuários do Painel Admin Validation

**Date**: 2026-11-10
**Spec**: `.specs/features/admin-usuarios/spec.md`
**Diff range**: `ff334b6..100dd79` (branch `feat/admin-usuarios`, T1 a T7)
**Verifier**: sub-agente independente (autor ≠ verificador), rodada única enxuta

**Veredito: FAIL** (1 gap real, menor: mutante M9 sobreviveu. Os 4 grupos de AC passam e os 8 mutantes de segurança foram mortos.)

---

## Task Completion

| Task | Status  | Notes |
| ---- | ------- | ----- |
| T1 a T7 | ✅ Done | Um commit por task: `e1f1a57`, `f43a70f`, `bde05a8`, `9a1037e`, `62c66df`, `4c97727`, `100dd79` |

---

## Spec-Anchored Acceptance Criteria

Migration: `plataforma/supabase/migrations/20261110120000_admin_usuarios.sql` (SQL). Testes SQL: `plataforma/tests/sql-admin-usuarios.test.ts` (L) e `sql-admin-usuarios-detalhe.test.ts` (D). Unidade: `plataforma/tests/admin-usuarios.test.ts` (U). e2e: `plataforma/e2e/admin-usuarios.spec.ts` (E1) e `admin-usuarios-detalhe.spec.ts` (E2). Telas: `plataforma/app/admin/usuarios/page.tsx` (P1) e `[id]/page.tsx` (P2).

### USR-01 Lista

| Critério | Resultado afirmado pela spec | Código | Teste (valor afirmado) | Result |
| -------- | ---------------------------- | ------ | ---------------------- | ------ |
| 01.1 menu "Usuários" entre Mandatos e Analytics | ordem Equipe, Mandatos, Usuários, Analytics, Logs | `app/admin/_componentes/Casca.tsx:11` | `e2e/admin-acesso.spec.ts:72` (`toHaveText([... 'Mandatos','Usuários','Analytics' ...])`), E1:37 | ✅ PASS |
| 01.2 colunas nome, e-mail, mandatos+papel, cadastro, último acesso | essas 5 colunas | P1:157, P1:165-172; SQL:84-92 | E1:50; L:90 (chaves exatas da linha) | ✅ PASS |
| 01.3 toda conta de `auth.users` | todas, inclusive equipe e sem perfil | SQL:52-58 (`from auth.users` com left join) | L:114 (`total` 5 e ids exatos) | ✅ PASS |
| 01.4 "Sem perfil" só sem perfil e fora da equipe | marca "Sem perfil" | SQL:57; `lib/admin/usuarios.ts` `marcaPessoa` | L:122; U:115, U:124; E1:59 | ✅ PASS |
| 01.5 marca com papel da equipe | `admin` ou `leitura` | `usuarios.ts` `marcaPessoa` | L:134; U:119; E1:59 | ✅ PASS (formato "Equipe Legisla · papel" é decisão do worker, ver SP-3) |
| 01.6 nome: perfil, depois cadastro, depois e-mail | ordem perfil, cadastro, e-mail | SQL:53-55 | L:151, L:157 (ordem nome, full_name, name, e-mail) | ✅ PASS (chaves do cadastro: SP-4) |
| 01.7 último acesso `dd/mm/aaaa hh:mm` Brasília, "Nunca" | formato e fuso | `usuarios.ts` `rotuloUltimoAcesso`; SQL:86 (`last_sign_in_at`) | U:82, U:86 (02h30 UTC vira 23h30), U:90, U:94; L:186; E1:50, E1:85 | ✅ PASS |
| 01.8 ordem: acesso mais recente, nunca por último, desempate e-mail | ordem exata | SQL:78, SQL:94 | L:198 (lista exata de e-mails); E1:113 | ✅ PASS |
| 01.9 25 por página e total | 25 e total | SQL:43; `argumentosLista`; `paginas` | L:210, L:221, L:231; U:57, U:163-178; E1:124-159 | ✅ PASS |
| 01.10 nunca gênero, raça, nascimento, telefone | ausentes da lista e da função | SQL:84-92 (só id, nome, email, criado_em, ultimo_acesso, sem_perfil, equipe_papel, mandatos) | L:102 (`texto` não contém telefone, nascimento, genero, raca etc.); L:90 (chaves exatas); L:263; E1:97 (mesmo com a resposta trazendo os campos); mutante M3 morto | ✅ PASS |
| 01.11 sem conta: "Nenhuma pessoa cadastrada." sem tabela | texto exato | P1:142-147 | E1:167 | ✅ PASS |
| 01.12 falha: mensagem padrão e "Tentar de novo" | texto e botão | P1:131-137 | E1:173 | ✅ PASS |

### USR-02 Detalhe

| Critério | Resultado afirmado pela spec | Código | Teste | Result |
| -------- | ---------------------------- | ------ | ----- | ------ |
| 02.1 clicar na linha abre `/admin/usuarios/<id>` | URL do detalhe | P1:164-166 | E1:202, E1:208 | ✅ PASS |
| 02.2 nome, e-mail, cadastro, último acesso, papel na equipe | campos | P2:276-280; SQL:121-127 | D:99, D:110, D:115; E2:56, E2:66 | ✅ PASS |
| 02.3 perfil completo com rótulos do primeiro acesso | nome, nascimento dd/mm/aaaa, gênero, raça, telefone, atua, tempo | P2:298-304; `rotulosPerfil`; SQL:128-130 | D:125, D:133; U:132-156; E2:72, E2:83 | ✅ PASS |
| 02.4 sem perfil: "Esta pessoa ainda não preencheu o perfil." | texto exato | P2:306 | D:142; E2:90 | ✅ PASS |
| 02.5 consentimento mais recente; sem: "Sem consentimento registrado" | versão e data; texto exato | P2:285-290; SQL:131-134 (`order by aceito_em desc, id desc limit 1`) | D:150, D:160; E2:96, E2:103 | ✅ PASS |
| 02.6 mandatos com parlamentar, cargo, UF, papel e link `/admin/mandatos/<id>` | campos e href | P2:312-327; SQL:135-140 | D:166; E2:111 | ✅ PASS |
| 02.7 sem mandato: "Esta pessoa não está em nenhum mandato." | texto exato | P2:330 | D:174; E2:121 | ✅ PASS |
| 02.8 "← Voltar para Usuários" mantém busca, filtros e página | href refeito | P2:233-234 (relê `de=` por `lerConsulta`) | E2:129, E2:146, E2:162 | ✅ PASS |
| 02.9 sem botão que altere dado, sem exportação | só "Sair" do painel | P2 inteiro (nenhum `<button>`, `<form>`, `<a download>`) | E2:172 (`getByRole('button')` igual a `['Sair']`), E2:179; mutante M8 morto | ✅ PASS |
| 02.10 id inexistente: "Pessoa não encontrada." e link para voltar | texto e link | P2:238, P2:242, P2:256 | D:180 (`null`); E2:185, E2:192 | ✅ PASS |
| 02.11 falha: mensagem padrão e "Tentar de novo" | texto e botão | P2:257-262 | E2:199 | ✅ PASS |

### USR-03 Proteção no banco

| Critério | Resultado afirmado pela spec | Código | Teste | Result |
| -------- | ---------------------------- | ------ | ----- | ------ |
| 03.1 funções próprias que leem `equipe_legisla` a cada chamada | recusa na hora ao sair da equipe | SQL:47, SQL:115 (`private.eh_legisla()`) | L:342, L:356; D:186, D:199 | ✅ PASS |
| 03.2 não membro: "Você não tem permissão para esta ação." e 42501 | `code 42501` e mensagem exata | SQL:47-49, SQL:115-117 | L:349 e D:191 (`SEM_PERMISSAO = { code: '42501', message: /^Você não tem permissão para esta ação\.$/ }`, para conta de mandato e conta sem equipe); mutantes M1 e M2 mortos | ✅ PASS |
| 03.3 `anon` sem execute | `has_function_privilege('anon', ...)` falso e "permission denied" | SQL:101, SQL:150 | L:363 (`[{ a: false }]` e `NEGADO`); D:206; mutante M4 morto | ✅ PASS |
| 03.4 só os campos da spec | sem senha, hash, token, metadados | SQL:84-92, SQL:119-140 | L:90, L:102 (token e `provider_token` ausentes); D:83, D:92 | ✅ PASS (SP-5: a spec não enumera os campos dentro do USR-03) |
| 03.5 não grava nada | `provolatile = 's'` | SQL:38, SQL:111 (`stable`) | L:372; D:213 (`v: 's'`) | ✅ PASS (a prova é só a volatilidade; o corpo não tem DML, conferido na leitura) |
| 03.6 busca, filtros, limite e posição no servidor, com total filtrado | `total` das que atendem | SQL:62-80 | L:221, L:231, L:238 | ✅ PASS |
| 03.7 limite fora de 1 a 100 vira 25 | 0, -1, 101, nulo viram 25 | SQL:43 | L:210 (`for limite of [0,-1,101,null]` igual a 25; 1 e 100 valem) | ✅ PASS |

### USR-04 Busca, filtros e paginação

| Critério | Resultado afirmado pela spec | Código | Teste | Result |
| -------- | ---------------------------- | ------ | ----- | ------ |
| 04.1 busca por nome ou e-mail sem maiúsculas e acentos, volta à página 1 | match; página 1 | SQL:65-67; P1:67-80 | L:244, L:253, L:258, L:263; E1:264, E1:274 | ✅ PASS (SP-2: acentos fora das vogais e do ç) |
| 04.2 filtro de papel com 5 opções | `Todos, Coordenação, Assessoria, Somente leitura, Equipe Legisla` | `usuarios.ts` `FILTROS_PAPEL` | U:75; E1:280; L:279 | ✅ PASS |
| 04.3 filtro de mandato: não arquivados, ordem alfabética | ordem e conteúdo | P1:57-65 | E1:296 | ✅ PASS |
| 04.4 filtro "só quem não preencheu o perfil" | só sem perfil | SQL:68; P1:122-125 | L:293; E1:306; mutante M6 morto | ✅ PASS |
| 04.5 filtros juntos | interseção | SQL:62-76 | L:299, L:306, L:314; E1:315 | ✅ PASS (SP-1) |
| 04.6 trocar de página mantém busca e filtros | URL mantém | P1:185-186; `montaConsulta` | U:15; E1:332, E1:401 | ✅ PASS |
| 04.7 sem resultado: "Nenhuma pessoa encontrada com esses filtros." | texto exato | P1:145 | E1:350, E1:380 | ✅ PASS |
| 04.8 "Limpar filtros" com filtro ativo | botão só com filtro | P1:126 | U:66; E1:358 | ✅ PASS |

### Edge Cases

| Caso | Código | Teste | Result |
| ---- | ------ | ----- | ------ |
| mandato arquivado com "(arquivado)" | SQL:87-91; `rotuloMandato` | L:331; U:111; E1:72 | ✅ |
| busca com mais de 100 caracteres cortada | SQL:41 (`left(...,100)`); `lerConsulta` | L:270; U:51; E1:388 | ✅ |
| mesmo nome distinguido pelo e-mail | P1:169 | L:178; E1:85 | ✅ |
| conta sem e-mail mostra "—" | P1:169 | L:171; E1:85 | ✅ |
| equipe Legisla e mandato juntos | SQL:84-92 | L:142; E1:72 | ✅ |

**Status**: ✅ Todos os ACs cobertos com valor da spec. ⚠️ 5 imprecisões de spec anotadas (SP-1 a SP-5). ❌ 1 gap de teste (GAP-1).

---

## Pontos de atenção (a) a (f)

- **(a) papel e mandato juntos.** O SQL exige o mesmo vínculo (`exists` sobre `membros` com `mandato_id` e `papel` na mesma linha, SQL:72-76). Quem é `assessoria` em A e `coordenacao` em B não aparece em "coordenacao + A". É coerente com "aplicar todos juntos" e o teste L:306 fixa o valor, mas a spec não diz se é a mesma participação: SP-1.
- **(b) `p_papel` desconhecido.** Não filtra e não dá erro: a sonda no PGlite com `xyz` e `'; drop` devolveu os 7 contas, sem erro e sem efeito colateral (SQL:41, usado só como valor, nunca concatenado). Mas nenhum teste cobre isso: o mutante M9 sobreviveu (GAP-1). A UI nunca envia valor desconhecido (`lerConsulta` normaliza para "todos").
- **(c) injeção na busca.** A busca usa `strpos` com o texto como parâmetro. Sonda: `'`, `o'neil`, `\`, `'; drop table public.perfis; --`, `%`, `_`, `100%`: sem erro, `perfis` intacta. `%` e `_` são literais: `_` achou só `a_b@x.com`, não `axb@x.com`; `%` achou só quem tem `%` no nome. Isso é o melhor reading de "busca por nome ou e-mail"; a spec não diz "literal": SP-2 (também: nenhum teste de `%`/`_`).
- **(d) último acesso.** Vem de `u.last_sign_in_at` (SQL:52, SQL:86, SQL:126); L:186 afirma o valor exato e a ordem usa o mesmo campo (L:198; M5 morto).
- **(e) `de=`.** `lerConsulta` descarta tudo que não é `q`, `papel`, `mandato`, `sem_perfil`, `pagina`. Com `de=https://evil.example` o "Voltar" vai para `/admin/usuarios` (executado: `montaConsulta(lerConsulta('https://evil.example'))` devolve vazio). E2:162 cobre `javascript:` e valores estranhos; sem redirecionamento para fora. Mutante M7 morto.
- **(f) conta de mandato.** A migration só cria funções e grants de função: não cria policy nem grant de tabela (conferido por leitura do SQL inteiro). Na sonda, `membro` recebeu "permission denied" em `auth.users`; `anon` recebeu "permission denied" em `perfis` e no schema `private`; `authenticated` não executa `private.sem_acento`. Em `perfis`, `consentimentos` e `equipe_legisla` o `membro` viu 0 linhas, mas a semente do PGlite não tem linhas nessas tabelas, então essa parte é inconclusiva: ela depende da RLS que já existia e que esta feature não tocou.

---

## Discrimination Sensor

Scratch fora da árvore (`git worktree add --detach` em pasta temporária, com cópia de `node_modules`), removido no fim. Testes por arquivo: `node --test <arquivo>` (SQL) e `playwright test e2e/admin-usuarios-detalhe.spec.ts` (tela).

| Mutante | Arquivo:linha | Descrição | Killed? |
| ------- | ------------- | --------- | ------- |
| M1 | `...admin_usuarios.sql:47-49` | removeu `eh_legisla` de `admin_usuarios` | ✅ morto (L:349, L:356) |
| M2 | `...admin_usuarios.sql:115-117` | removeu `eh_legisla` de `admin_usuario_detalhe` | ✅ morto (D:191, D:199) |
| M3 | `...admin_usuarios.sql:84` | a lista devolve `telefone` | ✅ morto (L:102, L:90) |
| M4 | `...admin_usuarios.sql:102` | `execute` da lista para `anon` | ✅ morto (L:363) |
| M5 | `...admin_usuarios.sql:78,94` | ordem do último acesso invertida | ✅ morto (L:198) |
| M6 | `...admin_usuarios.sql:68` | ignora `p_sem_perfil` | ✅ morto (L:293, L:314, L:231) |
| M7 | `app/admin/usuarios/[id]/page.tsx:233` | `de=` usado cru, sem `lerConsulta` | ✅ morto (E2:162) |
| M8 | `app/admin/usuarios/[id]/page.tsx:249` | botão "Editar" no detalhe | ✅ morto (E2:172, E2:179) |
| M9 (extra) | `...admin_usuarios.sql:41` | `p_papel` desconhecido passa a filtrar (`p_papel <> 'legisla'`) | ❌ **sobreviveu**: 0 falhas em `sql-admin-usuarios.test.ts` |

**Sensor depth**: lightweight reforçado (9 mutantes, foco em segurança e dado sensível). **Result**: 8/9 mortos, **FAIL**.

Isolamento: `git status --porcelain` do worktree da feature idêntico ao de antes (as mudanças em `graphify-out/` já existiam). Scratch e `playwright.isolado.config.ts` removidos; sem servidor na porta 3100.

---

## Gate Check

- `npx tsc --noEmit`: exit 0.
- `node --test --test-concurrency=3 "tests/**/*.test.ts"`: 1190 passaram, 0 falharam, 0 ignorados.
- e2e `admin-usuarios.spec.ts`, `admin-usuarios-detalhe.spec.ts`, `admin-acesso.spec.ts` no servidor próprio da porta 3100: 68 passaram, 0 falharam.

---

## Code Quality

| Princípio | Status |
| --------- | ------ |
| Minimum code / surgical changes | ✅ só os arquivos da feature, mais `sql-ambiente.ts` (`last_sign_in_at`) e o item de menu |
| Matches patterns (security definer, `search_path` vazio, 42501, sem `anon`) | ✅ |
| Spec-anchored outcome check | ✅ com 5 imprecisões de spec |
| Todo teste mapeia para AC ou Edge Case | ✅ (rótulos nos nomes dos testes) |
| Guidelines documentadas | nenhuma além de `CLAUDE.md`; padrões do painel seguidos |

---

## Spec-precision gaps

- **SP-1** (USR-04.5): "aplicar todos juntos" não diz se papel e mandato valem para a mesma participação. A implementação exige a mesma participação (decisão 1 do worker, AD-014). Confirmar com o dono do produto e escrever na spec.
- **SP-2** (USR-04.1): "sem diferenciar acentos" não lista os caracteres, nem diz que `%`, `_` e `\` são literais. `private.sem_acento` (SQL:25-27) cobre as vogais acentuadas e o ç; `ñ`, `ý` e similares não são normalizados.
- **SP-3** (USR-01.5): o texto da marca ("Equipe Legisla · admin") não está na spec.
- **SP-4** (USR-01.6): "nome do cadastro" não diz quais chaves de `raw_user_meta_data` valem (o SQL lê `nome`, `full_name`, `name`).
- **SP-5** (USR-03.4): "campos listados na spec" não aponta a lista; ela está nas Assumptions (colunas) e no design.

---

## Fix Plans

### GAP-1 (menor): `p_papel` desconhecido sem teste (M9 sobreviveu)

- **Root cause**: nenhum teste chama `admin_usuarios` com papel fora de `coordenacao`, `assessoria`, `leitura`, `legisla`.
- **Fix task**: em `plataforma/tests/sql-admin-usuarios.test.ts`, depois do teste L:279, acrescentar um teste que chame `lista({ papel: 'xyz' })` e `lista({ papel: "'; drop" })` e afirme `ids(...)` igual a `ids(await lista())` (sem erro). Opcional: um teste com `busca: "%"` e `busca: "_"` afirmando que só acha quem tem o caractere no nome ou e-mail (fixa SP-2).
- **Priority**: Minor (o comportamento está certo; falta fixá-lo).

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| USR-01 | Implemented | ✅ Verified (comportamento) |
| USR-02 | Implemented | ✅ Verified (comportamento) |
| USR-03 | Implemented | ✅ Verified (comportamento) |
| USR-04 | Implemented | ✅ Verified, com GAP-1 de teste pendente |

---

## Summary

**Overall**: ❌ FAIL (por GAP-1; nenhum AC falhou)

**Spec-anchored check**: 4/4 grupos (38 ACs e 5 edge cases) bateram com o resultado da spec; 5 imprecisões de spec anotadas.
**Sensor**: 8/9 mutantes mortos, 1 sobrevivente (M9).
**Gate**: tsc 0 erros; 1190/1190 unidade e SQL; 68/68 e2e.

**Next steps**: aplicar o teste de GAP-1 e rodar de novo o Verifier só sobre ele. As 10 decisões do worker em AD-014 não escondem gap de segurança; SP-1 a SP-4 pedem confirmação do dono do produto.
