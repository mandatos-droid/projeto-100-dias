import type { Page } from '@playwright/test';

/** Abre a rota de teste com as ilhas pedidas e `D.campos` já preenchido. Resolve quando as ilhas montaram. */
export async function abre(page: Page, ilhas: string[], campos: Record<string, string> = {}) {
  /* a semente vale só na primeira carga da aba: recarregar tem de mostrar o que ficou salvo */
  await page.addInitScript((c) => {
    if (sessionStorage.getItem('semeado')) return;
    sessionStorage.setItem('semeado', '1');
    (window as unknown as { __semente: unknown }).__semente = { campos: c };
  }, campos);
  await page.goto(`/teste-equipe?ilha=${ilhas.join(',')}`);
  await page.locator('#tela[data-pronto="true"]').waitFor();
}

/** Lê D.campos do navegador (o estado real que o Guia salvaria). */
export const camposDe = (page: Page) => page.evaluate(() => (window as unknown as { D: { campos: Record<string, string> } }).D.campos);
