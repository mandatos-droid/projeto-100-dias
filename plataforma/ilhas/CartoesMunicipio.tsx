'use client';
/* Cartões de município do partido na Conjuntura (pergunta 2.2): um por município mais votado da liderança, com os blocos
   Placar, Força e Executivo (PAR-04 a PAR-08). Sem votação 2026 por município, só o município de domicílio (PAR-08). */
import { useMemo } from 'react';
import { carregaGeo } from '@/lib/dados';
import { cincoMais } from '@/lib/maisVotados';
import { nf, pct } from '@/lib/format';
import { numerosMun } from '@/lib/forcaMunicipio';
import type { CasaChave, Conj2, ExecUF, FiliadosUF, MunUF, PosExec } from '@/lib/types';
import { CasaMunicipal } from './CasaMunicipal';
import { useVotosMun } from './MaisVotados';
import { POSICOES, ROT_POS, sugere } from './posicoes';
import { useLegado } from './ponte';
import { Chip, Foto, useCarga } from './pecas';

export const MSG_SEM_DOMICILIO = 'Informe o município de domicílio em Dados do mandato.';
const CASAS: CasaChave[] = ['federal', 'estadual', 'senado'];

export type ItemMun = { cdi: string; nome: string; pos?: number; votos?: number };
export type AlvoMun = { casa: CasaChave | null; itens: ItemMun[]; carregando: boolean; aviso: string | null };

/** Os municípios dos cartões: os 5 mais votados (candidatura 2026) ou, sem eles, o município de domicílio. */
export function useAlvoMun(munUF: MunUF | undefined): AlvoMun {
  const { D, m } = useLegado();
  const t = D.tse as { sq?: string; casa?: string; uf?: string; cdi?: string };
  const casa = CASAS.find((c) => c === t.casa) ?? null;
  const uf = t.uf || m.uf;
  const cdi = t.cdi || m.municipio || '';
  const votos = useVotosMun(uf, casa, t.sq ?? null);
  const geo = useCarga(casa && uf && t.sq ? () => carregaGeo(uf) : null, `geo${uf}`);
  return useMemo<AlvoMun>(() => {
    const domicilio = (): AlvoMun => ({
      casa, carregando: false,
      itens: cdi ? [{ cdi, nome: munUF?.mun[cdi]?.nm ?? cdi }] : [],
      aviso: cdi ? null : MSG_SEM_DOMICILIO,
    });
    if (!casa || !t.sq) return domicilio();
    if (votos.carregando || geo.carregando) return { casa, itens: [], carregando: true, aviso: null };
    const nomes = new Map((geo.dados?.mun ?? []).map((x) => [x.id, x.nm]));
    const lista = votos.dados ? cincoMais(votos.dados.mun, nomes) : [];
    if (votos.erro || !lista.length) return domicilio();
    return { casa, carregando: false, aviso: null, itens: lista.map((l) => ({ cdi: l.cdi, nome: l.nome, pos: l.pos, votos: l.votos })) };
  }, [casa, t.sq, votos.carregando, votos.erro, votos.dados, geo.carregando, geo.dados, cdi, munUF]);
}

