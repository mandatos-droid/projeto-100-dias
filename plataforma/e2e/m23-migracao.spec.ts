import { test, expect, type Page } from '@playwright/test';
import { abre as abreEquipe, camposDe as camposEquipe } from './semente';
import { abre as abreRumo, camposDe as camposRumo, dadoDe } from './semente-rumo';

/* Mandato salvo pelo modelo antigo abre a Missão 2 e a Missão 3 sem perder dado (RMX-01 a RMX-04),
   e o Feedback da Missão 5 segue a nova liderança derivada (RM2-38). */
const ESCOPO = 'Definir a estratégia de comunicação: posicionamento, cronograma e gestão de crises';

/* Missão 2 do modelo antigo: 20 cadeiras fixas com nome, ficha (escopo em chips, perfil, ritmo, entrega), rotinas desligadas e entre áreas. */
const ANTIGO_M2: Record<string, string> = {
  ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`m2.f${i + 1}`, `Pessoa ${i + 1}`])),
  'm2.p1.escopo': ESCOPO, 'm2.p1.coord': 'Chefia de área', 'm2.p8.escopo': ESCOPO,
  'm2.p2.espec': 'Redação legislativa', 'm2.p3.hab_dest': 'Organização', 'm2.p4.rep_dest': 'Boa escrita',
  'm2.p5.ritmo': 'Diário', 'm2.p6.rel': 'Gabinete da liderança', 'm2.p7.entrega': 'Relatório semanal', 'm2.p8.fb_falei': 'Conversa feita',
  'm2.areas': 'saude|educacao', 'm2.areas_aplicadas': 'saude', 'm2.rotoff': 'semanal', 'm2.x': '[{"id":"x1","a":"Legislativo","b":"Comunicação"}]',
};
const campo = (page: Page, rotulo: string, n: number) => page.getByLabel(`${rotulo}, linha ${n}`, { exact: true });

test.describe('Missão 2 de mandato antigo (RMX-02, RMX-03)', () => {
  test('a tabela mostra as 20 pessoas e os escopos, com a categoria derivada (RMX-02)', async ({ page }) => {
    await abreEquipe(page, ['equipe-tabela'], ANTIGO_M2);
    await expect(page.getByLabel(/^Nome da pessoa, linha \d+$/)).toHaveCount(20);
    for (const n of [1, 8, 20]) await expect(campo(page, 'Nome da pessoa', n)).toHaveValue(`Pessoa ${n}`);
    await expect(campo(page, 'Escopo', 1)).toHaveValue(ESCOPO);
    await expect(campo(page, 'Escopo', 8)).toHaveValue(ESCOPO);
    /* cadeira 0 = Chefia; a 1 lidera outras (Coordenação); a 2 não lidera ninguém (Executora) */
    await expect(campo(page, 'Categoria', 1)).toHaveValue('Chefia');
    await expect(campo(page, 'Categoria', 2)).toHaveValue('Coordenação');
    await expect(campo(page, 'Categoria', 3)).toHaveValue('Executora');
  });

  test('abrir e editar uma linha não apaga nenhuma chave do modelo antigo (RMX-03)', async ({ page }) => {
    await abreEquipe(page, ['equipe-tabela', 'organograma'], ANTIGO_M2);
    await expect(page.locator('.es-no')).toHaveCount(20);
    await campo(page, 'Escopo', 8).fill(`${ESCOPO} e relações com a imprensa`);
    const c = await camposEquipe(page);
    for (const [k, v] of Object.entries(ANTIGO_M2)) {
      if (k === 'm2.p8.escopo') continue; // o escopo antigo fica; a edição grava na chave nova (m2.p8.esc)
      expect(c[k], k).toBe(v);
    }
    expect(c['m2.p8.escopo']).toBe(ESCOPO);
    expect(c['m2.p8.esc']).toBe(`${ESCOPO} e relações com a imprensa`);
  });
});

