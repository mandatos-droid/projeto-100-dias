'use client';
/* Missão 4 · cartão de uma comissão escolhida: 3 perguntas em botões (motivo, papel, primeiro movimento), cada uma com "Outro (escrever)".
   Grava na hora, em texto legível, em pq, papel e mov do registro de D.comissoes (o legado e o Resumo leem esses campos).
   SPEC_DEVIATION: o design previa guardar também `motivos[]`; os ids são recuperados do próprio texto (leEscolhas), sem segunda cópia que possa divergir.
   Reason: o Guia antigo e o Resumo editam/leem só o texto; duas fontes poderiam discordar. */
import { useState } from 'react';
import { MOTIVOS, MOVIMENTOS, PAPEIS, alternaMovimento, alternaOutroMovimento, defineDataMovimento, defineTextoMovimento, hojeISO, leEscolhas, limitesPrazo, lerMovimentos, ordemMovimentos, papelNorm, textoDasEscolhas, textoMovimentos, validaPrazo, type Movimento } from '@/lib/capital';
import { aviso } from '../ponte';
import './capital.css';

export type RegistroComissao = { pq?: string; papel?: string; mov?: string; movs?: Movimento[] } & Record<string, unknown>;
type Campo = 'pq' | 'papel';

const PERGUNTAS: { campo: Campo; titulo: string; opcoes: string[]; varias: boolean; outro: string }[] = [
  { campo: 'pq', titulo: 'Por que estar nesse espaço?', opcoes: MOTIVOS.map((m) => m.rot), varias: true, outro: 'Outro motivo' },
  { campo: 'papel', titulo: 'Papel que pretende exercer', opcoes: PAPEIS, varias: false, outro: 'Outro papel' },
];

export default function CartaoComissao({ reg, nome, posse, onMuda }: { reg: RegistroComissao; nome: string; posse?: string; onMuda: () => void }) {
  /* "Outro" aberto: já tem texto livre gravado, ou a pessoa acabou de clicar nele */
  const [abertos, setAbertos] = useState<Record<Campo, boolean>>(() => ({
    pq: leEscolhas(reg.pq, MOTIVOS.map((m) => m.rot)).outro !== '', papel: leEscolhas(papelNorm(reg.papel), PAPEIS).outro !== '',
  }));
  const grava = (campo: Campo, texto: string) => { reg[campo] = texto; onMuda(); };

  /* movimentos: lista estruturada em `movs`; `mov` é o texto legível derivado, que o Guia antigo e o Resumo leem */
  const movs = lerMovimentos(reg);
  const ordem = ordemMovimentos(movs);
  const grMovs = (novos: Movimento[]) => { reg.movs = novos; reg.mov = textoMovimentos(novos); onMuda(); };
  const aplica = (r: ReturnType<typeof alternaMovimento>) => { if (r.ok) grMovs(r.movs); else aviso(r.erro); };
  const mudaData = (i: number, v: string) => {
    if (v !== '') { const erro = validaPrazo(v, hojeISO(), posse); if (erro) { aviso(erro); onMuda(); return; } }
    grMovs(defineDataMovimento(movs, i, v));
  };
  const lim = limitesPrazo(posse, hojeISO());
  const rotulosMov = MOVIMENTOS.map((m) => m.rot);

  return (
    <div className="cp-cartao" role="group" aria-label={`Perguntas sobre ${nome}`}>
      {PERGUNTAS.map((p) => {
        const { marcados, outro } = leEscolhas(p.campo === 'papel' ? papelNorm(reg.papel) : reg[p.campo], p.opcoes);
        const aberto = abertos[p.campo] || outro !== '';
        const abre = (v: boolean) => setAbertos({ ...abertos, [p.campo]: v });
        const escolhe = (rot: string) => {
          if (p.varias) grava(p.campo, textoDasEscolhas(marcados.includes(rot) ? marcados.filter((x) => x !== rot) : [...marcados, rot], outro));
          else { abre(false); grava(p.campo, marcados[0] === rot ? '' : rot); }
        };
        const alternaOutro = () => {
          if (aberto) { abre(false); grava(p.campo, textoDasEscolhas(marcados)); return; }
          abre(true);
          if (!p.varias) grava(p.campo, ''); // uma resposta só: o texto livre substitui o botão marcado
        };
        return (
          <fieldset key={p.campo} className="cp-perg" data-campo={p.campo}>
            <legend>{p.titulo}{p.varias && <small> (pode marcar mais de um)</small>}</legend>
            <div className="cp-botoes">
              {p.opcoes.map((rot) => (
                <button key={rot} type="button" className="rm-chip" aria-pressed={marcados.includes(rot)} onClick={() => escolhe(rot)}>{rot}</button>
              ))}
              <button type="button" className="rm-chip" aria-pressed={aberto} onClick={alternaOutro}>Outro (escrever)</button>
            </div>
            {aberto && (
              <label className="campo"><span className="rot">{p.outro}</span>
                <input type="text" value={outro} onChange={(e) => grava(p.campo, textoDasEscolhas(marcados, e.target.value))} />
              </label>
            )}
          </fieldset>
        );
      })}
      <fieldset className="cp-perg" data-campo="mov">
        <legend>Ordem de tudo o que o mandato precisa fazer para alcançar este objetivo<small> (selecionar até 4 movimentos)</small></legend>
        <div className="cp-botoes">
          {rotulosMov.map((rot) => (
            <button key={rot} type="button" className="rm-chip" aria-pressed={movs.some((m) => m.rot === rot)} onClick={() => aplica(alternaMovimento(movs, rot))}>{rot}</button>
          ))}
          <button type="button" className="rm-chip" aria-pressed={movs.some((m) => !rotulosMov.includes(m.rot))} onClick={() => aplica(alternaOutroMovimento(movs))}>Outro (escrever)</button>
        </div>
        {movs.length > 0 && (
          <ol className="cp-movs" aria-label="Movimentos em ordem de data">
            {ordem.map((i) => {
              const m = movs[i];
              const livre = !rotulosMov.includes(m.rot);
              return (
                <li key={i} className="cp-mov" data-mov={livre ? 'outro' : m.rot}>
                  {livre
                    ? <label className="campo"><span className="rot">Outro movimento</span><input type="text" value={m.rot} onChange={(e) => grMovs(defineTextoMovimento(movs, i, e.target.value))} /></label>
                    : <span className="cp-mov-t">{m.rot}</span>}
                  <label className="campo"><span className="rot">{livre ? 'Data do movimento' : `Data de ${m.rot}`}</span>
                    <input type="date" value={m.data} min={lim.min} max={lim.max} onChange={(e) => mudaData(i, e.target.value)} />
                  </label>
                </li>
              );
            })}
          </ol>
        )}
      </fieldset>
    </div>
  );
}