export function CartoesMunicipio({ alvo, partido, uf, c, munUF, fil, exUF, pctUF, nomeUF }: {
  alvo: AlvoMun; partido: string; uf: string; c: Conj2; munUF?: MunUF; fil?: FiliadosUF; exUF?: ExecUF; pctUF: number | null; nomeUF: string;
}) {
  const { D, m, bump } = useLegado();
  const cdiDomicilio = (D.tse as { cdi?: string }).cdi || m.municipio || '';

  if (alvo.carregando) return <p className="sem" role="status">Buscando os municípios mais votados…</p>;
  if (alvo.aviso) return <p className="sem" role="status">{alvo.aviso}</p>;
  if (!munUF) return <p className="sem" role="status">Carregando dados…</p>;

  /* a posição do domicílio é a da seção Executivo (c.posicao.pref); as demais, a das prefeituras acompanhadas (c.prefExtra) */
  const salvo = (id: string): PosExec | '' => (id === cdiDomicilio ? c.posicao?.pref : c.prefExtra?.[id]) ?? '';
  const grava = (id: string, p: PosExec | '') => {
    if (id === cdiDomicilio) { const pos = c.posicao ?? (c.posicao = {}); if (p) pos.pref = p; else delete pos.pref; }
    else (c.prefExtra ?? (c.prefExtra = {}))[id] = p;
    bump();
  };

  return (
    <section className="cm5" aria-labelledby="cm5-t">
      <h4 id="cm5-t">{alvo.itens.length > 1 ? 'Os 5 municípios mais votados da liderança' : 'Município da liderança'}</h4>
      <ol className="cm5-lista">
        {alvo.itens.map((it) => {
          const n = numerosMun(it, munUF, fil, alvo.casa, partido);
          const mun = munUF.mun[it.cdi];
          const reg = exUF?.pref[it.cdi];
          const eleito = mun?.m24?.pref.cands.find((q) => q[4]);
          const sug = sugere(reg, partido);
          const escolhido = salvo(it.cdi) || null;
          const efetivo = escolhido ?? sug;
          return (
            <li className="cm5-cartao" key={it.cdi} data-testid="cartao-municipio">
              <header className="cm5-topo">
                {it.pos ? <span className="mv5-pos" aria-label={`${it.pos}º lugar`}>{it.pos}º</span> : null}
                <strong className="mv5-nome">{n.nome}</strong>
                {it.votos ? <span className="peq-t">{nf.format(it.votos)} votos da liderança</span> : null}
              </header>

              <div className="cm5-bloco" role="group" aria-label={`Placar de ${n.nome}`}>
                <h5>Placar</h5>
                <dl className="cm5-dl">
                  <div><dt>Vereadores no município</dt><dd>{mun?.m24 ? nf.format(n.vereadoresTotal) : '—'}</dd></div>
                  <div><dt>Vereadores do {partido}</dt><dd>{mun?.m24 ? nf.format(n.vereadoresPartido) : '—'}</dd></div>
                  <div><dt>Filiados do {partido}</dt><dd>{fil ? nf.format(n.filiados) : '—'}</dd></div>
                  <div><dt>Posição do {partido} diante do Executivo</dt><dd>{efetivo ? ROT_POS[efetivo] : 'Não informada'}</dd></div>
                </dl>
                {reg ? (
                  <div className="casa-pref">
                    {eleito ? <Foto sq={eleito[3]} uf={uf} ano={2024} nome={reg.n} tam={44} /> : null}
                    <div>
                      <span className="peq-t">Prefeito(a) · eleição de 2024</span><br />
                      <strong>{reg.n}</strong> <Chip p={reg.p} />
                    </div>
                  </div>
                ) : <p className="sem">Sem prefeito eleito em 2024 neste município no arquivo do TSE.</p>}
                {mun && (
                  <details className="cm5-camara">
                    <summary>Ver a Câmara Municipal</summary>
                    <CasaMunicipal id={it.cdi} uf={uf} mun={mun} exec={reg} partido={partido} />
                  </details>
                )}
              </div>

              <div className="cm5-bloco" role="group" aria-label={`Força de ${n.nome}`}>
                <h5>Força</h5>
                {n.pct == null ? <p className="sem">Sem votação do cargo da liderança neste município.</p> : (
                  <dl className="cm5-dl">
                    <div><dt>Votos do {partido} em {n.nome}</dt><dd>{pct(n.pct)}</dd></div>
                    <div><dt>Votos do {partido} em {nomeUF}</dt><dd>{pctUF == null ? '—' : pct(pctUF)}</dd></div>
                  </dl>
                )}
              </div>

              <div className="cm5-bloco" role="group" aria-label={`Executivo de ${n.nome}`}>
                <h5>Executivo</h5>
                <div className="v2-seg" role="radiogroup" aria-label={`Posição do partido diante da prefeitura de ${n.nome}`}>
                  {POSICOES.map((p) => (
                    <button key={p.k} type="button" role="radio" aria-checked={efetivo === p.k}
                      onClick={() => grava(it.cdi, escolhido === p.k ? '' : p.k)}>
                      {p.rot}{!escolhido && sug === p.k ? <small> · sugerido</small> : null}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
