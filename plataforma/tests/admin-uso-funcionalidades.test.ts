import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usoPorDia, usoPorFuncionalidade } from '../lib/admin/usoFuncionalidades.ts';
import type { LinhaUsoCampos, LinhaUsoDia } from '../lib/admin/usoFuncionalidades.ts';

const vazia = (id: string): LinhaUsoCampos => ({
  mandato_id: id, uf: 'SP', persona: false, conjuntura: false, municipio: false, eleitorado: false, social: false, cadeiras: false,
});
const todas = (id: string): LinhaUsoCampos => ({ ...vazia(id), persona: true, conjuntura: true, municipio: true, eleitorado: true, social: true, cadeiras: true });
const contagens = (l: LinhaUsoCampos[]) => usoPorFuncionalidade(l).map((x) => x.mandatos);

test('devolve as 6 linhas da Fase 1, na ordem da spec (ADM-12.11)', () => {
  const r = usoPorFuncionalidade([vazia('a')]);
  assert.deepEqual(r.map((x) => x.nome), ['Persona', 'Conjuntura', 'Município', 'Eleitorado', 'Social', 'Cadeiras e escalação']);
  assert.deepEqual(r.map((x) => x.id), ['persona', 'conjuntura', 'municipio', 'eleitorado', 'social', 'cadeiras']);
});

test('zero mandatos: as 6 linhas continuam, todas com 0', () => {
  assert.deepEqual(contagens([]), [0, 0, 0, 0, 0, 0]);
});

test('todos os mandatos usaram tudo: cada linha conta todos', () => {
  assert.deepEqual(contagens([todas('a'), todas('b'), todas('c')]), [3, 3, 3, 3, 3, 3]);
});

test('um só mandato que usou uma só funcionalidade soma 1 só naquela linha', () => {
  assert.deepEqual(contagens([{ ...vazia('a'), municipio: true }, vazia('b')]), [0, 0, 1, 0, 0, 0]);
});

test('cada campo alimenta a sua linha e nenhuma outra', () => {
  const campos = ['persona', 'conjuntura', 'municipio', 'eleitorado', 'social', 'cadeiras'] as const;
  campos.forEach((c, i) => {
    const esperado = [0, 0, 0, 0, 0, 0];
    esperado[i] = 1;
    assert.deepEqual(contagens([{ ...vazia('a'), [c]: true }]), esperado, c);
  });
});

test('mandato arquivado fica de fora, quando a linha traz arquivado_em (ADM-08.1)', () => {
  const r = usoPorFuncionalidade([todas('a'), { ...todas('b'), arquivado_em: '2026-10-01T12:00:00Z' }]);
  assert.deepEqual(r.map((x) => x.mandatos), [1, 1, 1, 1, 1, 1]);
});

test('aberturas e tendência ficam null sem registro de uso (ADM-12.12)', () => {
  for (const linha of usoPorFuncionalidade([todas('a')])) {
    assert.equal(linha.aberturas, null);
    assert.equal(linha.tendencia, null);
  }
});

test('não altera a lista recebida', () => {
  const l = [todas('a'), vazia('b')];
  const antes = JSON.stringify(l);
  usoPorFuncionalidade(l);
  assert.equal(JSON.stringify(l), antes);
});

// ---- registro de uso (P3, ADM-15) ----
const AGORA = new Date('2026-11-06T15:00:00Z'); // 06/11 em Brasília
const uso = (dia: string, funcionalidade: string, qtd = 1, mandato_id = 'a'): LinhaUsoDia => ({ dia, mandato_id, uf: 'SP', funcionalidade, qtd });
const linha = (r: ReturnType<typeof usoPorFuncionalidade>, id: string) => r.find((x) => x.id === id)!;

test('com uso: aberturas somam só o período e a janela é de N dias de calendário com hoje incluído (ADM-15.7)', () => {
  const u = [uso('2026-11-06', 'persona', 2), uso('2026-10-31', 'persona', 3), uso('2026-10-30', 'persona', 10), uso('2026-11-05', 'social', 4)];
  const r7 = usoPorFuncionalidade([vazia('a')], u, AGORA, 7);
  assert.equal(linha(r7, 'persona').aberturas, 5); // 06/11 e 31/10 (6 dias atrás) entram; 30/10 (7 dias atrás) não
  assert.equal(linha(r7, 'social').aberturas, 4);
  assert.equal(linha(r7, 'conjuntura').aberturas, 0);
  assert.equal(linha(usoPorFuncionalidade([vazia('a')], u, AGORA, 30), 'persona').aberturas, 15);
});

