import type { Page } from '@playwright/test';

/* Abre o Guia de verdade (/guia, todos os scripts do legado) em modo local: o nucleo.js é reescrito só na resposta do teste
   para NUVEM=false, de modo que nada chega ao Supabase (em localhost o app apontaria para o projeto real). O estado vem do
   localStorage, semeado uma vez por aba (recarregar mostra o que ficou salvo). */
export interface MandatoReal {
  dados?: Record<string, unknown>;
  mandato?: Record<string, string>;
  eventos?: { texto: string; autor: string; criado_em: string }[];
}

export const MANDATO_REAL: Record<string, string> = {
  nome_parlamentar: 'Ana Souza', cargo: 'Deputado(a) Estadual', casa: 'Assembleia Legislativa', uf: 'SP', data_posse: '2027-02-01',
};

export async function abreGuia(page: Page, hash = '#/', m: MandatoReal = {}) {
  await page.route('**/legacy/nucleo.js', async (rota) => {
    const r = await rota.fetch();
    const corpo = (await r.text()).replace('var NUVEM=!!(CONFIG.url&&CONFIG.key);', 'var NUVEM=false;');
    await rota.fulfill({ response: r, body: corpo });
  });
  await page.addInitScript((s) => {
    if (sessionStorage.getItem('guia-real-semeado')) return;
    sessionStorage.setItem('guia-real-semeado', '1');
    const u = { id: 'u_teste', email: 'teste@legisla.test', nome: 'Teste' };
    const mand = {
      id: 'm_teste', codigo: 'ABC234', ...s.mandato, membros: [{ user_id: u.id, nome: u.nome, email: u.email, papel: 'coordenacao' }],
      eventos: s.eventos ?? [], dados: s.dados ?? {},
    };
    localStorage.setItem('legisla.regimento.v3', JSON.stringify({ sessao: u, usuarios: { [u.email]: u }, mandatos: { m_teste: mand } }));
    localStorage.setItem('legisla.mandatoAtual', 'm_teste');
  }, { mandato: m.mandato ?? MANDATO_REAL, dados: m.dados, eventos: m.eventos });
  await page.goto(`/guia${hash}`);
  await page.locator('#ladoNav .it').first().waitFor();
}

/** Lê o mandato salvo (o que a nuvem receberia). */
export const salvoDe = (page: Page) => page.evaluate(() => {
  const b = JSON.parse(localStorage.getItem('legisla.regimento.v3') ?? '{}');
  return Object.values(b.mandatos ?? {})[0] as { dados: Record<string, unknown>; eventos: { texto: string }[] };
});