/* Missão 3 do modelo antigo: texto livre em m3.obj.*, preditores e metas com status. */
const OBJ: Record<string, string> = { p1: 'Priorizar a educação', p2: 'Pautar o fim do trabalho infantil', p3: 'Cuidar da saúde básica' };
const METAS = [
  { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei sobre educação', resp: 'Carla Dias', apoio: 'Davi Rocha', status: 'concluida' },
  { id: 'b', pred: 'p2', texto: 'Realizar 3 debates públicos', resp: 'Ana Souza', apoio: '', status: 'nao_concluida' },
  { id: 'c', pred: 'p3', texto: 'Visitar 10 postos de saúde', resp: 'Bruno Lima', apoio: '', status: 'concluida70', sucessos: [{ id: 's1', mes: 1, texto: 'Agendar as visitas', status: 'concluida' }] },
];
const CAMPOS_M3: Record<string, string> = { 'm3.obj.p1': OBJ.p1, 'm3.obj.p2': OBJ.p2, 'm3.obj.p3': OBJ.p3, 'm3.legado': 'A educação no centro do debate' };
const ANTIGO_M3 = { campos: CAMPOS_M3, D: { preditores: ['p1', 'p2', 'p3'], metas: METAS } };

test.describe('Missão 3 de mandato antigo (RMX-01, RMX-04)', () => {
  test('abre na estratégia B com as frases antigas, sem mexer em texto nem em metas', async ({ page }) => {
    await abreRumo(page, ['rumo-estrategia'], ANTIGO_M3);
    await expect(page.locator('[data-estrategia="b"]').getByRole('radio')).toBeChecked();
    await expect(page.locator('[data-estrategia="a"]').getByRole('radio')).not.toBeChecked();
    for (const pid of ['p1', 'p2', 'p3']) await expect(page.locator(`[data-frase="${pid}"] input`)).toHaveValue(OBJ[pid]);
    expect(await dadoDe(page, 'metas')).toEqual(METAS); // metas idênticas
    expect(await dadoDe(page, 'preditores')).toEqual(['p1', 'p2', 'p3']);
    const c = await camposRumo(page);
    for (const [k, v] of Object.entries(CAMPOS_M3)) expect(c[k], k).toBe(v); // nenhum texto antigo mudou
  });

  test('a árvore do planejamento mostra as frases antigas e as mesmas metas', async ({ page }) => {
    await abreRumo(page, ['plano'], ANTIGO_M3);
    for (const pid of ['p1', 'p2', 'p3']) await expect(page.locator(`[data-no="obj-${pid}"]`).first()).toContainText(OBJ[pid]);
    for (const [i, m] of METAS.entries()) await expect(page.getByLabel(`Status da meta 0${i + 1}`)).toBeVisible();
    expect(await dadoDe(page, 'metas')).toEqual(METAS);
  });
});

/* Missão 5: a liderança direta vem da regra D8 gravada pela tabela: Executora liderada pela Coordenação da área; Coordenação, pela Chefia. */
const linhaNova = (i: number, v: { pessoa: string; cat: string; coord: string; lider: string }) => ({
  [`m2.p${i + 1}.esc`]: 'Escopo', [`m2.p${i + 1}.comp`]: 'Competências', [`m2.p${i + 1}.nome_cargo`]: `Cargo ${i}`,
  [`m2.f${i + 1}`]: v.pessoa, [`m2.p${i + 1}.cat`]: v.cat, [`m2.p${i + 1}.coord`]: v.coord, [`m2.p${i + 1}.lider`]: v.lider,
});
const EQUIPE_NOVA = {
  'm2.n': '4', 'm2.on': '0|20|21|22',
  ...linhaNova(0, { pessoa: 'Ana Souza', cat: 'Chefia', coord: 'Chefia de área', lider: '-' }),
  ...linhaNova(20, { pessoa: 'Bia Lima', cat: 'Coordenação', coord: 'Legislativo', lider: '0' }),
  ...linhaNova(21, { pessoa: 'Caio Reis', cat: 'Executora', coord: 'Legislativo', lider: '20' }),
  ...linhaNova(22, { pessoa: 'Dani Melo', cat: 'Executora', coord: 'Legislativo', lider: '20' }),
};
const card = (page: Page, i: number) => page.locator(`[data-lider="${i}"]`);

test.describe('Feedback da Missão 5 com a equipe nova (RM2-38)', () => {
  test('a Coordenação da área dá feedback às Executoras e a Chefia, à Coordenação', async ({ page }) => {
    await abreRumo(page, ['rumo-feedback'], { campos: EQUIPE_NOVA, D: { feedbacks: [] } });
    await expect(page.locator('[data-lider]')).toHaveCount(2); // as Executoras não lideram ninguém
    await expect(card(page, 20)).toContainText('Bia Lima');
    await expect(card(page, 20)).toContainText('dá feedback a 2 pessoas');
    await expect(card(page, 0)).toContainText('Ana Souza');
    await expect(card(page, 0)).toContainText('dá feedback a 1 pessoa');
  });

  test('conversa antiga, ligada à cadeira, conta para a pessoa certa sem alterar D.feedbacks', async ({ page }) => {
    const antiga = { id: 'o', cadeira: 21, pessoa: 'Caio Reis', lider: 'Bia Lima', data: '10/03', destaques: 'x', ajustes: 'y', acao: 'z' };
    await abreRumo(page, ['rumo-feedback'], { campos: EQUIPE_NOVA, D: { feedbacks: [antiga] } });
    await expect(card(page, 20)).toContainText('feitas 1 de 2');
    expect(await dadoDe(page, 'feedbacks')).toEqual([antiga]);
  });
});

/* Planejamento arquivado do modelo antigo: sem estratégia nem justificativas; abre somente leitura com o texto gravado. */
test.describe('Planejamento arquivado antigo', () => {
  test('abre somente leitura, mostra o texto gravado e não altera o arquivado', async ({ page }) => {
    const arq = {
      n: 1, criadoEm: '2026-05-01T10:00:00.000Z', legado: 'A educação no centro do debate', bandeiras: [],
      objetivos: [{ pid: 'p1', nome: 'Priorizar a agenda', pergunta: '', texto: 'Priorizar a educação' }],
      metas: [{ id: 'z', pred: 'p1', texto: 'Aprovar 2 projetos de lei antigos', status: 'concluida' }],
    };
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await abreRumo(page, ['plano'], { campos: CAMPOS_M3, D: { preditores: ['p1', 'p2', 'p3'], metas: METAS, planos: [arq] } });
    await page.locator('.rm-ciclo select').selectOption('1');
    await expect(page.getByText('somente leitura')).toBeVisible();
    await expect(page.getByText('Aprovar 2 projetos de lei antigos')).toBeVisible();
    await expect(page.getByRole('button', { name: /Editar a meta|Acrescentar meta/ })).toHaveCount(0);
    expect(await dadoDe(page, 'planos')).toEqual([arq]);
    expect(erros).toEqual([]);
  });
});
