import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECOES, semanaDe, lerComunicacao, registra, serie, ultimoRegistro, aparicoesPorBandeira, type Comunicacao } from '../lib/comunicacao.ts';

/* Missão 4 · regras da comunicação (CAP-20, CAP-21, CAP-31, CAP-40). Resultados esperados vêm da spec e do calendário ISO. */
const vazia: Comunicacao = { semanas: {}, clipping: [] };
const ok = (r: ReturnType<typeof registra>) => { assert.equal(r.ok, true); return (r as { ok: true; com: Comunicacao }).com; };

test('semanaDe: 2026-12-31 cai na semana ISO 2026-W53 (virada de ano, CAP-40)', () => {
  assert.equal(semanaDe('2026-12-31'), '2026-W53');
});

test('semanaDe: 2027-01-01 (sexta) ainda é 2026-W53 e a segunda 2027-01-04 abre 2027-W01 (CAP-40)', () => {
  assert.equal(semanaDe('2027-01-01'), '2026-W53');
  assert.equal(semanaDe('2027-01-03'), '2026-W53');
  assert.equal(semanaDe('2027-01-04'), '2027-W01');
});

test('semanaDe: segunda a domingo na mesma semana (CAP-20.2) e início de 2026', () => {
  assert.equal(semanaDe('2026-10-26'), '2026-W44');
  assert.equal(semanaDe('2026-11-01'), '2026-W44');
  assert.equal(semanaDe('2026-11-02'), '2026-W45');
  assert.equal(semanaDe('2026-01-01'), '2026-W01');
  assert.equal(semanaDe('2024-12-30'), '2025-W01');
});

test('semanaDe: aceita Date e recusa data inválida', () => {
  assert.equal(semanaDe(new Date(2026, 9, 27)), '2026-W44');
  assert.equal(semanaDe('2026-02-30'), null);
  assert.equal(semanaDe('amanhã'), null);
  assert.equal(semanaDe(new Date('x')), null);
});

test('as 5 seções do Guia têm a caixinha antiga m4.k1 a m4.k5 e campos com ajuda (CAP-21.8)', () => {
  assert.deepEqual(SECOES.map((s) => s.caixinha), ['m4.k1', 'm4.k2', 'm4.k3', 'm4.k4', 'm4.k5']);
  assert.deepEqual(SECOES.map((s) => s.campos.length), [3, 3, 2, 2, 2]);
  assert.ok(SECOES.every((s) => s.campos.every((c) => c.ajuda.trim() !== '' && c.rot.trim() !== '')));
});

test('registra: registrar a mesma semana duas vezes edita o registro, não duplica (CAP-20.3)', () => {
  let c = ok(registra(vazia, 'k1', '2026-W44', { seguidores: 100, novos: 5 }));
  c = ok(registra(c, 'k1', '2026-W44', { seguidores: 110, novos: 9 }));
  assert.deepEqual(Object.keys(c.semanas), ['2026-W44']);
  assert.deepEqual(c.semanas['2026-W44'].k1, { seguidores: 110, novos: 9 });
  assert.deepEqual(serie(c, 'k1', 'seguidores'), [{ semana: '2026-W44', valor: 110 }]);
});

test('registra: não muda a entrada e preserva as outras seções da semana (CAP-40)', () => {
  const a = ok(registra(vazia, 'k1', '2026-W44', { alcance: 1 }));
  const b = ok(registra(a, 'k2', '2026-W44', { comentarios: 2 }));
  assert.deepEqual(a.semanas['2026-W44'], { k1: { alcance: 1 } });
  assert.deepEqual(b.semanas['2026-W44'], { k1: { alcance: 1 }, k2: { comentarios: 2 } });
});

test('registra: número negativo é rejeitado e nada é gravado (CAP-20.4)', () => {
  const r = registra(vazia, 'k1', '2026-W44', { seguidores: -1 });
  assert.equal(r.ok, false);
  assert.match((r as { erro: string }).erro, /negativo/);
  assert.deepEqual(vazia.semanas, {});
});

test('registra: zero vale; texto, NaN, infinito, campo e seção desconhecidos são rejeitados (CAP-20.4)', () => {
  assert.equal(registra(vazia, 'k1', '2026-W44', { seguidores: 0 }).ok, true);
  for (const v of ['10', Number.NaN, Infinity, null, undefined]) assert.equal(registra(vazia, 'k1', '2026-W44', { seguidores: v }).ok, false, String(v));
  assert.equal(registra(vazia, 'k1', '2026-W44', { inventado: 1 }).ok, false);
  assert.equal(registra(vazia, 'k9', '2026-W44', { seguidores: 1 }).ok, false);
  assert.equal(registra(vazia, 'k1', 'semana1', { seguidores: 1 }).ok, false);
});

test('serie devolve as semanas em ordem, mesmo registradas fora de ordem, e na virada de ano (CAP-21.5)', () => {
  let c = ok(registra(vazia, 'k1', '2027-W01', { alcance: 30 }));
  c = ok(registra(c, 'k1', '2026-W53', { alcance: 20 }));
  c = ok(registra(c, 'k1', '2026-W44', { alcance: 10 }));
  c = ok(registra(c, 'k2', '2026-W45', { comentarios: 7 }));
  assert.deepEqual(serie(c, 'k1', 'alcance'), [{ semana: '2026-W44', valor: 10 }, { semana: '2026-W53', valor: 20 }, { semana: '2027-W01', valor: 30 }]);
  assert.deepEqual(serie(c, 'k1', 'novos'), []);
});

test('ultimoRegistro mostra a semana mais recente da seção, ou null sem registro (CAP-20.1)', () => {
  assert.equal(ultimoRegistro(vazia, 'k1'), null);
  let c = ok(registra(vazia, 'k1', '2026-W45', { alcance: 2 }));
  c = ok(registra(c, 'k1', '2026-W44', { alcance: 1 }));
  assert.deepEqual(ultimoRegistro(c, 'k1'), { semana: '2026-W45', valores: { alcance: 2 } });
});

test('lerComunicacao: dado ausente, corrompido ou parcial vira estrutura válida sem perder o que é válido (CAP-40)', () => {
  assert.deepEqual(lerComunicacao(undefined), { semanas: {}, clipping: [] });
  assert.deepEqual(lerComunicacao('lixo'), { semanas: {}, clipping: [] });
  const c = lerComunicacao({ semanas: { '2026-W44': { k1: { alcance: 3, novos: -2, x: 'a' }, k9: { a: 1 } }, ruim: { k1: {} } }, clipping: [null, { id: 'n1' }] });
  assert.deepEqual(c.semanas, { '2026-W44': { k1: { alcance: 3 } } });
  assert.equal(c.clipping.length, 1);
});

test('aparicoesPorBandeira: conta por bandeira, "sem" para sem etiqueta, e ignora as ocultas (CAP-31)', () => {
  const n = (id: string, bandeiras: string[], extra = {}) => ({ id, semana: '2026-W44', titulo: id, veiculo: 'v', data: '2026-10-27', url: `u${id}`, bandeiras, ...extra });
  const r = aparicoesPorBandeira([n('1', ['educacao']), n('2', ['educacao', 'saude']), n('3', []), n('4', ['saude'], { oculta: true })]);
  assert.deepEqual(r, { educacao: 2, saude: 1, sem: 1 });
  assert.deepEqual(aparicoesPorBandeira([n('1', ['educacao']), n('2', ['saude'], { semana: '2026-W45' })], '2026-W45'), { saude: 1 });
});
