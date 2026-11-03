import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerEstrategia, defineEstrategia, textoObjetivo, OBJETIVOS_LEGISLA, lerJustificativa, defineJustificativa, faltamJustificativas, passoPreditoresConcluido } from '../lib/estrategia.ts';

const NOME_P1 = 'Priorizar a agenda';
const CINCO = { 'm3.just.p1': 'a', 'm3.just.p2': 'b', 'm3.just.p3': 'c', 'm3.just.p4': 'd', 'm3.just.p5': 'e' };
const TRES = ['p1', 'p2', 'p3'];

test('A: textoObjetivo devolve o nome do preditor mesmo com m3.obj preenchido (RM3-12)', () => {
  assert.equal(textoObjetivo({ 'm3.obj.p1': 'Minha frase' }, 'p1', 'a'), NOME_P1);
});

test('B: devolve a frase de m3.obj, ou o nome se vazia ou só espaços (RM3-13)', () => {
  assert.equal(textoObjetivo({ 'm3.obj.p1': '  Minha frase ' }, 'p1', 'b'), 'Minha frase');
  assert.equal(textoObjetivo({ 'm3.obj.p1': '   ' }, 'p1', 'b'), NOME_P1);
  assert.equal(textoObjetivo({}, 'p1', 'b'), NOME_P1);
});

test('C: devolve o nome do preditor e OBJETIVOS_LEGISLA traz as 3 frases do documento (RM3-14)', () => {
  assert.equal(textoObjetivo({ 'm3.obj.p1': 'Minha frase' }, 'p1', 'c'), NOME_P1);
  assert.deepEqual(OBJETIVOS_LEGISLA, ['Avanço Legislativo', 'Expansão de Capital Político e Influência', 'Governança Estratégica']);
});

test('defineEstrategia grava só m3.est e não apaga m3.obj.* ao trocar (RM3-17)', () => {
  const c = { 'm3.est': 'b', 'm3.obj.p1': 'Minha frase' };
  const patch = defineEstrategia(c, 'a');
  assert.deepEqual(patch, { 'm3.est': 'a' });
  const depois = { ...c, ...patch };
  assert.equal(depois['m3.obj.p1'], 'Minha frase');
  const deVolta = { ...depois, ...defineEstrategia(depois, 'b') };
  assert.equal(textoObjetivo(deVolta, 'p1', lerEstrategia(deVolta, TRES)), 'Minha frase');
});

test('lerEstrategia: m3.est gravado vale; valor inválido vira null (RMX-01)', () => {
  assert.equal(lerEstrategia({ 'm3.est': 'c' }, TRES), 'c');
  assert.equal(lerEstrategia({ 'm3.est': 'a', 'm3.obj.p1': 'frase' }, TRES), 'a');
  assert.equal(lerEstrategia({ 'm3.est': 'x' }, TRES), null);
});

test('lerEstrategia sem m3.est: B se há m3.obj preenchido, A se há preditores e nenhum texto, null sem preditores (RMX-01)', () => {
  assert.equal(lerEstrategia({ 'm3.obj.p2': 'frase' }, TRES), 'b');
  assert.equal(lerEstrategia({ 'm3.obj.p2': '  ' }, TRES), 'a');
  assert.equal(lerEstrategia({}, ['p1']), 'a');
  assert.equal(lerEstrategia({}, []), null);
  assert.equal(lerEstrategia({}), null);
});

test('justificativas por preditor ficam em m3.just.{pid} e sobrevivem à troca da seleção (RM3-05)', () => {
  const patch = defineJustificativa({}, 'p4', '  porque sim ');
  assert.deepEqual(patch, { 'm3.just.p4': 'porque sim' });
  // desmarcar e remarcar p4 só mexe em D.preditores; o campo da justificativa não depende da seleção
  const c = { ...patch };
  assert.equal(lerJustificativa(c, 'p4'), 'porque sim');
  assert.equal(lerJustificativa({}, 'p5'), '');
});

test('faltamJustificativas conta as 5 preditores (RM3-06)', () => {
  assert.equal(faltamJustificativas({}), 5);
  assert.equal(faltamJustificativas({ 'm3.just.p1': 'x', 'm3.just.p5': '   ' }), 4);
  assert.equal(faltamJustificativas(CINCO), 0);
});

test('passoPreditoresConcluido exige 3 escolhidos, estratégia, 3 frases se B e 5 justificativas (RM3-06)', () => {
  assert.equal(passoPreditoresConcluido({ ...CINCO, 'm3.est': 'a' }, TRES), true);
  assert.equal(passoPreditoresConcluido({ ...CINCO, 'm3.est': 'c' }, TRES), true);
  assert.equal(passoPreditoresConcluido({ ...CINCO, 'm3.est': 'a' }, ['p1', 'p2']), false, 'só 2 escolhidos');
  assert.equal(passoPreditoresConcluido({ ...CINCO, 'm3.est': 'x' }, TRES), false, 'estratégia inválida');
  assert.equal(passoPreditoresConcluido({ ...CINCO, 'm3.est': 'a', 'm3.just.p3': '' }, TRES), false, 'falta uma justificativa');
  const b = { ...CINCO, 'm3.est': 'b', 'm3.obj.p1': 'f1', 'm3.obj.p2': 'f2' };
  assert.equal(passoPreditoresConcluido(b, TRES), false, 'B com 2 frases');
  assert.equal(passoPreditoresConcluido({ ...b, 'm3.obj.p3': 'f3' }, TRES), true);
});
