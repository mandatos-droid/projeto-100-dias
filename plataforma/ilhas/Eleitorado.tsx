'use client';
/* Pergunta 3.1 da Missão 1 (expectativas do eleitorado): 3 colunas lado a lado, cada uma com o botão "+" que abre o
   formulário do tipo. Sem mapa nem município (ELE-01). Regras em lib/eleitorado.ts; tudo vai para D.eleitorado.itens.
   Itens antigos com `muns` continuam gravados e aparecem sem município (ELE-10). */
import { useId, useState } from 'react';
import { COLUNAS, GRUPOS, adiciona, remove } from '@/lib/eleitorado';
import type { Eleitorado, TipoEl } from '@/lib/types';
import { useLegado } from './ponte';

const TIPOS = COLUNAS;
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const MSG_REPETIDO = 'Este item já está na lista.';

export default function EleitoradoIlha() {
  const { D, bump } = useLegado();
  if (!D.eleitorado) D.eleitorado = { itens: [] } satisfies Eleitorado;
  const itens = D.eleitorado.itens;

  const [aberto, setAberto] = useState<Partial<Record<TipoEl, boolean>>>({});
  const [textos, setTextos] = useState<Record<TipoEl, string>>({ promessa: '', apoio: '', potencial: '' });
  const [erros, setErros] = useState<Partial<Record<TipoEl, string>>>({});
  const base = useId();

  const poeTexto = (k: TipoEl, v: string) => { setTextos((t) => ({ ...t, [k]: v })); setErros((e) => ({ ...e, [k]: undefined })); };
  const tenta = (k: TipoEl, txt: string, limpa: boolean) => {
    const r = adiciona(itens, k, txt, novoId());
    if (r.erro === 'repetido') { setErros((e) => ({ ...e, [k]: MSG_REPETIDO })); return; }
    if (r.erro) return;
    D.eleitorado!.itens = r.itens;
    bump();
    setErros((e) => ({ ...e, [k]: undefined }));
    if (limpa) setTextos((t) => ({ ...t, [k]: '' }));
  };

  return (
    <div className="ilha-corpo">
      <div className="el-cols">
        {TIPOS.map((x) => {
          const l = itens.filter((i) => i.tipo === x.k);
          const aberta = !!aberto[x.k];
          const idForm = `${base}-${x.k}`;
          const vazio = !textos[x.k].trim();
          return (
            <section className="el-col" key={x.k} style={{ ['--c' as string]: x.cor }} aria-label={x.titulo}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1 }}>{x.titulo} <small>{l.length}</small></span>
                <button type="button" className="bt sec" aria-expanded={aberta} aria-controls={idForm}
                  aria-label={`${aberta ? 'Fechar' : 'Abrir'} formulário: ${x.titulo}`}
                  onClick={() => setAberto((a) => ({ ...a, [x.k]: !a[x.k] }))}>+</button>
              </h4>

              {aberta && (
                <form id={idForm} className="el-form" onSubmit={(e) => { e.preventDefault(); tenta(x.k, textos[x.k], true); }}>
                  <label className="peq-t" htmlFor={`${idForm}-t`} style={{ margin: 0 }}><strong>{x.rotuloForm}</strong></label>
                  <div className="linha">
                    <input id={`${idForm}-t`} type="text" value={textos[x.k]} placeholder={x.exemplo}
                      aria-describedby={erros[x.k] ? `${idForm}-e` : undefined} aria-invalid={erros[x.k] ? true : undefined}
                      onChange={(e) => poeTexto(x.k, e.target.value)} />
                    <button type="submit" className="bt sec" disabled={vazio}>Adicionar</button>
                  </div>
                  {erros[x.k] && <p id={`${idForm}-e`} className="peq-t" role="alert" style={{ margin: 0, color: 'var(--erro, #B3261E)' }}>{erros[x.k]}</p>}
                  {x.tags && (
                    <div className="el-acoes" role="group" aria-label="Sugestões de grupos sociais">
                      {GRUPOS.map((s) => <button key={s} type="button" className="bt sec" onClick={() => tenta(x.k, s, false)}>+ {s}</button>)}
                    </div>
                  )}
                </form>
              )}

              {l.length === 0 && <p className="sem">Nada registrado ainda.</p>}
              {l.map((i) => (
                <div className="el-item" key={i.id}>
                  <div className="topo">
                    <span style={{ flex: 1, fontWeight: 700 }}>{i.texto}</span>
                    <button type="button" className="rm" aria-label={`Remover “${i.texto}”`}
                      onClick={() => { D.eleitorado!.itens = remove(itens, i.id); bump(); }}>×</button>
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** Versão somente leitura para a aba Resumo: as 3 colunas, sem município (ELE-11). */
export function EleitoradoResumo() {
  const { D } = useLegado();
  const itens = D.eleitorado?.itens ?? [];
  if (!itens.length) return <p className="sem">Nada registrado ainda.</p>;
  return (
    <div className="ilha-corpo">
      {TIPOS.map((x) => {
        const l = itens.filter((i) => i.tipo === x.k);
        if (!l.length) return null;
        return (
          <div key={x.k}>
            <strong style={{ color: x.cor }}>{x.titulo} ({l.length})</strong>
            <ul className="el-resumo-lista">
              {l.map((i) => <li key={i.id}><strong>{i.texto}</strong></li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
