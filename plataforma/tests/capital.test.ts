import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOTIVOS, PAPEIS, MOVIMENTOS, TEXTO_SABER, progressoAcoes, acaoCompleta, limitesPrazo, validaPrazo, ehDataISO, ordenaPorPrazo, textoDasEscolhas, leEscolhas, papelNorm, lerMovimentos, alternaMovimento, alternaOutroMovimento, textoMovimentos, defineDataMovimento, ordemMovimentos } from '../lib/capital.ts';

/* Missão 4 · listas e regra de progresso (CAP-03, CAP-12). Resultados esperados vêm da spec. */

test('progressoAcoes: 2 ações na mesma frente não cumprem a regra (CAP-12.8)', () => {
  const r = progressoAcoes([{ bingo: 'articulacao', i: 0 }, { bingo: 'articulacao', i: 1 }]);
  assert.deepEqual(r, { total: 2, frentes: 1, ok: false });
});

test('progressoAcoes: 2 ações em 2 frentes diferentes cumprem a regra (CAP-12.8)', () => {
  const r = progressoAcoes([{ bingo: 'articulacao', i: 0 }, { bingo: 'mobilizacao', i: 3 }]);
  assert.deepEqual(r, { total: 2, frentes: 2, ok: true });
});

test('progressoAcoes: 1 ação sozinha, lista vazia e entradas inválidas não cumprem (CAP-12.8, CAP-40)', () => {
  assert.equal(progressoAcoes([{ bingo: 'redes', i: 0 }]).ok, false);
  assert.deepEqual(progressoAcoes([]), { total: 0, frentes: 0, ok: false });
  assert.deepEqual(progressoAcoes(undefined), { total: 0, frentes: 0, ok: false });
  assert.deepEqual(progressoAcoes('corrompido'), { total: 0, frentes: 0, ok: false });
});

test('progressoAcoes: ação salva no formato antigo (id, bingo, i, titulo, campos soltos) conta normalmente (CAP-12.11)', () => {
  const antigas = [
    { id: 'a1', bingo: 'partido', i: 2, titulo: 'Contribuir', alcancar: 'x', resp: 'Ana', prazo: 'até 20/03', saber: 'y', prox: 'z' },
    { id: 'a2', bingo: 'redes', i: 0, titulo: 'Definir públicos' },
    { id: 'a3', bingo: 'redes', i: 1, titulo: 'Planejar' },
  ];
  assert.deepEqual(progressoAcoes(antigas), { total: 3, frentes: 2, ok: true });
});

test('progressoAcoes: registro sem frente ou que não é objeto não conta (CAP-40)', () => {
  assert.deepEqual(progressoAcoes([null, 'x', { i: 1 }, { bingo: 'redes', i: 0 }]), { total: 1, frentes: 1, ok: false });
});

test('PAPEIS tem Titular, Suplente, Conquista de Relatoria Relevante, Vice-presidência e Presidência (CAP-03.7, SUG-46)', () => {
  assert.deepEqual([...PAPEIS], ['Titular', 'Suplente', 'Conquista de Relatoria Relevante', 'Vice-presidência', 'Presidência']);
});

test('MOTIVOS e MOVIMENTOS têm ids únicos e rótulos preenchidos, prontos para múltipla escolha (CAP-03.7)', () => {
  for (const lista of [MOTIVOS, MOVIMENTOS]) {
    assert.ok(lista.length >= 3);
    assert.equal(new Set(lista.map((x) => x.id)).size, lista.length);
    assert.ok(lista.every((x) => x.rot.trim() !== ''));
  }
});

test('TEXTO_SABER tem um texto base para cada uma das 4 frentes do Guia (CAP-11.7)', () => {
  assert.deepEqual(Object.keys(TEXTO_SABER).sort(), ['articulacao', 'mobilizacao', 'partido', 'redes']);
  assert.ok(Object.values(TEXTO_SABER).every((t) => t.trim() !== ''));
});

