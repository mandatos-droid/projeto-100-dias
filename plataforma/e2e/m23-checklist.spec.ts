import { test, expect } from '@playwright/test';
import { abre, camposDe } from './semente';

/* Missão 2 · sugestão do checklist (m2.c1..c3) pelo novo desenho (RM2-57). */
const ILHA = 'm2-sugestao-checklist';
const C1 = 'Escopo de trabalho de cada cargo definido';
const C3 = 'Fluxos de trabalho e rotinas de comunicação estabelecidos';
const linha = (n: number, cat: string, area: string, esc: string) => ({
  [`m2.p${n}.esc`]: esc, [`m2.p${n}.nome_cargo`]: `Cargo ${n}`, [`m2.f${n}`]: `Pessoa ${n}`, [`m2.p${n}.cat`]: cat, [`m2.p${n}.coord`]: area,
});
const equipe = (esc2 = 'Coordenar o legislativo') => ({
  'm2.on': '0|20', 'm2.n': '2', ...linha(1, 'Chefia', 'Chefia de área', 'Coordenar o gabinete'), ...linha(21, 'Coordenação', 'Legislativo', esc2),
});
const agendadas = JSON.stringify(Object.fromEntries(['plan', 'mensal', 'semanal', 'area', 'feedback'].map((id) => [id, { data: '2030-03-01', hora: '09:00' }])));

test('escopo em todas as linhas sugere c1 e só "Marcar como pronto" grava (RM2-57)', async ({ page }) => {
  await abre(page, [ILHA], equipe());
  const sug = page.getByRole('status').filter({ hasText: 'Sugestão' });
  await expect(sug).toContainText(C1);
  await expect(sug).not.toContainText(C3);
  expect((await camposDe(page))['m2.c1']).toBeUndefined(); // sugerir não grava
  await sug.getByRole('button', { name: `Marcar como pronto: ${C1}` }).click();
  expect((await camposDe(page))['m2.c1']).toBeTruthy();
  await expect(page.getByText(C1)).toHaveCount(0); // marcado, a sugestão some
});

test('sem escopo em alguma linha, c1 não é sugerido (RM2-57)', async ({ page }) => {
  await abre(page, [ILHA], equipe(''));
  await expect(page.getByText(C1)).toHaveCount(0);
});

test('com as rotinas ligadas todas agendadas, c3 é sugerido e só o botão grava (RM2-57)', async ({ page }) => {
  await abre(page, [ILHA], { ...equipe(''), 'm2.rq': agendadas });
  const sug = page.getByRole('status').filter({ hasText: 'Sugestão' });
  await expect(sug).toContainText(C3);
  expect((await camposDe(page))['m2.c3']).toBeUndefined();
  await sug.getByRole('button', { name: `Marcar como pronto: ${C3}` }).click();
  expect((await camposDe(page))['m2.c3']).toBeTruthy();
});

test('sem rotinas agendadas, c3 não é sugerido (RM2-57)', async ({ page }) => {
  await abre(page, [ILHA], equipe());
  await expect(page.getByText(C3)).toHaveCount(0);
});
