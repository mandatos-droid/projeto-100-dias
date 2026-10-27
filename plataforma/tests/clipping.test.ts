import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leRss, dataDoRss, termoBusca, urlDoRss, criaBuscador, Limitador, LIMITE_BUSCAS_POR_HORA, trataClipping, type Dependencias, type Buscador } from '../lib/clipping.ts';

/* Missão 4 · busca de notícias (CAP-30, CAP-32). A fonte é sempre falsa: nenhum teste chama a internet. */
const item = (t: string, link: string, fonte = 'VEJA', pub = 'Sat, 24 Oct 2026 20:59:38 GMT') =>
  `<item><title>${t} - ${fonte}</title><link>${link}</link><guid>${link}</guid><pubDate>${pub}</pubDate>` +
  `<description>&lt;a href="${link}"&gt;${t}&lt;/a&gt; texto da matéria</description><source url="https://x.com">${fonte}</source></item>`;
const rss = (...itens: string[]) => `<?xml version="1.0"?><rss version="2.0"><channel><title>t</title>${itens.join('')}</channel></rss>`;

test('leRss: devolve título (sem o sufixo do veículo), veículo, data e link', () => {
  const r = leRss(rss(item('Projeto &amp; emenda: &quot;Educação&quot;', 'https://news.google.com/rss/articles/A?oc=5', 'O GLOBO')));
  assert.deepEqual(r, [{ titulo: 'Projeto & emenda: "Educação"', veiculo: 'O GLOBO', data: '2026-10-24', url: 'https://news.google.com/rss/articles/A?oc=5' }]);
});

test('leRss: remove duplicadas por link e por título; ignora item sem link válido', () => {
  const r = leRss(rss(
    item('Mesma notícia', 'https://g/1'), item('Outra', 'https://g/1'), item('Mesma  notícia!', 'https://g/2'),
    item('Sem link', 'javascript:x'), item('Distinta', 'https://g/3')));
  assert.deepEqual(r.map((i) => i.url), ['https://g/1', 'https://g/3']);
});

test('leRss: sem itens devolve lista vazia; formato inesperado lança erro', () => {
  assert.deepEqual(leRss(rss()), []);
  assert.throws(() => leRss('<html>captcha</html>'));
  assert.throws(() => leRss(''));
});

test('dataDoRss: usa o horário de Brasília e rejeita data inválida', () => {
  assert.equal(dataDoRss('Sat, 24 Oct 2026 02:00:00 GMT'), '2026-10-23');
  assert.equal(dataDoRss('lixo'), '');
});

test('termoBusca/urlDoRss: nome entre aspas, OR com nome de urna diferente, 7 dias', () => {
  assert.equal(termoBusca('Ana "Souza"'), '"Ana Souza"');
  assert.equal(termoBusca('Ana Souza', 'ana souza'), '"Ana Souza"');
  assert.equal(termoBusca('Ana Souza', 'Aninha'), '"Ana Souza" OR "Aninha"');
  const u = urlDoRss('Ana Souza');
  assert.match(u, /^https:\/\/news\.google\.com\/rss\/search\?q=%22Ana%20Souza%22\+when:7d&hl=pt-BR&gl=BR&ceid=BR:pt-419$/);
  assert.match(urlDoRss('A', '', 999), /when:30d/);
});

test('criaBuscador: sucesso, status ruim, formato inesperado e falha de rede viram resultado tratável, nunca exceção', async () => {
  const resp = (corpo: string, status = 200) => (async () => new Response(corpo, { status })) as unknown as typeof fetch;
  const ok = await criaBuscador(resp(rss(item('A', 'https://g/1'))))('Ana');
  assert.equal(ok.ok && ok.itens.length, 1);
  assert.equal((await criaBuscador(resp('x', 503))('Ana')).ok, false);
  assert.equal((await criaBuscador(resp('<html/>'))('Ana')).ok, false);
  assert.equal((await criaBuscador((async () => { throw new Error('rede'); }) as unknown as typeof fetch)('Ana')).ok, false);
});

