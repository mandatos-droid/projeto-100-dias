// Primeiro acesso: opções e validação do formulário de perfil (PAG-02.4 a 02.11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENEROS, RACAS, ATUACOES, TEMPOS } from '../lib/perfil/opcoes.ts';
import { validaPerfil, ERRO_VAZIO, ERRO_NOME, ERRO_NASCIMENTO, ERRO_TELEFONE } from '../lib/perfil/validacao.ts';
import type { CamposPerfil } from '../lib/perfil/validacao.ts';

// 9/11/2026, 12h em Brasília
const AGORA = new Date('2026-11-09T15:00:00Z');
const VALIDO: CamposPerfil = {
  nome: 'Carlos Lima', nascimento: '1990-05-17', genero: 'homem_cis', raca: 'parda', telefone: '11987654321',
  atua: 'sim', tempo: '3_5', consentimento: true, sensiveis: true,
};
const valida = (c: Partial<CamposPerfil>, agora = AGORA) => validaPerfil({ ...VALIDO, ...c }, agora);
const vazio = (campo: string) => ({ ok: false, erro: ERRO_VAZIO, campo });
const recusa = (erro: string, campo: string) => ({ ok: false, erro, campo });

// ---------- opções ----------

test('as mensagens de erro são os textos literais da spec (PAG-02.8 a 02.11)', () => {
  assert.equal(ERRO_VAZIO, 'Preencha todos os campos e aceite o tratamento dos dados para continuar.');
  assert.equal(ERRO_NOME, 'Informe seu nome completo.');
  assert.equal(ERRO_NASCIMENTO, 'Informe uma data de nascimento válida.');
  assert.equal(ERRO_TELEFONE, 'Informe um telefone com DDD.');
});

test('gênero tem as 8 opções da spec, na ordem, com a chave gravada no banco (PAG-02.6)', () => {
  assert.deepEqual(GENEROS.map((o) => [o.chave, o.rotulo]), [
    ['mulher_cis', 'Mulher cisgênero'], ['homem_cis', 'Homem cisgênero'], ['mulher_trans', 'Mulher transgênero'],
    ['homem_trans', 'Homem transgênero'], ['travesti', 'Travesti'], ['nao_binaria', 'Pessoa não binária'],
    ['outra', 'Outra identidade'], ['nao_informar', 'Prefiro não informar'],
  ]);
});

test('raça tem as 6 opções da spec, na ordem, com a chave gravada no banco (PAG-02.6)', () => {
  assert.deepEqual(RACAS.map((o) => [o.chave, o.rotulo]), [
    ['branca', 'Branca'], ['preta', 'Preta'], ['parda', 'Parda'], ['amarela', 'Amarela'], ['indigena', 'Indígena'],
    ['nao_informar', 'Prefiro não informar'],
  ]);
});

test('atuação tem "Não atuo na política" e as 5 faixas de tempo; o tempo oferecido a quem responde "Sim" são as 5 faixas (PAG-02.4, PAG-02.5)', () => {
  assert.deepEqual(ATUACOES.map((o) => [o.chave, o.rotulo]), [
    ['nao_atua', 'Não atuo na política'], ['menos_1', 'Menos de 1 ano'], ['1_2', '1 a 2 anos'], ['3_5', '3 a 5 anos'],
    ['6_10', '6 a 10 anos'], ['mais_10', 'Mais de 10 anos'],
  ]);
  assert.deepEqual(TEMPOS.map((o) => o.rotulo), ['Menos de 1 ano', '1 a 2 anos', '3 a 5 anos', '6 a 10 anos', 'Mais de 10 anos']);
});

// ---------- formulário válido ----------

test('formulário válido devolve os dados prontos para gravar: nome aparado, telefone só com dígitos, atua e tempo (PAG-02.12)', () => {
  assert.deepEqual(valida({ nome: '  Carlos Lima  ', telefone: '(11) 98765-4321' }), {
    ok: true,
    dados: { nome: 'Carlos Lima', nascimento: '1990-05-17', genero: 'homem_cis', raca: 'parda', telefone: '11987654321', atua: true, tempo: '3_5' },
  });
});

