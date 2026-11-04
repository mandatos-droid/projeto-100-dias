/* Missão 4 · acompanhamento semanal da comunicação: regras puras (sem DOM). Semana ISO (segunda a domingo), um registro por seção
   por semana. Dados em D.comunicacao = { semanas: { "2026-W44": { k1: { seguidores: 10, ... } } }, clipping: [...] }. */

export type Campo = { id: string; rot: string; ajuda: string };
export type Secao = { id: string; caixinha: string; titulo: string; curto: string; principal: string; campos: Campo[] };
export type Valores = Record<string, number>;
export type Semanas = Record<string, Record<string, Valores>>;
export type Noticia = { id: string; semana: string; titulo: string; veiculo: string; data: string; url: string; bandeiras: string[]; manual?: boolean; oculta?: boolean };
/** `meses`: registros mensais ("2026-11"); `datas`: dia do registro semanal (semana → seção → "AAAA-MM-DD"). Os dois só existem quando há dado (SUG-50, SUG-51). */
export type Comunicacao = { semanas: Semanas; clipping: Noticia[]; meses?: Semanas; datas?: Record<string, Record<string, string>> };

/** As 5 seções do Guia (os títulos repetem os de m4.k1..k5) e os números de cada uma. `caixinha` é a chave antiga em D.campos. */
export const SECOES: Secao[] = [
  { id: 'k1', caixinha: 'm4.k1', titulo: 'Alcance e crescimento da comunidade', curto: 'Alcance', principal: 'alcance', campos: [
    { id: 'seguidores', rot: 'Seguidores (total)', ajuda: 'Onde achar? Na página inicial das estatísticas da rede social.' },
    { id: 'novos', rot: 'Novos seguidores na semana', ajuda: 'Onde achar? Nas estatísticas de público da rede.' },
    { id: 'alcance', rot: 'Alcance ou visualizações', ajuda: 'Onde achar? Nas estatísticas de conteúdo, no período de 7 dias.' }] },
  { id: 'k2', caixinha: 'm4.k2', titulo: 'Compartilhamentos, comentários e respostas', curto: 'Interações', principal: 'comentarios', campos: [
    { id: 'compartilhamentos', rot: 'Compartilhamentos', ajuda: 'Onde achar? Nas estatísticas de interações da rede.' },
    { id: 'comentarios', rot: 'Comentários recebidos', ajuda: 'Onde achar? Nas estatísticas de interações da rede.' },
    { id: 'respostas', rot: 'Respostas dadas pelo mandato', ajuda: 'Conte à mão as respostas que o mandato deu na semana.' }] },
  { id: 'k3', caixinha: 'm4.k3', titulo: 'Mensagens recebidas e encaminhadas', curto: 'Mensagens', principal: 'recebidas', campos: [
    { id: 'recebidas', rot: 'Mensagens recebidas', ajuda: 'Onde achar? Na caixa de mensagens ou no aplicativo de atendimento.' },
    { id: 'encaminhadas', rot: 'Mensagens encaminhadas', ajuda: 'Quantas foram repassadas à equipe ou a outro órgão.' }] },
  { id: 'k4', caixinha: 'm4.k4', titulo: 'Participação gerada por campanhas e convites', curto: 'Campanhas', principal: 'participaram', campos: [
    { id: 'convites', rot: 'Convites enviados', ajuda: 'Conte os convites feitos na semana.' },
    { id: 'participaram', rot: 'Pessoas que participaram', ajuda: 'Conte quem compareceu ou respondeu ao convite.' }] },
  { id: 'k5', caixinha: 'm4.k5', titulo: 'Presença das agendas do mandato na imprensa e no debate público', curto: 'Imprensa', principal: 'aparicoes', campos: [
    { id: 'aparicoes', rot: 'Aparições na imprensa', ajuda: 'Calculado pelo clipping de notícias, se você usar a busca.' },
    { id: 'notas', rot: 'Notas e entrevistas dadas', ajuda: 'Conte as notas e entrevistas do mandato na semana.' }] },
];

export const secaoDe = (id: string) => SECOES.find((s) => s.id === id);

const ehObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const dois = (n: number) => String(n).padStart(2, '0');
const ehMes = (m: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m);

