import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { avaliaMeta, ALERTA_ROTINA, LETRAS } from '../lib/smart.ts';

/* O exemplo e a fórmula vêm do conteudo.js (texto do Guia), não de uma cópia nossa. */
const ctx: Record<string, unknown> = {};
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../public/legacy/conteudo.js', import.meta.url), 'utf8') + ';this.FORMULA_META = FORMULA_META;', ctx);
const FORMULA_META = ctx.FORMULA_META as { exemplo: string };

const ok = (r: ReturnType<typeof avaliaMeta>) => LETRAS.filter((l) => r.letras[l].ok).join('');

test('o exemplo de FORMULA_META, com objetivo e capacidade confirmada, atende as 5 letras (RUM-31.3)', () => {
  const r = avaliaMeta({ texto: FORMULA_META.exemplo, pred: 'p1', alcancavel: true });
  assert.equal(ok(r), 'SMART');
  assert.equal(r.pontos, 5);
  assert.equal(r.falta, null);
  assert.deepEqual(r.alertas, []);
});

test('o exemplo do Guia sozinho atende S, M e T (RUM-31.4 a 6)', () => {
  assert.equal(ok(avaliaMeta({ texto: FORMULA_META.exemplo })), 'SMT');
});

test('"Aprovar 2 projetos de lei sobre educação até dezembro de 2027" atende S, M e T (RUM-31.4 a 6)', () => {
  const r = avaliaMeta({ texto: 'Aprovar 2 projetos de lei sobre educação até dezembro de 2027' });
  assert.equal(ok(r), 'SMT');
  assert.equal(r.pontos, 3);
});

test('"Melhorar a educação" não atende S, M nem T e a dica é a de S (RUM-31.4 a 6)', () => {
  const r = avaliaMeta({ texto: 'Melhorar a educação' });
  assert.equal(r.letras.S.ok, false);
  assert.equal(r.letras.M.ok, false);
  assert.equal(r.letras.T.ok, false);
  assert.equal(r.falta, 'S');
  assert.equal(r.dica, r.letras.S.dica);
  assert.ok(r.dica.length > 10);
});

test('a dica é a da primeira letra que falta, na ordem S, M, A, R, T', () => {
  const r = avaliaMeta({ texto: 'Aprovar projetos de lei sobre educação para a rede estadual' });
  assert.equal(r.letras.S.ok, true);
  assert.equal(r.falta, 'M');
  assert.equal(r.dica, r.letras.M.dica);
});

test('Específica pede verbo no infinitivo e ao menos 6 palavras (RUM-31.6)', () => {
  assert.equal(avaliaMeta({ texto: 'Aprovar dois projetos de lei' }).letras.S.ok, false, '5 palavras');
  assert.equal(avaliaMeta({ texto: 'Aprovar dois projetos de lei hoje' }).letras.S.ok, true, '6 palavras');
  assert.equal(avaliaMeta({ texto: 'Dois projetos de lei aprovados na Casa' }).letras.S.ok, false, 'sem verbo no início');
  assert.equal(avaliaMeta({ texto: 'Ver dois projetos de lei na Casa hoje' }).letras.S.ok, false, '"ver" é curta demais para valer como verbo');
  assert.equal(avaliaMeta({ texto: 'Valor total de dois projetos na Casa hoje' }).letras.S.ok, false, 'substantivo em "or"');
  ['Articular', 'Ampliar', 'Garantir', 'Exercer', 'Contribuir', 'Expor', 'Destravar'].forEach((v) =>
    assert.equal(avaliaMeta({ texto: `${v} a pauta da educação com a equipe` }).letras.S.ok, true, v));
});

test('Mensurável aceita número, percentual e quantidade por extenso (RUM-31.4)', () => {
  assert.equal(avaliaMeta({ texto: 'Ampliar em 15% a presença' }).letras.M.ok, true);
  assert.equal(avaliaMeta({ texto: 'Realizar 3 audiências' }).letras.M.ok, true);
  assert.equal(avaliaMeta({ texto: 'Realizar duas audiências públicas' }).letras.M.ok, true);
  assert.equal(avaliaMeta({ texto: 'Realizar TRÊS audiências públicas' }).letras.M.ok, true);
  assert.equal(avaliaMeta({ texto: 'Realizar audiências públicas na região' }).letras.M.ok, false);
});

