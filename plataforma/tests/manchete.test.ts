import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargosPostulaveis, compoe, MODELOS, aplicaModelo, mencionaCargo, avisos, dataEdicao, AVISO_SEM_CARGO, AVISO_LONGA } from '../lib/manchete.ts';

test('cargosPostulaveis de Deputado(a) Estadual, com a reeleição primeiro (RUM-11.2)', () => {
  assert.deepEqual(cargosPostulaveis('Deputado(a) Estadual'), [
    'Reeleição a Deputado(a) Estadual', 'Deputado(a) Federal', 'Senador(a)', 'Vice-governador(a)', 'Governador(a)', 'Prefeito(a)', 'Outro',
  ]);
});

test('cargosPostulaveis das demais Casas segue a tabela do design (RUM-11.2)', () => {
  assert.deepEqual(cargosPostulaveis('Deputado(a) Federal'), ['Reeleição a Deputado(a) Federal', 'Senador(a)', 'Vice-governador(a)', 'Governador(a)', 'Prefeito(a)', 'Outro']);
  assert.deepEqual(cargosPostulaveis('Senador(a)'), ['Reeleição ao Senado', 'Governador(a)', 'Vice-presidente', 'Presidente', 'Outro']);
  assert.deepEqual(cargosPostulaveis('Vereador(a)'), ['Reeleição a Vereador(a)', 'Prefeito(a)', 'Vice-prefeito(a)', 'Deputado(a) Estadual', 'Deputado(a) Federal', 'Outro']);
});

test('cargosPostulaveis reconhece o cargo sem depender de acento, caixa ou gênero', () => {
  assert.equal(cargosPostulaveis('deputada estadual')[0], 'Reeleição a Deputado(a) Estadual');
  assert.equal(cargosPostulaveis('  DEPUTADO FEDERAL ')[0], 'Reeleição a Deputado(a) Federal');
});

test('cargo vazio ou desconhecido devolve a lista completa, terminando em Outro (edge case)', () => {
  const completa = cargosPostulaveis('');
  assert.ok(completa.length >= 10);
  assert.equal(completa[completa.length - 1], 'Outro');
  ['Deputado(a) Estadual', 'Deputado(a) Federal', 'Senador(a)', 'Governador(a)', 'Presidente', 'Prefeito(a)', 'Vereador(a)'].forEach((c) => assert.ok(completa.includes(c), c));
  assert.deepEqual(cargosPostulaveis('Cargo inventado'), completa);
  assert.ok(!completa.some((c) => c.startsWith('Reeleição')), 'sem cargo atual não há reeleição');
});

test('compoe inclui nome, entrega, resultado e o cargo na frase (RUM-10.3)', () => {
  const t = compoe({ protagonista: '', entrega: 'colocou a Educação no centro do debate', resultado: 'zerou a evasão escolar', cargo: 'Governador(a)' }, { nome: 'Joaquim José', bandeiras: [] });
  assert.match(t, /Joaquim José/);
  assert.match(t, /colocou a Educação no centro do debate/);
  assert.match(t, /zerou a evasão escolar/);
  assert.match(t, /Governador\(a\)/);
});

test('o protagonista digitado vale mais que o nome do mandato (RUM-10.3)', () => {
  const t = compoe({ protagonista: 'A bancada', entrega: 'a', resultado: 'b', cargo: '' }, { nome: 'Joaquim José', bandeiras: [] });
  assert.match(t, /A bancada/);
  assert.doesNotMatch(t, /Joaquim/);
});

test('compoe com elementos vazios não deixa "undefined", espaços duplos nem pontuação solta (RUM-10.3)', () => {
  const casos = [
    compoe({ protagonista: '', entrega: '', resultado: '', cargo: '' }, { nome: '', bandeiras: [] }),
    compoe({ protagonista: '', entrega: 'fez algo', resultado: '', cargo: '' }, { nome: 'Ana', bandeiras: [] }),
    compoe({ protagonista: '  ', entrega: '  fez   algo ', resultado: '', cargo: 'Senador(a)' }, { nome: '', bandeiras: [] }),
    compoe({ protagonista: '', entrega: '', resultado: 'venceu', cargo: 'Reeleição ao Senado' }, { nome: 'Ana', bandeiras: [] }),
  ];
  casos.forEach((t) => {
    assert.doesNotMatch(t, /undefined|null/);
    assert.doesNotMatch(t, /\s{2,}/);
    assert.doesNotMatch(t, /(^|\s)[,;:]|[,;:]\s*$|:\s*[,;]|,\s*,/);
    assert.equal(t, t.trim());
  });
  assert.equal(casos[0], '');
  assert.match(casos[1], /Ana/);
  assert.match(casos[2], /fez algo/);
});

test('compoe usa o texto de "Outro" quando o cargo é Outro (RUM-10.3)', () => {
  const t = compoe({ protagonista: 'Ana', entrega: 'fez', resultado: 'venceu', cargo: 'Outro', cargoOutro: 'Ministra da Educação' }, { nome: '', bandeiras: [] });
  assert.match(t, /Ministra da Educação/);
  assert.doesNotMatch(t, /Outro/);
});

