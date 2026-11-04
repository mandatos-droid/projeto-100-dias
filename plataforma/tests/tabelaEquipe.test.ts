import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplica, ativas, coordDe, liderDe } from '../lib/cadeiras.ts';
import { COLUNAS, CATEGORIAS, linhas, colunaLiberada, completa, contagemCompletas, defineN, editaCelula, recalculaLideres, avisosOrg, escopoTexto, competenciasTexto, categoriaPadrao, migrada, materializa, vistaDaTabela, organogramaGerado } from '../lib/tabelaEquipe.ts';

type C = Record<string, string>;
/** mandato que já usa a tabela nova (m2.n gravado), com a Chefia (0) e duas linhas acrescentadas (índices 20 e 21) */
const base = (extra: C = {}): C => ({ 'm2.on': '0|20|21', 'm2.n': '3', ...extra });
const cheia = (n: number, extra: C = {}): C => ({
  [`m2.p${n + 1}.esc`]: 'Coordenar a equipe', [`m2.p${n + 1}.comp`]: 'Liderança',
  [`m2.p${n + 1}.nome_cargo`]: 'Chefe de gabinete', [`m2.f${n + 1}`]: 'Ana',
  [`m2.p${n + 1}.cat`]: 'Chefia', [`m2.p${n + 1}.coord`]: 'Legislativo', ...extra,
});

test('a ordem das colunas é escopo, competências, cargo, pessoa, categoria, área (RM2-05)', () => {
  assert.deepEqual(COLUNAS.map((x) => x.id), ['esc', 'comp', 'cargo', 'pessoa', 'cat', 'area']);
  assert.ok(COLUNAS.every((x) => x.rotulo.length > 0));
});

test('as categorias são Chefia, Coordenação, Especialista e Executora (D4)', () => {
  assert.deepEqual([...CATEGORIAS], ['Chefia', 'Coordenação', 'Especialista', 'Executora']);
});

test('linhas devolve uma por cadeira ativa, na ordem, com os seis valores lidos das chaves m2.* (RM2-01)', () => {
  const l = linhas(base(cheia(20)));
  assert.deepEqual(l.map((x) => x.i), [0, 20, 21]);
  const x = l.find((r) => r.i === 20)!;
  assert.deepEqual([x.esc, x.comp, x.cargo, x.pessoa, x.cat, x.area],
    ['Coordenar a equipe', 'Liderança', 'Chefe de gabinete', 'Ana', 'Chefia', 'Legislativo']);
});

test('linha nova (índice 20+) nasce com todas as colunas vazias, sem área nem liderança herdadas (design, Risks)', () => {
  const x = linhas(base()).find((r) => r.i === 20)!;
  assert.deepEqual([x.esc, x.comp, x.cargo, x.pessoa, x.cat, x.area], ['', '', '', '', '', '']);
  assert.equal(x.completa, false);
});

test('a primeira coluna está sempre liberada (RM2-05)', () => {
  const x = linhas(base()).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(x, 'esc'), { ok: true });
});

test('a coluna N só libera com a N-1 preenchida e devolve o rótulo da que falta (RM2-05)', () => {
  const x = linhas(base()).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(x, 'comp'), { ok: false, falta: 'Escopo' });
  const y = linhas(base({ 'm2.p21.esc': 'Escopo x' })).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(y, 'comp'), { ok: true });
  assert.deepEqual(colunaLiberada(y, 'cargo'), { ok: false, falta: 'Competências comportamentais' });
});

test('categoria só libera com a pessoa preenchida e a área só com a categoria (RM2-08)', () => {
  const c = base({ 'm2.p21.esc': 'a', 'm2.p21.comp': 'b', 'm2.p21.nome_cargo': 'c' });
  const sem = linhas(c).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(sem, 'cat'), { ok: false, falta: 'Nome da pessoa' });
  const com = linhas({ ...c, 'm2.f21': 'Bia' }).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(com, 'cat'), { ok: true });
  assert.deepEqual(colunaLiberada(com, 'area'), { ok: false, falta: 'Categoria' });
});