test('o limite de buscas por hora é 10 (CAP-32) e é o padrão do Limitador', () => {
  assert.equal(LIMITE_BUSCAS_POR_HORA, 10);
  const l = new Limitador();
  for (let i = 0; i < 10; i++) assert.equal(l.tenta('m'), true);
  assert.equal(l.tenta('m'), false);
});

test('Limitador: 10 por hora por chave, a 11ª é recusada, chaves independentes, libera depois da janela', () => {
  let t = 0;
  const l = new Limitador(10, 3600000, () => t);
  for (let i = 0; i < 10; i++) assert.equal(l.tenta('m1'), true);
  assert.equal(l.tenta('m1'), false);
  assert.equal(l.tenta('m2'), true);
  t = 3600001;
  assert.equal(l.tenta('m1'), true);
});

const deps = (extra: Partial<Dependencias> = {}): Dependencias & { chamadas: number } => {
  const d = {
    chamadas: 0,
    usuario: async (tk: string) => (tk === 'bom' ? 'u1' : null),
    membro: async (_t: string, m: string) => m === 'm1',
    busca: (async () => { d.chamadas++; return { ok: true as const, itens: [{ titulo: 'T', veiculo: 'V', data: '2026-10-24', url: 'https://g/1', texto: 'MATÉRIA', description: 'x' } as never] }; }) as Buscador,
    limitador: new Limitador(10, 3600000),
    ...extra,
  };
  return d;
};
const pedido = { nome: 'Ana Souza', mandatoId: 'm1' };

test('rota: sem login ou token inválido responde 401 e não busca', async () => {
  const d = deps();
  for (const aut of [null, '', 'Bearer ruim', 'Basic bom']) assert.equal((await trataClipping(aut, pedido, d)).status, 401);
  assert.equal(d.chamadas, 0);
});

test('rota: falha ao validar o token também é 401 (não vira exceção)', async () => {
  const d = deps({ usuario: async () => { throw new Error('supabase fora'); } });
  assert.equal((await trataClipping('Bearer bom', pedido, d)).status, 401);
});

test('rota: pedido inválido responde 400; mandato de outra pessoa responde 403', async () => {
  const d = deps();
  for (const c of [null, {}, { nome: '  ', mandatoId: 'm1' }, { nome: 'Ana' }, { nome: 'x'.repeat(121), mandatoId: 'm1' }])
    assert.equal((await trataClipping('Bearer bom', c, d)).status, 400);
  assert.equal((await trataClipping('Bearer bom', { nome: 'Ana', mandatoId: 'outro' }, d)).status, 403);
  assert.equal(d.chamadas, 0);
});

test('rota: a 11ª busca na hora é recusada com 429; a recusada não chama a fonte', async () => {
  const d = deps();
  for (let i = 0; i < LIMITE_BUSCAS_POR_HORA; i++) assert.equal((await trataClipping('Bearer bom', pedido, d)).status, 200);
  const r = await trataClipping('Bearer bom', pedido, d);
  assert.equal(r.status, 429);
  assert.equal(d.chamadas, 10);
});

test('rota: a resposta tem só título, veículo, data e link', async () => {
  const r = await trataClipping('Bearer bom', pedido, deps());
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo, { itens: [{ titulo: 'T', veiculo: 'V', data: '2026-10-24', url: 'https://g/1' }] });
});

test('rota: falha da fonte devolve 502 com mensagem amigável, mesmo se a fonte lançar exceção', async () => {
  for (const busca of [(async () => ({ ok: false as const, erro: 'x' })) as Buscador, (async () => { throw new Error('boom'); }) as Buscador]) {
    const r = await trataClipping('Bearer bom', pedido, deps({ busca }));
    assert.equal(r.status, 502);
    assert.match(String(r.corpo.erro), /Não consegui buscar agora/);
  }
});

test('rota: repassa o nome de urna e os dias à fonte', async () => {
  let visto: unknown;
  const busca: Buscador = async (n, o) => { visto = [n, o]; return { ok: true, itens: [] }; };
  const r = await trataClipping('Bearer bom', { ...pedido, nomeUrna: 'Aninha', dias: 7 }, deps({ busca }));
  assert.equal(r.status, 200);
  assert.deepEqual(visto, ['Ana Souza', { nomeUrna: 'Aninha', dias: 7 }]);
});
