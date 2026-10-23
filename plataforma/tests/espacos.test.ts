import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS_ESPACO, PAPEIS, TEMAS_POR_BANDEIRA, sugestoes, alerta, faltaBandeira1, ALERTA_ESPACO } from '../lib/espacos.ts';
import { BANDEIRAS } from '../lib/bandeiras.ts';

const catalogo = { gerado: '2026-10-01T00:00:00Z', fonte: 'https://dadosabertos.camara.leg.br', comissoes: [
  { nome: 'Comissão de Agricultura, Pecuária, Abastecimento e Desenvolvimento Rural', sigla: 'CAPADR' },
  { nome: 'Comissão de Educação', sigla: 'CE' },
  { nome: 'Comissão de Saúde', sigla: 'CSAUDE' },
  { nome: 'Comissão de Finanças e Tributação', sigla: 'CFT' },
] };

test('TEMAS_POR_BANDEIRA tem entrada com nomes genéricos para as 19 bandeiras (RUM-50.4)', () => {
  assert.equal(BANDEIRAS.length, 19);
  BANDEIRAS.forEach((b) => {
    const nomes = TEMAS_POR_BANDEIRA[b.id];
    assert.ok(Array.isArray(nomes) && nomes.length >= 1, b.id);
    assert.ok(nomes.every((n) => n.trim() !== ''), b.id);
  });
});

test('papéis e tipos de espaço cobrem o que a spec lista (RUM-50.1, RUM-50.6)', () => {
  assert.deepEqual(PAPEIS, ['Titular', 'Suplente', 'Presidência', 'Vice-presidência', 'Relatoria', 'Outro']);
  const rots = TIPOS_ESPACO.map((t) => t.rot.toLowerCase()).join('|');
  ['titular', 'suplente', 'presidência', 'relatoria', 'mesa diretora', 'liderança', 'frente parlamentar', 'cpi', 'conselho'].forEach((k) => assert.match(rots, new RegExp(k)));
  const cpmi = TIPOS_ESPACO.find((t) => /cpmi/i.test(t.rot))!;
  assert.ok(cpmi.casas.includes('federal') && !cpmi.casas.includes('municipal'), 'CPMI é do Congresso');
  assert.ok(TIPOS_ESPACO.every((t) => t.casas.length > 0));
});

test('Federal com catálogo: devolve as comissões do catálogo, com as da bandeira prioritária destacadas (RUM-50.2, RUM-50.5)', () => {
  const s = sugestoes({ cargo: 'Deputado(a) Federal', uf: 'SP', bandeiras: ['educacao'] }, catalogo);
  assert.equal(s.length, 4, 'todas as comissões do catálogo');
  assert.ok(s.every((x) => x.origem === 'catalogo'));
  assert.deepEqual(s.filter((x) => x.destacada).map((x) => x.nome), ['Comissão de Educação']);
  assert.equal(s[0].nome, 'Comissão de Educação', 'destacadas primeiro');
  assert.equal(s[0].sigla, 'CE');
  assert.equal(s[0].bandeira, 'educacao');
  assert.equal(s.find((x) => x.sigla === 'CFT')!.bandeira, undefined, 'comissão sem tema de bandeira não ganha etiqueta');
});

test('com duas bandeiras prioritárias, as comissões de ambas são destacadas (RUM-50.5)', () => {
  const s = sugestoes({ cargo: 'Deputado(a) Federal', uf: 'SP', bandeiras: ['saude', 'agricultura'] }, catalogo);
  assert.deepEqual(s.filter((x) => x.destacada).map((x) => x.sigla).sort(), ['CAPADR', 'CSAUDE']);
});

test('Estadual sem catálogo: nomes genéricos por bandeira prioritária (RUM-50.4)', () => {
  const s = sugestoes({ cargo: 'Deputado(a) Estadual', uf: 'MG', bandeiras: ['educacao', 'saude'] });
  assert.ok(s.length >= 2);
  assert.ok(s.every((x) => x.origem === 'generica' && x.destacada));
  assert.ok(s.some((x) => x.nome === TEMAS_POR_BANDEIRA.educacao[0] && x.bandeira === 'educacao'));
  assert.ok(s.some((x) => x.bandeira === 'saude'));
  assert.equal(new Set(s.map((x) => x.nome)).size, s.length, 'sem repetição');
});

