import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOTAO_MONIT, FEEDBACK_ORIENTACAO, MONIT_INTRO, MONIT_PERGUNTAS, MONIT_ROTULO } from '../ilhas/rumo/textosAlana.ts';

/* Textos das sugestões #128 a #131 da Alana (spec missao5-monitoramento-alana: MON-01, FBK-01, Q7, Q9). */
test('#129: a introdução do monitoramento diz que o percentual é do todo, e não do mês', () => {
  assert.ok(MONIT_INTRO.join(' ').includes('o percentual corresponde ao todo, e não ao mês'));
});

test('#128: o rótulo da caixa e as duas perguntas são os da Alana', () => {
  assert.equal(MONIT_ROTULO, 'Registre o detalhamento de como esta Meta caminhou ao longo deste mês.');
  assert.equal(MONIT_PERGUNTAS.length, 2);
  assert.match(MONIT_PERGUNTAS[0], /O que deu certo e o que deu errado/);
  assert.match(MONIT_PERGUNTAS[1], /novas oportunidades políticas/);
});

test('#131: o botão do Planejamento tem o texto pedido', () => {
  assert.equal(BOTAO_MONIT, 'Registrar detalhes sobre o atingimento das metas no Monitoramento');
});

test('#130: a orientação usa as palavras da Alana e não leva a anotação interna (Q7, Q9)', () => {
  const t = FEEDBACK_ORIENTACAO.join(' ');
  assert.ok(t.includes('Chefia de Gabinete'));
  assert.ok(t.includes('liderança parlamentar'));
  assert.ok(!t.includes('Pedro Salvar'));
});
