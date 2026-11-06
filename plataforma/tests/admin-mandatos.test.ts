import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtraMandatos, paginaDe, semAcento, TAMANHO_PAGINA } from '../lib/admin/mandatos.ts';
import type { LinhaMandato } from '../lib/admin/mandatos.ts';

const AGORA = new Date('2026-11-05T15:00:00Z');

function m(o: Partial<LinhaMandato> & { codigo: string }): LinhaMandato {
  return {
    id: 'id-' + o.codigo, nome_parlamentar: null, cargo: null, casa: null, uf: null, partido: null, data_posse: null,
    resp_nome: null, resp_cargo: null, criado_em: '2026-01-01T12:00:00Z', arquivado_em: null, membros: 1,
    ultima_atividade: '2026-11-04T12:00:00Z', exercicios_concluidos: 0, ...o,
  };
}
const codigos = (l: LinhaMandato[]) => l.map((x) => x.codigo);

const base = [
  m({ codigo: 'AAA111', nome_parlamentar: 'José Conceição', uf: 'SP', casa: 'Câmara dos Deputados' }),
  m({ codigo: 'BBB222', nome_parlamentar: 'Ana Maria', uf: 'SP', casa: 'Assembleia Legislativa' }),
  m({ codigo: 'CCC333', nome_parlamentar: 'João da Silva', uf: 'RJ', casa: 'Câmara dos Deputados', ultima_atividade: '2026-09-01T12:00:00Z' }),
  m({ codigo: 'DDD444', nome_parlamentar: 'Arquivada Souza', uf: 'RJ', casa: 'Senado Federal', arquivado_em: '2026-10-01T12:00:00Z' }),
];

test('semAcento tira acentos e cedilha sem mexer no resto', () => {
  assert.equal(semAcento('José Conceição'), 'Jose Conceicao');
});

test('sem filtros, devolve só os não arquivados, na ordem recebida (ADM-05.1)', () => {
  assert.deepEqual(codigos(filtraMandatos(base, {}, AGORA)), ['AAA111', 'BBB222', 'CCC333']);
});

test('busca por nome sem acento e sem maiúsculas (ADM-05.3)', () => {
  assert.deepEqual(codigos(filtraMandatos(base, { busca: 'jose conceicao' }, AGORA)), ['AAA111']);
  assert.deepEqual(codigos(filtraMandatos(base, { busca: 'JOAO' }, AGORA)), ['CCC333']);
  assert.deepEqual(codigos(filtraMandatos(base, { busca: 'conceição' }, AGORA)), ['AAA111']);
});

test('busca por código, parcial e sem diferenciar maiúsculas; espaços nas pontas não contam', () => {
  assert.deepEqual(codigos(filtraMandatos(base, { busca: ' bbb2 ' }, AGORA)), ['BBB222']);
});

test('nome parlamentar nulo não quebra a busca', () => {
  const l = [m({ codigo: 'ZZZ999' }), ...base];
  assert.deepEqual(codigos(filtraMandatos(l, { busca: 'zzz' }, AGORA)), ['ZZZ999']);
  assert.deepEqual(codigos(filtraMandatos(l, { busca: 'ana' }, AGORA)), ['BBB222']);
});

test('UF e casa se combinam (ADM-05.4)', () => {
  assert.deepEqual(codigos(filtraMandatos(base, { uf: 'SP' }, AGORA)), ['AAA111', 'BBB222']);
  assert.deepEqual(codigos(filtraMandatos(base, { uf: 'SP', casa: 'Câmara dos Deputados' }, AGORA)), ['AAA111']);
  assert.deepEqual(codigos(filtraMandatos(base, { uf: 'RJ', casa: 'Assembleia Legislativa' }, AGORA)), []);
});

test('busca combinada com UF', () => {
  assert.deepEqual(codigos(filtraMandatos(base, { busca: 'a', uf: 'RJ' }, AGORA)), ['CCC333']);
});

test('situação "arquivados" lista só os arquivados; "ativos" só os demais (ADM-05.4, ADM-08.2)', () => {
  assert.deepEqual(codigos(filtraMandatos(base, { situacao: 'arquivados' }, AGORA)), ['DDD444']);
  assert.deepEqual(codigos(filtraMandatos(base, { situacao: 'ativos' }, AGORA)), ['AAA111', 'BBB222', 'CCC333']);
});

test('"Parado há" 45 lista só quem está parado há mais de 45 dias (ADM-05.9)', () => {
  // CCC333: 01/09 a 05/11 = 65 dias
  assert.deepEqual(codigos(filtraMandatos(base, { paradoHa: 45 }, AGORA)), ['CCC333']);
});

test('"Parado há" usa "mais de N": exatamente N dias não entra', () => {
  const l = [m({ codigo: 'X45', ultima_atividade: '2026-09-21T15:00:00Z' }), m({ codigo: 'X46', ultima_atividade: '2026-09-20T15:00:00Z' })];
  assert.deepEqual(codigos(filtraMandatos(l, { paradoHa: 45 }, AGORA)), ['X46']);
});

test('"Parado há" se combina com busca e UF; null desliga o filtro', () => {
  assert.deepEqual(codigos(filtraMandatos(base, { paradoHa: 7, uf: 'SP' }, AGORA)), []);
  assert.deepEqual(codigos(filtraMandatos(base, { paradoHa: 7, uf: 'RJ' }, AGORA)), ['CCC333']);
  assert.deepEqual(codigos(filtraMandatos(base, { paradoHa: null }, AGORA)), ['AAA111', 'BBB222', 'CCC333']);
});

test('lista vazia ou sem acertos devolve lista vazia (ADM-05.7)', () => {
  assert.deepEqual(filtraMandatos([], { busca: 'x' }, AGORA), []);
  assert.deepEqual(filtraMandatos(base, { busca: 'nao existe' }, AGORA), []);
});

test('filtraMandatos não altera a lista recebida', () => {
  const antes = JSON.stringify(base);
  filtraMandatos(base, { busca: 'a', uf: 'SP', paradoHa: 7, situacao: 'arquivados' }, AGORA);
  assert.equal(JSON.stringify(base), antes);
});

const itens = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

test('25 itens cabem em 1 página, sem página extra (Edge Case)', () => {
  const p = paginaDe(itens(25), 1, TAMANHO_PAGINA);
  assert.equal(p.itens.length, 25);
  assert.equal(p.total, 25);
  assert.equal(p.paginas, 1);
});

test('26 itens viram 2 páginas, a segunda com 1 item', () => {
  assert.equal(paginaDe(itens(26), 1, 25).paginas, 2);
  assert.deepEqual(paginaDe(itens(26), 2, 25).itens, [26]);
  assert.equal(paginaDe(itens(26), 1, 25).itens.length, 25);
});

test('lista vazia: total 0, nenhum item e 1 página', () => {
  assert.deepEqual(paginaDe([], 1, 25), { itens: [], total: 0, paginas: 1 });
});

test('página fora do intervalo é ajustada para a mais próxima', () => {
  assert.deepEqual(paginaDe(itens(26), 9, 25).itens, [26]);
  assert.equal(paginaDe(itens(26), 0, 25).itens[0], 1);
});

test('tamanho da página do painel é 25 (ADM-05.1)', () => {
  assert.equal(TAMANHO_PAGINA, 25);
});
