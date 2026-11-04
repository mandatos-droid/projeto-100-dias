import { test, expect, type Page } from '@playwright/test';
import { abre } from './semente';

/* Missão 2 · "Gerar PDF do organograma e rotinas" (RM2-61, RM2-63). A impressão do navegador não é testável de fora:
   o teste espiona window.print, emula a mídia de impressão e confere o que está visível no instante da chamada. */
const ILHA = 'pdf-org-rotinas';
const linha = (i: number, v: { pessoa: string; cargo: string; cat: string; coord: string; lider: string }) => ({
  [`m2.p${i + 1}.esc`]: 'Escopo', [`m2.p${i + 1}.comp`]: 'Competências', [`m2.p${i + 1}.nome_cargo`]: v.cargo, [`m2.f${i + 1}`]: v.pessoa,
  [`m2.p${i + 1}.cat`]: v.cat, [`m2.p${i + 1}.coord`]: v.coord, [`m2.p${i + 1}.lider`]: v.lider,
});
const equipe: Record<string, string> = {
  'm2.n': '3', 'm2.on': '0|20|21',
  ...linha(0, { pessoa: 'Ana Souza', cargo: 'Chefe de gabinete', cat: 'Chefia', coord: 'Chefia de área', lider: '-' }),
  ...linha(20, { pessoa: 'Bia Lima', cargo: 'Coordenadora Legislativa', cat: 'Coordenação', coord: 'Legislativo', lider: '0' }),
  ...linha(21, { pessoa: 'Caio Reis', cargo: 'Assessor legislativo', cat: 'Executora', coord: 'Legislativo', lider: '20' }),
};
const rq = JSON.stringify({ plan: { data: '2030-03-04', hora: '09:00' }, mensal: { on: false } });

type Foto = { classe: boolean; pdf: string; secoes: string[]; outros: string[]; texto: string; quebra: string; svgs: number };
/** troca window.print por um espião que fotografa o estado da página no instante da chamada */
const espia = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { __fotos: unknown[] };
  w.__fotos = [];
  window.print = () => {
    const pdf = document.querySelector('.pdf-org') as HTMLElement;
    w.__fotos.push({
      classe: document.body.classList.contains('imprimindo-org'),
      pdf: getComputedStyle(pdf).display,
      secoes: [...pdf.querySelectorAll('section')].map((s) => (s as HTMLElement).dataset.pdf),
      outros: [...document.body.children].filter((e) => !e.classList.contains('pdf-org') && e.tagName !== 'SCRIPT').map((e) => getComputedStyle(e).display),
      texto: pdf.innerText,
      quebra: getComputedStyle(pdf.querySelector('section') as HTMLElement).breakAfter,
      svgs: pdf.querySelectorAll('svg').length,
    });
  };
});
const fotos = (page: Page) => page.evaluate(() => (window as unknown as { __fotos: Foto[] }).__fotos);

test('em mídia de impressão só o organograma (página 1) e o quadro de rotinas ficam visíveis (RM2-61)', async ({ page }) => {
  await abre(page, [ILHA], { ...equipe, 'm2.rq': rq });
  await expect(page.locator('.pdf-org')).toBeHidden(); // na tela o bloco não aparece
  await page.emulateMedia({ media: 'print' });
  await espia(page);
  await page.evaluate(() => { document.querySelector<HTMLButtonElement>('button')!.click(); });
  const [f] = await fotos(page);
  expect(f.classe).toBe(true);
  expect(f.pdf).toBe('block');
  expect(f.secoes).toEqual(['organograma', 'rotinas']);
  expect(f.outros.length).toBeGreaterThan(0);
  expect(f.outros.every((d) => d === 'none')).toBe(true); // o resto da página some
  expect(f.quebra).toBe('page'); // o organograma ocupa a página 1
  expect(f.svgs).toBe(1);
  expect(f.texto).toContain('Organograma do mandato');
  expect(f.texto).toContain('Rotinas do mandato');
  expect(f.texto).toContain('Planejamento estratégico');
  expect(f.texto).toContain('04/03/2030 às 09:00');
  expect(f.texto).not.toContain('Monitoramento de avanços'); // rotina desligada fica de fora
  await expect(page.locator('.pdf-org svg')).toContainText('Bia Lima');
});

test('o botão chama window.print uma vez e limpa imprimindo-org depois (RM2-61)', async ({ page }) => {
  await abre(page, [ILHA], equipe);
  await espia(page);
  await page.getByRole('button', { name: 'Gerar PDF do organograma e rotinas' }).click();
  expect(await fotos(page)).toHaveLength(1);
  expect(await page.evaluate(() => document.body.classList.contains('imprimindo-org'))).toBe(false);
  await expect(page.locator('.pdf-org')).toBeHidden();
});

test('sem linhas na tabela, o PDF traz só as rotinas e a plataforma avisa (RM2-63)', async ({ page }) => {
  await abre(page, [ILHA]);
  await page.emulateMedia({ media: 'print' });
  await espia(page);
  await page.evaluate(() => { document.querySelector<HTMLButtonElement>('button')!.click(); });
  const [f] = await fotos(page);
  expect(f.secoes).toEqual(['rotinas']);
  expect(f.svgs).toBe(0);
  expect(f.texto).not.toContain('Organograma do mandato');
  expect(f.texto).toContain('Reunião de feedback estruturado individual');
  await expect(page.locator('#avisos')).toContainText('O organograma ainda não existe');
});