test('esvaziar uma coluna anterior trava as seguintes e não apaga os valores (RM2-06)', () => {
  const c = base(cheia(20, { 'm2.p21.esc': '' }));
  const antes = JSON.stringify(c);
  const x = linhas(c).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(x, 'area'), { ok: false, falta: 'Escopo' });
  assert.deepEqual(colunaLiberada(x, 'cargo'), { ok: false, falta: 'Escopo' });
  assert.equal(x.comp, 'Liderança');
  assert.equal(x.area, 'Legislativo');
  assert.equal(JSON.stringify(c), antes);
});

test('espaços em branco não contam como preenchido (RM2-05)', () => {
  const x = linhas(base({ 'm2.p21.esc': '   ' })).find((r) => r.i === 20)!;
  assert.equal(colunaLiberada(x, 'comp').ok, false);
});

test('"*" no nome da pessoa conta como preenchida e marca processo seletivo (RM2-07)', () => {
  const c = base({ 'm2.p21.esc': 'a', 'm2.p21.comp': 'b', 'm2.p21.nome_cargo': 'c', 'm2.f21': '*' });
  const x = linhas(c).find((r) => r.i === 20)!;
  assert.equal(x.processoSeletivo, true);
  assert.deepEqual(colunaLiberada(x, 'cat'), { ok: true });
  const y = linhas({ ...c, 'm2.f21': 'Bia' }).find((r) => r.i === 20)!;
  assert.equal(y.processoSeletivo, false);
});

test('completa só com as 6 colunas preenchidas (RM2-09)', () => {
  const l = linhas(base(cheia(20)));
  assert.equal(l.find((r) => r.i === 20)!.completa, true);
  assert.equal(completa(l.find((r) => r.i === 20)!), true);
  const falta = linhas(base(cheia(20, { 'm2.p21.coord': '' }))).find((r) => r.i === 20)!;
  assert.equal(falta.completa, false);
  assert.equal(completa(falta), false);
});

test('contagem "X de N linhas completas" (RM2-09)', () => {
  assert.deepEqual(contagemCompletas(base()), { completas: 0, total: 3 });
  assert.deepEqual(contagemCompletas(base(cheia(20))), { completas: 1, total: 3 });
  assert.deepEqual(contagemCompletas(base({ ...cheia(20), ...cheia(21), ...cheia(0) })), { completas: 3, total: 3 });
});

test('ler a tabela nunca altera os dados (RM2-06)', () => {
  const c = base(cheia(20));
  const antes = JSON.stringify(c);
  linhas(c); contagemCompletas(c);
  assert.equal(JSON.stringify(c), antes);
});

/* ---------- T13 · quantidade de pessoas ---------- */
const aplicado = (c: C, r: { patch: Record<string, string> }): C => { const x = { ...c }; aplica(x, r.patch); return x; };

test('N inválido (0, 41, decimal, texto, vazio) devolve erro e nenhum patch (RM2-03)', () => {
  for (const n of [0, 41, 2.5, -1, NaN, 'abc', '', '3.5', '0', '41']) {
    const r = defineN({}, n as number | string);
    assert.deepEqual(r.patch, {}, `n=${String(n)}`);
    assert.equal(typeof r.erro, 'string', `n=${String(n)}`);
  }
});

test('N válido de 1 a 40, número ou texto, é aceito e grava m2.n (RM2-03)', () => {
  assert.equal(defineN({}, 1).erro, undefined);
  assert.equal(defineN({}, 40).patch['m2.n'], '40');
  assert.equal(defineN({}, '4').patch['m2.n'], '4');
});

test('N conta a Chefia: mandato novo com N=4 passa a ter 4 linhas, a primeira é a cadeira 0 (RM2-04)', () => {
  const c = aplicado({}, defineN({}, 4));
  assert.deepEqual(ativas(c), [0, 20, 21, 22]);
  assert.equal(c['m2.n'], '4');
  assert.equal(linhas(c).length, 4);
});

test('N=1 mantém só a Chefia (design)', () => {
  const c = aplicado({}, defineN({}, 1));
  assert.deepEqual(ativas(c), [0]);
});

test('aumentar cria linhas só com índices 20+, nunca reativa as do modelo, sem coord nem lider herdados de PADRAO (RM2-04)', () => {
  const c0: C = { 'm2.on': '0|1|2' };
  const c = aplicado(c0, defineN(c0, 6));
  assert.deepEqual(ativas(c), [0, 1, 2, 20, 21, 22]);
  [20, 21, 22].forEach((i) => {
    assert.equal(c[`m2.p${i + 1}.coord`], undefined);
    assert.equal(c[`m2.p${i + 1}.lider`], undefined);
    assert.equal(coordDe(c, i), 'Sem área');
    assert.equal(liderDe(c, i), null);
  });
  linhas(c).filter((l) => l.i >= 20).forEach((l) => assert.deepEqual([l.esc, l.pessoa, l.cat, l.area], ['', '', '', '']));
});

