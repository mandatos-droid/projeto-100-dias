import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLUNAS, GRUPOS, adiciona, remove } from '../lib/eleitorado.ts';
import type { ItemEl } from '../lib/types.ts';

test('3 colunas na ordem da spec, com rótulo e exemplo de cada formulário (ELE-02, ELE-03)', () => {
  assert.deepEqual(COLUNAS.map((c) => c.titulo), ['Promessas de Campanha', 'Grupos que Apoiaram', 'Grupos com Potencial']);
  assert.deepEqual(COLUNAS.map((c) => c.rotuloForm),
    ['Adicionar: promessa', 'Adicionar: grupo que apoiou', 'Adicionar: grupo com potencial']);
  assert.deepEqual(COLUNAS.map((c) => c.exemplo),
    ['Ex.: Ampliar o transporte escolar rural', 'Ex.: Professoras da rede municipal', 'Ex.: Jovens de 16 a 24 anos']);
});

test('as tags só valem para os dois tipos de grupo (ELE-04)', () => {
  assert.deepEqual(COLUNAS.map((c) => [c.k, c.tags]), [['promessa', false], ['apoio', true], ['potencial', true]]);
});

test('GRUPOS tem as 16 tags na ordem da tela (ELE-04)', () => {
  assert.deepEqual(GRUPOS, ['Mulheres', 'Jovens', 'Pessoas idosas', 'Pessoas negras', 'Povos indígenas', 'LGBTQIA+',
    'Pessoas com deficiência', 'Servidores públicos', 'Professores', 'Evangélicos', 'Católicos', 'Agricultura familiar',
    'Empreendedores e MEI', 'Estudantes', 'Moradores da periferia', 'Trabalhadores de aplicativo']);
});

test('adiciona apara o texto, grava muns vazio e põe no fim (ELE-05)', () => {
  const antes: ItemEl[] = [{ id: 'a', tipo: 'promessa', texto: 'Primeira', muns: ['5208707'] }];
  const r = adiciona(antes, 'promessa', '  Transporte rural  ', 'n1');
  assert.equal(r.erro, undefined);
  assert.deepEqual(r.itens[1], { id: 'n1', tipo: 'promessa', texto: 'Transporte rural', muns: [] });
  assert.equal(r.itens.length, 2);
  assert.deepEqual(r.itens[0], antes[0]);
  assert.equal(antes.length, 1, 'não altera a lista de entrada');
});

test('texto vazio ou só espaços não grava (ELE-07)', () => {
  for (const t of ['', '   ', '\t\n']) {
    const r = adiciona([], 'apoio', t, 'x');
    assert.equal(r.erro, 'vazio');
    assert.deepEqual(r.itens, []);
  }
});

test('repetido sem acento, sem maiúscula e no mesmo tipo é barrado (ELE-08)', () => {
  const base: ItemEl[] = [{ id: 'a', tipo: 'apoio', texto: 'Professoras da Rede', muns: [] }];
  const r = adiciona(base, 'apoio', ' PROFESSORAS da rede ', 'b');
  assert.equal(r.erro, 'repetido');
  assert.deepEqual(r.itens, base);
  const r2 = adiciona([{ id: 'a', tipo: 'apoio', texto: 'Educação', muns: [] }], 'apoio', 'educacao', 'b');
  assert.equal(r2.erro, 'repetido');
});

test('o mesmo texto em outro tipo entra (ELE-08)', () => {
  const base: ItemEl[] = [{ id: 'a', tipo: 'apoio', texto: 'Jovens', muns: [] }];
  const r = adiciona(base, 'potencial', 'Jovens', 'b');
  assert.equal(r.erro, undefined);
  assert.equal(r.itens.length, 2);
  assert.equal(r.itens[1].tipo, 'potencial');
});

test('remove tira só o item do id e preserva os demais com muns (ELE-09, ELE-10)', () => {
  const itens: ItemEl[] = [
    { id: 'a', tipo: 'promessa', texto: 'A', muns: ['1'] },
    { id: 'b', tipo: 'apoio', texto: 'B', muns: [] },
  ];
  assert.deepEqual(remove(itens, 'b'), [itens[0]]);
  assert.deepEqual(remove(itens, 'zzz'), itens);
});