/** Semana ISO de uma data ("AAAA-MM-DD" ou Date): "2026-12-31" → "2026-W53"; "2027-01-01" → "2026-W53". Data inválida → null. */
export function semanaDe(data: string | Date): string | null {
  let d: Date;
  if (typeof data === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
    if (!m) return null;
    d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  } else {
    if (Number.isNaN(data.getTime())) return null;
    d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  }
  const dia = d.getUTCDay() || 7;                 // segunda = 1 ... domingo = 7
  d.setUTCDate(d.getUTCDate() + 4 - dia);         // a quinta-feira da semana decide o ano ISO
  const ano = d.getUTCFullYear();
  const semana = Math.ceil(((d.getTime() - Date.UTC(ano, 0, 1)) / 86400000 + 1) / 7);
  return `${ano}-W${dois(semana)}`;
}

/** Lê D.comunicacao com qualquer formato antigo ou corrompido: sempre devolve { semanas, clipping } válidos, sem mutar a entrada. */
export function lerComunicacao(bruto: unknown): Comunicacao {
  const b = ehObj(bruto) ? bruto : {};
  const semanas: Semanas = {};
  if (ehObj(b.semanas)) {
    for (const [sem, secoes] of Object.entries(b.semanas)) {
      if (!/^\d{4}-W\d{2}$/.test(sem) || !ehObj(secoes)) continue;
      for (const [sec, vals] of Object.entries(secoes)) {
        if (!secaoDe(sec) || !ehObj(vals)) continue;
        const v: Valores = {};
        for (const [c, n] of Object.entries(vals)) if (typeof n === 'number' && Number.isFinite(n) && n >= 0) v[c] = n;
        (semanas[sem] ??= {})[sec] = v;
      }
    }
  }
  const clipping = (Array.isArray(b.clipping) ? b.clipping : []).filter((n): n is Noticia => ehObj(n) && typeof n.id === 'string') as Noticia[];
  const meses: Semanas = {};
  if (ehObj(b.meses)) {
    for (const [mes, secoes] of Object.entries(b.meses)) {
      if (!ehMes(mes) || !ehObj(secoes)) continue;
      for (const [sec, vals] of Object.entries(secoes)) {
        if (!secaoDe(sec) || !ehObj(vals)) continue;
        const v: Valores = {};
        for (const [c, n] of Object.entries(vals)) if (typeof n === 'number' && Number.isFinite(n) && n >= 0) v[c] = n;
        (meses[mes] ??= {})[sec] = v;
      }
    }
  }
  const datas: Record<string, Record<string, string>> = {};
  if (ehObj(b.datas)) {
    for (const [sem, secoes] of Object.entries(b.datas)) {
      if (!/^\d{4}-W\d{2}$/.test(sem) || !ehObj(secoes)) continue;
      for (const [sec, d] of Object.entries(secoes)) if (secaoDe(sec) && typeof d === 'string' && semanaDe(d) !== null) (datas[sem] ??= {})[sec] = d;
    }
  }
  return { semanas, clipping, ...(Object.keys(meses).length ? { meses } : {}), ...(Object.keys(datas).length ? { datas } : {}) };
}

type Validado = { ok: true; novos: Valores } | { ok: false; erro: string };
function validaValores(sec: Secao, valores: Record<string, unknown>): Validado {
  const novos: Valores = {};
  for (const [c, n] of Object.entries(valores)) {
    const campo = sec.campos.find((x) => x.id === c);
    if (!campo) return { ok: false, erro: `Campo desconhecido: ${c}.` };
    if (typeof n !== 'number' || !Number.isFinite(n)) return { ok: false, erro: `${campo.rot}: escreva um número.` };
    if (n < 0) return { ok: false, erro: `${campo.rot}: o número não pode ser negativo.` };
    novos[c] = n;
  }
  return { ok: true, novos };
}

/** Registra (ou edita) os números de uma seção numa semana. A mesma semana duas vezes edita o mesmo registro, não duplica.
 *  Recusa número negativo, não numérico ou de campo que a seção não tem. Com `data` ("AAAA-MM-DD" do dia do registro), guarda a data para o cabeçalho.
 *  Devolve a nova comunicação; a entrada não muda. */