test('Estadual com catálogo da UF usa o dele (RUM-50.3)', () => {
  const uf = { gerado: '2026-10-01', fonte: 'curadoria', comissoes: [{ nome: 'Comissão de Educação, Cultura, Desporto e Turismo', sigla: 'CECDT' }] };
  const s = sugestoes({ cargo: 'Deputado(a) Estadual', uf: 'MG', bandeiras: ['educacao'] }, uf);
  assert.deepEqual(s.map((x) => [x.nome, x.origem, x.destacada]), [['Comissão de Educação, Cultura, Desporto e Turismo', 'catalogo', true]]);
});

test('catálogo vazio ou inválido cai no modo genérico (RUM-50.4)', () => {
  const g = sugestoes({ cargo: 'Deputado(a) Estadual', uf: 'MG', bandeiras: ['educacao'] });
  assert.deepEqual(sugestoes({ cargo: 'Deputado(a) Estadual', uf: 'MG', bandeiras: ['educacao'] }, { gerado: '', fonte: '', comissoes: [] }), g);
  assert.deepEqual(sugestoes({ cargo: 'Deputado(a) Estadual', uf: 'MG', bandeiras: ['educacao'] }, null), g);
  assert.deepEqual(sugestoes({ cargo: 'Deputado(a) Estadual', uf: 'MG', bandeiras: ['educacao'] }, {} as never), g);
});

test('sem bandeira prioritária e sem catálogo, não há sugestão genérica (campo livre segue disponível)', () => {
  assert.deepEqual(sugestoes({ cargo: 'Senador(a)', uf: 'SP', bandeiras: [] }), []);
});

test('bandeira que não é da taxonomia (outra) não quebra a sugestão', () => {
  assert.deepEqual(sugestoes({ cargo: 'Senador(a)', uf: 'SP', bandeiras: ['x-mobilidade-urbana'] }), []);
});

test('alerta: texto exato quando a bandeira do espaço não está entre as prioritárias, null quando está (RUM-51.7)', () => {
  assert.equal(ALERTA_ESPACO, 'Este espaço não conversa com as bandeiras prioritárias');
  assert.equal(alerta({ comissao: 'Comissão de Esportes', bandeira: 'Esportes' }, ['educacao', 'saude']), ALERTA_ESPACO);
  assert.equal(alerta({ comissao: 'Comissão de Educação', bandeira: 'Educação' }, ['educacao', 'saude']), null);
  assert.equal(alerta({ comissao: 'X', bandeira: 'educação' }, ['Educação']), null, 'aceita rótulo no lugar do id');
});

test('alerta infere a bandeira pelo nome da comissão quando o campo bandeira está vazio (RUM-51.7)', () => {
  assert.equal(alerta({ comissao: 'Comissão de Saúde' }, ['saude']), null);
  assert.equal(alerta({ comissao: 'Comissão de Saúde' }, ['educacao']), ALERTA_ESPACO);
  assert.equal(alerta({ comissao: 'Frente Parlamentar da Primeira Infância' }, ['educacao']), ALERTA_ESPACO, 'sem tema reconhecido, não conversa');
});

test('alerta compara bandeira livre ("outra") pelo texto e não reclama sem prioritárias (RUM-51.7)', () => {
  assert.equal(alerta({ comissao: 'Comissão de Mobilidade', bandeira: 'Mobilidade urbana' }, ['Mobilidade Urbana']), null);
  assert.equal(alerta({ comissao: 'X', bandeira: 'Educação' }, []), null);
});

test('faltaBandeira1 é verdadeiro enquanto nenhum espaço aponta a prioritária 1 (RUM-51.8)', () => {
  const pri = ['educacao', 'saude'];
  assert.equal(faltaBandeira1([], pri), true);
  assert.equal(faltaBandeira1([{ comissao: 'Comissão de Saúde', bandeira: 'Saúde' }], pri), true, 'só a 2ª tem espaço');
  assert.equal(faltaBandeira1([{ comissao: 'Comissão de Educação', bandeira: 'Educação' }], pri), false);
  assert.equal(faltaBandeira1([{ comissao: 'Comissão de Educação' }], pri), false, 'inferida pelo nome');
});

test('faltaBandeira1 é falso sem prioritárias: não há o que cobrar ainda (RUM-51.8)', () => {
  assert.equal(faltaBandeira1([], []), false);
});

test('registros antigos de comissoesDesejadas, sem papel e com campos faltando, não quebram (RUM-51.9)', () => {
  const antigos = [{ comissao: 'Comissão de Educação', cargo: 'titular', bandeira: 'Educação' }, {}, { comissao: 7 }] as never[];
  assert.equal(faltaBandeira1(antigos, ['educacao']), false);
  assert.equal(alerta(antigos[1], ['educacao']), ALERTA_ESPACO);
  assert.equal(alerta(antigos[2], ['educacao']), ALERTA_ESPACO);
});
