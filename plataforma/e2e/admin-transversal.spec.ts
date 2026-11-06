import { test, expect, type Page } from '@playwright/test';
import { chamadas, mandato, moca, naoMapeadas, semeiaSessao, vazou, type EstadoMoca, type Papel } from './admin-api';

/* Varredura transversal do /admin (ADM-16, ADM-02): as 5 telas em 360 px e a rede de todas elas.
   Os dados são de propósito "feios" (nomes e e-mails longos, páginas cheias) para estressar o layout.
   Supabase todo interceptado (admin-api.ts). */

const ID = 'mand-1';
const CATALOGO: [string, number, number][] = [
  ['m1.persona', 1, 1], ['m1.conjuntura', 1, 2], ['m1.oportunidades', 1, 3], ['m1.frag', 1, 4],
  ['m2.funcoes', 2, 1], ['m2.gestao', 2, 2],
  ['m3.bandeiras', 3, 1], ['m3.legado', 3, 2], ['m3.preditores', 3, 3], ['m3.metas', 3, 4],
  ['m4.comissoes', 4, 1], ['m4.acoes', 4, 2], ['m4.metricas', 4, 3],
  ['m5.monit', 5, 1], ['m5.feedback', 5, 2], ['m5.imersao', 5, 3],
];
const guia = CATALOGO.map(([id, missao, ordem]) => ({ id, missao, ordem, titulo: `Exercício muito comprido de ${id} para esticar a tabela` }));
const agora = Date.now();

// 30 mandatos (a lista de Mandatos pagina em 25); o primeiro é o do detalhe
const mandatos = Array.from({ length: 30 }, (_, i) => mandato({
  id: i === 0 ? ID : `m${i}`, codigo: `COD${String(i).padStart(3, '0')}`, uf: ['SP', 'RJ', 'MG'][i % 3],
  nome_parlamentar: i === 0 ? 'Parlamentar com um nome bastante comprido da Silva Sauro' : `Parlamentar ${i}`,
  resp_nome: 'Responsável Com Nome Longo', resp_cargo: 'chefe de gabinete', membros: 2, exercicios_concluidos: i % 17,
  criado_em: new Date(agora - (i + 20) * 86400000).toISOString(), ultima_atividade: new Date(agora - i * 3 * 86400000).toISOString(),
}));
const exercicios = mandatos.flatMap((m, i) => CATALOGO.map(([exercicio, missao, ordem], k) => ({ mandato_id: m.id, uf: m.uf, exercicio, missao, ordem, ok: k < i % 17 })));
const campos = mandatos.map((m, i) => ({ mandato_id: m.id, uf: m.uf, persona: i % 2 === 0, conjuntura: true, municipio: false, eleitorado: i % 3 === 0, social: false, cadeiras: true }));
const eventosMes = mandatos.map((m, i) => ({ mandato_id: m.id, mes: '2026-10-01', qtd: i % 4 }));
const atividade = Array.from({ length: 60 }, (_, i) => ({ criado_em: new Date(agora - i * 3600000).toISOString(), missao: (i % 5) + 1, exercicio: 'm1.persona', codigo: `COD${String(i % 30).padStart(3, '0')}` }));
const auditoria = Array.from({ length: 60 }, (_, i) => ({
  id: 100 - i, criado_em: new Date(agora - i * 3600000).toISOString(), autor: 'Ana Souza de Albuquerque Maranhão', acao: 'membro.adicionar',
  alvo_tipo: 'mandato', alvo_id: ID, detalhe: { codigo: 'COD000', email: 'pessoa.com.email.muito.comprido@organizacao-com-dominio-longo.org.br', nome: 'Pessoa', papel: 'assessoria' },
}));
const equipe = [
  { user_id: 'u1', nome: 'Ana Souza de Albuquerque Maranhão', email: 'ana.souza.de.albuquerque@organizacao-com-dominio-longo.org.br', papel: 'admin', criado_em: '2026-10-01T12:00:00Z' },
  { user_id: 'u2', nome: 'Carla Dias', email: 'carla@exemplo.org', papel: 'leitura', criado_em: '2026-10-02T12:00:00Z' },
];
const membros = [
  { user_id: 'u-julia', nome: 'Júlia Melo de Albuquerque', email: 'julia.melo.de.albuquerque@organizacao-com-dominio-longo.org.br', papel: 'assessoria', criado_em: '2026-10-22T15:00:00Z' },
  { user_id: 'u-rafael', nome: 'Rafael Cruz', email: 'rafael@exemplo.org', papel: 'coordenacao', criado_em: '2026-10-21T15:00:00Z' },
];

const estado = (): EstadoMoca => ({
  views: {
    v_admin_mandatos: mandatos, v_admin_exercicios: exercicios, v_admin_eventos_mes: eventosMes, v_admin_uso_campos: campos,
    exercicios_guia: guia, v_admin_atividade: atividade, auditoria_admin: auditoria,
  },
  rpc: { admin_equipe: () => ({ corpo: equipe }), admin_membros: () => ({ corpo: membros }) },
});