test('mencionaCargo reconhece Governo do Estado, Governador(a) e Senado, sem acento nem caixa (RUM-11.7)', () => {
  assert.equal(mencionaCargo('Ana vai ao GOVERNO DO ESTADO depois de provar', 'Governador(a)'), true);
  assert.equal(mencionaCargo('A governadora do futuro', 'Governador(a)'), true);
  assert.equal(mencionaCargo('Da Câmara ao senado, Simone', 'Senador(a)'), true);
  assert.equal(mencionaCargo('Chega ao Senado a mais jovem', 'Reeleição ao Senado'), true);
  assert.equal(mencionaCargo('Ana se reelege como a mais votada', 'Reeleição a Deputado(a) Estadual'), true);
  assert.equal(mencionaCargo('Ana é a mais votada de Jiripoca', 'Governador(a)'), false);
  assert.equal(mencionaCargo('Ana é a mais votada de Jiripoca', 'Senador(a)'), false);
});

test('mencionaCargo cobre os demais cargos da tabela e o texto livre de Outro (RUM-11.7)', () => {
  assert.equal(mencionaCargo('Candidata à Prefeitura da capital', 'Prefeito(a)'), true);
  assert.equal(mencionaCargo('Rumo à Presidência da República', 'Presidente'), true);
  assert.equal(mencionaCargo('Na Câmara dos Deputados com mais votos', 'Deputado(a) Federal'), true);
  assert.equal(mencionaCargo('Chega à Assembleia Legislativa', 'Deputado(a) Estadual'), true);
  assert.equal(mencionaCargo('Ministra da Educação do país', 'Ministra da Educação'), true);
});

test('avisos: cargo ausente na manchete e manchete longa demais (RUM-11.7, edge case)', () => {
  assert.deepEqual(avisos('Ana é a mais votada', 'Governador(a)'), [AVISO_SEM_CARGO]);
  assert.equal(AVISO_SEM_CARGO, 'A manchete ainda não diz o cargo postulado');
  assert.deepEqual(avisos('Ana vai ao Governo do Estado', 'Governador(a)'), []);
  const longa = 'Ana '.repeat(71) + 'Governador(a)';
  assert.ok(longa.length > 280);
  assert.deepEqual(avisos(longa, 'Governador(a)'), [AVISO_LONGA]);
  assert.equal(AVISO_LONGA, 'Manchetes curtas funcionam melhor');
  assert.deepEqual(avisos('x'.repeat(281), 'Governador(a)'), [AVISO_SEM_CARGO, AVISO_LONGA]);
  assert.deepEqual(avisos('x'.repeat(280), ''), []);
});

test('avisos não reclama de cargo enquanto não há cargo escolhido nem manchete', () => {
  assert.deepEqual(avisos('Ana é a mais votada', ''), []);
  assert.deepEqual(avisos('', 'Governador(a)'), []);
});

test('aplicaModelo devolve os 4 modelos pré-preenchidos com nome e bandeiras, todos "sugestão" (RUM-52.1, RUM-52.2)', () => {
  assert.equal(MODELOS.length, 4);
  assert.deepEqual(MODELOS.map((m) => m.id).sort(), ['camara-senado', 'entrega', 'outro-cargo', 'reeleicao']);
  const ctx = { nome: 'Marta Silva', bandeiras: ['Educação', 'Saúde'], cargoAtual: 'Deputado(a) Estadual' };
  MODELOS.forEach((m) => {
    assert.equal(m.sugestao, true, m.id);
    const el = aplicaModelo(m, ctx);
    assert.equal(el.protagonista, 'Marta Silva', m.id);
    assert.match(el.entrega.toLowerCase(), /educação/, m.id);
    assert.ok(el.resultado.trim() !== '', m.id);
    assert.doesNotMatch(Object.values(el).join(' '), /undefined|\{/);
  });
});

test('o modelo de reeleição já escolhe a reeleição do cargo atual (RUM-52.2)', () => {
  const m = MODELOS.find((x) => x.id === 'reeleicao')!;
  assert.equal(aplicaModelo(m, { nome: 'Ana', bandeiras: ['Saúde'], cargoAtual: 'Deputado(a) Estadual' }).cargo, 'Reeleição a Deputado(a) Estadual');
  assert.equal(aplicaModelo(m, { nome: 'Ana', bandeiras: ['Saúde'], cargoAtual: '' }).cargo, '', 'sem cargo atual, a lacuna fica aberta');
  assert.equal(aplicaModelo(MODELOS.find((x) => x.id === 'camara-senado')!, { nome: 'Ana', bandeiras: [] }).cargo, 'Senador(a)');
  assert.equal(aplicaModelo(MODELOS.find((x) => x.id === 'outro-cargo')!, { nome: 'Ana', bandeiras: [] }).cargo, 'Governador(a)');
});

test('modelo sem bandeiras prioritárias não deixa lacuna crua no texto (RUM-52.2)', () => {
  MODELOS.forEach((m) => {
    const el = aplicaModelo(m, { nome: 'Ana', bandeiras: [] });
    assert.doesNotMatch(Object.values(el).join(' '), /undefined|\{|\}/, m.id);
    assert.ok(el.entrega.trim() !== '', m.id);
  });
});

test('dataEdicao: dezembro do último ano da legislatura (RUM-12.10)', () => {
  assert.equal(dataEdicao('2027-02-01'), 'dezembro de 2030');
  assert.equal(dataEdicao('2031-02-01'), 'dezembro de 2034');
  assert.equal(dataEdicao(undefined), 'ao fim da legislatura');
  assert.equal(dataEdicao(''), 'ao fim da legislatura');
  assert.equal(dataEdicao('data ruim'), 'ao fim da legislatura');
});