test('aumentar reaproveita o primeiro índice 20+ livre (RM2-04)', () => {
  const c0: C = { 'm2.on': '0|20|22' };
  assert.deepEqual(ativas(aplicado(c0, defineN(c0, 4))), [0, 20, 21, 22]);
});

test('diminuir remove só linhas vazias, sem pedir confirmação, e grava m2.n (RM2-04)', () => {
  const c0 = base({ ...cheia(0), ...cheia(20), 'm2.n': '3' });
  const r = defineN(c0, 2);
  assert.equal(r.confirma, undefined);
  const c = aplicado(c0, r);
  assert.deepEqual(ativas(c), [0, 20]);
  assert.equal(c['m2.n'], '2');
  assert.equal(c['m2.f21'], 'Ana');
});

test('diminuir tira as vazias antes das preenchidas, mesmo as de índice menor (RM2-04)', () => {
  const c0: C = { 'm2.on': '0|20|21|22', 'm2.f22': 'Bia' }; // m2.f22 é a cadeira 21; 20 e 22 vazias
  const r = defineN(c0, 2);
  assert.equal(r.confirma, undefined);
  assert.deepEqual(ativas(aplicado(c0, r)), [0, 21]);
});

test('se faltar linha vazia, devolve confirma com os nomes das preenchidas que sairiam (RM2-04)', () => {
  const c0 = base({ ...cheia(0), ...cheia(20, { 'm2.f21': 'Bia' }), ...cheia(21, { 'm2.f22': 'Caio' }) });
  const r = defineN(c0, 1);
  assert.deepEqual([...(r.confirma ?? [])].sort(), ['Bia', 'Caio']);
  assert.deepEqual(r.remove?.slice().sort((a, b) => a - b), [20, 21]);
  assert.deepEqual(ativas(aplicado(c0, r)), [0]);
});

test('só as preenchidas necessárias entram em confirma; as vazias saem antes (RM2-04)', () => {
  const c0 = base({ ...cheia(0), ...cheia(20, { 'm2.f21': 'Bia' }) }); // a 21 está vazia
  const r = defineN(c0, 2);
  assert.equal(r.confirma, undefined);
  assert.deepEqual(r.remove, [21]);
  const r2 = defineN(c0, 1);
  assert.deepEqual(r2.confirma, ['Bia']);
  assert.deepEqual(r2.remove?.slice().sort((a, b) => a - b), [20, 21]);
});

test('a Chefia nunca é removida, nem preenchida (RM2-04)', () => {
  const c0 = base({ ...cheia(0) });
  assert.ok(ativas(aplicado(c0, defineN(c0, 1))).includes(0));
  assert.equal(aplicado(c0, defineN(c0, 1))['m2.f1'], 'Ana');
});

test('remover linha preenchida limpa escopo, competências e categoria para não voltarem numa linha nova (RM2-04)', () => {
  const c0 = base({ ...cheia(20) });
  const c1 = aplicado(c0, defineN(c0, 1));
  assert.equal(c1['m2.p21.esc'], undefined);
  assert.equal(c1['m2.p21.comp'], undefined);
  assert.equal(c1['m2.p21.cat'], undefined);
  assert.equal(c1['m2.f21'], undefined);
  const c2 = aplicado(c1, defineN(c1, 2));
  const nova = linhas(c2).find((l) => l.i === 20)!;
  assert.deepEqual([nova.esc, nova.comp, nova.cat, nova.pessoa, nova.completa], ['', '', '', '', false]);
});

test('N igual ao atual só grava m2.n (RM2-04)', () => {
  assert.deepEqual(defineN(base(), 3).patch, { 'm2.n': '3' });
});

test('defineN não altera os campos recebidos (RM2-04)', () => {
  const c0 = base(cheia(20));
  const antes = JSON.stringify(c0);
  defineN(c0, 1); defineN(c0, 9);
  assert.equal(JSON.stringify(c0), antes);
});

