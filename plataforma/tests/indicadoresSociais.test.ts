import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linhasDaAgenda, filtraFaixa, emSlides } from '../lib/indicadoresSociais.ts';
import type { Agenda, Catalogo, DadosIndicador, IndInfo } from '../lib/agendas.ts';

const cat: Catalogo = {
  fonte: 'f', url: 'u',
  ods: [{ n: 3, rot: 'Saúde e bem-estar' }, { n: 4, rot: 'Educação de qualidade' }, { n: 8, rot: 'Trabalho' }],
  indicadores: [
    { id: 'S3_A', ods: 3, nome: 'Mortalidade infantil', fonte: '', ano: null, sentido: '' },
    { id: 'S3_B', ods: 3, nome: 'Cobertura vacinal', fonte: '', ano: null, sentido: '' },
    { id: 'S3_SEM', ods: 3, nome: 'Sem dado na UF', fonte: '', ano: null, sentido: '' },
    { id: 'S4_A', ods: 4, nome: 'Evasão escolar', fonte: '', ano: null, sentido: '' },
    { id: 'S8_JV', ods: 8, nome: 'Jovens sem ocupação', fonte: '', ano: null, sentido: '' },
  ],
};
const dados: Record<string, DadosIndicador | null> = {
  'ods-3': { uf: { ES: 61.5, GO: 10 } },
  S3_A: { uf: { ES: 72, GO: 1 } },
  S3_B: { uf: { ES: 39.9 } },
  S3_SEM: { uf: { GO: 50 } },
  S4_A: { uf: { ES: 55 } },
  S8_JV: { uf: { ES: 80 } },
  'ods-4': null,
};
const saude: Agenda = { id: 'saude', rot: 'Saúde', cor: '#000', ods: [3] };

test('linhasDaAgenda usa a nota da UF, põe a nota do ODS e os indicadores, e omite quem não tem dado (SOC-03, SOC-04)', () => {
  const r = linhasDaAgenda(saude, cat, dados, 'ES');
  assert.deepEqual(r, [
    { indicador: 'Nota geral do ODS 3', ods: 3, odsRot: 'Saúde e bem-estar', nota: 61.5 },
    { indicador: 'Mortalidade infantil', ods: 3, odsRot: 'Saúde e bem-estar', nota: 72 },
    { indicador: 'Cobertura vacinal', ods: 3, odsRot: 'Saúde e bem-estar', nota: 39.9 },
  ]);
});

test('outra UF lê a nota daquela UF e o indicador que só ela tem aparece (SOC-03)', () => {
  const r = linhasDaAgenda(saude, cat, dados, 'GO');
  assert.deepEqual(r.map((l) => [l.indicador, l.nota]),
    [['Nota geral do ODS 3', 10], ['Mortalidade infantil', 1], ['Sem dado na UF', 50]]);
});

test('indicadores avulsos (extras) entram na agenda; arquivo nulo é omitido (SOC-03)', () => {
  const juv: Agenda = { id: 'juventude', rot: 'Juventude', cor: '#000', ods: [], extras: ['S8_JV', 'NAO_EXISTE'] };
  assert.deepEqual(linhasDaAgenda(juv, cat, dados, 'ES'),
    [{ indicador: 'Jovens sem ocupação', ods: 8, odsRot: 'Trabalho', nota: 80 }]);
  const edu: Agenda = { id: 'educacao', rot: 'Educação', cor: '#000', ods: [4] };
  assert.deepEqual(linhasDaAgenda(edu, cat, dados, 'ES').map((l) => l.indicador), ['Evasão escolar']);
});

test('filtraFaixa respeita os limites 39,9 / 40 / 59,9 / 60 / 80 (SOC-05)', () => {
  const l = (nota: number) => ({ indicador: String(nota), ods: 1, odsRot: '', nota });
  const todas = [l(39.9), l(40), l(59.9), l(60), l(80)];
  const rot = (f: string) => filtraFaixa(todas, f).map((x) => x.nota);
  assert.deepEqual(rot('Muito baixo'), [39.9]);
  assert.deepEqual(rot('Baixo'), [40]);
  assert.deepEqual(rot('Médio'), [59.9]);
  assert.deepEqual(rot('Alto'), [60]);
  assert.deepEqual(rot('Muito alto'), [80]);
});

