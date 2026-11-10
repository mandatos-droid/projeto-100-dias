import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CORRIGIR, atuacao, consultaPerfil, dataBr, linhasDaConta, telefoneBr, type Perfil } from '../lib/mandato/conta.ts';

/* Aba Minha conta da Área do mandato: o e-mail e o perfil da própria pessoa, só para leitura, no formato da tela
   (AMA-02.8, 02.9). Datas sem fuso; telefone com DDD; gênero, raça e atuação pelos rótulos do primeiro acesso. */

const LIA: Perfil = {
  nome: 'Lia Torres Almeida', nascimento: '1990-05-17', genero: 'mulher_cis', raca: 'parda', telefone: '11987654321', atua: true, tempo: '3_5',
};

test('data de nascimento AAAA-MM-DD vira DD/MM/AAAA pelo texto, sem fuso; fora do formato fica vazia', () => {
  assert.equal(dataBr('1990-05-17'), '17/05/1990');
  assert.equal(dataBr('2000-01-01'), '01/01/2000'); // à meia-noite UTC seria 31/12/1999 em Brasília
  assert.equal(dataBr('1990-05-17T00:00:00Z'), '');
  assert.equal(dataBr(''), '');
  assert.equal(dataBr(null), '');
});

test('telefone com DDD: celular (11 dígitos) vira "(11) 98765-4321" e fixo (10 dígitos) vira "(11) 3456-7890"', () => {
  assert.equal(telefoneBr('11987654321'), '(11) 98765-4321');
  assert.equal(telefoneBr('1134567890'), '(11) 3456-7890');
  assert.equal(telefoneBr('123'), '123'); // fora do formato, como veio
  assert.equal(telefoneBr(null), '');
});

test('atuação política: quem não atua vê "Não atuo na política"; quem atua vê o tempo, com os rótulos do primeiro acesso', () => {
  assert.equal(atuacao(false, null), 'Não atuo na política');
  assert.equal(atuacao(true, 'menos_1'), 'Menos de 1 ano');
  assert.equal(atuacao(true, '3_5'), '3 a 5 anos');
  assert.equal(atuacao(true, 'mais_10'), 'Mais de 10 anos');
});

test('mostra o e-mail e os campos do perfil, nesta ordem, em texto (AMA-02.8)', () => {
  assert.deepEqual(linhasDaConta('lia@gabinete.test', LIA), [
    { rotulo: 'E-mail', valor: 'lia@gabinete.test' },
    { rotulo: 'Nome', valor: 'Lia Torres Almeida' },
    { rotulo: 'Data de nascimento', valor: '17/05/1990' },
    { rotulo: 'Gênero', valor: 'Mulher cisgênero' },
    { rotulo: 'Raça', valor: 'Parda' },
    { rotulo: 'Telefone', valor: '(11) 98765-4321' },
    { rotulo: 'Atuação política', valor: '3 a 5 anos' },
  ]);
});

test('gênero e raça usam os rótulos do formulário, inclusive "Prefiro não informar"; chave desconhecida aparece como veio', () => {
  const valor = (p: Partial<Perfil>, rotulo: string) => linhasDaConta(null, { ...LIA, ...p }).find((l) => l.rotulo === rotulo)?.valor;
  assert.equal(valor({ genero: 'nao_binaria' }, 'Gênero'), 'Pessoa não binária');
  assert.equal(valor({ genero: 'nao_informar' }, 'Gênero'), 'Prefiro não informar');
  assert.equal(valor({ raca: 'indigena' }, 'Raça'), 'Indígena');
  assert.equal(valor({ raca: 'nao_informar' }, 'Raça'), 'Prefiro não informar');
  assert.equal(valor({ genero: 'outra_chave' }, 'Gênero'), 'outra_chave');
});

test('sem perfil (equipe Legisla) a aba mostra só o e-mail (AMA-02.9)', () => {
  assert.deepEqual(linhasDaConta('ana@legisla.org', null), [{ rotulo: 'E-mail', valor: 'ana@legisla.org' }]);
});

test('a leitura pede só a linha da própria pessoa, com as colunas da aba', () => {
  assert.equal(consultaPerfil('uid-lia'), 'perfis?select=nome,nascimento,genero,raca,telefone,atua,tempo&user_id=eq.uid-lia');
  assert.equal(consultaPerfil('a&b=c'), 'perfis?select=nome,nascimento,genero,raca,telefone,atua,tempo&user_id=eq.a%26b%3Dc');
});

test('o texto de correção é "Para corrigir seus dados, escreva para contato@legislabrasil.org" (AMA-02.8)', () => {
  assert.equal(CORRIGIR, 'Para corrigir seus dados, escreva para contato@legislabrasil.org');
});