/* ---------- T14 · edição de célula e liderança derivada ---------- */
const pessoa = (i: number, cat: string, area: string): C => ({ [`m2.p${i + 1}.cat`]: cat, [`m2.p${i + 1}.coord`]: area });
/** Chefia (0); Legislativo: coordenação 20, executora 21, especialista 22; Comunicação: coordenação 23, executora 24 */
const equipe = (extra: C = {}): C => ({
  'm2.on': '0|20|21|22|23|24',
  ...pessoa(0, 'Chefia', 'Chefia de área'), ...pessoa(20, 'Coordenação', 'Legislativo'), ...pessoa(21, 'Executora', 'Legislativo'),
  ...pessoa(22, 'Especialista', 'Legislativo'), ...pessoa(23, 'Coordenação', 'Comunicação'), ...pessoa(24, 'Executora', 'Comunicação'),
  ...extra,
});

test('Chefia grava lider "-"; Coordenação aponta para a Chefia; Especialista e Executora para a Coordenação da própria área (RM2-31)', () => {
  const c = aplicado(equipe(), { patch: recalculaLideres(equipe()) });
  assert.equal(c['m2.p1.lider'], '-');
  assert.equal(c['m2.p21.lider'], '0');
  assert.equal(c['m2.p24.lider'], '0');
  assert.equal(c['m2.p22.lider'], '20');
  assert.equal(c['m2.p23.lider'], '20');
  assert.equal(c['m2.p25.lider'], '23');
});

test('área sem Coordenação liga à Chefia e avisosOrg traz "Área sem coordenação" (RM2-32)', () => {
  const c = equipe({ 'm2.p21.cat': 'Executora' }); // a coordenação de Legislativo (cadeira 20) deixa de existir
  const c2 = aplicado(c, { patch: recalculaLideres(c) });
  assert.equal(c2['m2.p22.lider'], '0');
  assert.equal(c2['m2.p23.lider'], '0');
  assert.ok(avisosOrg(c2).some((a) => a.includes('Área sem coordenação')));
  assert.equal(liderDe(c2, 21), 0);
});

test('sem a falta, avisosOrg não traz "Área sem coordenação" (RM2-32)', () => {
  assert.ok(!avisosOrg(equipe()).some((a) => a.includes('Área sem coordenação')));
});

test('sem Chefia avisosOrg traz "Defina a chefia" e a Coordenação fica no topo (RM2-33)', () => {
  const c0 = equipe({ 'm2.p1.cat': '' });
  assert.ok(avisosOrg(c0).includes('Defina a chefia'));
  const c = aplicado(c0, { patch: recalculaLideres(c0) });
  assert.equal(c['m2.p21.lider'], '-');
});

test('com duas ou mais Chefias avisosOrg traz o aviso de mais de uma chefia e não traz "Defina a chefia" (RM2-34)', () => {
  const c0 = equipe(pessoa(24, 'Chefia', 'Chefia de área'));
  const a = avisosOrg(c0);
  assert.ok(a.some((x) => x.includes('Mais de uma chefia')));
  assert.ok(!a.includes('Defina a chefia'));
  assert.ok(!avisosOrg(equipe()).some((x) => x.includes('Mais de uma chefia')));
});

test('tabela vazia não gera aviso (RM2-30)', () => {
  assert.deepEqual(avisosOrg(base()), []);
});

test('editar a categoria de uma linha recalcula a liderança das dependentes no mesmo patch (RM2-35)', () => {
  const c0 = aplicado(equipe(), { patch: recalculaLideres(equipe()) });
  const patch = editaCelula(c0, 20, 'cat', 'Especialista');
  assert.equal(patch['m2.p21.cat'], 'Especialista');
  const c = aplicado(c0, { patch });
  assert.equal(c['m2.p22.lider'], '0');   // ficou sem coordenação, liga à Chefia
  assert.equal(c['m2.p23.lider'], '0');
  assert.equal(c['m2.p21.lider'], '0');
});

