import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplica } from '../lib/cadeiras.ts';
import { editaRotina } from '../lib/quadroRotinas.ts';
import { sugestaoChecklist } from '../lib/entrega.ts';

type C = Record<string, string>;

/** Linha da tabela nova: escopo, competências, cargo, pessoa, categoria e área. */
const linha = (i: number, cat: string, area: string, esc = 'Coordenar a equipe'): C => ({
  [`m2.p${i + 1}.esc`]: esc, [`m2.p${i + 1}.comp`]: 'Organização', [`m2.p${i + 1}.nome_cargo`]: `Cargo ${i}`,
  [`m2.f${i + 1}`]: `Pessoa ${i}`, [`m2.p${i + 1}.cat`]: cat, [`m2.p${i + 1}.coord`]: area,
});
/** Chefia (0) e uma Coordenação de Legislativo (20), tabela já em uso (m2.n) */
const equipe = (extra: C = {}): C => ({
  'm2.on': '0|20', 'm2.n': '2', ...linha(0, 'Chefia', 'Chefia de área'), ...linha(20, 'Coordenação', 'Legislativo'), ...extra,
});
const agenda = (c: C, ids = ['plan', 'mensal', 'semanal', 'area', 'feedback']): C => {
  const x = { ...c };
  ids.forEach((id) => aplica(x, editaRotina(x, id, { data: '2030-03-01', hora: '09:00' })));
  return x;
};

test('c1 só é verdadeiro com escopo (esc) em todas as linhas ativas (RM2-57)', () => {
  assert.equal(sugestaoChecklist(equipe()).c1, true);
  assert.equal(sugestaoChecklist(equipe({ 'm2.p21.esc': '' })).c1, false);
  assert.equal(sugestaoChecklist(equipe({ 'm2.p21.esc': '   ' })).c1, false);
});

test('c1 é falso sem nenhuma linha preenchida: a Chefia sempre existe e precisa de escopo (RM2-57)', () => {
  assert.equal(sugestaoChecklist({}).c1, false);
});

test('c1 aceita o escopo do formato antigo (chips de escopo) em todas as linhas ativas (RM2-57)', () => {
  const antigo: C = {
    'm2.on': '0|1', 'm2.f1': 'Ana', 'm2.f2': 'Bia',
    'm2.p1.escopo': 'Coordenar a equipe: distribuir tarefas', 'm2.p2.escopo': 'Preparar orientação de voto para comissões e plenário',
  };
  assert.equal(sugestaoChecklist(antigo).c1, true);
  delete antigo['m2.p2.escopo'];
  assert.equal(sugestaoChecklist(antigo).c1, false);
});

test('c2 é verdadeiro com organograma gerado e sem o aviso "Defina a chefia" (RM2-57)', () => {
  assert.equal(sugestaoChecklist(equipe()).c2, true);
});

test('c2 é falso sem Chefia, mesmo com linhas completas (RM2-57)', () => {
  const c = equipe({ 'm2.p1.cat': 'Executora' });
  assert.equal(sugestaoChecklist(c).c2, false);
});

test('c2 é falso enquanto não há organograma gerado (nenhuma linha com cargo, categoria e área) (RM2-57)', () => {
  assert.equal(sugestaoChecklist({}).c2, false);
  assert.equal(sugestaoChecklist({ 'm2.on': '0|20', 'm2.n': '2' }).c2, false);
});

test('c2 vale para mandato antigo cujas categorias são derivadas (RMX-02)', () => {
  const antigo: C = { 'm2.on': '0|1', 'm2.f1': 'Ana', 'm2.f2': 'Bia', 'm2.p1.nome_cargo': 'Chefe de gabinete', 'm2.p2.nome_cargo': 'Coordenadora' };
  assert.equal(sugestaoChecklist(antigo).c2, true);
});

test('c3 é verdadeiro quando todas as rotinas ligadas têm data e hora (RM2-57)', () => {
  assert.equal(sugestaoChecklist(agenda({})).c3, true);
});

test('c3 é falso com rotina ligada sem data e hora, e desligar essa rotina tira a exigência (RM2-57)', () => {
  const c = agenda({}, ['plan', 'mensal', 'semanal', 'area']);
  assert.equal(sugestaoChecklist(c).c3, false);
  aplica(c, editaRotina(c, 'feedback', { on: false }));
  assert.equal(sugestaoChecklist(c).c3, true);
  assert.equal(sugestaoChecklist({}).c3, false);
});

test('a sugestão só devolve valores: nunca grava m2.c1..c3 (comportamento atual)', () => {
  const c = agenda(equipe());
  const antes = JSON.stringify(c);
  assert.deepEqual(sugestaoChecklist(c), { c1: true, c2: true, c3: true });
  assert.equal(JSON.stringify(c), antes);
  assert.equal(c['m2.c1'], undefined);
});