export function registra(com: Comunicacao, secaoId: string, semana: string, valores: Record<string, unknown>, data?: string): { ok: true; com: Comunicacao } | { ok: false; erro: string } {
  const sec = secaoDe(secaoId);
  if (!sec) return { ok: false, erro: 'Seção desconhecida.' };
  if (!/^\d{4}-W\d{2}$/.test(semana)) return { ok: false, erro: 'Semana inválida.' };
  const v = validaValores(sec, valores);
  if (!v.ok) return v;
  const semanas: Semanas = { ...com.semanas, [semana]: { ...com.semanas[semana], [secaoId]: v.novos } };
  const datas = data && semanaDe(data) === semana ? { ...com.datas, [semana]: { ...com.datas?.[semana], [secaoId]: data } } : com.datas;
  return { ok: true, com: { ...com, semanas, ...(datas ? { datas } : {}) } };
}

/** Registro do mês ("2026-11"): um por seção por mês; o mesmo mês duas vezes edita o mesmo registro (SUG-50). */
export function registraMes(com: Comunicacao, secaoId: string, mes: string, valores: Record<string, unknown>): { ok: true; com: Comunicacao } | { ok: false; erro: string } {
  const sec = secaoDe(secaoId);
  if (!sec) return { ok: false, erro: 'Seção desconhecida.' };
  if (!ehMes(mes)) return { ok: false, erro: 'Mês inválido.' };
  const v = validaValores(sec, valores);
  if (!v.ok) return v;
  return { ok: true, com: { ...com, meses: { ...com.meses, [mes]: { ...com.meses?.[mes], [secaoId]: v.novos } } } };
}

/** Dias que o registro semanal pode recuar: "esta semana ou nos últimos 15 dias" (hoje e os 14 anteriores). */
export const DIAS_RECUO = 14;
const somaDias = (iso: string, n: number) => { const [a, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10); };

/** Recusa da data do registro semanal (de 14 dias atrás até hoje), ou null se vale. */
export function validaDataRegistro(data: string, hoje: string): string | null {
  if (semanaDe(data) === null) return 'Escolha uma data válida.';
  if (data > hoje) return 'A data do registro não pode ser no futuro.';
  if (data < somaDias(hoje, -DIAS_RECUO)) return 'O registro semanal vai até 15 dias atrás. Para um período maior, use o registro do mês.';
  return null;
}

/** Recusa do mês do registro mensal (mês futuro não vale), ou null se vale. */
export function validaMesRegistro(mes: string, hoje: string): string | null {
  if (!ehMes(mes)) return 'Escolha um mês válido.';
  return mes > hoje.slice(0, 7) ? 'O mês do registro não pode ser no futuro.' : null;
}

/** Os valores de um campo por semana, em ordem de semana (só as semanas em que o campo foi registrado). */
export function serie(com: Comunicacao, secaoId: string, campo: string): { semana: string; valor: number }[] {
  return Object.keys(com.semanas).sort()
    .map((semana) => ({ semana, valor: com.semanas[semana][secaoId]?.[campo] }))
    .filter((p): p is { semana: string; valor: number } => typeof p.valor === 'number');
}

/** Semanas em que a seção tem registro, em ordem. */
export const semanasDaSecao = (com: Comunicacao, secaoId: string) => Object.keys(com.semanas).sort().filter((s) => com.semanas[s][secaoId]);

/** Último registro da seção (para o cabeçalho fechado), ou null. */
export function ultimoRegistro(com: Comunicacao, secaoId: string): { semana: string; valores: Valores } | null {
  const s = semanasDaSecao(com, secaoId);
  return s.length ? { semana: s[s.length - 1], valores: com.semanas[s[s.length - 1]][secaoId] } : null;
}

const dataBR = (iso: string) => iso.split('-').reverse().join('/');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Segunda-feira ("AAAA-MM-DD") da semana ISO "2026-W45". */
export function inicioDaSemana(semana: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(semana);
  if (!m) return '';
  const jan4 = new Date(Date.UTC(+m[1], 0, 4));
  const seg = new Date(jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * 86400000 + (+m[2] - 1) * 7 * 86400000);
  return seg.toISOString().slice(0, 10);
}

