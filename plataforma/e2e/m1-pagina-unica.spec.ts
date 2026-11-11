import { test, expect } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Missão 1 · cada etapa abre numa página só (PAG-01 a PAG-04). */
const ETAPAS: { id: string; nome: string; perguntas: string[] }[] = [
  { id: 'm1.persona', nome: 'A Persona', perguntas: [
    'Quem é a liderança parlamentar?',
    'Qual foi o seu desempenho eleitoral em todos os pleitos em que já concorreu?',
    'Qual é o desejo da liderança parlamentar para o futuro?'] },
  { id: 'm1.conjuntura', nome: 'A Conjuntura', perguntas: [
    'Como está posta a legislatura atual?',
    'Qual é a conjuntura política regional e nacional de seu partido?'] },
  { id: 'm1.oportunidades', nome: 'As Oportunidades e Ameaças', perguntas: [
    'Quais são as principais expectativas do eleitorado?',
    'Qual é a conjuntura social do território?',
    'Quais são as agendas prioritárias?'] },
  { id: 'm1.frag', nome: 'As Fragilidades e Fortalezas', perguntas: [
    'Quais são os conhecimentos e/ou práticas que a liderança parlamentar ou a equipe ainda não domina(m) para um bom exercício do mandato?'] },
];
const faixa = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'As 4 etapas do Mapa Político' });

test.describe('Cada etapa numa página só (PAG-01, PAG-02, PAG-03)', () => {
  for (const e of ETAPAS) {
    test(`${e.id}: todas as perguntas na mesma página, faixa na etapa atual e sem botões de avançar`, async ({ page }) => {
      await abreGuia(page, `#/m/1/${e.id}`);
      for (const p of e.perguntas) await expect(page.locator('#tela').getByText(p, { exact: false }).first()).toBeVisible();
      // a faixa marca só a etapa atual
      await expect(faixa(page).locator('[aria-current="step"]')).toHaveCount(1);
      await expect(faixa(page).locator('[aria-current="step"]')).toContainText(e.nome);
      // sem passo a passo: nada de barra de passos, Anterior, Avançar nem alternar modo
      await expect(page.locator('.passos-barra, .passo-conta')).toHaveCount(0);
      const rodape = page.locator('.passo-rodape');
      await expect(rodape.getByRole('button', { name: 'Anterior' })).toHaveCount(0);
      await expect(rodape.getByRole('button', { name: 'Avançar' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Ver tudo de uma vez|Voltar ao passo a passo/ })).toHaveCount(0);
      // ao fim da página, seguir para a etapa seguinte
      await expect(page.getByRole('button', { name: /Próximo exercício/ })).toBeVisible();
    });
  }

  test('o botão do fim da página leva à etapa seguinte', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona');
    await page.getByRole('button', { name: /Próximo exercício/ }).click();
    await expect(page).toHaveURL(/#\/m\/1\/m1\.conjuntura$/);
    await expect(faixa(page).locator('li').nth(1)).toHaveAttribute('aria-current', 'step');
  });
});

test.describe('Endereços antigos de passo (PAG-04)', () => {
  for (const id of ['m1.conjuntura', 'm1.oportunidades']) {
    test(`#/m/1/${id}/1 abre a página única da etapa`, async ({ page }) => {
      await abreGuia(page, `#/m/1/${id}/1`);
      const e = ETAPAS.find((x) => x.id === id)!;
      for (const p of e.perguntas) await expect(page.locator('#tela').getByText(p, { exact: false }).first()).toBeVisible();
      await expect(page.locator('.passo-rodape').getByRole('button', { name: 'Avançar' })).toHaveCount(0);
      await expect(page.locator('.passo-conta')).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`#/m/1/${id.replace('.', '\\.')}$`));
    });
  }
});

test.describe('As Missões 2 a 5 seguem no passo a passo (PAG-03)', () => {
  test('m3.legado mantém o botão de alternar modo e a conta de passos', async ({ page }) => {
    await abreGuia(page, '#/m/3/m3.legado');
    await expect(page.getByRole('button', { name: 'Ver tudo de uma vez' })).toBeVisible();
    await expect(page.locator('.passo-conta')).toBeVisible();
  });

  test('depois de passar pela Missão 1 o passo a passo volta nas outras missões', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona');
    await expect(page.getByRole('button', { name: /Ver tudo de uma vez/ })).toHaveCount(0);
    await page.evaluate(() => { location.hash = '#/m/3/m3.legado'; });
    await expect(page.getByRole('button', { name: 'Ver tudo de uma vez' })).toBeVisible();
  });
});
