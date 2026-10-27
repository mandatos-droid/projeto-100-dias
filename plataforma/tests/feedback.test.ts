import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apaga, contagens, edita, mapaFeedback, migraAntigo, registra, removidas, type Conversa } from '../lib/feedback.ts';

type C = Record<string, string>;
/* Equipe de teste: 0 Ana (chefia) lidera 1 Bruno; Bruno lidera 2 Carla e 3 Davi (liderança padrão da Missão 2). */
const EQUIPE: C = { 'm2.on': '0|1|2|3', 'm2.f1': 'Ana Souza', 'm2.f2': 'Bruno Lima', 'm2.f3': 'Carla Dias', 'm2.f4': 'Davi Rocha' };
const conv = (cadeira: number, extra: Partial<Conversa> = {}): Conversa => ({ id: `c${cadeira}`, cadeira, lider: '', pessoa: '', data: '', destaques: '', ajustes: '', acao: '', ...extra });

/* ---------- mapaFeedback (M5-20.1) ---------- */
test('mapaFeedback devolve cada liderança com seus liderados e o total N (M5-20.1)', () => {
  const m = mapaFeedback(EQUIPE);
  assert.deepEqual(m.map((l) => [l.i, l.liderados.map((p) => p.i)]), [[0, [1]], [1, [2, 3]]]);
  assert.deepEqual(m.map((l) => l.n), [1, 2]);
  assert.equal(m[1].nome, 'Bruno Lima');
  assert.equal(m[1].liderados[0].nome, 'Carla Dias');
});

test('quem não lidera ninguém não aparece como liderança, e cadeira sem nome não é liderada (M5-20.1)', () => {
  const c = { ...EQUIPE, 'm2.f4': '' };
  assert.deepEqual(mapaFeedback(c).map((l) => [l.i, l.n]), [[0, 1], [1, 1]]);
  assert.deepEqual(mapaFeedback({}), []);
});

test('o asterisco do processo seletivo some do nome (M5-20.1)', () => {
  assert.equal(mapaFeedback({ ...EQUIPE, 'm2.f3': 'Carla Dias*' })[1].liderados[0].nome, 'Carla Dias');
});

test('ler o mapa não altera as chaves da Missão 2 (M5-20.1)', () => {
  const c = { ...EQUIPE }; const antes = JSON.stringify(c);
  mapaFeedback(c); contagens(c, []);
  assert.equal(JSON.stringify(c), antes);
});

/* ---------- contagens (M5-20.2) ---------- */
test('contagens devolve feitas X de N e marca cada pessoa como feita ou pendente (M5-20.2)', () => {
  const r = contagens(EQUIPE, [conv(2)]);
  assert.deepEqual(r.map((l) => [l.i, l.feitas, l.n]), [[0, 0, 1], [1, 1, 2]]);
  assert.deepEqual(r[1].liderados.map((p) => [p.i, p.feita]), [[2, true], [3, false]]);
  assert.deepEqual(r[0].liderados.map((p) => p.feita), [false]);
});

test('duas conversas da mesma pessoa contam uma só vez (M5-20.2)', () => {
  assert.equal(contagens(EQUIPE, [conv(2, { id: 'a' }), conv(2, { id: 'b' })])[1].feitas, 1);
});

/* ---------- registra, edita, apaga (M5-21.4, M5-21.5) ---------- */
test('registra grava a conversa, marca a pessoa como feita e atualiza a contagem (M5-21.4)', () => {
  const lista = registra([], { cadeira: 3, pessoa: 'Davi Rocha', lider: 'Bruno Lima', data: '18/03', destaques: 'Boa entrega', ajustes: 'Prazos', acao: 'Reunião semanal' });
  assert.equal(lista.length, 1);
  assert.equal(lista[0].id.length > 0, true);
  assert.equal(lista[0].destaques, 'Boa entrega');
  const r = contagens(EQUIPE, lista);
  assert.equal(r[1].feitas, 1);
  assert.equal(r[1].liderados.find((p) => p.i === 3)!.feita, true);
});

test('registra não altera a lista recebida e mantém as outras conversas (M5-21.4)', () => {
  const antes = [conv(2)]; const copia = JSON.stringify(antes);
  const depois = registra(antes, { cadeira: 3, pessoa: 'Davi', lider: 'Bruno', data: '', destaques: '', ajustes: '', acao: '' });
  assert.equal(JSON.stringify(antes), copia);
  assert.equal(depois.length, 2);
});

