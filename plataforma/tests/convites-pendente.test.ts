import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guardaPendente, lePendente, limpaPendente, CHAVE_PENDENTE } from '../lib/convites/pendente.ts';

const TOKEN = 'AbC-_123456789012345xy'; // 22 caracteres

function falso() {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const quebrado = {
  getItem: () => { throw new Error('bloqueado'); },
  setItem: () => { throw new Error('cheio'); },
  removeItem: () => { throw new Error('bloqueado'); },
};

test('a chave é legisla.convite', () => {
  assert.equal(CHAVE_PENDENTE, 'legisla.convite');
});

test('guardar e ler devolve o mesmo token, na chave legisla.convite (ACE-02.5)', () => {
  const s = falso();
  guardaPendente(s, TOKEN);
  assert.equal(s.m.get('legisla.convite'), TOKEN);
  assert.equal(lePendente(s), TOKEN);
});

test('limpar faz a leitura devolver null (ACE-02.5)', () => {
  const s = falso();
  guardaPendente(s, TOKEN);
  limpaPendente(s);
  assert.equal(lePendente(s), null);
  assert.equal(s.m.size, 0);
});

test('sem nada guardado a leitura devolve null', () => {
  assert.equal(lePendente(falso()), null);
});

test('valor guardado fora do formato de 22 caracteres lê como null', () => {
  const s = falso();
  for (const ruim of ['curto', TOKEN + 'x', TOKEN.slice(0, 21) + '=', '', '#' + TOKEN]) {
    s.m.set('legisla.convite', ruim);
    assert.equal(lePendente(s), null, ruim);
  }
});

test('guardar token inválido não grava nada', () => {
  const s = falso();
  guardaPendente(s, 'curto');
  assert.equal(s.m.size, 0);
});

test('armazenamento que lança exceção não derruba as três funções', () => {
  assert.doesNotThrow(() => guardaPendente(quebrado, TOKEN));
  assert.equal(lePendente(quebrado), null);
  assert.doesNotThrow(() => limpaPendente(quebrado));
});

test('armazenamento ausente (null ou undefined) também não derruba', () => {
  assert.doesNotThrow(() => guardaPendente(null, TOKEN));
  assert.equal(lePendente(undefined), null);
  assert.doesNotThrow(() => limpaPendente(null));
});