test('textoDasEscolhas junta os rótulos e o "Outro" com "; " em texto legível (CAP-03.6, CAP-03.8)', () => {
  assert.equal(textoDasEscolhas(['Pauta da nossa bandeira', 'Dá visibilidade ao mandato']), 'Pauta da nossa bandeira; Dá visibilidade ao mandato');
  assert.equal(textoDasEscolhas(['Titular'], '  Líder da bancada  '), 'Titular; Líder da bancada');
  assert.equal(textoDasEscolhas([], 'só o outro'), 'só o outro');
  assert.equal(textoDasEscolhas([], '   '), '');
});

test('leEscolhas recupera os marcados e o "Outro"; texto antigo digitado à mão vira "Outro" sem perda (CAP-03.8, CAP-40)', () => {
  const rots = MOTIVOS.map((m) => m.rot);
  const texto = textoDasEscolhas([rots[0], rots[2]], 'Convite do presidente');
  assert.deepEqual(leEscolhas(texto, rots), { marcados: [rots[0], rots[2]], outro: 'Convite do presidente' });
  assert.deepEqual(leEscolhas('Ex.: educação, titular', rots), { marcados: [], outro: 'Ex.: educação, titular' });
  assert.deepEqual(leEscolhas(undefined, rots), { marcados: [], outro: '' });
  assert.deepEqual(leEscolhas('', rots), { marcados: [], outro: '' });
});

test('acaoCompleta: só os 5 campos preenchidos (alcancar, resp, prazo, saber, prox) dão ponto verde (CAP-11.9)', () => {
  const cheia = { id: 'a', bingo: 'redes', i: 0, titulo: 'x', alcancar: 'a', resp: 'Ana', prazo: '2027-03-01', saber: 's', prox: 'p' };
  assert.equal(acaoCompleta(cheia), true);
  for (const k of ['alcancar', 'resp', 'prazo', 'saber', 'prox']) {
    assert.equal(acaoCompleta({ ...cheia, [k]: '' }), false, `${k} vazio`);
    assert.equal(acaoCompleta({ ...cheia, [k]: '   ' }), false, `${k} só espaços`);
  }
  assert.equal(acaoCompleta({ id: 'a', bingo: 'redes', i: 0, titulo: 'x' }), false);
  assert.equal(acaoCompleta(null), false);
});

test('limitesPrazo: com posse o prazo vai de hoje até 100 dias depois da posse (CAP-11.6, design)', () => {
  assert.deepEqual(limitesPrazo('2027-02-01', '2026-10-27'), { min: '2026-10-27', max: '2027-05-12' });
  assert.deepEqual(limitesPrazo('2027-01-01', '2026-12-31'), { min: '2026-12-31', max: '2027-04-11' });
});

test('limitesPrazo: sem data da posse (ausente, vazia ou inválida) não há máximo (CAP-40)', () => {
  for (const posse of [undefined, '', 'em breve', '2027-13-45', null]) assert.deepEqual(limitesPrazo(posse, '2026-10-27'), { min: '2026-10-27' });
});

test('validaPrazo: hoje e datas futuras valem; o passado é recusado (CAP-11.6)', () => {
  assert.equal(validaPrazo('2026-10-27', '2026-10-27', undefined), null);
  assert.equal(validaPrazo('2026-10-28', '2026-10-27', undefined), null);
  assert.match(validaPrazo('2026-10-26', '2026-10-27', undefined) ?? '', /passado|já passou/i);
});

test('validaPrazo: sem posse qualquer prazo futuro é aceito, mesmo muito distante (CAP-40)', () => {
  assert.equal(validaPrazo('2040-01-01', '2026-10-27', undefined), null);
});

test('validaPrazo: com posse recusa depois de 100 dias dela e aceita no último dia (CAP-11.6)', () => {
  assert.equal(validaPrazo('2027-05-12', '2026-10-27', '2027-02-01'), null);
  assert.match(validaPrazo('2027-05-13', '2026-10-27', '2027-02-01') ?? '', /100 dias/);
});

test('validaPrazo: data que não é AAAA-MM-DD é recusada; ehDataISO reconhece só datas reais', () => {
  assert.notEqual(validaPrazo('até 20/03', '2026-10-27', undefined), null);
  assert.equal(ehDataISO('2027-02-29'), false);
  assert.equal(ehDataISO('2028-02-29'), true);
  assert.equal(ehDataISO('até 20/03'), false);
});