test('Temporal aceita data, mês, "até", prazo e frequência (RUM-31.5)', () => {
  ['Realizar audiências até dezembro', 'Realizar audiências em 2027', 'Realizar audiências mensalmente', 'Realizar audiências em 90 dias',
    'Realizar audiências por mês', 'Realizar audiências por semana', 'Realizar audiências em março', 'Realizar audiências semanais', 'Realizar audiências ATÉ o fim do ano'].forEach((t) =>
    assert.equal(avaliaMeta({ texto: t }).letras.T.ok, true, t));
  ['Realizar audiências públicas na região', 'Realizar audiências sobre o estado'].forEach((t) =>
    assert.equal(avaliaMeta({ texto: t }).letras.T.ok, false, t));
});

test('Relevante só atende com objetivo vinculado; Alcançável só com confirmação (RUM-31.7, RUM-31.8)', () => {
  const texto = 'Aprovar 2 projetos de lei sobre educação até dezembro de 2027';
  assert.equal(avaliaMeta({ texto }).letras.R.ok, false);
  assert.equal(avaliaMeta({ texto, pred: '' }).letras.R.ok, false);
  assert.equal(avaliaMeta({ texto, pred: 'p2' }).letras.R.ok, true);
  assert.equal(avaliaMeta({ texto, pred: 'p2' }).letras.A.ok, false);
  assert.equal(avaliaMeta({ texto, pred: 'p2', alcancavel: false }).letras.A.ok, false);
  assert.equal(avaliaMeta({ texto, alcancavel: true }).letras.A.ok, true);
  assert.equal(avaliaMeta({ texto, alcancavel: true }).letras.R.ok, false);
});

test('"Enviar e-mail semanal aos assessores" dispara "Meta não é tarefa diária" (RUM-31.9)', () => {
  const r = avaliaMeta({ texto: 'Enviar e-mail semanal aos assessores' });
  assert.deepEqual(r.alertas, ['Meta não é tarefa diária']);
  assert.equal(ALERTA_ROTINA, 'Meta não é tarefa diária');
  ['Fazer reunião semanal com a equipe', 'Responder todas as mensagens do gabinete', 'Postar nas redes sociais todo dia'].forEach((t) =>
    assert.deepEqual(avaliaMeta({ texto: t }).alertas, [ALERTA_ROTINA], t));
});

test('texto sem padrão de rotina não dispara o alerta (RUM-31.9)', () => {
  [FORMULA_META.exemplo, 'Aprovar 2 projetos de lei sobre educação até dezembro de 2027', 'Realizar um discurso quinzenal em plenário reforçando a fiscalização', 'Ampliar os atendimentos de saúde no interior em 20%'].forEach((t) =>
    assert.deepEqual(avaliaMeta({ texto: t }).alertas, [], t));
});

test('texto vazio ou só espaços: nenhuma letra, 0 pontos, sem exceção (edge case)', () => {
  for (const texto of ['', '   ', '\n\t ']) {
    const r = avaliaMeta({ texto, pred: 'p1', alcancavel: true });
    assert.equal(ok(r), '');
    assert.equal(r.pontos, 0);
    assert.deepEqual(r.alertas, []);
    assert.equal(r.falta, 'S');
  }
  assert.equal(avaliaMeta({ texto: undefined as unknown as string }).pontos, 0);
});

test('pontos é a contagem de letras atendidas e HTML digitado é só texto', () => {
  const r = avaliaMeta({ texto: '<script>alert(1)</script> Aprovar 2 projetos até dezembro', pred: 'p1' });
  assert.equal(r.pontos, LETRAS.filter((l) => r.letras[l].ok).length);
  assert.equal(avaliaMeta({ texto: '<b>x</b>' }).pontos, 0);
});