// ---------- campos vazios e consentimento (PAG-02.8) ----------

test('nome vazio, só com espaços ou ausente recusa com a mensagem de campo vazio e destaca o nome (PAG-02.8)', () => {
  for (const nome of ['', '   ', null, undefined]) assert.deepEqual(valida({ nome }), vazio('nome'), String(nome));
});

test('data de nascimento vazia recusa com a mensagem de campo vazio e destaca a data (PAG-02.8)', () => {
  for (const nascimento of ['', null]) assert.deepEqual(valida({ nascimento }), vazio('nascimento'), String(nascimento));
});

test('gênero sem escolha ou fora da lista recusa com a mensagem de campo vazio e destaca o gênero (PAG-02.8)', () => {
  for (const genero of ['', null, 'feminino']) assert.deepEqual(valida({ genero }), vazio('genero'), String(genero));
});

test('raça sem escolha ou fora da lista recusa com a mensagem de campo vazio e destaca a raça (PAG-02.8)', () => {
  for (const raca of ['', null, 'negra']) assert.deepEqual(valida({ raca }), vazio('raca'), String(raca));
});

test('telefone vazio recusa com a mensagem de campo vazio e destaca o telefone (PAG-02.8)', () => {
  for (const telefone of ['', '  ', null]) assert.deepEqual(valida({ telefone }), vazio('telefone'), String(telefone));
});

test('"Atua na política?" sem resposta recusa com a mensagem de campo vazio e destaca a pergunta (PAG-02.8)', () => {
  for (const atua of ['', null, 'talvez']) assert.deepEqual(valida({ atua }), vazio('atua'), String(atua));
});

test('"Sim" sem tempo, ou com tempo fora das 5 faixas, recusa com a mensagem de campo vazio e destaca o tempo (PAG-02.4, PAG-02.8)', () => {
  for (const tempo of ['', null, 'nao_atua', '2_3']) assert.deepEqual(valida({ atua: 'sim', tempo }), vazio('tempo'), String(tempo));
});

test('a caixa de consentimento desmarcada recusa com a mesma mensagem e destaca a caixa (PAG-02.8)', () => {
  for (const consentimento of [false, null, undefined]) {
    assert.deepEqual(valida({ consentimento }), vazio('consentimento'), String(consentimento));
  }
});

test('a caixa específica dos dados sensíveis desmarcada recusa com a mesma mensagem e destaca a caixa (PAG-02.8)', () => {
  for (const sensiveis of [false, null, undefined]) assert.deepEqual(valida({ sensiveis }), vazio('sensiveis'), String(sensiveis));
});

test('com vários campos vazios, a recusa é a de campo vazio e destaca o primeiro na ordem do formulário (PAG-02.8)', () => {
  assert.deepEqual(validaPerfil({}, AGORA), vazio('nome'));
  assert.deepEqual(valida({ nome: 'Carlos', telefone: '', consentimento: false }), vazio('telefone'));
});

// ---------- nome (PAG-02.9) ----------

test('nome com uma palavra recusa com "Informe seu nome completo." (PAG-02.9)', () => {
  for (const nome of ['Carlos', 'A', '  Carlos  ']) assert.deepEqual(valida({ nome }), recusa(ERRO_NOME, 'nome'), nome);
});

test('nome de duas palavras com 121 caracteres recusa e com 120 passa, contados depois de aparar (PAG-02.9)', () => {
  const n120 = `Ana ${'x'.repeat(116)}`;
  assert.equal(n120.length, 120);
  assert.deepEqual(valida({ nome: `${n120}y` }), recusa(ERRO_NOME, 'nome'));
  const r = valida({ nome: ` ${n120} ` });
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.dados.nome, n120);
});

// ---------- data de nascimento (PAG-02.10) ----------