/** "mês de novembro de 2026" para "2026-11". */
export const rotuloMes = (mes: string) => (ehMes(mes) ? `mês de ${MESES[+mes.slice(5) - 1]} de ${mes.slice(0, 4)}` : mes);

/** Último registro da seção entre semanas e meses, com o texto da data certa para o cabeçalho (SUG-51):
 *  "em 04/11/2026" (semanal com data), "semana de 02/11 a 08/11/2026" (semanal antigo, sem data) ou "mês de novembro de 2026". */
export function ultimoRegistroDatado(com: Comunicacao, secaoId: string): { rotulo: string; valores: Valores } | null {
  const cand: { fim: string; rotulo: string; valores: Valores }[] = [];
  for (const sem of semanasDaSecao(com, secaoId)) {
    const data = com.datas?.[sem]?.[secaoId];
    const seg = inicioDaSemana(sem);
    const dom = somaDias(seg, 6);
    cand.push({ fim: data ?? dom, rotulo: data ? `em ${dataBR(data)}` : `semana de ${dataBR(seg).slice(0, 5)} a ${dataBR(dom)}`, valores: com.semanas[sem][secaoId] });
  }
  for (const mes of mesesDaSecao(com, secaoId)) {
    const [a, m] = mes.split('-').map(Number);
    cand.push({ fim: new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10), rotulo: rotuloMes(mes), valores: com.meses![mes][secaoId] });
  }
  cand.sort((x, y) => (x.fim < y.fim ? -1 : x.fim > y.fim ? 1 : 0));
  const u = cand[cand.length - 1];
  return u ? { rotulo: u.rotulo, valores: u.valores } : null;
}

/** Meses em que a seção tem registro, em ordem. */
export const mesesDaSecao = (com: Comunicacao, secaoId: string) => Object.keys(com.meses ?? {}).sort().filter((m) => com.meses![m][secaoId]);

/** Os valores de um campo por mês (só os meses em que o campo foi registrado). */
export function serieMes(com: Comunicacao, secaoId: string, campo: string): { mes: string; valor: number }[] {
  return mesesDaSecao(com, secaoId)
    .map((mes) => ({ mes, valor: com.meses![mes][secaoId][campo] }))
    .filter((p): p is { mes: string; valor: number } => typeof p.valor === 'number');
}

/** Aparições do mês: notícias do clipping não ocultas com data nesse mês. */
export const aparicoesDoMes = (clipping: Noticia[], mes: string): number => clipping.filter((n) => !n.oculta && typeof n.data === 'string' && n.data.startsWith(`${mes}-`)).length;

export const SEM_BANDEIRA = 'sem';

/** Aparições por bandeira (id da bandeira → nº de notícias; "sem" = sem bandeira). Não conta as ocultas. Notícia com 2 bandeiras conta em cada uma. */
export function aparicoesPorBandeira(clipping: Noticia[], semana?: string): Record<string, number> {
  const r: Record<string, number> = {};
  for (const n of clipping) {
    if (n.oculta || (semana && n.semana !== semana)) continue;
    const ids = Array.isArray(n.bandeiras) && n.bandeiras.length ? n.bandeiras : [SEM_BANDEIRA];
    for (const id of ids) r[id] = (r[id] ?? 0) + 1;
  }
  return r;
}

/** Número de aparições da semana: notícias do clipping não ocultas cuja data cai nela (CAP-31.7). */
export const aparicoesDaSemana = (clipping: Noticia[], semana: string): number => clipping.filter((n) => !n.oculta && n.semana === semana).length;

/** O indicador da seção na linha do tempo geral: por semana, o número principal da seção (se faltar, o primeiro campo registrado). */
export function indicador(com: Comunicacao, secaoId: string): { semana: string; valor: number }[] {
  const sec = secaoDe(secaoId);
  if (!sec) return [];
  return semanasDaSecao(com, secaoId).flatMap((semana) => {
    const v = com.semanas[semana][secaoId];
    const campo = v[sec.principal] !== undefined ? sec.principal : sec.campos.find((c) => v[c.id] !== undefined)?.id;
    return campo ? [{ semana, valor: v[campo] }] : [];
  });
}

