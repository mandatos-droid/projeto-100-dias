import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assinar, definirFoco, focoAtual, limparFoco } from '../ilhas/equipe/foco.ts';

test('assinar entrega o foco atual na hora e cada mudança depois (MEQ-19, T-26)', () => {
  limparFoco();
  const vistos: number[][] = [];
  const parar = assinar((f) => vistos.push(f.cadeiras));
  definirFoco({ cadeiras: [7, 8], id: 'area:Comunicação' });
  definirFoco({ cadeiras: [1] });
  parar();
  assert.deepEqual(vistos, [[], [7, 8], [1]]);
});

test('limparFoco notifica com lista vazia e zera o foco atual (MEQ-19, T-26)', () => {
  definirFoco({ cadeiras: [3], id: 'x' });
  let ultimo: { cadeiras: number[]; id?: string } | undefined;
  const parar = assinar((f) => { ultimo = f; });
  limparFoco();
  parar();
  assert.deepEqual(ultimo, { cadeiras: [] });
  assert.deepEqual(focoAtual(), { cadeiras: [] });
});

test('cancelar a assinatura para as notificações (MEQ-19, T-26)', () => {
  limparFoco();
  let n = 0;
  const parar = assinar(() => { n++; });
  parar();
  definirFoco({ cadeiras: [1] });
  limparFoco();
  assert.equal(n, 1); // só a entrega inicial
});
