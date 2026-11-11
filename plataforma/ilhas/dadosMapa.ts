/* Dados que o HTML do Mapa Político (Missão 1) leva além das respostas gravadas: os cartões de município da 2.2 e os
   cartões de agenda da 3.2. O legado (`Baixar.mapaPolitico`, m1.js) chama `Ilhas.dadosMapaPolitico()` e monta o HTML
   estático com o que voltar. Se uma fonte falha, o campo vem vazio e o HTML mostra a mensagem da tela (FEC-02, FEC-05). */
import { carregaExecUF, carregaFiliadosUF, carregaGeo, carregaMun, carregaUF } from '@/lib/dados';
import { AGENDAS, carregaCatalogo, carregaIndicador, faixaDe, type DadosIndicador } from '@/lib/agendas';
import { linhasDaAgenda } from '@/lib/indicadoresSociais';
import { cincoMais } from '@/lib/maisVotados';
import type { CasaChave } from '@/lib/types';
import type { ItemMun } from './CartoesMunicipio';
import { numerosMun, pctEstado } from '@/lib/forcaMunicipio';
import { buscaVotos } from './MaisVotados';
import { ROT_POS, sugere } from './posicoes';
import { dadosGuia, mandato } from './ponte';

const CASAS: CasaChave[] = ['federal', 'estadual', 'senado'];

export type CartaoMunicipio = {
  nome: string; pos?: number; votos?: number; partido: string; nomeUF: string;
  vereadores: number | null; vereadoresPartido: number | null; filiados: number | null;
  prefeito: { nome: string; partido: string } | null; posicao: string;
  pctMun: number | null; pctUF: number | null;
};
export type CartaoAgenda = { id: string; rot: string; linhas: { indicador: string; ods: number; odsRot: string; nota: number; faixa: string }[] };
export type DadosMapa = {
  uf: string; partido: string;
  municipios: { cartoes: CartaoMunicipio[]; nomes: Record<string, string>; aviso: string | null };
  agendas: CartaoAgenda[] | null;
};

async function agendas(uf: string): Promise<CartaoAgenda[] | null> {
  try {
    const cat = await carregaCatalogo();
    if (!cat || !uf) return null;
    const ids = new Set<string>();
    for (const a of AGENDAS) {
      a.ods.forEach((n) => { ids.add(`ods-${n}`); cat.indicadores.filter((i) => i.ods === n).forEach((i) => ids.add(i.id)); });
      (a.extras ?? []).forEach((id) => ids.add(id));
    }
    const lista = [...ids];
    const arqs = await Promise.all(lista.map((id) => carregaIndicador(id)));
    const dados: Record<string, DadosIndicador | null> = Object.fromEntries(lista.map((id, k) => [id, arqs[k]]));
    const out = AGENDAS.map((a) => ({
      id: a.id, rot: a.rot,
      linhas: linhasDaAgenda(a, cat, dados, uf).map((l) => ({ ...l, faixa: faixaDe(l.nota).rot })),
    }));
    return out.every((c) => !c.linhas.length) ? null : out;
  } catch { return null; }
}

async function municipios(uf: string, partido: string): Promise<DadosMapa['municipios']> {
  const vazio = { cartoes: [], nomes: {}, aviso: null as string | null };
  try {
    const D = dadosGuia(), m = mandato();
    const t = D.tse as { sq?: string; casa?: string; uf?: string; cdi?: string };
    const casa = CASAS.find((c) => c === t.casa) ?? null;
    const cdiDom = t.cdi || m.municipio || '';
    const [munUF, fil, exUF, uData] = await Promise.all([
      carregaMun(uf), carregaFiliadosUF(uf).catch(() => undefined), carregaExecUF(uf).catch(() => undefined), carregaUF(uf).catch(() => undefined),
    ]);
    if (!munUF) return vazio;
    let itens: ItemMun[] = [];
    if (casa && t.sq) {
      try {
        const [votos, geo] = await Promise.all([buscaVotos(uf, casa, t.sq), carregaGeo(uf)]);
        const nomes = new Map((geo?.mun ?? []).map((x) => [x.id, x.nm]));
        itens = cincoMais(votos.mun, nomes).map((l) => ({ cdi: l.cdi, nome: l.nome, pos: l.pos, votos: l.votos }));
      } catch { itens = []; }
    }
    if (!itens.length) itens = cdiDom ? [{ cdi: cdiDom, nome: munUF.mun[cdiDom]?.nm ?? cdiDom }] : [];
    if (!itens.length) return { ...vazio, aviso: 'Informe o município de domicílio em Dados do mandato.' };
    const c = D.conj2;
    const pctUF = pctEstado(munUF.mun, casa, partido);
    const nomeUF = uData?.nome ?? uf;
    const nomes: Record<string, string> = {};
    const cartoes = itens.map((it): CartaoMunicipio => {
      const n = numerosMun(it, munUF, fil, casa, partido);
      const mun = munUF.mun[it.cdi];
      const reg = exUF?.pref[it.cdi];
      const salvo = (it.cdi === cdiDom ? c?.posicao?.pref : c?.prefExtra?.[it.cdi]) || null;
      const efetivo = salvo ?? sugere(reg, partido);
      nomes[it.cdi] = n.nome;
      return {
        nome: n.nome, pos: it.pos, votos: it.votos, partido, nomeUF,
        vereadores: mun?.m24 ? n.vereadoresTotal : null, vereadoresPartido: mun?.m24 ? n.vereadoresPartido : null,
        filiados: fil ? n.filiados : null,
        prefeito: reg ? { nome: reg.n, partido: reg.p } : null,
        posicao: efetivo ? ROT_POS[efetivo] : '', pctMun: n.pct, pctUF,
      };
    });
    return { cartoes, nomes, aviso: null };
  } catch { return vazio; }
}

export async function dadosMapaPolitico(): Promise<DadosMapa> {
  const m = mandato();
  const uf = (m.uf ?? '').toUpperCase(), partido = (m.partido ?? '').toUpperCase();
  const [mun, ag] = await Promise.all([uf ? municipios(uf, partido) : Promise.resolve({ cartoes: [], nomes: {}, aviso: null }), agendas(uf)]);
  return { uf, partido, municipios: mun, agendas: ag };
}
