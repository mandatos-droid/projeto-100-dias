import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/* RM3-44: "objetivo específico" não pode sobrar em arquivo de UI ou lib. Só conteudo.js e guia.js (legados,
   cobertos pelo override de m3.js) e os arquivos ainda não refeitos ficam de fora. */
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PASTAS = ['app', 'ilhas', 'lib', 'public/legacy'];
const EXTENSOES = /\.(ts|tsx|js|mjs)$/;
const TERMO_ANTIGO = /objetivos?\s+espec[ií]fic/i;

/** Arquivos fora da varredura. Lista vazia de pendências: todos os ignorados são legados cobertos pelo override. */
const IGNORADOS: Record<string, string> = {
  'public/legacy/conteudo.js': 'legado extraído, coberto pelo override de m3.js (AD-003)',
  'public/legacy/guia.js': 'legado extraído, coberto pelo override de m3.js (AD-003)',
};

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : EXTENSOES.test(nome) ? [caminho] : [];
  });
}

function infratores(lista: { caminho: string; texto: string }[]): string[] {
  return lista.filter((a) => !(a.caminho in IGNORADOS) && TERMO_ANTIGO.test(a.texto)).map((a) => a.caminho);
}

test('a varredura reconhece o termo antigo em qualquer caixa e plural, e ignora o termo novo (RM3-44)', () => {
  const lista = [
    { caminho: 'a.tsx', texto: 'Objetivo específico da meta' },
    { caminho: 'b.ts', texto: 'os OBJETIVOS ESPECÍFICOS' },
    { caminho: 'c.tsx', texto: 'um objetivo estratégico' },
    { caminho: 'public/legacy/conteudo.js', texto: 'objetivo específico' },
  ];
  assert.deepEqual(infratores(lista), ['a.tsx', 'b.ts']);
});

test('nenhum arquivo de UI ou lib fora da lista de ignorados contém "objetivo específico" (RM3-44)', () => {
  const lista = PASTAS.flatMap((p) => arquivos(join(RAIZ, p))).map((c) => ({
    caminho: relative(RAIZ, c).replaceAll('\\', '/'),
    texto: readFileSync(c, 'utf8'),
  }));
  assert.ok(lista.length > 50, 'a varredura precisa enxergar os arquivos do produto');
  assert.deepEqual(infratores(lista), []);
});

test('os arquivos ignorados existem, para a lista não apodrecer (RM3-44)', () => {
  for (const c of Object.keys(IGNORADOS)) assert.ok(statSync(join(RAIZ, c)).isFile(), c);
});
