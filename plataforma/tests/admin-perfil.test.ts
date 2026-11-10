// Lógica da seção de perfil do Analytics (PAG-06): resumo do banco -> categorias com número e porcentagem.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { viewPerfil, rotuloMes } from '../lib/admin/perfil.ts';
import type { ResumoPerfil } from '../lib/admin/perfil.ts';

const base = (o: Partial<ResumoPerfil> = {}): ResumoPerfil => ({
  total: 4, por_mes: [{ mes: '2026-11', qtd: 4 }],
  genero: { mulher_cis: 4 }, raca: { parda: 4 }, faixa: { '25 a 34': 4 }, atuacao: { '3_5': 4 }, ...o,
});
const dist = (r: ResumoPerfil) => {
  const v = viewPerfil(r);
  assert.equal(v.vazio, false);
  if (v.vazio) throw new Error('inesperado');
  return v;
};
const soma = (cs: { qtd: number }[]) => cs.reduce((s, c) => s + c.qtd, 0);

test('gênero vira categorias com rótulo da spec, quantidade e porcentagem inteira, na ordem da spec (PAG-06.3)', () => {
  const v = dist(base({ total: 6, genero: { homem_cis: 1, nao_binaria: 1, mulher_cis: 3, outra: 1 } }));
  assert.deepEqual(v.distribuicoes.genero, [
    { rotulo: 'Mulher cisgênero', qtd: 3, pct: 50 },
    { rotulo: 'Homem cisgênero', qtd: 1, pct: 17 },
    { rotulo: 'Pessoa não binária', qtd: 1, pct: 17 },
    { rotulo: 'Outra identidade', qtd: 1, pct: 17 },
  ]);
});

test('raça vira categorias com rótulo da spec, na ordem da spec (PAG-06.3)', () => {
  const v = dist(base({ total: 4, raca: { indigena: 1, preta: 1, branca: 1, parda: 1 } }));
  assert.deepEqual(v.distribuicoes.raca.map((c) => c.rotulo), ['Branca', 'Preta', 'Parda', 'Indígena']);
  assert.deepEqual(v.distribuicoes.raca.map((c) => c.pct), [25, 25, 25, 25]);
});

test('a porcentagem é arredondada para inteiro: 2 de 3 = 67 e 1 de 3 = 33 (PAG-06.3)', () => {
  const v = dist(base({ total: 3, genero: { mulher_cis: 2, homem_cis: 1 } }));
  assert.deepEqual(v.distribuicoes.genero.map((c) => c.pct), [67, 33]);
});

test('"Prefiro não informar" é categoria própria em gênero e em raça (PAG-06.4)', () => {
  const v = dist(base({ total: 4, genero: { mulher_cis: 3, nao_informar: 1 }, raca: { parda: 2, nao_informar: 2 } }));
  assert.deepEqual(v.distribuicoes.genero[1], { rotulo: 'Prefiro não informar', qtd: 1, pct: 25 });
  assert.deepEqual(v.distribuicoes.raca[1], { rotulo: 'Prefiro não informar', qtd: 2, pct: 50 });
});

test('as faixas etárias saem na ordem de "Até 24" a "65 ou mais" (PAG-06.5)', () => {
  const v = dist(base({
    total: 6,
    faixa: { '65 ou mais': 1, '45 a 54': 1, 'Até 24': 1, '55 a 64': 1, '25 a 34': 1, '35 a 44': 1 },
  }));
  assert.deepEqual(v.distribuicoes.faixa.map((c) => c.rotulo), ['Até 24', '25 a 34', '35 a 44', '45 a 54', '55 a 64', '65 ou mais']);
});

test('atuação traz "Não atuo na política" e as 5 faixas de tempo, com os rótulos da spec, em ordem (PAG-06.3)', () => {
  const v = dist(base({ total: 6, atuacao: { mais_10: 1, '6_10': 1, '3_5': 1, '1_2': 1, menos_1: 1, nao_atua: 1 } }));
  assert.deepEqual(v.distribuicoes.atuacao.map((c) => c.rotulo), [
    'Não atuo na política', 'Menos de 1 ano', '1 a 2 anos', '3 a 5 anos', '6 a 10 anos', 'Mais de 10 anos',
  ]);
});

test('a soma das quantidades de cada distribuição é igual a total (PAG-06.12)', () => {
  const v = dist({
    total: 7, por_mes: [{ mes: '2026-11', qtd: 7 }],
    genero: { mulher_cis: 2, nao_informar: 2, travesti: 3 }, raca: { preta: 5, parda: 2 },
    faixa: { 'Até 24': 3, '65 ou mais': 4 }, atuacao: { nao_atua: 6, '1_2': 1 },
  });
  for (const k of ['genero', 'raca', 'faixa', 'atuacao'] as const) assert.equal(soma(v.distribuicoes[k]), 7, k);
});

test('categoria que não veio do banco não aparece, sem inventar categoria com zero (PAG-06.12)', () => {
  const v = dist(base({ total: 2, genero: { mulher_cis: 2 } }));
  assert.deepEqual(v.distribuicoes.genero, [{ rotulo: 'Mulher cisgênero', qtd: 2, pct: 100 }]);
});

test('total 0 devolve o estado vazio com "Ainda não há perfis cadastrados." (PAG-06.9)', () => {
  const v = viewPerfil({ total: 0, por_mes: [], genero: {}, raca: {}, faixa: {}, atuacao: {} });
  assert.deepEqual(v, { vazio: true, mensagem: 'Ainda não há perfis cadastrados.' });
});

test('por_mes vira rótulos Mês/aa, na ordem do banco, com mês vazio em zero (PAG-06.2)', () => {
  const v = dist(base({ total: 3, por_mes: [{ mes: '2026-09', qtd: 2 }, { mes: '2026-10', qtd: 0 }, { mes: '2026-11', qtd: 1 }] }));
  assert.deepEqual(v.meses, [{ rotulo: 'Set/26', qtd: 2 }, { rotulo: 'Out/26', qtd: 0 }, { rotulo: 'Nov/26', qtd: 1 }]);
});

test('rotuloMes usa Jan a Dez e os dois últimos dígitos do ano (PAG-06.2)', () => {
  assert.equal(rotuloMes('2027-01'), 'Jan/27');
  assert.equal(rotuloMes('2026-12'), 'Dez/26');
});

test('a view traz o total de pessoas com perfil (PAG-06.2)', () => {
  assert.equal(dist(base({ total: 4 })).total, 4);
});

test('a view não carrega nenhum campo individual além de contagens (PAG-06.6)', () => {
  const texto = JSON.stringify(dist(base()));
  for (const proibido of ['nome', 'email', 'telefone', 'nascimento', 'user_id']) assert.ok(!texto.includes(proibido), proibido);
});
