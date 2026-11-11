import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linhasDaAgenda, filtraFaixa, emSlides } from '../lib/indicadoresSociais.ts';
import type { Agenda, Catalogo, DadosIndicador } from '../lib/agendas.ts';

const cat: Catalogo = {
  fonte: 'f', url: 'u',
  ods: [{ n: 3, rot: 'Saúde e bem-estar' }, { n: 4, rot: 'Educação de qualidade' }, { n: 8, rot: 'Trabalho' }],
  indicadores: [
    { id: 'S3_A', ods: 3, nome: 'Mortalidade infantil', fonte: '', ano: null, sentido: '' },
    { id: 'S3_B', ods: 3, nome: 'Cobertura vacinal', fonte: '', ano: null, sentido: '' },
    { id: 'S3_SEM', ods: 3, nome: 'Sem dado na UF', fonte: '', ano: null, sentido: '' },
    { id: 'S4_A', ods: 4, nome: 'Evasão escolar', fonte: '', ano: null, sentido: '' },
    { id: 'S8_JV', ods: 8, nome: 'Jovens sem ocupação', fonte: '', ano: null, sentido: '' },
  ],
};
const dados: Record<string, DadosIndicador | null> = {
  'ods-3': { uf: { ES: 61.5, GO: 10 } },
  S3_A: { uf: { ES: 72, GO: 1 } },
  S3_B: { uf: { ES: 39.9 } },
  S3_SEM: { uf: { GO: 50 } },
  S4_A: { uf: { ES: 55 } },
  S8_JV: { uf: { ES: 80 } },
  'ods-4': null,
};
const saude: Agenda = { id: 'saude', rot: 'Saúde', cor: '#000', ods: [3] };

test('linhasDaAgenda usa a nota da UF, põe a nota do ODS e os indicadores, e omite quem não tem dado (SOC-03, SOC-04)', () => {
  const r = linhasDaAgenda(saude, cat, dados, 'ES');
  assert.deepEqual(r, [
    { indicador: 'Nota geral do ODS 3', ods: 3, odsRot: 'Saúde e bem-estar', nota: 61.5 },
    { indicador: 'Mortalidade infantil', ods: 3, odsRot: 'Saúde e bem-estar', nota: 72 },
    { indicador: 'Cobertura vacinal', ods: 3, odsRot: 'Saúde e bem-estar', nota: 39.9 },
  ]);
});

test('outra UF lê a nota daquela UF e o indicador que só ela tem aparece (SOC-03)', () => {
  const r = linhasDaAgenda(saude, cat, dados, 'GO');
  assert.deepEqual(r.map((l) => [l.indicador, l.nota]),
    [['Nota geral do ODS 3', 10], ['Mortalidade infantil', 1], ['Sem dado na UF', 50]]);
});

test('indicadores avulsos (extras) entram na agenda; arquivo nulo é omitido (SOC-03)', () => {
  const juv: Agenda = { id: 'juventude', rot: 'Juventude', cor: '#000', ods: [], extras: ['S8_JV', 'NAO_EXISTE'] };
  assert.deepEqual(linhasDaAgenda(juv, cat, dados, 'ES'),
    [{ indicador: 'Jovens sem ocupação', ods: 8, odsRot: 'Trabalho', nota: 80 }]);
  const edu: Agenda = { id: 'educacao', rot: 'Educação', cor: '#000', ods: [4] };
  assert.deepEqual(linhasDaAgenda(edu, cat, dados, 'ES').map((l) => l.indicador), ['Evasão escolar']);
});

test('filtraFaixa respeita os limites 39,9 / 40 / 59,9 / 60 / 80 (SOC-05)', () => {
  const l = (nota: number) => ({ indicador: String(nota), ods: 1, odsRot: '', nota });
  const todas = [l(39.9), l(40), l(59.9), l(60), l(80)];
  const rot = (f: string) => filtraFaixa(todas, f).map((x) => x.nota);
  assert.deepEqual(rot('Muito baixo'), [39.9]);
  assert.deepEqual(rot('Baixo'), [40]);
  assert.deepEqual(rot('Médio'), [59.9]);
  assert.deepEqual(rot('Alto'), [60]);
  assert.deepEqual(rot('Muito alto'), [80]);
});

test('filtraFaixa "todas" devolve tudo; faixa sem nota devolve vazio (SOC-05)', () => {
  const ls = [{ indicador: 'a', ods: 1, odsRot: '', nota: 45 }];
  assert.deepEqual(filtraFaixa(ls, 'todas'), ls);
  assert.deepEqual(filtraFaixa(ls, 'Alto'), []);
});

test('emSlides divide em grupos de 4 e o último pode ser menor (SOC-06)', () => {
  const itens = Array.from({ length: 13 }, (_, i) => i);
  const s = emSlides(itens);
  assert.deepEqual(s.map((g) => g.length), [4, 4, 4, 1]);
  assert.deepEqual(s[3], [12]);
  assert.deepEqual(emSlides([]), []);
  assert.deepEqual(emSlides([1, 2, 3], 2), [[1, 2], [3]]);
});
