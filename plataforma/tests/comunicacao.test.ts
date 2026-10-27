import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECOES, semanaDe, lerComunicacao, registra, serie, ultimoRegistro, aparicoesPorBandeira, indicador, caixinhasParaMarcar, mesclaBusca, aparicoesDaSemana, adicionaManual, ocultaNoticias, etiquetaNoticias, type Comunicacao } from '../lib/comunicacao.ts';

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

test('indicador: um número por semana de cada seção (o principal; se faltar, o primeiro registrado), em ordem de semana (CAP-21.7)', () => {
  let c = ok(registra(vazia, 'k1', '2026-W45', { seguidores: 1100, alcance: 300 }));
  c = ok(registra(c, 'k1', '2026-W44', { seguidores: 1000, alcance: 200 }));
  c = ok(registra(c, 'k1', '2026-W46', { seguidores: 1200 })); // sem o principal (alcance): vale o primeiro campo registrado
  assert.deepEqual(indicador(c, 'k1'), [{ semana: '2026-W44', valor: 200 }, { semana: '2026-W45', valor: 300 }, { semana: '2026-W46', valor: 1200 }]);
  assert.deepEqual(indicador(c, 'k2'), []);
});

test('caixinhasParaMarcar: só as seções com registro cujas caixinhas antigas ainda estão desmarcadas (CAP-21.8)', () => {
  let c = ok(registra(vazia, 'k1', '2026-W44', { alcance: 1 }));
  c = ok(registra(c, 'k3', '2026-W44', { recebidas: 0 }));
  c = ok(registra(c, 'k4', '2026-W44', { convites: 2 }));
  assert.deepEqual(caixinhasParaMarcar(c, { 'm4.k4': true as unknown as string }), ['m4.k1', 'm4.k3']);
  assert.deepEqual(caixinhasParaMarcar(vazia, {}), []);
});

test('mesclaBusca: entra sem bandeira e visível, sem repetir link/título (nem de oculta), ignora item sem título (CAP-30)', () => {
  let n = 0;
  const id = () => `n${++n}`;
  const base: Comunicacao['clipping'] = [{ id: 'x', semana: '2026-W44', titulo: 'Velha notícia', veiculo: 'V', data: '2026-10-27', url: 'https://g/0', bandeiras: [], oculta: true }];
  const r = mesclaBusca(base, [
    { titulo: 'Nova A', veiculo: 'O Globo', data: '2026-10-28', url: 'https://g/1' },
    { titulo: 'Velha notícia!', veiculo: 'V', data: '2026-10-27', url: 'https://g/9' },
    { titulo: 'Outra', veiculo: 'V', data: '2026-10-28', url: 'https://g/0' },
    { titulo: '  ', veiculo: 'V', data: '2026-10-28', url: 'https://g/5' },
    { titulo: 'Nova A', veiculo: 'O Globo', data: '2026-10-28', url: 'https://g/1' },
    { titulo: 'Data ruim', veiculo: '', data: 'ontem', url: 'javascript:x' },
  ], id);
  assert.equal(r.novas, 2);
  assert.deepEqual(r.clipping.slice(1).map((x) => [x.id, x.titulo, x.semana, x.bandeiras, x.oculta, x.url]), [['n1', 'Nova A', '2026-W44', [], undefined, 'https://g/1'], ['n2', 'Data ruim', semanaDe(new Date()), [], undefined, '']]);
  assert.equal(base.length, 1);
});

test('adicionaManual: título e data obrigatórios; link opcional mas precisa ser http(s); semana vem da data (CAP-30.5)', () => {
  const id = () => 'm1';
  assert.equal(adicionaManual([], { titulo: ' ', veiculo: '', url: '', data: '2026-10-28' }, id).ok, false);
  assert.equal(adicionaManual([], { titulo: 'T', veiculo: '', url: '', data: '' }, id).ok, false);
  assert.equal(adicionaManual([], { titulo: 'T', veiculo: '', url: 'ftp://x', data: '2026-10-28' }, id).ok, false);
  const r = adicionaManual([], { titulo: ' Entrevista ', veiculo: 'Rádio X ', url: '', data: '2026-12-31' }, id);
  assert.deepEqual(r.ok && r.clipping, [{ id: 'm1', semana: '2026-W53', titulo: 'Entrevista', veiculo: 'Rádio X', data: '2026-12-31', url: '', bandeiras: [], manual: true }]);
});

test('ocultaNoticias e etiquetaNoticias: lote, sem repetir etiqueta, sem mutar; oculta não conta no gráfico (CAP-31)', () => {
  const mk = (id: string) => ({ id, semana: '2026-W44', titulo: id, veiculo: '', data: '2026-10-28', url: '', bandeiras: [] as string[] });
  const base = [mk('a'), mk('b'), mk('c')];
  let c = etiquetaNoticias(base, ['a', 'b'], 'add', 'saude');
  c = etiquetaNoticias(c, ['a'], 'add', 'saude');
  c = etiquetaNoticias(c, ['a'], 'add', 'educacao');
  assert.deepEqual(c.map((n) => n.bandeiras), [['saude', 'educacao'], ['saude'], []]);
  assert.deepEqual(etiquetaNoticias(c, ['a'], 'remove', 'saude')[0].bandeiras, ['educacao']);
  assert.deepEqual(etiquetaNoticias(c, ['a', 'b'], 'limpa').map((n) => n.bandeiras), [[], [], []]);
  assert.deepEqual(base.map((n) => n.bandeiras), [[], [], []]);
  const o = ocultaNoticias(c, ['b'], true);
  assert.deepEqual(aparicoesPorBandeira(o), { saude: 1, educacao: 1, sem: 1 });
  assert.equal(ocultaNoticias(o, ['b'], false)[1].oculta, false);
});
test('aparicoesDaSemana: conta só as não ocultas da semana pedida (CAP-31.7)', () => {
  const mk = (id: string, semana: string, oculta = false) => ({ id, semana, titulo: id, veiculo: '', data: '', url: '', bandeiras: [] as string[], oculta });
  const c = [mk('a', '2026-W44'), mk('b', '2026-W44'), mk('c', '2026-W44', true), mk('d', '2026-W43')];
  assert.equal(aparicoesDaSemana(c, '2026-W44'), 2);
  assert.equal(aparicoesDaSemana(c, '2026-W43'), 1);
  assert.equal(aparicoesDaSemana(c, '2026-W42'), 0);
  assert.equal(aparicoesDaSemana([], '2026-W44'), 0);
});