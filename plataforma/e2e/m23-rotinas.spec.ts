import { test, expect, type Page } from '@playwright/test';
import { abre, camposDe } from './semente';

/* Missão 2 · Mão na massa 2: quadro-modelo de rotinas (RM2-50 a 58). */
const ILHA = 'quadro-rotinas';
const R = [
  { id: 'plan', titulo: 'Planejamento estratégico', freq: 'Quadrimestralmente', quem: 'Todos', dur: '2 períodos de 6h' },
  { id: 'mensal', titulo: 'Monitoramento de avanços do trabalho previsto para o mês (acompanhamento de metas)', freq: 'Mensalmente', quem: 'Todos', dur: '1h' },
  { id: 'semanal', titulo: 'Alinhamento de atualização coletiva e expectativas do trabalho da semana', freq: 'Semanalmente', quem: 'Todos', dur: '1h' },
  { id: 'area', titulo: 'Reunião de distribuição de trabalho dentro de cada área', freq: 'Semanalmente', quem: 'Assessores e Coordenação de uma área específica', dur: '45 min' },
  { id: 'feedback', titulo: 'Reunião de feedback estruturado individual', freq: 'Semestralmente', quem: 'Liderança e Assessores (individualmente)', dur: '30 min por reunião' },
];
const agenda = async (page: Page, r: (typeof R)[number], data: string, hora: string) => {
  await page.getByLabel(`Data de início: ${r.titulo}`).fill(data);
  await page.getByLabel(`Horário de início: ${r.titulo}`).fill(hora);
};

test('o quadro mostra as 5 rotinas do documento, com frequência, participantes e duração (RM2-51)', async ({ page }) => {
  await abre(page, [ILHA]);
  await expect(page.locator('[data-rotina]')).toHaveCount(5);
  await expect(page.getByRole('columnheader', { name: 'Quando o mandato iniciará a rotina?' })).toBeVisible();
  for (const r of R) {
    const linha = page.locator(`[data-rotina="${r.id}"]`);
    await expect(linha.getByRole('rowheader')).toContainText(r.titulo);
    await expect(page.getByLabel(`Frequência: ${r.titulo}`)).toHaveValue(r.freq);
    await expect(page.getByLabel(`Quem participa: ${r.titulo}`)).toHaveValue(r.quem);
    await expect(page.getByLabel(`Duração média: ${r.titulo}`)).toHaveValue(r.dur);
  }
  await expect(page.locator('[data-contador]')).toHaveText('0 de 5 agendadas');
});

test('preencher data e horário das 5 mostra "5 de 5 agendadas" (RM2-52)', async ({ page }) => {
  await abre(page, [ILHA]);
  for (const [k, r] of R.entries()) {
    await agenda(page, r, '2030-03-0' + (k + 1), '09:00');
    await expect(page.locator('[data-contador]')).toHaveText(`${k + 1} de 5 agendadas`);
  }
  await expect(page.locator('[data-concluida]')).toContainText('Você já pode marcar o exercício como concluído');
  const rq = JSON.parse((await camposDe(page))['m2.rq']);
  expect(rq.plan).toEqual({ data: '2030-03-01', hora: '09:00' });
});

test('só data, sem horário, não conta como agendada (RM2-52)', async ({ page }) => {
  await abre(page, [ILHA]);
  await page.getByLabel(`Data de início: ${R[0].titulo}`).fill('2030-03-01');
  await expect(page.locator('[data-contador]')).toHaveText('0 de 5 agendadas');
});

test('editar a duração da 1ª rotina e reabrir mantém a edição, sem tocar nas outras (RM2-53)', async ({ page }) => {
  await abre(page, [ILHA]);
  await page.getByLabel(`Duração média: ${R[0].titulo}`).fill('2 períodos de 4h');
  await page.reload();
  await page.locator('#tela[data-pronto="true"]').waitFor();
  await expect(page.getByLabel(`Duração média: ${R[0].titulo}`)).toHaveValue('2 períodos de 4h');
  await expect(page.getByLabel(`Duração média: ${R[1].titulo}`)).toHaveValue('1h');
  await expect(page.getByLabel(`Frequência: ${R[0].titulo}`)).toHaveValue('Quadrimestralmente');
  expect(JSON.parse((await camposDe(page))['m2.rq'])).toEqual({ plan: { dur: '2 períodos de 4h' } });
});

test('frequência e participantes também se alteram; apagar o campo volta ao texto da Legisla (RM2-53)', async ({ page }) => {
  await abre(page, [ILHA]);
  const freq = page.getByLabel(`Frequência: ${R[2].titulo}`);
  await freq.fill('Quinzenalmente');
  await page.getByLabel(`Quem participa: ${R[2].titulo}`).fill('Só a coordenação');
  expect(JSON.parse((await camposDe(page))['m2.rq']).semanal).toEqual({ freq: 'Quinzenalmente', quem: 'Só a coordenação' });
  await freq.fill('');
  await freq.blur();
  await expect(freq).toHaveValue('Semanalmente');
  expect(JSON.parse((await camposDe(page))['m2.rq']).semanal).toEqual({ quem: 'Só a coordenação' });
});

test('data anterior a hoje avisa sem bloquear, e a rotina conta como agendada (RM2-54)', async ({ page }) => {
  await abre(page, [ILHA]);
  await expect(page.getByText('Essa data já passou')).toHaveCount(0);
  await agenda(page, R[0], '2020-01-15', '08:30');
  await expect(page.getByText('Essa data já passou. Você pode mantê-la, é só um aviso.')).toBeVisible();
  await expect(page.locator('[data-contador]')).toHaveText('1 de 5 agendadas');
  await agenda(page, R[0], '2031-01-15', '08:30');
  await expect(page.getByText('Essa data já passou')).toHaveCount(0);
});

test('desligar uma rotina tira a exigência de data dela (RM2-57)', async ({ page }) => {
  await abre(page, [ILHA]);
  for (const r of R.slice(0, 4)) await agenda(page, r, '2030-04-01', '10:00');
  await expect(page.locator('[data-contador]')).toHaveText('4 de 5 agendadas');
  await expect(page.locator('[data-concluida]')).toHaveCount(0);
  await page.getByLabel(`Rotina ligada: ${R[4].titulo}`).uncheck();
  await expect(page.locator('[data-contador]')).toHaveText('4 de 4 agendadas');
  await expect(page.getByLabel(`Data de início: ${R[4].titulo}`)).toBeDisabled();
  await expect(page.locator('[data-concluida]')).toContainText('Você já pode marcar o exercício como concluído');
  await page.getByLabel(`Rotina ligada: ${R[4].titulo}`).check();
  await expect(page.locator('[data-contador]')).toHaveText('4 de 5 agendadas');
  expect((await camposDe(page))['m2.rq']).not.toContain('"on"'); // ligada é o padrão: não fica gravado
});

test('com a tabela de equipe preenchida, a reunião de distribuição lista as áreas do mandato (RM2-56)', async ({ page }) => {
  await abre(page, [ILHA], {
    'm2.n': '3', 'm2.on': '0|20|21',
    'm2.p1.cat': 'Chefia', 'm2.p1.coord': 'Chefia de área',
    'm2.p21.cat': 'Coordenação', 'm2.p21.coord': 'Legislativo',
    'm2.p22.cat': 'Coordenação', 'm2.p22.coord': 'Comunicação',
  });
  await expect(page.locator('[data-rotina="area"] [data-areas]')).toHaveText('Áreas do mandato: Legislativo, Comunicação');
  await expect(page.locator('[data-rotina="plan"] [data-areas]')).toHaveCount(0);
});