/** Chaves das caixinhas antigas (m4.k1 a m4.k5) a marcar: seções com registro cuja caixinha ainda não está marcada. Nunca desmarca. */
export function caixinhasParaMarcar(com: Comunicacao, campos: Record<string, unknown>): string[] {
  return SECOES.filter((s) => (semanasDaSecao(com, s.id).length > 0 || mesesDaSecao(com, s.id).length > 0) && !campos[s.caixinha]).map((s) => s.caixinha);
}

/* ---------- clipping: operações puras sobre a lista de notícias (guardam só título, veículo, data e link) ---------- */
const chaveTitulo = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const ehUrlWeb = (u: string) => /^https?:\/\/\S+$/i.test(u);
const ehData = (d: string) => semanaDe(d) !== null;

export type ItemBusca = { titulo: string; veiculo: string; data: string; url: string };

/** Acrescenta os itens da busca que ainda não estão na lista (mesmo link ou mesmo título, inclusive ocultas). Entram sem bandeira e visíveis. */
export function mesclaBusca(clipping: Noticia[], itens: ItemBusca[], novoId: () => string): { clipping: Noticia[]; novas: number } {
  const urls = new Set(clipping.map((n) => n.url).filter(Boolean)), titulos = new Set(clipping.map((n) => chaveTitulo(n.titulo)));
  const novasNoticias: Noticia[] = [];
  for (const i of itens) {
    const t = typeof i.titulo === 'string' ? i.titulo.trim() : '';
    const url = typeof i.url === 'string' && ehUrlWeb(i.url) ? i.url : '';
    if (!t || urls.has(url) || titulos.has(chaveTitulo(t))) continue;
    if (url) urls.add(url);
    titulos.add(chaveTitulo(t));
    const data = typeof i.data === 'string' && ehData(i.data) ? i.data : '';
    novasNoticias.push({ id: novoId(), semana: semanaDe(data || new Date()) ?? '', titulo: t, veiculo: String(i.veiculo ?? '').trim(), data, url, bandeiras: [] });
  }
  return { clipping: [...clipping, ...novasNoticias], novas: novasNoticias.length };
}

/** Aparição manual: título e data são obrigatórios; o link é opcional, mas precisa ser http(s) se vier. */
export function adicionaManual(clipping: Noticia[], d: { titulo: string; veiculo: string; url: string; data: string }, novoId: () => string): { ok: true; clipping: Noticia[] } | { ok: false; erro: string } {
  const titulo = d.titulo.trim(), url = d.url.trim();
  if (!titulo) return { ok: false, erro: 'Escreva o título da aparição.' };
  if (!ehData(d.data)) return { ok: false, erro: 'Informe a data da aparição.' };
  if (url && !ehUrlWeb(url)) return { ok: false, erro: 'O link precisa começar com http:// ou https://.' };
  return { ok: true, clipping: [...clipping, { id: novoId(), semana: semanaDe(d.data)!, titulo, veiculo: d.veiculo.trim(), data: d.data, url, bandeiras: [], manual: true }] };
}

/** Oculta ou restaura notícias. A entrada não muda. */
export const ocultaNoticias = (clipping: Noticia[], ids: string[], oculta: boolean): Noticia[] =>
  clipping.map((n) => (ids.includes(n.id) ? { ...n, oculta } : n));

/** Etiqueta notícias com uma bandeira (`add`), tira a bandeira (`remove`) ou volta a "Sem bandeira" (`limpa`). Sem repetir etiqueta. */
export function etiquetaNoticias(clipping: Noticia[], ids: string[], acao: 'add' | 'remove' | 'limpa', bandeira = ''): Noticia[] {
  return clipping.map((n) => {
    if (!ids.includes(n.id)) return n;
    const atuais = Array.isArray(n.bandeiras) ? n.bandeiras : [];
    const bandeiras = acao === 'limpa' ? [] : acao === 'remove' ? atuais.filter((b) => b !== bandeira) : atuais.includes(bandeira) ? atuais : [...atuais, bandeira];
    return { ...n, bandeiras };
  });
}