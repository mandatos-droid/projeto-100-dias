import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODELO, lerQuadro, editaRotina, agendadas, concluida, dataPassada, areasDoMandato } from '../lib/quadroRotinas.ts';
import { aplica } from '../lib/cadeiras.ts';

type C = Record<string, string>;
const aplicado = (c: C, patch: Record<string, string>): C => { const x = { ...c }; aplica(x, patch); return x; };
const IDS = ['plan', 'mensal', 'semanal', 'area', 'feedback'];

test('MODELO traz as 5 rotinas do documento, na ordem, com frequência, participantes e duração (RM2-51)', () => {
  assert.deepEqual(MODELO.map((r) => r.id), IDS);
  assert.deepEqual(MODELO.map((r) => [r.titulo, r.freq, r.quem, r.dur]), [
    ['Planejamento estratégico', 'Quadrimestralmente', 'Todos', '2 períodos de 6h'],
    ['Monitoramento de avanços do trabalho previsto para o mês (acompanhamento de metas)', 'Mensalmente', 'Todos', '1h'],
    ['Alinhamento de atualização coletiva e expectativas do trabalho da semana', 'Semanalmente', 'Todos', '1h'],
    ['Reunião de distribuição de trabalho dentro de cada área', 'Semanalmente', 'Assessores e Coordenação de uma área específica', '45 min'],
    ['Reunião de feedback estruturado individual', 'Semestralmente', 'Liderança e Assessores (individualmente)', '30 min por reunião'],
  ]);
});

test('sem edição vale o modelo da Legisla: 5 rotinas ligadas e sem data (RM2-55)', () => {
  const q = lerQuadro({});
  assert.deepEqual(q.map((r) => [r.id, r.freq, r.quem, r.dur, r.on]), MODELO.map((r) => [r.id, r.freq, r.quem, r.dur, true]));
  assert.ok(q.every((r) => !r.data && !r.hora));
});

test('editaRotina altera frequência, quem e duração de uma rotina sem tocar nas outras (RM2-53)', () => {
  const c = aplicado({}, editaRotina({}, 'plan', { freq: 'Semestralmente', quem: 'Só a liderança', dur: '1 período de 6h' }));
  const q = lerQuadro(c);
  assert.deepEqual([q[0].freq, q[0].quem, q[0].dur], ['Semestralmente', 'Só a liderança', '1 período de 6h']);
  assert.deepEqual(q.slice(1), lerQuadro({}).slice(1));
});

test('editar uma rotina preserva as edições anteriores das outras (RM2-53)', () => {
  let c: C = aplicado({}, editaRotina({}, 'mensal', { dur: '2h' }));
  c = aplicado(c, editaRotina(c, 'semanal', { freq: 'Quinzenalmente' }));
  const q = lerQuadro(c);
  assert.equal(q[1].dur, '2h');
  assert.equal(q[2].freq, 'Quinzenalmente');
  assert.equal(q[2].dur, '1h');
});

test('editar a duração e reabrir (reler do JSON gravado) mantém a edição (RM2-53)', () => {
  const c = aplicado({}, editaRotina({}, 'plan', { dur: '3 períodos de 4h' }));
  assert.equal(JSON.parse(c['m2.rq']).plan.dur, '3 períodos de 4h');
  assert.equal(lerQuadro({ 'm2.rq': c['m2.rq'] })[0].dur, '3 períodos de 4h');
});

test('limpar um campo editado volta ao valor do modelo (RM2-53)', () => {
  let c: C = aplicado({}, editaRotina({}, 'plan', { dur: '3h' }));
  c = aplicado(c, editaRotina(c, 'plan', { dur: '' }));
  assert.equal(lerQuadro(c)[0].dur, MODELO[0].dur);
});

test('liga e desliga cada rotina sem tocar nas outras (RM2-53)', () => {
  const c = aplicado({}, editaRotina({}, 'area', { on: false }));
  assert.deepEqual(lerQuadro(c).map((r) => r.on), [true, true, true, false, true]);
  const c2 = aplicado(c, editaRotina(c, 'area', { on: true }));
  assert.deepEqual(lerQuadro(c2).map((r) => r.on), [true, true, true, true, true]);
});

test('editaRotina com id desconhecido não grava nada (RM2-53)', () => {
  assert.deepEqual(editaRotina({}, 'inexistente', { dur: '1h' }), {});
});

test('agendadas conta só rotinas ligadas com data e hora (RM2-52)', () => {
  assert.deepEqual(agendadas({}), { n: 0, total: 5 });
  let c: C = aplicado({}, editaRotina({}, 'plan', { data: '2030-02-10', hora: '09:00' }));
  c = aplicado(c, editaRotina(c, 'mensal', { data: '2030-02-17' })); // sem hora
  c = aplicado(c, editaRotina(c, 'semanal', { hora: '10:00' }));      // sem data
  assert.deepEqual(agendadas(c), { n: 1, total: 5 });
});

test('"5 de 5 agendadas" com data e hora nas 5 rotinas (RM2-52)', () => {
  let c: C = {};
  IDS.forEach((id) => { c = aplicado(c, editaRotina(c, id, { data: '2030-03-01', hora: '14:30' })); });
  assert.deepEqual(agendadas(c), { n: 5, total: 5 });
  assert.equal(concluida(c), true);
});

