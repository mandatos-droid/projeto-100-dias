import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adicionaSucesso, atingidos, editaSucesso, lerSucessos, porMes, removeSucesso, type Sucesso } from '../lib/sucessos.ts';

const base = (): Sucesso[] => [
  { id: 'a', mes: 2, texto: 'Aprovar 1 projeto', status: 'nao_concluida' },
  { id: 'b', mes: 1, texto: 'Visitar 5 escolas', status: 'concluida' },
  { id: 'c', mes: 2, texto: 'Realizar audiência', status: 'concluida70' },
];

test('adicionaSucesso cria sucesso com mês, texto e status não concluída, sem mudar a lista original (M5-01.1)', () => {
  const l = base();
  const nova = adicionaSucesso(l, { mes: 3, texto: 'Lançar campanha' });
  assert.equal(l.length, 3);
  assert.equal(nova.length, 4);
  const s = nova[3];
  assert.equal(s.mes, 3);
  assert.equal(s.texto, 'Lançar campanha');
  assert.equal(s.status, 'nao_concluida');
  assert.ok(s.id);
});

test('adicionaSucesso dá ids diferentes e aceita mês de 1 a 4; mês inválido vira 1 (M5-01.1)', () => {
  let l: Sucesso[] = [];
  for (const mes of [1, 2, 3, 4]) l = adicionaSucesso(l, { mes, texto: `m${mes}` });
  assert.deepEqual(l.map((s) => s.mes), [1, 2, 3, 4]);
  assert.equal(new Set(l.map((s) => s.id)).size, 4);
  assert.equal(adicionaSucesso([], { mes: 9, texto: 'x' })[0].mes, 1);
});

test('editaSucesso troca texto, mês ou status e não altera os outros campos nem os outros sucessos (M5-01.2)', () => {
  const l = base();
  const t = editaSucesso(l, 'a', { texto: 'Aprovar 2 projetos' });
  assert.deepEqual(t[0], { id: 'a', mes: 2, texto: 'Aprovar 2 projetos', status: 'nao_concluida' });
  const m = editaSucesso(l, 'a', { mes: 4 });
  assert.deepEqual(m[0], { id: 'a', mes: 4, texto: 'Aprovar 1 projeto', status: 'nao_concluida' });
  const s = editaSucesso(l, 'a', { status: 'concluida' });
  assert.deepEqual(s[0], { id: 'a', mes: 2, texto: 'Aprovar 1 projeto', status: 'concluida' });
  assert.deepEqual(s.slice(1), l.slice(1));
  assert.deepEqual(l, base(), 'a lista original não muda');
});

test('editaSucesso ignora mês e status inválidos (M5-01.2)', () => {
  const l = editaSucesso(base(), 'a', { mes: 7, status: 'xis' as never });
  assert.equal(l[0].mes, 2);
  assert.equal(l[0].status, 'nao_concluida');
});

test('removeSucesso remove só o escolhido (M5-01.3)', () => {
  const l = removeSucesso(base(), 'b');
  assert.deepEqual(l.map((s) => s.id), ['a', 'c']);
  assert.deepEqual(removeSucesso(base(), 'nao-existe'), base());
});

test('lerSucessos de meta sem sucessos devolve lista vazia, sem mutar o objeto (M5-02.7)', () => {
  const meta = { id: 'm', texto: 'Meta antiga', status: 'concluida' };
  const antes = JSON.stringify(meta);
  assert.deepEqual(lerSucessos(meta), []);
  assert.equal(JSON.stringify(meta), antes);
  assert.ok(!('sucessos' in meta));
  assert.deepEqual(lerSucessos(null), []);
  assert.deepEqual(lerSucessos({ sucessos: 'lixo' }), []);
});

test('lerSucessos normaliza mês, status e texto inválidos sem mutar e sem apagar texto (M5-02.7)', () => {
  const meta = { sucessos: [{ id: 'x', mes: 9, texto: 'Escrito', status: 'zzz' }, 'lixo', null, { mes: 3 }] };
  const antes = JSON.stringify(meta);
  const l = lerSucessos(meta);
  assert.equal(JSON.stringify(meta), antes);
  assert.equal(l.length, 2);
  assert.deepEqual(l[0], { id: 'x', mes: 1, texto: 'Escrito', status: 'nao_concluida' });
  assert.equal(l[1].mes, 3);
  assert.equal(l[1].texto, '');
  assert.ok(l[1].id);
});

test('lerSucessos mantém sucessos válidos como estão', () => {
  assert.deepEqual(lerSucessos({ sucessos: base() }), base());
});

test('porMes agrupa por mês na ordem 1 a 4 e omite mês vazio', () => {
  const g = porMes(base());
  assert.deepEqual(g.map((x) => x.mes), [1, 2]);
  assert.deepEqual(g[1].sucessos.map((s) => s.id), ['a', 'c']);
  assert.deepEqual(porMes([]), []);
  const todos = porMes([4, 3, 2, 1].map((mes) => ({ id: `i${mes}`, mes, texto: '', status: 'nao_concluida' as const })));
  assert.deepEqual(todos.map((x) => x.mes), [1, 2, 3, 4]);
});

test('atingidos conta só "concluída" sobre o total; congelado fica fora', () => {
  assert.deepEqual(atingidos(base()), { atingidos: 1, total: 3 });
  assert.deepEqual(atingidos([]), { atingidos: 0, total: 0 });
  const l = editaSucesso(base(), 'a', { status: 'congelada' });
  assert.deepEqual(atingidos(l), { atingidos: 1, total: 2 });
});