test('editar a área de uma linha recalcula a própria liderança e a das dependentes (RM2-35)', () => {
  const c0 = aplicado(equipe(), { patch: recalculaLideres(equipe()) });
  const c = aplicado(c0, { patch: editaCelula(c0, 21, 'area', 'Comunicação') });
  assert.equal(c['m2.p22.coord'], 'Comunicação');
  assert.equal(c['m2.p22.lider'], '23');   // a executora passa a responder à coordenação de Comunicação
  const d = aplicado(c0, { patch: editaCelula(c0, 20, 'area', 'Comunicação') });
  assert.equal(d['m2.p23.lider'], '0');    // a especialista de Legislativo ficou sem coordenação
});

test('editar outra coluna grava só a célula (RM2-35)', () => {
  const c0 = aplicado(equipe(), { patch: recalculaLideres(equipe()) });
  assert.deepEqual(editaCelula(c0, 21, 'cargo', 'Analista'), { 'm2.p22.nome_cargo': 'Analista' });
  assert.deepEqual(editaCelula(c0, 21, 'pessoa', 'Bia'), { 'm2.f22': 'Bia' });
  assert.deepEqual(editaCelula(c0, 21, 'esc', 'Redigir'), { 'm2.p22.esc': 'Redigir' });
  assert.deepEqual(editaCelula(c0, 21, 'comp', 'Organização'), { 'm2.p22.comp': 'Organização' });
});

test('linha sem categoria ou sem área não ganha lider novo (RM2-35)', () => {
  const c0 = equipe({ 'm2.p22.cat': '', 'm2.p23.coord': '' });
  const p = recalculaLideres(c0);
  assert.equal(p['m2.p22.lider'], undefined);
  assert.equal(p['m2.p23.lider'], undefined);
  assert.equal(p['m2.p21.lider'], '0');
});

test('liderDe lê o valor gravado, então o Feedback da M5 recebe a mesma liderança (RM2-38)', () => {
  const c = aplicado(equipe(), { patch: recalculaLideres(equipe()) });
  assert.equal(liderDe(c, 21), 20);
  assert.equal(liderDe(c, 24), 23);
  assert.equal(liderDe(c, 20), 0);
  assert.equal(liderDe(c, 0), null);
});

test('recalculaLideres e avisosOrg não alteram os dados recebidos (RM2-35)', () => {
  const c0 = equipe();
  const antes = JSON.stringify(c0);
  recalculaLideres(c0); avisosOrg(c0); editaCelula(c0, 20, 'cat', 'Executora');
  assert.equal(JSON.stringify(c0), antes);
});

/* ---------- T15 · migração do formato antigo ---------- */
const CHIP_A = 'Elaborar propostas legislativas: projetos de lei, emendas, requerimentos e indicações';
const CHIP_B = 'Preparar orientação de voto para comissões e plenário';
/** mandato do modelo de 20 cadeiras: Chefia (0), Coord. Legislativo (1, lidera 2), assessor (2); sem m2.n */
const antigo = (extra: C = {}): C => ({
  'm2.on': '0|1|2', 'm2.f1': 'Ana', 'm2.f2': 'Bia', 'm2.f3': 'Caio',
  'm2.p1.nome_cargo': 'Chefe de gabinete', 'm2.p2.nome_cargo': 'Coordenadora Legislativa', 'm2.p3.nome_cargo': 'Assessor',
  'm2.p2.escopo': `${CHIP_A}|${CHIP_B}`, 'm2.p2.espec': 'Foco em saúde',
  'm2.p3.hab_dest': 'Organização', 'm2.p3.ritmo': 'Lento', 'm2.p3.rel': 'Bom', 'm2.p3.fb_falei': 'ok', 'm2.p3.entrega': 'semanal',
  ...extra,
});

test('escopoTexto devolve esc quando há; senão junta os chips de escopo com espec (RMX-02)', () => {
  assert.equal(escopoTexto(antigo({ 'm2.p2.esc': 'Texto novo' }), 1), 'Texto novo');
  assert.equal(escopoTexto(antigo(), 1), `${CHIP_A}; ${CHIP_B}; Foco em saúde`);
  assert.equal(escopoTexto(antigo({ 'm2.p3.espec': 'Só texto livre' }), 2), 'Só texto livre');
  assert.equal(escopoTexto(antigo(), 2), '');
});

test('competenciasTexto devolve o valor novo; o formato antigo não tem destino para ele (RMX-02)', () => {
  assert.equal(competenciasTexto(antigo({ 'm2.p2.comp': 'Liderança' }), 1), 'Liderança');
  assert.equal(competenciasTexto(antigo(), 1), '');
});