test('filtraFaixa "todas" devolve tudo; faixa sem nota devolve vazio (SOC-05)', () => {
  const ls = [{ indicador: 'a', ods: 1, odsRot: '', nota: 45 }];
  assert.deepEqual(filtraFaixa(ls, 'todas'), ls);
  assert.deepEqual(filtraFaixa(ls, 'Alto'), []);
});

test('emSlides divide em grupos de 4 e o último pode ser menor (SOC-06)', () => {
  const itens = Array.from({ length: 13 }, (_, i) => i);
  const s = emSlides(itens);
  assert.deepEqual(s.map((g) => g.length), [4, 4, 4, 1]);
  assert.deepEqual(s[3], [12]);
  assert.deepEqual(emSlides([]), []);
  assert.deepEqual(emSlides([1, 2, 3], 2), [[1, 2], [3]]);
});

/* OP-02: selos de faixa com fundo preenchido e contraste mínimo de 4,5:1. A razão é calculada aqui, direto da fórmula WCAG,
   sem usar as funções da lib para a conta. */
import { FAIXAS, razaoContraste, textoSobre } from '../lib/agendas.ts';
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const wcag = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('cada faixa tem fundo próprio e texto com contraste de pelo menos 4,5:1 (OP-02)', () => {
  assert.equal(new Set(FAIXAS.map((f) => f.cor)).size, FAIXAS.length);
  for (const f of FAIXAS) {
    const texto = textoSobre(f.cor);
    assert.ok(wcag(f.cor, texto) >= 4.5, `${f.rot}: ${f.cor} com ${texto} dá ${wcag(f.cor, texto).toFixed(2)}`);
  }
});

test('razaoContraste confere com valores conhecidos do WCAG', () => {
  assert.ok(Math.abs(razaoContraste('#000000', '#FFFFFF') - 21) < 0.01);
  assert.ok(Math.abs(razaoContraste('#777777', '#FFFFFF') - 4.48) < 0.02);
  assert.equal(razaoContraste('#336699', '#336699'), 1);
});

test('textoSobre escolhe texto claro em fundo escuro e escuro em fundo claro', () => {
  assert.equal(textoSobre('#000000'), '#FFFFFF');
  assert.equal(textoSobre('#FFFFFF'), '#1A1A1A');
});

/* OP-04: texto do tooltip do ⓘ */
import { descreveIndicador } from '../lib/indicadoresSociais.ts';
const ind = (o: Partial<IndInfo> = {}): IndInfo => ({ id: 'X', ods: 4, nome: 'IDEB', fonte: 'MEC/IDEB', ano: '2023', sentido: 'mais é melhor', ...o });

test('descreveIndicador traz fonte, ano e sentido quando todos existem', () => {
  assert.equal(descreveIndicador(ind()), 'Fonte: MEC/IDEB · Ano: 2023 · Sentido: mais é melhor');
  assert.equal(descreveIndicador(ind({ sentido: 'menos é melhor' })), 'Fonte: MEC/IDEB · Ano: 2023 · Sentido: menos é melhor');
});

test('descreveIndicador omite o ano ausente, a fonte ausente e o sentido desconhecido', () => {
  assert.equal(descreveIndicador(ind({ ano: null })), 'Fonte: MEC/IDEB · Sentido: mais é melhor');
  assert.equal(descreveIndicador(ind({ fonte: '' })), 'Ano: 2023 · Sentido: mais é melhor');
  assert.equal(descreveIndicador(ind({ sentido: 'tanto faz' })), 'Fonte: MEC/IDEB · Ano: 2023');
  assert.equal(descreveIndicador(ind({ sentido: 'Mais é Melhor' })), 'Fonte: MEC/IDEB · Ano: 2023 · Sentido: mais é melhor');
});

test('descreveIndicador nunca devolve undefined, null nem texto vazio', () => {
  const casos = [
    ind({ fonte: '', ano: null, sentido: '' }),
    ind({ fonte: undefined as unknown as string, ano: undefined as unknown as null, sentido: undefined as unknown as string }),
    ind({ fonte: null as unknown as string, ano: null, sentido: null as unknown as string }),
    ind({ fonte: 'undefined', ano: 'null', sentido: 'null' }),
    ind({ fonte: '   ', ano: '  ', sentido: '  ' }),
  ];
  for (const c of casos) {
    const t = descreveIndicador(c);
    assert.ok(t.length > 0);
    assert.doesNotMatch(t, /undefined|null/i);
  }
  assert.equal(descreveIndicador(casos[0]), 'Sem informações adicionais sobre este indicador.');
});
