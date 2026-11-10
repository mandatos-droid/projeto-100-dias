import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ERRO_CARREGAR, mandatoDoGuia } from '../lib/mandato/legado.ts';

/* O mandato aberto no Guia (Store.mandato, Store.membros, Store.usuario) no formato de useMandato(), com o papel da
   própria pessoa. Base do provedor das abas da Área do mandato (AMA-02; AMA-02.10 e Edge Cases para as falhas). */

const ANA = {
  id: 'm-a', codigo: 'KJ4TP9', nome_parlamentar: 'Ana Souza', nome_civil: 'Ana Souza Lima', cargo: 'Deputado(a) Estadual',
  uf: 'SP', casa: 'Assembleia Legislativa', partido: 'PX', data_posse: '2027-02-01', resp_telefone: '11999990000',
  dados: { tse: { sq: '250001', ano: 2026 }, feitos: {} },
};
const BRUNO = { id: 'm-b', nome_parlamentar: 'Bruno Alves', cargo: 'Vereador(a)', uf: 'MG', partido: 'OP', data_posse: null, dados: {} };
const LIA = { id: 'uid-lia', email: 'lia@gabinete.test', nome: 'Lia Torres' };
const membrosDe = (papelDaLia: unknown) => [
  { mandato_id: 'm-a', user_id: 'uid-mariana', nome: 'Mariana Rocha', papel: 'coordenacao' },
  { mandato_id: 'm-a', user_id: 'uid-lia', nome: 'Lia Torres', papel: papelDaLia },
];

test('converte o mandato do Guia com o papel da própria pessoa e só os campos que as abas leem', () => {
  const r = mandatoDoGuia(ANA, membrosDe('assessoria'), LIA);
  assert.deepEqual(r, {
    ok: true,
    usuario: { id: 'uid-lia', email: 'lia@gabinete.test' },
    mandato: {
      id: 'm-a', papel: 'assessoria', nome_parlamentar: 'Ana Souza', cargo: 'Deputado(a) Estadual', uf: 'SP', partido: 'PX',
      data_posse: '2027-02-01', dados: { tse: { sq: '250001', ano: 2026 }, feitos: {} },
    },
  });
});

test('o papel vem da linha da pessoa em membros, não da primeira linha nem de outra pessoa', () => {
  for (const papel of ['coordenacao', 'assessoria', 'leitura']) {
    const r = mandatoDoGuia(ANA, membrosDe(papel), LIA);
    assert.equal(r.ok && r.mandato.papel, papel, papel);
  }
});

test('trocar de mandato no Guia dá o mandato novo com o papel da pessoa nele, sem nada do anterior (Edge Case: troca de mandato)', () => {
  const antes = mandatoDoGuia(ANA, membrosDe('coordenacao'), LIA);
  const depois = mandatoDoGuia(BRUNO, [{ mandato_id: 'm-b', user_id: 'uid-lia', papel: 'leitura' }], LIA);
  assert.equal(antes.ok && antes.mandato.id, 'm-a');
  assert.deepEqual(depois, {
    ok: true,
    usuario: { id: 'uid-lia', email: 'lia@gabinete.test' },
    mandato: { id: 'm-b', papel: 'leitura', nome_parlamentar: 'Bruno Alves', cargo: 'Vereador(a)', uf: 'MG', partido: 'OP', data_posse: null, dados: {} },
  });
});

test('sem pessoa na sessão (Store.usuario nulo ou sem id) o contexto não monta', () => {
  assert.deepEqual(mandatoDoGuia(ANA, membrosDe('assessoria'), null), { ok: false, falta: 'sem-usuario' });
  assert.deepEqual(mandatoDoGuia(ANA, membrosDe('assessoria'), { email: 'lia@gabinete.test' }), { ok: false, falta: 'sem-usuario' });
});

test('sem mandato aberto (Store.mandato nulo ou sem id) o contexto não monta', () => {
  assert.deepEqual(mandatoDoGuia(null, membrosDe('assessoria'), LIA), { ok: false, falta: 'sem-mandato' });
  assert.deepEqual(mandatoDoGuia({ nome_parlamentar: 'Ana Souza' }, membrosDe('assessoria'), LIA), { ok: false, falta: 'sem-mandato' });
});

test('sem a lista de membros o contexto não monta', () => {
  assert.deepEqual(mandatoDoGuia(ANA, null, LIA), { ok: false, falta: 'sem-membros' });
  assert.deepEqual(mandatoDoGuia(ANA, undefined, LIA), { ok: false, falta: 'sem-membros' });
});

test('a pessoa fora da lista de membros fica sem papel: o contexto não monta e nada é liberado (Edge Case: papel)', () => {
  const r = mandatoDoGuia(ANA, [{ mandato_id: 'm-a', user_id: 'uid-mariana', papel: 'coordenacao' }], LIA);
  assert.deepEqual(r, { ok: false, falta: 'sem-papel' });
});

test('papel desconhecido ou ausente não vira papel nenhum (Edge Case: papel)', () => {
  for (const papel of ['admin', '', null, undefined]) assert.deepEqual(mandatoDoGuia(ANA, membrosDe(papel), LIA), { ok: false, falta: 'sem-papel' }, String(papel));
});

test('campos ausentes do mandato viram null; dados que não são objeto viram null; e-mail ausente vira null', () => {
  const r = mandatoDoGuia({ id: 'm-x', dados: 'quebrado' }, [{ user_id: 'uid-lia', papel: 'leitura' }], { id: 'uid-lia' });
  assert.deepEqual(r, {
    ok: true,
    usuario: { id: 'uid-lia', email: null },
    mandato: { id: 'm-x', papel: 'leitura', nome_parlamentar: null, cargo: null, uf: null, partido: null, data_posse: null, dados: null },
  });
});

test('a mensagem da aba quando o contexto não monta é "Não foi possível carregar. Tente de novo." (AMA-02.10)', () => {
  assert.equal(ERRO_CARREGAR, 'Não foi possível carregar. Tente de novo.');
});