test('categoriaPadrao: cadeira 0 = Chefia; quem lidera alguém = Coordenação; o resto = Executora (RMX-02)', () => {
  const c = antigo();
  assert.equal(categoriaPadrao(c, 0), 'Chefia');
  assert.equal(categoriaPadrao(c, 1), 'Coordenação'); // lidera a cadeira 2 pelo padrão do modelo
  assert.equal(categoriaPadrao(c, 2), 'Executora');
});

test('categoriaPadrao usa a liderança gravada, não só o padrão do modelo (RMX-02)', () => {
  const c = antigo({ 'm2.on': '0|1|2|20', 'm2.p21.lider': '2', 'm2.p21.coord': 'Legislativo' });
  assert.equal(categoriaPadrao(c, 2), 'Coordenação');
  assert.equal(categoriaPadrao(c, 20), 'Executora');
});

test('migrada: verdadeiro com m2.n ausente e dados antigos; falso para mandato novo vazio ou com m2.n (RMX-02)', () => {
  assert.equal(migrada(antigo()), true);
  assert.equal(migrada({}), false);
  assert.equal(migrada({ 'm2.on': '0|20|21' }), false);
  assert.equal(migrada(antigo({ 'm2.n': '3' })), false);
});

test('a tabela lê o mandato antigo: pessoa, cargo, escopo, categoria derivada e área, sem reescrever dados (RMX-02, RMX-03)', () => {
  const c = antigo();
  const antes = JSON.stringify(c);
  const l = linhas(c);
  assert.deepEqual(l.map((x) => x.i), [0, 1, 2]);
  const coord = l.find((x) => x.i === 1)!;
  assert.deepEqual([coord.pessoa, coord.cargo, coord.esc, coord.cat, coord.area],
    ['Bia', 'Coordenadora Legislativa', `${CHIP_A}; ${CHIP_B}; Foco em saúde`, 'Coordenação', 'Legislativo']);
  const chefe = l.find((x) => x.i === 0)!;
  assert.deepEqual([chefe.pessoa, chefe.cat, chefe.area], ['Ana', 'Chefia', 'Chefia de área']);
  assert.equal(l.find((x) => x.i === 2)!.cat, 'Executora');
  assert.equal(JSON.stringify(c), antes);
});

test('mandato antigo: valor novo gravado vence a derivação, e m2.n gravado desliga a derivação (RMX-02)', () => {
  const c = antigo({ 'm2.p2.cat': 'Especialista', 'm2.p2.esc': 'Novo' });
  const x = linhas(c).find((l) => l.i === 1)!;
  assert.deepEqual([x.cat, x.esc], ['Especialista', 'Novo']);
  const novo = linhas(antigo({ 'm2.n': '3' })).find((l) => l.i === 1)!;
  assert.deepEqual([novo.cat, novo.esc], ['', '']);
});

test('nenhum dado do formato antigo (hab_*, rep_*, ritmo, rel, entrega, fb_*) é apagado ao ler ou editar (RMX-03)', () => {
  const c = antigo({ 'm2.p3.rep_dest': 'x', 'm2.p3.rep_dev': 'y', 'm2.p3.hab_dev': 'z', 'm2.p3.fb_ouvi': 'a', 'm2.p3.fb_dev': 'b', 'm2.rotoff': 'plan', 'm2.x': '[]' });
  const antes = JSON.stringify(c);
  linhas(c); migrada(c); escopoTexto(c, 2); categoriaPadrao(c, 2);
  const patch = editaCelula(c, 2, 'cat', 'Executora');
  assert.equal(JSON.stringify(c), antes);
  const apagadas = Object.entries(patch).filter(([k, v]) => v === '' && /\.(hab_|rep_|ritmo|rel|entrega|fb_)/.test(k));
  assert.deepEqual(apagadas, []);
});

/* ---------- T16 · competências antigas e materialização do mandato migrado ---------- */
test('competenciasTexto cai para as habilidades de destaque antigas (hab_dest) quando comp está vazio (RMX-02)', () => {
  const c = antigo({ 'm2.p3.hab_dest': 'Organização|Empatia' });
  assert.equal(competenciasTexto(c, 2), 'Organização, Empatia');
  assert.equal(competenciasTexto(antigo({ 'm2.p3.hab_dest': 'Organização', 'm2.p3.comp': 'Texto novo' }), 2), 'Texto novo');
  assert.equal(linhas(c).find((l) => l.i === 2)!.comp, 'Organização, Empatia');
});

