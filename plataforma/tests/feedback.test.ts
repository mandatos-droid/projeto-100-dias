import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apaga, contagens, edita, mapaFeedback, migraAntigo, paraGuia, pontosDe, registra, removidas, type Conversa } from '../lib/feedback.ts';

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

/* ---------- espelho para o Guia (Resumo e contagem seguem lendo pontos/encam) ---------- */
test('paraGuia espelha destaques+ajustes em pontos e a ação em encam, sem perder campo nenhum (M5-21.7)', () => {
  const v = paraGuia(conv(2, { destaques: 'Boa escuta', ajustes: 'Prazos', acao: 'Agenda' }));
  assert.equal(v.pontos, 'Boa escuta\nPontos de ajuste: Prazos');
  assert.equal(v.encam, 'Agenda');
  assert.equal(v.destaques, 'Boa escuta');
  assert.equal(v.cadeira, 2);
});

test('paraGuia sem ajustes deixa pontos igual aos destaques, e a volta por migraAntigo não duplica (M5-21.7)', () => {
  const v = paraGuia(conv(2, { destaques: 'Só destaque' }));
  assert.equal(v.pontos, 'Só destaque');
  assert.equal(migraAntigo([v], EQUIPE)[0].destaques, 'Só destaque');
});

/* ---------- campos separados da conversa: 2 destaques e 2 ajustes (spec missao5-monitoramento-alana, FBK-01.2, FBK-01.5, Q8, Q13) ---------- */
const NOVA = { cadeira: 3, pessoa: 'Davi Rocha', lider: 'Bruno Lima', data: '18/03', destaques: '', ajustes: '', acao: 'Reunião semanal', d1: 'Entrega no prazo', d2: 'Boa escuta', a1: 'Atualizar o monitoramento', a2: 'Mais devolutiva escrita' };

test('registra guarda d1, d2, a1 e a2 e monta destaques e ajustes juntando os dois pontos (FBK-01.2, FBK-01.5)', () => {
  const [v] = registra([], NOVA);
  assert.equal(v.d1, 'Entrega no prazo');
  assert.equal(v.d2, 'Boa escuta');
  assert.equal(v.a1, 'Atualizar o monitoramento');
  assert.equal(v.a2, 'Mais devolutiva escrita');
  assert.equal(v.destaques, 'Entrega no prazo\nBoa escuta');
  assert.equal(v.ajustes, 'Atualizar o monitoramento\nMais devolutiva escrita');
});

test('ponto vazio não deixa linha em branco nem erro: todos os campos são opcionais (Q13)', () => {
  const [um] = registra([], { ...NOVA, d2: '', a1: '', a2: '' });
  assert.equal(um.destaques, 'Entrega no prazo');
  assert.equal(um.ajustes, '');
  const [nada] = registra([], { ...NOVA, d1: '', d2: '', a1: '', a2: '', acao: '', data: '' });
  assert.equal(nada.destaques, '');
  assert.equal(nada.ajustes, '');
});

test('edita um dos pontos atualiza o texto montado e não mexe nos outros campos (FBK-01.2)', () => {
  const lista = registra([], { ...NOVA, id: 'x' });
  const [v] = edita(lista, 'x', { d2: 'Liderou a reunião' });
  assert.equal(v.destaques, 'Entrega no prazo\nLiderou a reunião');
  assert.equal(v.ajustes, 'Atualizar o monitoramento\nMais devolutiva escrita');
  assert.equal(v.acao, 'Reunião semanal');
});

test('paraGuia com os campos novos espelha pontos e encam para o Resumo do Guia (FBK-01.5)', () => {
  const v = paraGuia(registra([], NOVA)[0]);
  assert.equal(v.pontos, 'Entrega no prazo\nBoa escuta\nPontos de ajuste: Atualizar o monitoramento\nMais devolutiva escrita');
  assert.equal(v.encam, 'Reunião semanal');
});

test('migraAntigo preserva d1, d2, a1 e a2 quando existem', () => {
  const [v] = migraAntigo([paraGuia(registra([], { ...NOVA, id: 'n' })[0])], EQUIPE);
  assert.deepEqual([v.d1, v.d2, v.a1, v.a2], ['Entrega no prazo', 'Boa escuta', 'Atualizar o monitoramento', 'Mais devolutiva escrita']);
});

test('pontosDe lê conversa antiga (só destaques e ajustes) como d1 e a1, e a nova pelos campos separados', () => {
  assert.deepEqual(pontosDe(conv(2, { destaques: 'Antigo D', ajustes: 'Antigo A' })), { d1: 'Antigo D', d2: '', a1: 'Antigo A', a2: '' });
  assert.deepEqual(pontosDe(registra([], NOVA)[0]), { d1: 'Entrega no prazo', d2: 'Boa escuta', a1: 'Atualizar o monitoramento', a2: 'Mais devolutiva escrita' });
});
