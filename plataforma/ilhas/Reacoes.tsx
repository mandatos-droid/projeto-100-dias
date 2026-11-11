'use client';
/* Reação do mandato a 2 dados do partido (2.2): "Considerando [dado]: [valor], o mandato deve…" (PAR-10 a PAR-12).
   Os 2 dados são escolhidos clicando na própria página (modo de captura, SEL-01): os elementos `.capturable-data`
   da Conjuntura trazem `data-dado-id/nome/valor`. Grava em D.conj2.reacoes, no máximo 2 linhas, no mesmo formato de antes. */
import { useEffect, useRef, useState } from 'react';
import { defineReacao, frase, type DadoPartido } from '@/lib/dadosPartido';
import { dadosFinais, estadoInicial, mensagem, proximo, vagas, type Par } from '@/lib/selecaoDados';
import type { Reacao } from '@/lib/types';
import { useLegado } from './ponte';

const LINHAS = [0, 1] as const;
const TAGS = ['1️⃣', '2️⃣'] as const;
const vazia: Reacao = { dado: '', valor: '', texto: '' };

export function Reacoes({ dados }: { dados: DadoPartido[] }) {
  const { D, bump } = useLegado();
  const [est, setEst] = useState(() => estadoInicial());
  const secao = useRef<HTMLElement>(null);
  const c = D.conj2;
  const reacoes = (c?.reacoes ?? []).slice(0, 2);
  const capturando = est.fase === 'capturando';

  /* o dado de cada linha: o da lista ou, se o número mudou desde a gravação, o que ficou gravado */
  const dadoDe = (r: Reacao): DadoPartido | null => (r.dado ? dados.find((d) => d.id === r.dado) ?? { id: r.dado, nome: r.dado, valor: r.valor } : null);
  const atuais: Par = [dadoDe(reacoes[0] ?? vazia), dadoDe(reacoes[1] ?? vazia)];

  /* captura em andamento: clique em `.capturable-data` (fase de captura, antes de qualquer botão ou link) e Esc */
  useEffect(() => {
    if (!capturando) return;
    const aoClicar = (ev: MouseEvent) => {
      const alvo = ev.target instanceof Element ? ev.target : null;
      if (!alvo || alvo.closest('.rea-banner')) return; // o banner (Cancelar) segue funcionando
      const el = alvo.closest<HTMLElement>('.capturable-data');
      const { dadoId: id, dadoNome: nome, dadoValor: valor } = el?.dataset ?? {};
      if (!el || !id || !nome || valor == null) return; // sem data-dado-*: ignorado
      ev.preventDefault(); ev.stopPropagation(); // botão ou link dentro do elemento conta como captura e não age
      setEst((e) => proximo(e, { tipo: 'capturar', dado: { id, nome, valor } }));
    };
    const aoTecla = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setEst((e) => proximo(e, { tipo: 'cancelar' })); };
    document.addEventListener('click', aoClicar, true);
    document.addEventListener('keydown', aoTecla);
    document.body.classList.add('modo-captura');
    return () => {
      document.removeEventListener('click', aoClicar, true);
      document.removeEventListener('keydown', aoTecla);
      document.body.classList.remove('modo-captura');
    };
  }, [capturando]);

  /* tags 1️⃣/2️⃣ sobre o bloco clicado, só durante a captura */
  useEffect(() => {
    const livres = LINHAS.filter((i) => !est.atuais[i]);
    est.novos.forEach((d, k) => {
      document.querySelectorAll<HTMLElement>('.capturable-data').forEach((el) => {
        if (el.dataset.dadoId === d.id) el.dataset.capturaTag = TAGS[livres[k]];
      });
    });
    return () => document.querySelectorAll('[data-captura-tag]').forEach((el) => el.removeAttribute('data-captura-tag'));
  }, [est.novos, est.atuais]);

  /* 2º clique: grava os dois de uma vez (nada fica pela metade), fecha o banner e leva ao formulário */
  useEffect(() => {
    if (est.fase !== 'concluida' || !c) return;
    const fim = dadosFinais(est);
    let lista = reacoes;
    for (const i of LINHAS) if (fim[i] && fim[i]!.id !== atuais[i]?.id) lista = defineReacao(lista, i, fim[i], lista[i]?.texto ?? '');
    c.reacoes = lista;
    bump();
    setEst(estadoInicial());
    secao.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [est.fase]);

  if (!c) return null;
  const grava = (i: 0 | 1, dado: DadoPartido | null, texto: string) => { c.reacoes = defineReacao(reacoes, i, dado, texto); bump(); };
  const remove = (i: 0 | 1) => { grava(i, null, ''); setEst((e) => proximo(e, { tipo: 'remover', i })); };

  return (
    <section className="rea" aria-labelledby="rea-t" ref={secao}>
      <h4 id="rea-t">Reação do mandato a 2 dados do partido</h4>
      <p className="peq-t">Clique em um número do Placar ou dos cartões de município para escolher cada dado.</p>
      <button type="button" className="rea-bt" disabled={vagas(atuais) === 0 || capturando}
        onClick={() => setEst((e) => proximo(e, { tipo: 'iniciar', atuais }))}>
        Selecionar 2 dados na tela
      </button>
      {capturando && (
        <div className="rea-banner" role="status" aria-live="polite">
          <span>{mensagem(est)}</span>
          <button type="button" onClick={() => setEst((e) => proximo(e, { tipo: 'cancelar' }))}>Cancelar</button>
        </div>
      )}
      {LINHAS.map((i) => {
        const r = reacoes[i] ?? vazia;
        const atual = atuais[i];
        return (
          <div className="rea-linha" key={i}>
            <span className="rot">Dado {i + 1}</span>
            {atual ? (
              <>
                <span className="rea-chip">
                  <span aria-hidden="true">{TAGS[i]}</span>
                  <span>{`${atual.nome}: ${atual.valor}`}</span>
                  <button type="button" aria-label={`Remover o dado ${i + 1}`} onClick={() => remove(i)}>✕</button>
                </span>
                <label className="campo">
                  <span className="rot">{frase(atual)}…</span>
                  <textarea rows={3} value={r.texto} placeholder="Complete a frase"
                    onChange={(e) => grava(i, atual, e.target.value)} />
                </label>
              </>
            ) : <p className="sem">Nenhum dado escolhido ainda.</p>}
          </div>
        );
      })}
    </section>
  );
}