test('materializa: mandato novo (com m2.n) não ganha patch (RMX-02)', () => {
  assert.deepEqual(materializa(antigo({ 'm2.n': '3' })), {});
  assert.deepEqual(materializa({}), {});
});

test('materializa grava m2.n, esc, comp, cargo, cat, coord e lider explícitos de cada linha antiga, sem perder dado (RMX-02, RMX-03)', () => {
  const c = antigo({ 'm2.p3.hab_dest': 'Organização' });
  const antes = JSON.stringify(c);
  const p = materializa(c);
  assert.equal(JSON.stringify(c), antes);
  assert.equal(p['m2.n'], '3');
  assert.equal(p['m2.p2.esc'], `${CHIP_A}; ${CHIP_B}; Foco em saúde`);
  assert.equal(p['m2.p3.comp'], 'Organização');
  assert.equal(p['m2.p1.cat'], 'Chefia');
  assert.equal(p['m2.p2.cat'], 'Coordenação');
  assert.equal(p['m2.p3.cat'], 'Executora');
  assert.equal(p['m2.p2.coord'], 'Legislativo');
  assert.equal(p['m2.p3.lider'], '1');
  assert.equal(p['m2.p1.lider'], '-');
  const depois = { ...c }; aplica(depois, p);
  assert.deepEqual(linhas(depois), linhas(c)); // a tabela mostra a mesma coisa antes e depois
  assert.equal(depois['m2.p3.ritmo'], 'Lento');
  assert.equal(depois['m2.p3.fb_falei'], 'ok');
  assert.equal(liderDe(depois, 2), 1);
});

test('materializa não sobrescreve valor novo já gravado e usa o cargo do modelo quando falta nome_cargo (RMX-02)', () => {
  const c = antigo({ 'm2.p2.cat': 'Especialista', 'm2.p2.nome_cargo': '' });
  const p = materializa(c, (i) => (i === 1 ? 'Cargo do modelo' : ''));
  assert.equal(p['m2.p2.cat'], undefined);
  assert.equal(p['m2.p2.nome_cargo'], 'Cargo do modelo');
  assert.equal(p['m2.p1.nome_cargo'], undefined); // já tinha nome_cargo
});

/* ---------- T23 · vista da tabela e organograma gerado ---------- */
test('organogramaGerado: só com ao menos uma linha com cargo, categoria e área (RM2-30, RM2-63)', () => {
  assert.equal(organogramaGerado({}), false);
  assert.equal(organogramaGerado(base()), false);
  assert.equal(organogramaGerado(base({ 'm2.p21.nome_cargo': 'Assessor', 'm2.p21.cat': 'Executora' })), false); // falta a área
  assert.equal(organogramaGerado(base({ 'm2.p21.nome_cargo': 'Assessor', 'm2.p21.cat': 'Executora', 'm2.p21.coord': 'Legislativo' })), true);
});

test('vistaDaTabela devolve o mandato novo como está e o antigo com os derivados, sem alterar o original (RMX-02)', () => {
  const novo = base({ 'm2.p21.nome_cargo': 'Assessor' });
  assert.equal(vistaDaTabela(novo), novo);
  const c = antigo({ 'm2.p2.nome_cargo': '' });
  const antes = JSON.stringify(c);
  const v = vistaDaTabela(c, (i) => `Modelo ${i}`);
  assert.equal(JSON.stringify(c), antes);
  assert.equal(v['m2.n'], '3');
  assert.equal(v['m2.p2.nome_cargo'], 'Modelo 1');
  assert.equal(v['m2.p2.cat'], 'Coordenação');
  assert.equal(organogramaGerado(c), true); // há cargo (nome_cargo) nas outras linhas
  assert.equal(organogramaGerado(antigo({ 'm2.p1.nome_cargo': '', 'm2.p2.nome_cargo': '', 'm2.p3.nome_cargo': '' })), false);
  assert.equal(organogramaGerado(vistaDaTabela(antigo({ 'm2.p1.nome_cargo': '', 'm2.p2.nome_cargo': '', 'm2.p3.nome_cargo': '' }), (i) => `Modelo ${i}`)), true);
});
