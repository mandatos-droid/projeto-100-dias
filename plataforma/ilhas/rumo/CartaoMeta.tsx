'use client';
/* Missão 3 · cartão de uma meta: texto, retorno SMART ao vivo, "alcançável" por confirmação, responsável e apoios
   (chips das pessoas da Missão 2 ou texto livre) e, na aba Planejamento, o status. É o mesmo cartão no exercício e na aba. */
import { useState } from 'react';
import { STATUS } from '@/lib/atingimento';
import { type ItemMeta, type Objetivo } from '@/lib/plano';
import { MAX_APOIOS, resolve, validaApoio, type Pessoa, type Ref } from '@/lib/pessoas';
import { LETRAS, avaliaMeta, type Letra } from '@/lib/smart';
import type { Campos, Meta, StatusMeta } from '@/lib/rumo';
import { MESES, adicionaSucesso, editaSucesso, lerSucessos, removeSucesso, type Sucesso } from '@/lib/sucessos';
import { aviso } from '../ponte';
import './rumo.css';

const ROT_LETRA: Record<Letra, string> = { S: 'Específica', M: 'Mensurável', A: 'Alcançável', R: 'Relevante', T: 'Temporal' };

/** Metas antigas podem guardar HTML do editor do Guia; aqui o texto é puro (a meta só vira texto puro quando alguém a edita). */
const TEM_HTML = /<\/?(b|strong|i|em|u|ul|ol|li|br|p|div|a)\b/i;
export function semHtml(t: string | undefined): string {
  if (!TEM_HTML.test(t ?? '')) return t ?? ''; // texto puro passa como está (inclusive espaço no fim, enquanto se digita)
  return (t ?? '').replace(/<\/(p|div|li)>|<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\n{2,}/g, '\n').trim();
}

export interface CartaoMetaProps {
  meta: ItemMeta;
  objetivos: Objetivo[];
  pessoas: Pessoa[];
  campos: Campos;
  /** na aba, o filtro por pessoa esmaece ou destaca o cartão */
  marca?: 'esmaecido' | 'destaque';
  /** mostra o seletor de status (aba Planejamento) */
  comStatus?: boolean;
  /** valida a troca de objetivo (limite de 4 por objetivo); devolve o motivo da recusa ou null */
  podeMover: (pid: string) => string | null;
  onChange: (idx: number, patch: Partial<Meta>) => void;
  onRemove: (idx: number) => void;
}

