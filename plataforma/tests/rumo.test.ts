import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerRumo, lerMeta, lerMetas, aplicaRumo, espelho, CRITERIOS_GUIA } from '../lib/rumo.ts';
import type { Rumo } from '../lib/rumo.ts';

type D = { campos?: Record<string, string>; rumo?: unknown; metas?: unknown };
const porId = (r: Rumo, id: string) => r.bandeiras.find((b) => b.id === id);

test('sem D.rumo, o mural antigo vira bandeiras reconhecidas e as prioritárias seguem m3.b1..b3 (RUM-02.9)', () => {
  const d: D = { campos: { 'm3.mural': 'Educação, saúde; Indústria, comércio e empreendedorismo', 'm3.b1': 'educação', 'm3.b2': 'Saúde' } };
  const r = lerRumo(d);
  assert.deepEqual(r.bandeiras.map((b) => b.id), ['educacao', 'saude', 'industria']);
  assert.equal(porId(r, 'educacao')!.prioridade, 1);
  assert.equal(porId(r, 'saude')!.prioridade, 2);
  assert.equal(porId(r, 'industria')!.prioridade, null);
});

test('rótulo não reconhecido fica como bandeira "outra" com o texto original (RUM-02.9)', () => {
  const r = lerRumo({ campos: { 'm3.mural': 'Educação\nMobilidade urbana', 'm3.b3': 'Habitação popular' } });
  const outra = r.bandeiras.find((b) => b.rot === 'Mobilidade urbana')!;
  assert.ok(outra && outra.id.startsWith('x-'));
  const prio = r.bandeiras.find((b) => b.rot === 'Habitação popular')!;
  assert.equal(prio.prioridade, 3);
  assert.ok(prio.id.startsWith('x-'));
});

test('lerRumo não altera o objeto recebido, nem com dados corrompidos (RUM-70)', () => {
  const d: D = { campos: { 'm3.mural': 'Educação', 'm3.legado': 'Manchete' }, rumo: { v: 1, bandeiras: [1, null, { id: 'x' }], criterios: 'lixo' }, metas: [{ texto: 5 }] };
  const antes = JSON.stringify(d);
  lerRumo(d); lerMetas(d);
  assert.equal(JSON.stringify(d), antes);
});

test('D.rumo corrompido descarta só o campo inválido e mantém o texto (RUM-70)', () => {
  const d: D = { rumo: {
    v: 1, criterios: 'lixo',
    bandeiras: [{ id: 'educacao', rot: 'Educação', argumentos: 'texto bom', notas: { impacto: 9, apoiadores: 3, promessas: 'a', especializacao: 2.5 }, prioridade: 'um' }, 42, null],
    legado: { manchete: 'Minha manchete', el: 'x', rascunhos: 'y', fechado: 'sim' },
  } };
  const r = lerRumo(d);
  assert.equal(r.criterios.length, CRITERIOS_GUIA.length);
  assert.equal(r.bandeiras.length, 1);
  const b = r.bandeiras[0];
  assert.equal(b.argumentos, 'texto bom');
  assert.deepEqual(b.notas, { apoiadores: 3 });
  assert.equal(b.prioridade, null);
  assert.equal(r.legado.manchete, 'Minha manchete');
  assert.deepEqual(r.legado.rascunhos, []);
  assert.equal(r.legado.el.protagonista, '');
  assert.equal(r.legado.fechado, false);
});

test('D.rumo que não é objeto cai na migração do formato antigo (RUM-70)', () => {
  const r = lerRumo({ rumo: 'quebrado', campos: { 'm3.mural': 'Cultura' } });
  assert.deepEqual(r.bandeiras.map((b) => b.id), ['cultura']);
});

test('m3.legado e m3.cargo antigos viram manchete manual e cargo (RUM-70)', () => {
  const r = lerRumo({ campos: { 'm3.legado': 'Marta se reelege', 'm3.cargo': 'Senador(a)' } });
  assert.equal(r.legado.manchete, 'Marta se reelege');
  assert.equal(r.legado.manual, true);
  assert.equal(r.legado.el.cargo, 'Senador(a)');
  assert.equal(r.legado.fechado, false);
  assert.equal(lerRumo({}).legado.manual, false);
});