test('data inexistente recusa com "Informe uma data de nascimento válida."; 29/02 de ano bissexto passa (PAG-02.10)', () => {
  for (const nascimento of ['2023-02-29', '2023-02-30', '2023-13-01', '2023-00-10', '2023-04-31']) {
    assert.deepEqual(valida({ nascimento }), recusa(ERRO_NASCIMENTO, 'nascimento'), nascimento);
  }
  assert.equal(valida({ nascimento: '2024-02-29' }).ok, true);
});

test('data fora do formato do campo de data recusa com "Informe uma data de nascimento válida." (PAG-02.10)', () => {
  for (const nascimento of ['17/05/1990', '1990-5-17', 'ontem']) {
    assert.deepEqual(valida({ nascimento }), recusa(ERRO_NASCIMENTO, 'nascimento'), nascimento);
  }
});

test('data futura recusa; hoje passa, com "hoje" no fuso de Brasília (PAG-02.10)', () => {
  assert.deepEqual(valida({ nascimento: '2026-11-10' }), recusa(ERRO_NASCIMENTO, 'nascimento'));
  assert.equal(valida({ nascimento: '2026-11-09' }).ok, true);
  // 10/11 às 01h UTC ainda é 9/11 em Brasília: 10/11 é futuro
  const madrugadaUtc = new Date('2026-11-10T01:00:00Z');
  assert.deepEqual(valida({ nascimento: '2026-11-10' }, madrugadaUtc), recusa(ERRO_NASCIMENTO, 'nascimento'));
  assert.equal(valida({ nascimento: '2026-11-09' }, madrugadaUtc).ok, true);
});

test('data anterior a 1900-01-01 recusa; 1900-01-01 passa (PAG-02.10)', () => {
  assert.deepEqual(valida({ nascimento: '1899-12-31' }), recusa(ERRO_NASCIMENTO, 'nascimento'));
  assert.equal(valida({ nascimento: '1900-01-01' }).ok, true);
});

// ---------- telefone (PAG-02.11) ----------

test('telefone sem DDD de 11 a 99 mais 8 ou 9 dígitos recusa com "Informe um telefone com DDD." (PAG-02.11)', () => {
  for (const telefone of ['10987654321', '0987654321', '00987654321', '98765432', '119876543', '119876543210']) {
    assert.deepEqual(valida({ telefone }), recusa(ERRO_TELEFONE, 'telefone'), telefone);
  }
});

test('telefone aceita parênteses, espaço e hífen e devolve só os dígitos; 8 e 9 dígitos e DDD 99 passam (PAG-02.11)', () => {
  const telefoneDe = (telefone: string) => { const r = valida({ telefone }); return r.ok ? r.dados.telefone : r; };
  assert.equal(telefoneDe('(11) 98765-4321'), '11987654321');
  assert.equal(telefoneDe('11 3333-4444'), '1133334444');
  assert.equal(telefoneDe('(99)987654321'), '99987654321');
});

test('telefone com outros caracteres além de parênteses, espaço e hífen recusa (PAG-02.11)', () => {
  for (const telefone of ['+55 11 98765-4321', '11.98765.4321', '11 9876-ABCD']) {
    assert.deepEqual(valida({ telefone }), recusa(ERRO_TELEFONE, 'telefone'), telefone);
  }
});

// ---------- atuação (PAG-02.4, PAG-02.5) ----------

test('"Não" grava como não atua: atua falso e sem tempo, mesmo com um tempo escolhido antes (PAG-02.5)', () => {
  for (const tempo of ['', null, '6_10']) {
    const r = valida({ atua: 'nao', tempo });
    assert.equal(r.ok, true, String(tempo));
    assert.deepEqual(r.ok && [r.dados.atua, r.dados.tempo], [false, null], String(tempo));
  }
});

test('"Sim" grava atua verdadeiro com a faixa escolhida, para cada uma das 5 faixas (PAG-02.4)', () => {
  for (const tempo of ['menos_1', '1_2', '3_5', '6_10', 'mais_10']) {
    const r = valida({ atua: 'sim', tempo });
    assert.deepEqual(r.ok && [r.dados.atua, r.dados.tempo], [true, tempo], tempo);
  }
});
