import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paraEstrategico } from '../lib/termos.ts';

test('"Objetivo específico" vira "Objetivo estratégico" (RM3-41)', () => {
  assert.equal(paraEstrategico('Objetivo específico'), 'Objetivo estratégico');
  assert.equal(paraEstrategico('o objetivo específico do mandato'), 'o objetivo estratégico do mandato');
});

test('o plural "objetivos específicos" vira "objetivos estratégicos" (RM3-41)', () => {
  assert.equal(paraEstrategico('os objetivos específicos'), 'os objetivos estratégicos');
});

test('"OBJETIVO ESPECÍFICO" vira "OBJETIVO ESTRATÉGICO" (RM3-41)', () => {
  assert.equal(paraEstrategico('OBJETIVO ESPECÍFICO'), 'OBJETIVO ESTRATÉGICO');
  assert.equal(paraEstrategico('OBJETIVOS ESPECÍFICOS'), 'OBJETIVOS ESTRATÉGICOS');
});

test('iniciais maiúsculas: "Objetivos Específicos" vira "Objetivos Estratégicos"', () => {
  assert.equal(paraEstrategico('Objetivos Específicos'), 'Objetivos Estratégicos');
});

test('a forma "específica" também vira "estratégico" (objetivo é masculino)', () => {
  assert.equal(paraEstrategico('objetivo específica'), 'objetivo estratégico');
  assert.equal(paraEstrategico('objetivos específicas'), 'objetivos estratégicos');
});

test('texto sem o termo volta idêntico, byte a byte (RM3-41)', () => {
  const t = 'Meta específica do preditor, objetivo geral e específico.\n  Espaços   e acentos: ção, é.';
  assert.equal(paraEstrategico(t), t);
  assert.equal(paraEstrategico(''), '');
});

test('o termo no meio de uma frase longa troca só o termo', () => {
  assert.equal(
    paraEstrategico('Cada meta serve a um objetivo específico; veja os Objetivos Específicos acima.'),
    'Cada meta serve a um objetivo estratégico; veja os Objetivos Estratégicos acima.',
  );
});

test('HTML (tags e entidades) passa intacto', () => {
  const html = '<p class="a&amp;b">Tom &amp; <b>negrito</b> &nbsp;&eacute; sem termo</p>';
  assert.equal(paraEstrategico(html), html);
  assert.equal(
    paraEstrategico('<p class="x">objetivos específicos &amp; metas</p>'),
    '<p class="x">objetivos estratégicos &amp; metas</p>',
  );
});