test('espelho devolve todas as chaves m3.* em texto legível (RUM-02.10)', () => {
  const r = lerRumo({ rumo: { v: 1, bandeiras: [
    { id: 'educacao', rot: 'Educação', argumentos: 'Base da campanha', notas: { impacto: 5, apoiadores: 3 }, prioridade: 1 },
    { id: 'saude', rot: 'Saúde', argumentos: '', notas: {}, prioridade: 2 },
    { id: 'cultura', rot: 'Cultura', argumentos: '', notas: {}, prioridade: null },
  ], legado: { manchete: 'Manchete final', el: { cargo: 'Governador(a)' } } } });
  const e = espelho(r);
  assert.deepEqual(Object.keys(e).sort(), ['m3.argumentos', 'm3.b1', 'm3.b2', 'm3.b3', 'm3.cargo', 'm3.criterios', 'm3.legado', 'm3.mural']);
  assert.equal(e['m3.b1'], 'Educação');
  assert.equal(e['m3.b2'], 'Saúde');
  assert.equal(e['m3.b3'], '');
  assert.equal(e['m3.legado'], 'Manchete final');
  assert.equal(e['m3.cargo'], 'Governador(a)');
  assert.match(e['m3.mural'], /Educação/);
  assert.match(e['m3.mural'], /Cultura/);
  assert.match(e['m3.argumentos'], /Educação.*Base da campanha/);
  assert.match(e['m3.criterios'], /Educação/);
});

test('ida e volta: lerRumo(espelho(r)) preserva bandeiras e prioritárias (RUM-02.10)', () => {
  const r = lerRumo({ rumo: { v: 1, bandeiras: [
    { id: 'educacao', rot: 'Educação', argumentos: '', notas: {}, prioridade: 2 },
    { id: 'industria', rot: 'Indústria, comércio e empreendedorismo', argumentos: '', notas: {}, prioridade: 1 },
    { id: 'x-mobilidade-urbana', rot: 'Mobilidade urbana', argumentos: '', notas: {}, prioridade: 3 },
    { id: 'saude', rot: 'Saúde', argumentos: '', notas: {}, prioridade: null },
  ] } });
  const volta = lerRumo({ campos: espelho(r) });
  const resumo = (x: Rumo) => x.bandeiras.map((b) => [b.rot, b.prioridade]).sort();
  assert.deepEqual(resumo(volta), resumo(r));
});

test('aplicaRumo grava D.rumo e reespelha m3.*, apagando a chave vazia (RUM-02.10)', () => {
  const d: D = { campos: { 'm3.b2': 'Saúde' } };
  aplicaRumo(d, { bandeiras: [{ id: 'educacao', rot: 'Educação', argumentos: '', notas: {}, prioridade: 1 }] });
  assert.equal(d.campos!['m3.b1'], 'Educação');
  assert.equal('m3.b2' in d.campos!, false);
  assert.equal((d.rumo as Rumo).bandeiras.length, 1);
  assert.equal((d.rumo as Rumo).v, 1);
});

test('aplicaRumo mantém o texto antigo de argumentos e critérios (RUM-70)', () => {
  const d: D = { campos: { 'm3.argumentos': 'Texto antigo da equipe', 'm3.criterios': 'Critério antigo' } };
  aplicaRumo(d, { bandeiras: [{ id: 'educacao', rot: 'Educação', argumentos: 'novo', notas: {}, prioridade: null }] });
  assert.match(d.campos!['m3.argumentos'], /Texto antigo da equipe/);
  assert.match(d.campos!['m3.argumentos'], /novo/);
  assert.match(d.campos!['m3.criterios'], /Critério antigo/);
  const antes = d.campos!['m3.argumentos'];
  aplicaRumo(d, {});
  assert.equal(d.campos!['m3.argumentos'], antes, 'reaplicar não duplica o texto antigo');
});