export default function CartaoMeta({ meta, objetivos, pessoas, campos, comStatus, marca, podeMover, onChange, onRemove }: CartaoMetaProps) {
  const [ignora, setIgnora] = useState(false);
  const plano = semHtml(meta.texto);
  const r = avaliaMeta({ texto: plano, pred: meta.pred && objetivos.some((o) => o.pid === meta.pred) ? meta.pred : undefined, alcancavel: meta.alcancavel });
  const res = resolve(campos, meta);
  const n = String(meta.idx + 1).padStart(2, '0');
  const sucessos = lerSucessos(meta);
  const gravaSucessos = (l: Sucesso[]) => onChange(meta.idx, { sucessos: l });

  const respRef: Ref = { cad: typeof meta.respCad === 'number' ? meta.respCad : null, nome: res.resp };
  const cads = meta.apoioCad ?? [];
  const nomesCad = cads.map((c, i) => res.apoios[i] ?? `Cadeira ${c + 1}`);
  const livres = res.apoios.slice(cads.length);
  const refsApoio = (cadList: number[], nomes: string[], liv: string[]): Ref[] => [...cadList.map((c, i) => ({ cad: c, nome: nomes[i] })), ...liv.map((nome) => ({ nome }))];
  const grava = (cadList: number[], nomes: string[], liv: string[]) =>
    onChange(meta.idx, { apoioCad: cadList, apoio: [...nomes, ...liv].join('; ') });

  const escolheResp = (p: Pessoa) => {
    if (respRef.cad === p.cad) { onChange(meta.idx, { respCad: null, resp: '' }); return; }
    const erro = validaApoio({ cad: p.cad, nome: p.nome }, refsApoio(cads, nomesCad, livres));
    if (erro) { aviso(erro); return; }
    onChange(meta.idx, { respCad: p.cad, resp: p.nome });
  };
  const textoResp = (nome: string) => {
    const erro = validaApoio({ nome }, refsApoio(cads, nomesCad, livres));
    if (erro && nome.trim()) { aviso(erro); return; }
    onChange(meta.idx, { respCad: null, resp: nome });
  };
  const alternaApoio = (p: Pessoa) => {
    const tem = cads.includes(p.cad);
    const novoCad = tem ? cads.filter((c) => c !== p.cad) : [...cads, p.cad];
    const novosNomes = tem ? nomesCad.filter((_, i) => cads[i] !== p.cad) : [...nomesCad, p.nome];
    const erro = tem ? null : validaApoio(respRef, refsApoio(novoCad, novosNomes, livres));
    if (erro) { aviso(erro); return; }
    grava(novoCad, novosNomes, livres);
  };
  const textoApoio = (t: string) => {
    const liv = t.split(';').map((s) => s.trim()).filter(Boolean);
    // enquanto a pessoa digita, "Ana;" ainda não é um apoio novo: guarda o que está escrito sem validar ponto e vírgula solto
    const erro = validaApoio(respRef, refsApoio(cads, nomesCad, liv));
    if (erro) { aviso(erro); return; }
    grava(cads, nomesCad, liv);
  };
  const mudaObjetivo = (pid: string) => {
    if (pid && pid !== meta.pred) { const m = podeMover(pid); if (m) { aviso(m); return; } }
    onChange(meta.idx, { pred: pid });
  };

  const total = cads.length + livres.length;
  const semObjetivo = !meta.pred || !objetivos.some((o) => o.pid === meta.pred);

  return (
    <div className={`rm-meta${semObjetivo ? ' sem' : ''}`} data-meta={meta.idx} data-marca={marca}>
      <div className="rm-meta-topo">
        <span className="rm-meta-n">Meta {n}</span>
        {semObjetivo && <span className="rm-meta-sem">Sem objetivo</span>}
        <button type="button" className="rm-link" aria-label={`Remover a meta ${n}`} onClick={() => onRemove(meta.idx)}>Remover</button>
      </div>

      <label className="campo"><span className="rot">Objetivo específico da meta {n}</span>
        <select value={semObjetivo ? '' : meta.pred} onChange={(e) => mudaObjetivo(e.target.value)}>
          <option value="">Escolha o objetivo</option>
          {objetivos.map((o) => <option key={o.pid} value={o.pid}>{o.texto}</option>)}
        </select>
      </label>

      <label className="campo"><span className="rot">A meta {n}, no formato SMART</span>
        <textarea value={plano} onChange={(e) => { setIgnora(false); onChange(meta.idx, { texto: e.target.value }); }}
          placeholder="Ex.: Aprovar 2 projetos de lei sobre educação até dezembro de 2027" />
      </label>

      <div className="rm-smart" role="group" aria-label={`Retorno SMART da meta ${n}`}>
        <ul className="rm-smart-l">
          {LETRAS.map((l) => (
            <li key={l} data-letra={l} data-ok={r.letras[l].ok} aria-label={`${ROT_LETRA[l]}: ${r.letras[l].ok ? 'atendida' : 'falta'}`}>
              <b aria-hidden="true">{l}</b><span aria-hidden="true">{ROT_LETRA[l]}</span><i aria-hidden="true">{r.letras[l].ok ? '✓ ok' : 'falta'}</i>
            </li>
          ))}
        </ul>
        <p className="rm-smart-pts" data-pontos={r.pontos}>{r.pontos} de 5 letras atendidas</p>
        {r.alertas.map((a) => <p key={a} className="rm-alerta" role="status">{a}. Meta é um alvo de 4 meses, não uma rotina de trabalho.</p>)}
        {r.falta && plano && !ignora && (
          <p className="rm-dica" data-dica={r.falta}>
            <b>{r.falta}</b> · {r.dica}{' '}
            <button type="button" className="rm-link" onClick={() => setIgnora(true)}>Ignorar dica</button>
          </p>
        )}
        <p className="rm-dica">Retorno automático por regras; a decisão é da equipe.</p>
      </div>

      <label className="chk rm-alc"><input type="checkbox" checked={meta.alcancavel === true} onChange={(e) => onChange(meta.idx, { alcancavel: e.target.checked })} />
        <span>Cabe na capacidade da equipe nos 4 meses?</span></label>

      <fieldset className="rm-quem">
        <legend>Responsável direto</legend>
        {pessoas.length > 0 ? (
          <div className="rm-chips" role="group" aria-label={`Responsável direto da meta ${n}`}>
            {pessoas.map((p) => (
              <button key={p.cad} type="button" className="rm-chip" aria-pressed={respRef.cad === p.cad} onClick={() => escolheResp(p)}>
                {p.nome}{p.cargo && <small> · {p.cargo}</small>}
              </button>
            ))}
          </div>
        ) : (
          <p className="rm-dica">A lista de pessoas vem da Missão 2 (Equipe), que ainda não tem cadeiras com nome. Escreva o nome por enquanto.</p>
        )}
        <label className="campo"><span className="rot">{pessoas.length ? 'Ou outro nome' : 'Nome do responsável'}</span>
          <input type="text" value={typeof meta.respCad === 'number' ? '' : res.resp} onChange={(e) => textoResp(e.target.value)} />
        </label>
        {res.foraDaEquipe && res.fora.length > 0 && <p className="rm-alerta" role="note">{res.fora.join(', ')}: fora da equipe da Missão 2.</p>}
      </fieldset>

      <fieldset className="rm-quem">
        <legend>Quem dá suporte <span className="rm-n">{total} de {MAX_APOIOS}</span></legend>
        {pessoas.length > 0 && (
          <div className="rm-chips" role="group" aria-label={`Apoios da meta ${n}`}>
            {pessoas.map((p) => (
              <button key={p.cad} type="button" className="rm-chip" aria-pressed={cads.includes(p.cad)} onClick={() => alternaApoio(p)}>{p.nome}</button>
            ))}
          </div>
        )}
        <label className="campo"><span className="rot">{pessoas.length ? 'Outros apoios (separe com ponto e vírgula)' : 'Quem dá suporte (separe com ponto e vírgula)'}</span>
          <input type="text" defaultValue={livres.join('; ')} key={`${meta.idx}-${cads.length}`} onBlur={(e) => textoApoio(e.target.value)} />
        </label>
      </fieldset>

      <fieldset className="rm-suc" role="group" aria-label={`Sucessos mensais da meta ${n}`}>
        <legend>Sucessos mensais <span className="rm-n">{sucessos.length}</span></legend>
        <p className="rm-dica">Marcos de cada mês (Mês 1 a Mês 4). Com sucessos, o atingimento da meta passa a ser sucessos atingidos sobre o total.</p>
        {sucessos.length > 0 && (
          <ul className="rm-suc-l">
            {sucessos.map((s, i) => {
              const k = i + 1;
              return (
                <li key={s.id} data-sucesso={s.id}>
                  <label className="campo"><span className="rot">Mês</span>
                    <select aria-label={`Mês do sucesso ${k} da meta ${n}`} value={s.mes} onChange={(e) => gravaSucessos(editaSucesso(sucessos, s.id, { mes: Number(e.target.value) }))}>
                      {MESES.map((mes) => <option key={mes} value={mes}>Mês {mes}</option>)}
                    </select>
                  </label>
                  <label className="campo"><span className="rot">Sucesso</span>
                    <input type="text" aria-label={`Texto do sucesso ${k} da meta ${n}`} value={s.texto} placeholder="Ex.: Protocolar o projeto de lei"
                      onChange={(e) => gravaSucessos(editaSucesso(sucessos, s.id, { texto: e.target.value }))} />
                  </label>
                  <label className="campo"><span className="rot">Status</span>
                    <select aria-label={`Status do sucesso ${k} da meta ${n}`} value={s.status} onChange={(e) => gravaSucessos(editaSucesso(sucessos, s.id, { status: e.target.value as StatusMeta }))}>
                      {STATUS.map((st) => <option key={st.id} value={st.id}>{st.rot}</option>)}
                    </select>
                  </label>
                  <button type="button" className="rm-link" aria-label={`Remover o sucesso ${k} da meta ${n}`} onClick={() => gravaSucessos(removeSucesso(sucessos, s.id))}>Remover</button>
                </li>
              );
            })}
          </ul>
        )}
        <button type="button" className="bt sec peq" aria-label={`Adicionar sucesso à meta ${n}`}
          onClick={() => gravaSucessos(adicionaSucesso(sucessos, { mes: 1, texto: '' }))}>Adicionar sucesso</button>
      </fieldset>

      {comStatus && (
        <label className="campo rm-status"><span className="rot">Status da meta {n}</span>
          <select value={meta.status} onChange={(e) => onChange(meta.idx, { status: e.target.value as StatusMeta })}>
            {STATUS.map((s) => <option key={s.id} value={s.id}>{s.rot}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}