test('desligar uma rotina tira a exigência de data e hora dela do total e da conclusão (RM2-57)', () => {
  let c: C = {};
  IDS.slice(0, 4).forEach((id) => { c = aplicado(c, editaRotina(c, id, { data: '2030-03-01', hora: '14:30' })); });
  assert.equal(concluida(c), false);
  c = aplicado(c, editaRotina(c, 'feedback', { on: false }));
  assert.deepEqual(agendadas(c), { n: 4, total: 4 });
  assert.equal(concluida(c), true);
});

test('rotina desligada com data e hora não entra na contagem de agendadas (RM2-52)', () => {
  let c: C = aplicado({}, editaRotina({}, 'plan', { data: '2030-03-01', hora: '14:30', on: false }));
  assert.deepEqual(agendadas(c), { n: 0, total: 4 });
  c = aplicado(c, editaRotina(c, 'plan', { on: true }));
  assert.deepEqual(agendadas(c), { n: 1, total: 5 });
});

test('concluida exige todas as ligadas agendadas; sem nenhuma ligada não conclui (RM2-57)', () => {
  assert.equal(concluida({}), false);
  let c: C = {};
  IDS.forEach((id) => { c = aplicado(c, editaRotina(c, id, { on: false })); });
  assert.deepEqual(agendadas(c), { n: 0, total: 0 });
  assert.equal(concluida(c), false);
});

test('data ou hora mal formadas não contam como agendamento (RM2-52)', () => {
  const c = aplicado({}, editaRotina({}, 'plan', { data: '10/02/2030', hora: '9h' }));
  assert.equal(agendadas(c).n, 0);
  const d = aplicado({}, editaRotina({}, 'plan', { data: '2030-02-31', hora: '25:00' }));
  assert.equal(agendadas(d).n, 0);
});

test('dataPassada é só informação: verdadeira antes de hoje, falsa hoje, depois e vazia (RM2-54)', () => {
  const hoje = new Date(2030, 5, 15, 12, 0);
  assert.equal(dataPassada('2030-06-14', hoje), true);
  assert.equal(dataPassada('2030-06-15', hoje), false);
  assert.equal(dataPassada('2030-06-16', hoje), false);
  assert.equal(dataPassada('', hoje), false);
  assert.equal(dataPassada('lixo', hoje), false);
});

test('data passada não impede a rotina de contar como agendada (RM2-54)', () => {
  const c = aplicado({}, editaRotina({}, 'plan', { data: '2001-01-01', hora: '08:00' }));
  assert.equal(agendadas(c).n, 1);
});

test('JSON inválido em m2.rq cai no modelo sem erro (design, Error Handling)', () => {
  for (const ruim of ['{quebrado', 'null', '[]', '"texto"', '42']) {
    assert.deepEqual(lerQuadro({ 'm2.rq': ruim }), lerQuadro({}), ruim);
  }
});

test('campos de tipo errado em m2.rq são ignorados, os válidos seguem (design, Error Handling)', () => {
  const c = { 'm2.rq': JSON.stringify({ plan: { freq: 5, dur: '4h', on: 'sim', data: 20300101 }, mensal: 'x' }) };
  const q = lerQuadro(c);
  assert.deepEqual([q[0].freq, q[0].dur, q[0].on, q[0].data], [MODELO[0].freq, '4h', true, undefined]);
  assert.deepEqual(q[1], lerQuadro({})[1]);
});

test('editar sobre JSON inválido recomeça do modelo e grava JSON válido (design, Error Handling)', () => {
  const c = aplicado({ 'm2.rq': '{quebrado' }, editaRotina({ 'm2.rq': '{quebrado' }, 'plan', { dur: '3h' }));
  assert.equal(lerQuadro(c)[0].dur, '3h');
});

test('editaRotina não altera os campos recebidos (RM2-53)', () => {
  const c = { 'm2.rq': JSON.stringify({ plan: { dur: '3h' } }) };
  const antes = JSON.stringify(c);
  editaRotina(c, 'mensal', { on: false }); lerQuadro(c); agendadas(c);
  assert.equal(JSON.stringify(c), antes);
});

test('areasDoMandato lista as áreas das linhas da tabela, na ordem das linhas, sem repetir e sem a Chefia (RM2-56)', () => {
  const c: C = {
    'm2.on': '0|20|21|22|23', 'm2.n': '5',
    'm2.p1.coord': 'Chefia de área',
    'm2.p21.coord': 'Comunicação', 'm2.p22.coord': 'Legislativo', 'm2.p23.coord': 'Comunicação', 'm2.p24.coord': 'Logística',
  };
  assert.deepEqual(areasDoMandato(c), ['Comunicação', 'Legislativo', 'Logística']);
});

test('areasDoMandato sem áreas escolhidas devolve lista vazia (RM2-56)', () => {
  assert.deepEqual(areasDoMandato({}), []);
  assert.deepEqual(areasDoMandato({ 'm2.on': '0|20', 'm2.n': '2' }), []);
});
