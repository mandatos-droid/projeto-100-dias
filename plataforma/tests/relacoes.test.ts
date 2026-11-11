import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIAS, ajudaTexto, rotulo, contagem, resumoTexto } from '../lib/relacoes.ts';
import type { Relacao, Status } from '../lib/types.ts';

const rel = (status: Status): Relacao => ({ status, nome: 'X', partido: 'P', cargo: 'Deputado', uf: 'DF' });
const lote = (...pares: [Status, number][]): Record<string, Relacao> => {
  const o: Record<string, Relacao> = {};
  let i = 0;
  for (const [s, n] of pares) for (let k = 0; k < n; k++) o[`sq${i++}`] = rel(s);
  return o;
};

test('as 5 categorias vêm na ordem e com os rótulos da Alana (LEG-03)', () => {
  assert.deepEqual(CATEGORIAS.map((c) => c.rot),
    ['Aliado', 'Aliado, mas concorrente', 'Oponente', 'Oponente e concorrente', 'Indefinida']);
  assert.deepEqual(CATEGORIAS.map((c) => c.k),
    ['aliado', 'aliado_concorrente', 'concorrente', 'oponente_concorrente', 'potencial']);
});

test('chaves antigas aparecem com o rótulo novo: concorrente = Oponente, potencial = Indefinida (LEG-11)', () => {
  assert.equal(rotulo('aliado'), 'Aliado');
  assert.equal(rotulo('concorrente'), 'Oponente');
  assert.equal(rotulo('potencial'), 'Indefinida');
  assert.equal(rotulo('aliado_concorrente'), 'Aliado, mas concorrente');
  assert.equal(rotulo('oponente_concorrente'), 'Oponente e concorrente');
});

test('contagem conta por categoria e ignora neutro', () => {
  const n = contagem(lote(['aliado', 3], ['concorrente', 2], ['neutro', 4]));
  assert.deepEqual(n, { aliado: 3, concorrente: 2 });
});

test('resumoTexto no formato da spec, só com categorias de contagem ≥ 1 (LEG-12)', () => {
  assert.equal(resumoTexto(lote(['aliado', 20], ['aliado_concorrente', 5])),
    'Você tem 20 Aliados; 5 Aliados, mas concorrentes');
  assert.equal(resumoTexto(lote(['potencial', 2], ['oponente_concorrente', 3], ['concorrente', 4])),
    'Você tem 4 Oponentes; 3 Oponentes e concorrentes; 2 Indefinidas');
});

test('resumoTexto devolve string vazia sem classificação (LEG-12)', () => {
  assert.equal(resumoTexto({}), '');
  assert.equal(resumoTexto(lote(['neutro', 3])), '');
});

test('as definições do balão são as mesmas listadas na pergunta 2.1 do legado (LEG-04, sem duas versões)', async () => {
  const { readFileSync } = await import('node:fs');
  const m1 = readFileSync(new URL('../public/legacy/m1.js', import.meta.url), 'utf8');
  for (const c of CATEGORIAS) assert.ok(m1.includes(`<strong>${c.rot}:</strong> ${c.def}`), `m1.js sem a definição de ${c.rot}`);
  assert.ok(ajudaTexto().startsWith('Aliado: para aqueles'));
});
