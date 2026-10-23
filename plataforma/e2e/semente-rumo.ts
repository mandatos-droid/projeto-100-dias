import type { Page } from '@playwright/test';

/** O que a rota de teste coloca em D e Store antes de montar as ilhas da Missão 3. */
export interface Semente {
  campos?: Record<string, string>;
  /** listas e estado de D: metas, preditores, comissoesDesejadas, rumo */
  D?: Record<string, unknown>;
  /** Store.mandato: cargo, casa, uf, nome_parlamentar, data_posse */
  mandato?: Record<string, string>;
}

/** Mandato de teste: Deputado(a) Estadual de SP, posse em 2027. */
export const MANDATO: Record<string, string> = { cargo: 'Deputado(a) Estadual', casa: 'Assembleia Legislativa', uf: 'SP', nome_parlamentar: 'Ana Souza', data_posse: '2027-02-01' };
/** Missão 2 de teste: 4 cadeiras ativas, todas com nome. */
export const EQUIPE: Record<string, string> = {
  'm2.on': '0|1|2|3', 'm2.f1': 'Ana Souza', 'm2.f2': 'Bruno Lima', 'm2.f3': 'Carla Dias', 'm2.f4': 'Davi Rocha',
};

/** Abre a rota de teste com as ilhas pedidas e o estado semeado. Resolve quando as ilhas montaram. */
export async function abre(page: Page, ilhas: string[], semente: Semente = {}) {
  /* a semente vale só na primeira carga da aba: recarregar tem de mostrar o que ficou salvo */
  await page.addInitScript((s) => {
    if (sessionStorage.getItem('semeado')) return;
    sessionStorage.setItem('semeado', '1');
    (window as unknown as { __semente: unknown }).__semente = s;
  }, semente);
  await page.goto(`/teste-rumo?ilha=${ilhas.join(',')}`);
  await page.locator('#tela[data-pronto="true"]').waitFor();
}

type Janela = { D: { campos: Record<string, string> } & Record<string, unknown> };
/** Lê D.campos do navegador (o estado real que o Guia salvaria). */
export const camposDe = (page: Page) => page.evaluate(() => (window as unknown as Janela).D.campos);
/** Lê uma chave de D (metas, preditores, rumo, comissoesDesejadas). */
export const dadoDe = (page: Page, chave: string) => page.evaluate((k) => (window as unknown as Janela).D[k], chave);
