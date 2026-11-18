'use client';
/* Missão 4 · matriz das ações dos 100 dias. As frentes e as ações recomendadas vêm de BINGOS (conteudo.js, só leitura);
   as escolhidas ficam em D.acoes no formato antigo ({id, bingo, i, titulo, alcancar, resp, prazo, saber, prox}), sem migração. */
import { useState } from 'react';
import { TEXTO_SABER, acaoCompleta, acaoTemTexto, ehDataISO, metaDaAcao, metasLigaveis, ordenaPorPrazo, progressoAcoes, proximoIndiceLivre } from '@/lib/capital';
import Gaveta from '../Gaveta';
import { aviso } from '../ponte';
import { useRumo } from '../rumo/useRumo';
import LinhaAcao, { type Acao } from './LinhaAcao';
import '../rumo/rumo.css';
import './capital.css';

type Bingo = { n: string; itens: string[] };
const bingos = () => (window as unknown as { BINGOS?: Record<string, Bingo> }).BINGOS ?? {};
const uid = () => Math.random().toString(36).slice(2, 10);
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const chaveAcao = (a: Acao) => a.id ?? `${a.bingo ?? ''}-${a.i ?? ''}`;
const prazoBr = (v: unknown) => (ehDataISO(v) ? `${v.slice(8)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : texto(v));

export default function Matriz() {
  const { d: D, m, pessoas, bump } = useRumo();
  const frentes = Object.entries(bingos());
  const [ativa, setAtiva] = useState(frentes[0]?.[0] ?? '');
  const [todas, setTodas] = useState(false); // visão "Todas as ações" no lugar das linhas de uma frente
  const [livre, setLivre] = useState('');
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [focoChave, setFocoChave] = useState<string | null>(null);
  const [origemGaveta, setOrigemGaveta] = useState<HTMLElement | null>(null);
  const metas = metasLigaveis(D.metas);
  const lista = (Array.isArray(D.acoes) ? D.acoes : []) as Acao[];
  const doBingo = (k: string) => lista.filter((a) => a.bingo === k);
  const frente = bingos()[ativa];
  const prog = progressoAcoes(lista);
  const validas = lista.filter((a) => typeof a.bingo === 'string' && bingos()[a.bingo]);

  const abreGaveta = (chave: string | null, origem?: HTMLElement | null) => {
    setFocoChave(chave);
    setOrigemGaveta(origem ?? null);
    setGavetaAberta(true);
  };

  const alterna = (k: string, i: number, titulo: string, origem?: HTMLElement | null) => {
    const a = lista.find((x) => x.bingo === k && x.i === i);
    if (!a) {
      const nova: Acao = { id: uid(), bingo: k, i, titulo, saber: TEXTO_SABER[k] ?? '' };
      D.acoes = [...lista, nova];
      bump();
      abreGaveta(chaveAcao(nova), origem);
      return;
    }
    if (acaoTemTexto(a) && !window.confirm('Remover esta ação? O que foi preenchido nela será apagado.')) return;
    if (focoChave === chaveAcao(a)) setFocoChave(null);
    D.acoes = lista.filter((x) => x !== a);
    bump();
  };

  /* SUG-49: ação escrita à mão em qualquer frente; entra marcada, com índice acima dos itens do Guia */
  const adiciona = () => {
    const titulo = livre.trim();
    if (!titulo || !frente) return;
    D.acoes = [...lista, { id: uid(), bingo: ativa, i: proximoIndiceLivre(lista, ativa, frente.itens.length), titulo, livre: true, saber: TEXTO_SABER[ativa] ?? '' }];
    setLivre('');
    bump();
  };
  const escritas = lista.filter((a) => a.bingo === ativa && a.livre === true && typeof a.i === 'number');
  const focoValido = focoChave && validas.some((a) => chaveAcao(a) === focoChave) ? focoChave : null;
  const ordenadas = ordenaPorPrazo(validas);
  const acoesDrawer = focoValido ? validas.filter((a) => chaveAcao(a) === focoValido) : ordenadas;

  const itemCatalogo = (bingo: string, i: number, titulo: string, ac?: Acao) => {
    const completa = ac ? acaoCompleta(ac) : false;
    return (
      <li key={`${bingo}-${i}`} className={`cp-acao${ac ? ' on' : ''}`} data-bingo={bingo} data-i={i}>
        <div className="cp-acao-topo">
          <label>
            <input type="checkbox" checked={!!ac} onChange={(e) => alterna(bingo, i, titulo, e.currentTarget)} aria-label={`Escolher ação: ${titulo}`} />
            <span>{texto(ac?.titulo) || titulo}</span>
          </label>
          {ac && (
            <div className="cp-acao-acoes">
              <span className="cp-ponto" data-estado={completa ? 'completa' : 'pendente'} role="img" aria-label={completa ? 'Ação completa' : 'Faltam campos'}>
                {completa ? 'Completa' : 'Faltam campos'}
              </span>
              <button type="button" className="bt pri peq" onClick={(e) => abreGaveta(chaveAcao(ac), e.currentTarget)}>
                Detalhar ação
              </button>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="ilha-corpo cp-esc cp-matriz">
      <div className="np-sec-card cp-acoes-topo">
        <div className="cp-frentes" role="group" aria-label="Frentes de ação">
          {frentes.map(([k, b]) => (
            <button key={k} type="button" className="rm-chip" data-frente={k} aria-pressed={!todas && ativa === k} onClick={() => { setAtiva(k); setTodas(false); }}>
              {b.n} <span className="cp-n">{doBingo(k).length}</span>
            </button>
          ))}
          <button type="button" className="rm-chip" aria-pressed={todas} onClick={() => setTodas(true)}>Todas as ações <span className="cp-n">{validas.length}</span></button>
        </div>
        <div className="cp-acoes-estado">
          <div className="cp-progresso" role="status" data-ok={prog.ok}>
            <progress max={4} value={Math.min(prog.total, 2) + Math.min(prog.frentes, 2)} aria-label="Progresso das ações" />
            <span>{prog.ok ? `${prog.total} ações em ${prog.frentes} frentes ✓` : 'Faltam ações em frentes diferentes. O mínimo são duas, cada uma em uma frente.'}</span>
          </div>
          <button type="button" className="bt pri peq" onClick={(e) => abreGaveta(null, e.currentTarget)}>
            Plano das ações escolhidas ({validas.length})
          </button>
        </div>
      </div>

      <div className="np-sec-card">
        <h3 className="np-acoes-tit">{todas ? `Todas as ações selecionadas (${validas.length})` : frente?.n}</h3>
        {todas ? (
          validas.length ? (
            <ul className="cp-todas cp-lista" aria-label="Todas as ações, por prazo">
              {ordenadas.map((a) => {
                const completa = acaoCompleta(a);
                const metaLig = metaDaAcao(a, D.metas);
                const resumoItens = [
                  texto(a.resp) && `Responsável: ${texto(a.resp)}`,
                  texto(a.prazo) && `Prazo: ${prazoBr(a.prazo)}`,
                  metaLig && `Meta: ${metaLig.texto}`,
                ].filter(Boolean);
                return (
                  <li key={chaveAcao(a)} className="cp-acao on" data-bingo={a.bingo} data-i={a.i}>
                    <div className="cp-acao-topo">
                      <label>
                        <input type="checkbox" checked onChange={() => alterna(a.bingo!, a.i!, a.titulo ?? '')} aria-label={`Escolher ação: ${bingos()[a.bingo!].n}: ${a.titulo ?? ''}`} />
                        <span><b>{bingos()[a.bingo!].n}:</b> {texto(a.titulo) || ''}</span>
                      </label>
                      <div className="cp-acao-acoes">
                        <span className="cp-ponto" data-estado={completa ? 'completa' : 'pendente'} role="img" aria-label={completa ? 'Ação completa' : 'Faltam campos'}>
                          {completa ? 'Completa' : 'Faltam campos'}
                        </span>
                        <button type="button" className="bt pri peq" onClick={(e) => abreGaveta(chaveAcao(a), e.currentTarget)}>
                          Editar detalhamento
                        </button>
                      </div>
                    </div>
                    {resumoItens.length > 0 && <p className="cp-resumo">{resumoItens.join(' · ')}</p>}
                  </li>
                );
              })}
            </ul>
          ) : <p className="cp-vazio">Nenhuma ação escolhida ainda. Escolha uma frente e marque as ações.</p>
        ) : frente && (
          <ul className="cp-acoes cp-lista" aria-label={`Ações de ${frente.n}`}>
            {frente.itens.map((titulo, i) => itemCatalogo(ativa, i, titulo, lista.find((x) => x.bingo === ativa && x.i === i)))}
            {escritas.map((a) => itemCatalogo(ativa, a.i!, a.titulo ?? '', a))}
          </ul>
        )}
        {!todas && frente && (
          <form className="cp-livre" onSubmit={(e) => { e.preventDefault(); adiciona(); }}>
            <label className="campo"><span className="rot">Outra ação (escrever)</span>
              <input type="text" value={livre} onChange={(e) => setLivre(e.target.value)} placeholder={`Uma ação de ${frente.n} que não está na lista`} />
            </label>
            <button type="submit" className="bt sec peq">Adicionar</button>
          </form>
        )}
      </div>

      <Gaveta
        aberta={gavetaAberta}
        titulo={`Plano das ações escolhidas (${validas.length})`}
        ariaLabel="Plano das ações escolhidas"
        corTopo="#7E2FB8"
        origem={origemGaveta}
        onFechar={() => setGavetaAberta(false)}
        rodape={
          <>
            <button type="button" className="bt sec" onClick={() => setGavetaAberta(false)}>Fechar</button>
            <button
              type="button"
              className="bt pri"
              onClick={() => {
                setGavetaAberta(false);
                aviso('Ações salvas!');
              }}
            >
              Salvar ações
            </button>
          </>
        }
      >
        {validas.length > 1 && (
          <div className="cp-gaveta-chips">
            <button type="button" className="rm-chip" aria-pressed={focoValido === null} onClick={() => setFocoChave(null)}>
              Ver todas ({validas.length})
            </button>
            {validas.map((a, idx) => {
              const ch = chaveAcao(a);
              const t = texto(a.titulo) || 'Sem título';
              return (
                <button key={ch} type="button" className="rm-chip" aria-pressed={focoValido === ch} onClick={() => setFocoChave(ch)}>
                  Ação {idx + 1}: {t.length > 22 ? `${t.slice(0, 22)}…` : t}
                </button>
              );
            })}
          </div>
        )}
        {acoesDrawer.length > 0 ? (
          <ul className="cp-lista">
            {acoesDrawer.map((a) => (
              <LinhaAcao
                key={chaveAcao(a)}
                bingo={a.bingo!}
                i={a.i!}
                titulo={a.titulo ?? ''}
                frenteNome={bingos()[a.bingo!]?.n}
                acao={a}
                pessoas={pessoas}
                metas={metas}
                posse={m.data_posse}
                onAlterna={() => alterna(a.bingo!, a.i!, a.titulo ?? '')}
                onMuda={bump}
              />
            ))}
          </ul>
        ) : (
          <p className="cp-vazio">Marque sugestões na lista principal para detalhar responsável, prazo e meta.</p>
        )}
      </Gaveta>
    </div>
  );
}