test('tendência: 5 semanas de 7 dias terminando hoje, da mais antiga para a atual (ADM-15.7)', () => {
  const u = [
    uso('2026-11-06', 'persona', 1), uso('2026-10-31', 'persona', 1), // semana atual (0 a 6 dias atrás)
    uso('2026-10-30', 'persona', 2), uso('2026-10-24', 'persona', 2), // 7 a 13 dias atrás
    uso('2026-10-16', 'persona', 4), // 21 a 27 dias atrás: 3ª semana para trás (índice 1)
    uso('2026-10-03', 'persona', 8), // 34 dias atrás: última semana (índice 0)
    uso('2026-10-02', 'persona', 99), // 35 dias atrás: fora das 5 semanas
  ];
  const t = linha(usoPorFuncionalidade([vazia('a')], u, AGORA), 'persona').tendencia;
  assert.deepEqual(t, [8, 4, 0, 4, 2]);
});

test('o dia é o de Brasília: virada do dia usa o fuso, não o UTC (ADM-15.7)', () => {
  // 02:00Z de 07/11 ainda é 06/11 em Brasília: "hoje" continua 06/11 e a linha de 06/11 conta como hoje
  const tarde = new Date('2026-11-07T02:00:00Z');
  const r = usoPorFuncionalidade([vazia('a')], [uso('2026-11-06', 'persona', 3)], tarde, 7);
  assert.equal(linha(r, 'persona').aberturas, 3);
  assert.deepEqual(linha(r, 'persona').tendencia, [0, 0, 0, 0, 3]);
});

test('com uso aparece a linha Organograma e rotinas, com mandatos distintos que a abriram (ADM-15.7)', () => {
  const u = [uso('2026-11-06', 'organograma', 1, 'a'), uso('2026-11-05', 'organograma', 2, 'a'), uso('2026-11-05', 'organograma', 1, 'b')];
  const r = usoPorFuncionalidade([vazia('a')], u, AGORA, 30);
  assert.deepEqual(r.map((x) => x.nome).slice(-2), ['Cadeiras e escalação', 'Organograma e rotinas']);
  assert.equal(r.length, 7);
  assert.equal(linha(r, 'organograma').mandatos, 2);
  assert.equal(linha(r, 'organograma').aberturas, 4);
});

test('"Mandatos que usaram" das 6 linhas segue vindo dos campos mesmo com uso (ADM-12.11)', () => {
  const r = usoPorFuncionalidade([todas('a'), vazia('b')], [uso('2026-11-06', 'persona', 5, 'b')], AGORA, 30);
  assert.deepEqual(r.slice(0, 6).map((x) => x.mandatos), [1, 1, 1, 1, 1, 1]);
});

test('uso vazio ou ausente mantém o comportamento sem registro: 6 linhas com null (ADM-12.12)', () => {
  for (const u of [undefined, []]) {
    const r = usoPorFuncionalidade([todas('a')], u, AGORA, 30);
    assert.equal(r.length, 6);
    assert.ok(r.every((x) => x.aberturas === null && x.tendencia === null));
  }
});

test('usoPorFuncionalidade com uso não altera a lista recebida', () => {
  const u = [uso('2026-11-06', 'persona', 1)];
  const antes = JSON.stringify(u);
  usoPorFuncionalidade([vazia('a')], u, AGORA, 30);
  assert.equal(JSON.stringify(u), antes);
});

test('usoPorDia devolve 14 dias, do mais antigo para hoje, somando todas as funcionalidades (ADM-15.7)', () => {
  const u = [uso('2026-11-06', 'persona', 2), uso('2026-11-06', 'social', 3), uso('2026-10-24', 'persona', 7), uso('2026-10-23', 'persona', 99)];
  const r = usoPorDia(u, AGORA);
  assert.equal(r.length, 14);
  assert.equal(r[0].dia, '2026-10-24'); // 13 dias atrás
  assert.equal(r[13].dia, '2026-11-06');
  assert.equal(r[0].total, 7);
  assert.equal(r[13].total, 5);
  assert.equal(r.reduce((s, d) => s + d.total, 0), 12); // 23/10 fica de fora
});

test('usoPorDia sem registro devolve 14 dias zerados e atravessa a virada de mês e de ano', () => {
  const r = usoPorDia([], new Date('2027-01-05T15:00:00Z'));
  assert.equal(r.length, 14);
  assert.ok(r.every((d) => d.total === 0));
  assert.deepEqual([r[0].dia, r[13].dia], ['2026-12-23', '2027-01-05']);
});