test('edita troca só os campos do patch na conversa escolhida e a contagem segue (M5-21.5)', () => {
  const base = [conv(2, { id: 'x', destaques: 'A' }), conv(3, { id: 'y', destaques: 'B' })];
  const r = edita(base, 'x', { destaques: 'A2', acao: 'Plano' });
  assert.deepEqual([r[0].destaques, r[0].acao, r[0].cadeira], ['A2', 'Plano', 2]);
  assert.deepEqual(r[1], base[1]);
  assert.equal(contagens(EQUIPE, r)[1].feitas, 2);
});

test('apaga tira só a conversa escolhida e a pessoa volta a pendente (M5-21.5)', () => {
  const base = [conv(2, { id: 'x' }), conv(3, { id: 'y' })];
  const r = apaga(base, 'x');
  assert.deepEqual(r.map((v) => v.id), ['y']);
  const ct = contagens(EQUIPE, r)[1];
  assert.equal(ct.feitas, 1);
  assert.equal(ct.liderados.find((p) => p.i === 2)!.feita, false);
});

/* ---------- migraAntigo (M5-21.7) ---------- */
test('migraAntigo converte pessoa/lider/data/pontos/encam sem perder texto (M5-21.7)', () => {
  const [v] = migraAntigo([{ id: 'o', pessoa: 'Carla Dias', lider: 'Bruno Lima', data: '10/03', pontos: 'Falamos de prazos', encam: 'Revisar escopo' }], EQUIPE);
  assert.equal(v.id, 'o');
  assert.equal(v.pessoa, 'Carla Dias');
  assert.equal(v.lider, 'Bruno Lima');
  assert.equal(v.data, '10/03');
  assert.equal(v.destaques, 'Falamos de prazos');
  assert.equal(v.acao, 'Revisar escopo');
  assert.equal(v.ajustes, '');
});

test('migraAntigo liga a conversa antiga à cadeira pelo nome, sem diferenciar caixa nem asterisco (M5-21.7)', () => {
  const c = { ...EQUIPE, 'm2.f3': 'Carla Dias*' };
  const [v] = migraAntigo([{ pessoa: '  carla dias ' }], c);
  assert.equal(v.cadeira, 2);
  assert.equal(contagens(c, [v])[1].feitas, 1);
});

test('migraAntigo não altera a lista e aceita lista ausente ou itens inválidos (M5-21.7)', () => {
  const antes = [{ pessoa: 'Carla Dias', pontos: 'x' }]; const copia = JSON.stringify(antes);
  migraAntigo(antes, EQUIPE);
  assert.equal(JSON.stringify(antes), copia);
  assert.deepEqual(migraAntigo(undefined, EQUIPE), []);
  assert.deepEqual(migraAntigo([null, 3, 'a'], EQUIPE), []);
});

test('conversa já no formato novo passa igual, sem misturar com pontos/encam (M5-21.7)', () => {
  const nova = { id: 'n', cadeira: 3, pessoa: 'Davi Rocha', lider: 'Bruno Lima', data: '1', destaques: 'D', ajustes: 'J', acao: 'A', pontos: 'D', encam: 'A' };
  const [v] = migraAntigo([nova], EQUIPE);
  assert.deepEqual(v, { id: 'n', cadeira: 3, pessoa: 'Davi Rocha', lider: 'Bruno Lima', data: '1', destaques: 'D', ajustes: 'J', acao: 'A' });
});

/* ---------- pessoa removida (edge case da spec) ---------- */
test('conversa de pessoa que saiu da Missão 2 é mantida e listada como pessoa removida', () => {
  const sem3 = { ...EQUIPE, 'm2.on': '0|1|2', 'm2.f4': '' };
  const lista = [conv(3, { pessoa: 'Davi Rocha' }), conv(2), migraAntigo([{ pessoa: 'Zé Antigo', pontos: 'texto' }], sem3)[0]];
  const r = removidas(sem3, lista);
  assert.deepEqual(r.map((v) => v.pessoa), ['Davi Rocha', 'Zé Antigo']);
  assert.equal(r[1].destaques, 'texto');
  assert.equal(contagens(sem3, lista)[1].feitas, 1);
});