test('aplicaRumo mescla o legado sem apagar os outros elementos', () => {
  const d: D = {};
  aplicaRumo(d, { legado: { el: { protagonista: 'Ana' } } });
  aplicaRumo(d, { legado: { el: { cargo: 'Senador(a)' } } });
  const r = lerRumo(d);
  assert.equal(r.legado.el.protagonista, 'Ana');
  assert.equal(r.legado.el.cargo, 'Senador(a)');
  assert.equal(d.campos!['m3.cargo'], 'Senador(a)');
});

test('HTML digitado fica como texto, sem escape nem remoção (edge case)', () => {
  const d: D = {};
  aplicaRumo(d, { bandeiras: [{ id: 'x-a', rot: '<script>x</script>', argumentos: '<b>oi</b>', notas: {}, prioridade: null }] });
  assert.equal(lerRumo(d).bandeiras[0].rot, '<script>x</script>');
  assert.match(d.campos!['m3.mural'], /<script>x<\/script>/);
});

test('meta sem status lê como não concluída e preserva os campos antigos', () => {
  const m = lerMeta({ pred: 'p1', texto: 'Aprovar 2 projetos', resp: 'Ana', apoio: 'Bia' });
  assert.equal(m.status, 'nao_concluida');
  assert.equal(m.pred, 'p1');
  assert.equal(m.texto, 'Aprovar 2 projetos');
  assert.equal(m.resp, 'Ana');
  assert.equal(m.apoio, 'Bia');
});

test('meta com campo inválido perde só aquele campo (RUM-70)', () => {
  const m = lerMeta({ pred: 'p1', texto: 5, resp: 'Ana', status: 'inventado', respCad: 'x', apoioCad: [1, 'a', 2.5, 3], alcancavel: 'sim' });
  assert.equal(m.texto, undefined);
  assert.equal(m.resp, 'Ana');
  assert.equal(m.status, 'nao_concluida');
  assert.equal(m.respCad, undefined);
  assert.deepEqual(m.apoioCad, [1, 3]);
  assert.equal(m.alcancavel, undefined);
});

test('status válidos são mantidos e lerMetas aceita D.metas inválido', () => {
  assert.equal(lerMeta({ status: 'congelada' }).status, 'congelada');
  assert.equal(lerMeta({ status: 'concluida70' }).status, 'concluida70');
  assert.deepEqual(lerMetas({ metas: 'lixo' }), []);
  assert.equal(lerMetas({ metas: [{ texto: 'a' }, 7, null] }).length, 1);
});

test('rascunho de grupo guarda os elementos opcionais; rascunho antigo, só com manchete e cargo, continua válido (RUM-52.3, RUM-11.9)', () => {
  const r = lerRumo({ rumo: { v: 1, legado: { rascunhos: [
    { id: 'a', grupo: 'Grupo Azul', manchete: 'M1', cargo: 'Senador(a)', el: { protagonista: 'Ana', entrega: 'E1', resultado: 'R1', lixo: 1 } },
    { id: 'b', grupo: 'Grupo Verde', manchete: 'M2', cargo: '' },
    { id: 'c', grupo: 'Grupo Roxo', manchete: 'M3', cargo: '', el: 'corrompido' },
  ] } } });
  assert.deepEqual(r.legado.rascunhos[0].el, { protagonista: 'Ana', entrega: 'E1', resultado: 'R1' });
  assert.equal(r.legado.rascunhos[1].el, undefined);
  assert.equal(r.legado.rascunhos[2].el, undefined);
  assert.equal(r.legado.rascunhos[2].manchete, 'M3');
});

test('D.rumo com bandeira de id repetido: fica uma só, a primeira vence (RUM-70)', () => {
  const r = lerRumo({ rumo: { v: 1, bandeiras: [
    { id: 'educacao', rot: 'Educação', argumentos: 'primeira', notas: {}, prioridade: 1 },
    { id: 'saude', rot: 'Saúde', argumentos: '', notas: {}, prioridade: null },
    { id: 'educacao', rot: 'Educação', argumentos: 'segunda', notas: {}, prioridade: 2 },
  ] } });
  assert.deepEqual(r.bandeiras.map((b) => b.id), ['educacao', 'saude']);
  assert.equal(porId(r, 'educacao')!.argumentos, 'primeira');
  assert.equal(porId(r, 'educacao')!.prioridade, 1);
});
