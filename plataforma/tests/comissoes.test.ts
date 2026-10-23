import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../public/data/comissoes/', import.meta.url);
const arquivos = readdirSync(DIR).filter((f) => f.endsWith('.json'));
const le = (f: string) => JSON.parse(readFileSync(new URL(f, DIR), 'utf8'));

test('existe o catálogo da Câmara dos Deputados, br.json (RUM-50.2)', () => {
  assert.ok(arquivos.includes('br.json'));
});

test('todo arquivo de comissões segue { gerado, fonte, comissoes: [{ nome, sigla }] } (RUM-50.3)', () => {
  arquivos.forEach((f) => {
    const j = le(f);
    assert.ok(!Number.isNaN(Date.parse(j.gerado)), `${f}: gerado é uma data ISO`);
    assert.match(j.fonte, /^https:\/\//, `${f}: fonte é uma URL`);
    assert.ok(Array.isArray(j.comissoes), f);
    j.comissoes.forEach((c: Record<string, unknown>) => {
      assert.equal(typeof c.nome, 'string');
      assert.ok((c.nome as string).trim() !== '');
      assert.equal(typeof c.sigla, 'string');
      assert.deepEqual(Object.keys(c).sort(), ['nome', 'sigla'], `${f}: só nome e sigla`);
    });
  });
});

test('br.json tem ao menos 20 comissões permanentes, sem repetição (RUM-50.2)', () => {
  const { comissoes } = le('br.json');
  assert.ok(comissoes.length >= 20, `só ${comissoes.length}`);
  assert.equal(new Set(comissoes.map((c: { sigla: string }) => c.sigla)).size, comissoes.length);
  const nomes = comissoes.map((c: { nome: string }) => c.nome);
  assert.ok(nomes.includes('Comissão de Educação'));
  assert.ok(nomes.includes('Comissão de Saúde'));
  assert.ok(nomes.every((n: string) => !n.includes('�')), 'acentos íntegros');
});

test('o catálogo não traz nome de pessoa, CPF nem contato (privacidade)', () => {
  arquivos.forEach((f) => {
    const bruto = readFileSync(new URL(f, DIR), 'utf8');
    assert.doesNotMatch(bruto, /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/, `${f}: CPF`);
    assert.doesNotMatch(bruto, /@|telefone|email|presidente"|deputado"/i, `${f}: contato ou pessoa`);
  });
});

test('o script de geração documenta a URL consultada e falha sem gravar quando a fonte vem vazia', () => {
  const py = readFileSync(new URL('../scripts/build_comissoes.py', import.meta.url), 'utf8');
  assert.match(py, /dadosabertos\.camara\.leg\.br\/api\/v2\/orgaos/);
  assert.match(py, /codTipoOrgao=2/);
  assert.match(py, /sys\.exit/);
});