// As 5 telas: rota, título do h2 da casca e algo que prova que carregou
const TELAS = [
  { nome: 'Mandatos', rota: '/admin', pronto: (p: Page) => expect(p.getByText('COD001').first()).toBeVisible() },
  { nome: 'Equipe', rota: '/admin/equipe', pronto: (p: Page) => expect(p.getByText('Carla Dias')).toBeVisible() },
  { nome: 'Detalhe do mandato', rota: `/admin/mandatos/${ID}`, pronto: (p: Page) => expect(p.getByText('Rafael Cruz').first()).toBeVisible() },
  { nome: 'Analytics', rota: '/admin/analytics', pronto: (p: Page) => expect(p.locator('.kpis')).toBeVisible() },
  { nome: 'Logs', rota: '/admin/logs', pronto: (p: Page) => expect(p.locator('[role=tabpanel] tbody tr').first()).toBeVisible() },
] as const;

async function abre(page: Page, rota: string, pronto: (p: Page) => Promise<void>, papel: Papel = 'admin') {
  await semeiaSessao(page, papel);
  await moca(page, estado());
  await page.goto(rota);
  await pronto(page);
}

// Largura da página contra a da janela; pega só rolagem da página (tabelas rolam dentro do próprio quadro)
const rolagemLateral = (page: Page) => page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));

// Alvos de toque visíveis: botões, campos e links com cara de botão (.btn)
const alvosBaixos = (page: Page) => page.evaluate(() => {
  const alvos = [...document.querySelectorAll<HTMLElement>('button, input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea, a.btn')];
  return alvos
    .map((e) => ({ e, r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && r.height > 0)
    .filter(({ r }) => r.height < 40)
    .map(({ e, r }) => `${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.height)}px`);
});

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test.describe('360 px: sem rolagem lateral da página (ADM-16.1)', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  for (const t of TELAS) {
    test(`${t.nome}`, async ({ page }) => {
      await abre(page, t.rota, t.pronto);
      const l = await rolagemLateral(page);
      expect(l.doc).toBeLessThanOrEqual(l.janela);
    });
  }
  test('Logs: as três abas, e também com a tabela da aba Ações da equipe cheia', async ({ page }) => {
    await abre(page, '/admin/logs', TELAS[4].pronto);
    for (const aba of ['Ações da equipe', 'Sistema e erros', 'Atividade dos gabinetes']) {
      await page.getByRole('tab', { name: aba }).click();
      const l = await rolagemLateral(page);
      expect(l.doc, aba).toBeLessThanOrEqual(l.janela);
    }
  });
});

test.describe('360 px: botões e campos com pelo menos 40 px de altura (ADM-16.2)', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  for (const t of TELAS) {
    test(`${t.nome}`, async ({ page }) => {
      await abre(page, t.rota, t.pronto);
      expect(await alvosBaixos(page)).toEqual([]);
    });
  }
  test('Equipe: o diálogo "Incluir pessoa" também respeita os 40 px e a largura', async ({ page }) => {
    await abre(page, '/admin/equipe', TELAS[1].pronto);
    await page.getByRole('button', { name: 'Incluir pessoa' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await alvosBaixos(page)).toEqual([]);
    const l = await rolagemLateral(page);
    expect(l.doc).toBeLessThanOrEqual(l.janela);
  });
});

test.describe('Privacidade e rotas (ADM-02, ADM-16)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('nenhuma resposta nem pedido das 5 telas traz dados, texto, nome civil ou telefone', async ({ page }) => {
    await semeiaSessao(page, 'admin');
    await moca(page, estado());
    for (const t of TELAS) {
      await page.goto(t.rota);
      await t.pronto(page);
    }
    // Logs: percorre também as outras abas e a página 2
    await page.getByRole('tab', { name: 'Ações da equipe' }).click();
    await expect(page.locator('[role=tabpanel] tbody tr').first()).toBeVisible();
    expect(chamadas().length).toBeGreaterThan(10); // houve tráfego de verdade para varrer
    expect(vazou()).toEqual([]);
  });

  test('leitura vê as 5 telas sem nenhum botão que altere dados', async ({ page }) => {
    const ALTERA = /^(Incluir|Remover|Editar|Adicionar|Arquivar|Desarquivar|Excluir)/;
    for (const t of TELAS) {
      await abre(page, t.rota, t.pronto, 'leitura');
      const rotulos = await page.getByRole('button').allInnerTexts();
      expect(rotulos.filter((r) => ALTERA.test(r.trim())), t.nome).toEqual([]);
      await expect(page.getByRole('button', { name: ALTERA })).toHaveCount(0);
      // o filtro de situação "Arquivados" da lista é seletor, não botão de alteração; o resto fica desabilitado ou ausente
      await expect(page.locator('.main select:not([disabled])').filter({ hasText: /admin|leitura|coordenacao|assessoria/ })).toHaveCount(0);
    }
  });

  test('/painel continua abrindo (rewrite para public/painel.html)', async ({ page }) => {
    const r = await page.request.get('/painel');
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('text/html');
    expect(await r.text()).toContain('<html');
    // o link do menu do /admin aponta para ele
    await abre(page, '/admin/analytics', TELAS[3].pronto);
    await expect(page.getByRole('link', { name: /Painel de métricas/ })).toHaveAttribute('href', '/painel');
  });
});
