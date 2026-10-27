/* Missão 4 · busca de notícias do clipping (CAP-30, CAP-32). A fonte (RSS do Google Notícias, não oficial) fica
   atrás de buscaNoticias(): trocar de fonte não muda a rota nem a tela. Só metadados: título, veículo, data e link. */

export type Item = { titulo: string; veiculo: string; data: string; url: string };
export type Busca = { ok: true; itens: Item[] } | { ok: false; erro: string };
export type Buscador = (nome: string, opcoes?: { nomeUrna?: string; dias?: number }) => Promise<Busca>;

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decodifica = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (t, e: string) => {
      if (e[0] === '#') {
        const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : t;
      }
      return ENTIDADES[e.toLowerCase()] ?? t;
    })
    .trim();

const tag = (bloco: string, nome: string) => {
  const m = new RegExp(`<${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</${nome}>`, 'i').exec(bloco);
  return m ? decodifica(m[1]) : '';
};

/** Data do RSS (RFC 822, GMT) → "AAAA-MM-DD" no horário de Brasília (UTC-3). Inválida → "". */
export function dataDoRss(pubDate: string): string {
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return '';
  return new Date(t - 3 * 3600000).toISOString().slice(0, 10);
}

const chaveTitulo = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Lê o XML do RSS e devolve os itens sem duplicadas (mesmo link ou mesmo título). Lança erro se não parecer um RSS. */
export function leRss(xml: string): Item[] {
  if (!/<rss[\s>]/i.test(xml) || !/<channel[\s>]/i.test(xml)) throw new Error('formato inesperado');
  const itens: Item[] = [];
  const vistosUrl = new Set<string>(), vistosTitulo = new Set<string>();
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const bloco = m[1];
    const veiculo = tag(bloco, 'source');
    let titulo = tag(bloco, 'title');
    if (veiculo && titulo.endsWith(` - ${veiculo}`)) titulo = titulo.slice(0, -(veiculo.length + 3)).trim();
    const url = tag(bloco, 'link');
    if (!titulo || !/^https?:\/\//i.test(url)) continue;
    const ct = chaveTitulo(titulo);
    if (vistosUrl.has(url) || vistosTitulo.has(ct)) continue;
    vistosUrl.add(url); vistosTitulo.add(ct);
    itens.push({ titulo, veiculo, data: dataDoRss(tag(bloco, 'pubDate')), url });
  }
  return itens;
}

/** Termo da busca: "Nome Parlamentar" entre aspas; se houver nome de urna diferente, acrescenta OR "Nome de urna". */
export function termoBusca(nome: string, nomeUrna?: string): string {
  const limpa = (s: string) => s.replace(/["\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const a = limpa(nome), b = limpa(nomeUrna ?? '');
  return b && b.toLowerCase() !== a.toLowerCase() ? `"${a}" OR "${b}"` : `"${a}"`;
}

export const urlDoRss = (nome: string, nomeUrna?: string, dias = 7) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(termoBusca(nome, nomeUrna))}+when:${Math.min(30, Math.max(1, Math.round(dias)))}d&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

/** A fonte do clipping. Nunca lança: falha de rede, status ruim ou formato inesperado viram { ok: false }. */
export function criaBuscador(buscar: typeof fetch = fetch): Buscador {
  return async (nome, opcoes = {}) => {
    try {
      const r = await buscar(urlDoRss(nome, opcoes.nomeUrna, opcoes.dias ?? 7), {
        headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store', signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) return { ok: false, erro: `fonte respondeu ${r.status}` };
      return { ok: true, itens: leRss(await r.text()) };
    } catch (e) {
      return { ok: false, erro: e instanceof Error ? e.message : 'falha na fonte' };
    }
  };
}
export const buscaNoticias: Buscador = (nome, opcoes) => criaBuscador()(nome, opcoes);

/** Limite de buscas por janela, por chave (aqui, o mandato). Guarda só horários, na memória do servidor. */
export class Limitador {
  private usos = new Map<string, number[]>();
  private max: number;
  private janelaMs: number;
  private agora: () => number;
  constructor(max = 10, janelaMs = 3600000, agora: () => number = Date.now) {
    this.max = max; this.janelaMs = janelaMs; this.agora = agora;
  }
  /** Tenta gastar uma busca. false = limite atingido (não conta a recusada). */
  tenta(chave: string): boolean {
    const t = this.agora();
    const recentes = (this.usos.get(chave) ?? []).filter((x) => t - x < this.janelaMs);
    if (recentes.length >= this.max) { this.usos.set(chave, recentes); return false; }
    recentes.push(t); this.usos.set(chave, recentes);
    return true;
  }
}

export type Dependencias = {
  /** Valida o token da sessão e devolve o id do usuário (ou null). */
  usuario: (token: string) => Promise<string | null>;
  /** O usuário é membro do mandato? */
  membro: (token: string, mandatoId: string, usuarioId: string) => Promise<boolean>;
  busca: Buscador;
  limitador: Limitador;
};
export type Resposta = { status: number; corpo: Record<string, unknown> };

/** Regras da rota: 401 sem login, 400 pedido inválido, 403 fora do mandato, 429 acima de 10/hora, 502 fonte fora do ar. */
export async function trataClipping(autorizacao: string | null, corpo: unknown, d: Dependencias): Promise<Resposta> {
  const token = /^Bearer\s+(\S+)$/i.exec(autorizacao ?? '')?.[1];
  const uid = token ? await d.usuario(token).catch(() => null) : null;
  if (!token || !uid) return { status: 401, corpo: { erro: 'Faça login para buscar notícias.' } };

  const b = (corpo && typeof corpo === 'object' ? corpo : {}) as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  const urna = typeof b.nomeUrna === 'string' ? b.nomeUrna.trim() : '';
  const mandatoId = typeof b.mandatoId === 'string' ? b.mandatoId.trim() : '';
  const dias = typeof b.dias === 'number' && Number.isFinite(b.dias) ? b.dias : 7;
  if (!nome || nome.length > 120 || urna.length > 120 || !mandatoId || mandatoId.length > 80)
    return { status: 400, corpo: { erro: 'Informe o nome parlamentar e o mandato.' } };

  if (!(await d.membro(token, mandatoId, uid).catch(() => false)))
    return { status: 403, corpo: { erro: 'Esse mandato não é seu.' } };
  if (!d.limitador.tenta(mandatoId))
    return { status: 429, corpo: { erro: 'Limite de 10 buscas por hora atingido. Tente mais tarde ou adicione manualmente.' } };

  const r = await d.busca(nome, { nomeUrna: urna || undefined, dias }).catch(() => ({ ok: false as const, erro: 'falha' }));
  if (!r.ok) return { status: 502, corpo: { erro: 'Não consegui buscar agora. Adicione manualmente.' } };
  // só os 4 campos, nunca texto de matéria
  return { status: 200, corpo: { itens: r.itens.map(({ titulo, veiculo, data, url }) => ({ titulo, veiculo, data, url })) } };
}