test('ordenaPorPrazo: datas em ordem crescente; prazo em texto livre ou vazio vai para o fim, na ordem original (CAP-13.12)', () => {
  const a = [
    { id: 'texto', prazo: 'até 20/03' }, { id: 'tarde', prazo: '2027-05-01' }, { id: 'vazio', prazo: '' }, { id: 'cedo', prazo: '2027-02-10' },
    { id: 'meio', prazo: '2027-03-15' }, { id: 'sem' }, { id: 'texto2', prazo: 'logo' },
  ];
  const copia = a.map((x) => x.id);
  assert.deepEqual(ordenaPorPrazo(a).map((x) => x.id), ['cedo', 'meio', 'tarde', 'texto', 'vazio', 'sem', 'texto2']);
  assert.deepEqual(a.map((x) => x.id), copia, 'não muda a lista original');
});

test('ordenaPorPrazo: mesma data mantém a ordem em que as ações foram escolhidas', () => {
  const r = ordenaPorPrazo([{ id: 'b', prazo: '2027-03-01' }, { id: 'a', prazo: '2027-03-01' }]);
  assert.deepEqual(r.map((x) => x.id), ['b', 'a']);
});

/* ---------- sugestões da Missão 4 (SUG-46, 47, 48) ---------- */
test('SUG-46: papelNorm leva "Relatoria" antigo ao rótulo novo e deixa o resto como está', () => {
  assert.equal(papelNorm('Relatoria'), 'Conquista de Relatoria Relevante');
  assert.equal(papelNorm(' Relatoria '), 'Conquista de Relatoria Relevante');
  assert.equal(papelNorm('Titular'), 'Titular');
  assert.equal(papelNorm(undefined), '');
});

test('SUG-48: MOVIMENTOS inclui "Articular com a Presidência da Casa"', () => {
  assert.ok(MOVIMENTOS.some((m) => m.rot === 'Articular com a Presidência da Casa'));
});

test('SUG-47: lerMovimentos lê o texto antigo (sem data) e o texto com data', () => {
  assert.deepEqual(lerMovimentos({ mov: 'Pedir a vaga formalmente' }), [{ rot: 'Pedir a vaga formalmente', data: '' }]);
  assert.deepEqual(lerMovimentos({ mov: 'A (10/12/2026); B' }), [{ rot: 'A', data: '2026-12-10' }, { rot: 'B', data: '' }]);
  assert.deepEqual(lerMovimentos({}), []);
  assert.deepEqual(lerMovimentos({ movs: [{ rot: 'A', data: 'lixo' }, 3], mov: 'ignorado' }), [{ rot: 'A', data: '' }]);
});

test('SUG-47: no máximo 4 movimentos; o 5º é recusado e a lista não muda', () => {
  let movs: { rot: string; data: string }[] = [];
  for (const r of MOVIMENTOS.slice(0, 4).map((m) => m.rot)) { const x = alternaMovimento(movs, r); assert.ok(x.ok); if (x.ok) movs = x.movs; }
  assert.deepEqual(alternaMovimento(movs, MOVIMENTOS[4].rot), { ok: false, erro: 'Escolha no máximo 4 movimentos.' });
  assert.equal(alternaOutroMovimento(movs).ok, false);
  const sem = alternaMovimento(movs, MOVIMENTOS[0].rot);
  assert.ok(sem.ok && sem.movs.length === 3);
});

test('SUG-47: ordem e texto por data; sem data fica no fim na ordem de marcação', () => {
  let movs = [{ rot: 'A', data: '' }, { rot: 'B', data: '' }, { rot: 'C', data: '' }];
  movs = defineDataMovimento(movs, 2, '2026-12-01');
  movs = defineDataMovimento(movs, 1, '2026-11-20');
  assert.deepEqual(ordemMovimentos(movs), [1, 2, 0]);
  assert.equal(textoMovimentos(movs), 'B (20/11/2026); C (01/12/2026); A');
  assert.equal(textoMovimentos([{ rot: '', data: '2026-12-01' }, { rot: 'x;y', data: '' }]), 'x,y');
  assert.deepEqual(lerMovimentos({ mov: textoMovimentos(movs) }).map((m) => m.rot), ['B', 'C', 'A']);
});
