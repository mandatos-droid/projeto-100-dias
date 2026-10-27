'use client';
/* Missão 4 · cartão de uma comissão escolhida: 3 perguntas em botões (motivo, papel, primeiro movimento), cada uma com "Outro (escrever)".
   Grava na hora, em texto legível, em pq, papel e mov do registro de D.comissoes (o legado e o Resumo leem esses campos).
   SPEC_DEVIATION: o design previa guardar também `motivos[]`; os ids são recuperados do próprio texto (leEscolhas), sem segunda cópia que possa divergir.
   Reason: o Guia antigo e o Resumo editam/leem só o texto; duas fontes poderiam discordar. */
import { useState } from 'react';
import { MOTIVOS, MOVIMENTOS, PAPEIS, leEscolhas, textoDasEscolhas } from '@/lib/capital';
import './capital.css';

export type RegistroComissao = { pq?: string; papel?: string; mov?: string } & Record<string, unknown>;
type Campo = 'pq' | 'papel' | 'mov';

const PERGUNTAS: { campo: Campo; titulo: string; opcoes: string[]; varias: boolean; outro: string }[] = [
  { campo: 'pq', titulo: 'Por que estar nesse espaço?', opcoes: MOTIVOS.map((m) => m.rot), varias: true, outro: 'Outro motivo' },
  { campo: 'papel', titulo: 'Papel que pretende exercer', opcoes: PAPEIS, varias: false, outro: 'Outro papel' },
  { campo: 'mov', titulo: 'Primeiro movimento', opcoes: MOVIMENTOS.map((m) => m.rot), varias: false, outro: 'Outro movimento' },
];

export default function CartaoComissao({ reg, nome, onMuda }: { reg: RegistroComissao; nome: string; onMuda: () => void }) {
  /* "Outro" aberto: já tem texto livre gravado, ou a pessoa acabou de clicar nele */
  const [abertos, setAbertos] = useState<Record<Campo, boolean>>(() => ({
    pq: leEscolhas(reg.pq, MOTIVOS.map((m) => m.rot)).outro !== '', papel: leEscolhas(reg.papel, PAPEIS).outro !== '', mov: leEscolhas(reg.mov, MOVIMENTOS.map((m) => m.rot)).outro !== '',
  }));
  const grava = (campo: Campo, texto: string) => { reg[campo] = texto; onMuda(); };

  return (
    <div className="cp-cartao" role="group" aria-label={`Perguntas sobre ${nome}`}>
      {PERGUNTAS.map((p) => {
        const { marcados, outro } = leEscolhas(reg[p.campo], p.opcoes);
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
    </div>
  );
}
