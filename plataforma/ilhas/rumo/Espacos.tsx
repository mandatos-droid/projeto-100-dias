'use client';
/* Missão 3 · espaços que o mandato pretende compor (comissões e outros), com sugestões por cargo, Casa e bandeira.
   Grava em D.comissoesDesejadas: os campos antigos (comissao, cargo, bandeira) ficam, `papel` é opcional. */
import { useEffect, useState } from 'react';
import { bandeiraDe } from '@/lib/bandeiras';
import { PAPEIS, TIPOS_ESPACO, alerta, faltaBandeira1, sugestoes, type Casa, type Catalogo, type Espaco } from '@/lib/espacos';
import { aviso } from '../ponte';
import { useRumo } from './useRumo';
import './rumo.css';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const uid = () => Math.random().toString(36).slice(2, 10);
/* o catálogo desta Casa: Câmara para Deputado(a) Federal, {uf}.json para Assembleia (se alguém curou); as outras ficam sem catálogo */
export function casaDe(cargo: string): Casa | null {
  const n = norm(cargo);
  if (n.includes('federal')) return 'federal';
  if (n.includes('estadual') || n.includes('distrital')) return 'estadual';
  if (n.includes('senador')) return 'senado';
  if (n.includes('vereador')) return 'municipal';
  return null;
}
const ROTULO_CASA: Record<Casa, string> = { federal: 'Câmara dos Deputados', estadual: 'Assembleia Legislativa', senado: 'Senado Federal', municipal: 'Câmara Municipal' };
/** o tipo de espaço que já é um papel preenche o papel; os demais preenchem o nome */
const PAPEL_DO_TIPO: Record<string, string> = { titular: 'Titular', suplente: 'Suplente', presidencia: 'Presidência', relatoria: 'Relatoria' };
const DICA_GUIA = 'É importante concentrar esforços para que a vaga na comissão com titularidade contemple a principal bandeira prioritária do mandato.';

export default function Espacos() {
  const { rumo, m, espacos, setEspacos } = useRumo();
  const casa = casaDe(m.cargo ?? '');
  const uf = (m.uf ?? '').toLowerCase();
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState('Titular');
  const [bandeira, setBandeira] = useState('');

  useEffect(() => {
    const arquivo = casa === 'federal' ? 'br' : casa === 'estadual' && uf ? uf : '';
    setCatalogo(null);
    if (!arquivo) return;
    let vivo = true;
    fetch(`/data/comissoes/${arquivo}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo && j && Array.isArray(j.comissoes)) setCatalogo(j as Catalogo); })
      .catch(() => {}); // sem catálogo (404 ou JSON inválido): modo genérico
    return () => { vivo = false; };
  }, [casa, uf]);

  const prior = rumo.bandeiras.filter((b) => b.prioridade !== null).sort((a, b) => a.prioridade! - b.prioridade!);
  const priorIds = prior.map((b) => b.id);
  const lista = sugestoes({ cargo: m.cargo ?? '', uf: m.uf ?? '', bandeiras: priorIds }, catalogo);
  const destacadas = lista.filter((s) => s.destacada);
  const demais = lista.filter((s) => !s.destacada);
  const tipos = TIPOS_ESPACO.filter((t) => !casa || t.casas.includes(casa));
  const opcoesBandeira = [...prior, ...rumo.bandeiras.filter((b) => b.prioridade === null)];
  const jaTem = (n: string) => espacos.some((e) => norm(e.comissao ?? '').trim() === norm(n).trim());
  const nomesAntigos = [...new Set(espacos.map((e) => (e.comissao ?? '').trim()).filter(Boolean))];

  const registra = (e: { comissao: string; papel: string; bandeira: string }) => {
    setEspacos([...espacos, { id: uid(), comissao: e.comissao, papel: e.papel, cargo: e.papel, bandeira: e.bandeira }]);
  };
  const envia = () => {
    if (!nome.trim()) { aviso('Escreva a comissão ou o espaço antes de registrar.'); return; }
    registra({ comissao: nome.trim(), papel, bandeira });
    setNome('');
  };
  const remove = (i: number) => setEspacos(espacos.filter((_, k) => k !== i));
  const tipo = (id: string, rot: string) => {
    if (PAPEL_DO_TIPO[id]) setPapel(PAPEL_DO_TIPO[id]);
    else { setNome(rot); setPapel('Outro'); }
  };
  const cartao = (s: (typeof lista)[number]) => {
    const rotBandeira = s.bandeira ? bandeiraDe(s.bandeira)?.rot ?? '' : '';
    return (
      <li key={s.nome} className={`rm-sug-c${s.destacada ? ' dest' : ''}`}>
        <span>{s.nome}{s.sigla && <small> · {s.sigla}</small>}{rotBandeira && <em className="rm-sug">{rotBandeira}</em>}</span>
        <button type="button" className="bt sec peq" disabled={jaTem(s.nome)} aria-label={jaTem(s.nome) ? `${s.nome} já registrada` : `Registrar ${s.nome}`}
          onClick={() => registra({ comissao: s.nome, papel: 'Titular', bandeira: rotBandeira })}>{jaTem(s.nome) ? 'Registrada' : 'Registrar como titular'}</button>
      </li>
    );
  };

  return (
    <div className="ilha-corpo rm-esp">
      <p className="peq-t">{casa ? `Tipos de espaço da ${ROTULO_CASA[casa]}.` : 'Tipos de espaço de uma Casa legislativa.'} Clique para começar o registro.</p>
      <div className="rm-chips" role="group" aria-label="Tipos de espaço">
        {tipos.map((t) => <button key={t.id} type="button" className="rm-chip" onClick={() => tipo(t.id, t.rot)}>{t.rot}</button>)}
      </div>

      <section aria-labelledby="rm-sugestoes-t">
        <h4 id="rm-sugestoes-t">Sugestões para as suas bandeiras</h4>
        {!prior.length && <p className="rm-vazio">Confirme as bandeiras prioritárias no exercício anterior para ver as comissões que conversam com elas.</p>}
        {prior.length > 0 && !destacadas.length && <p className="rm-vazio">Nenhuma comissão do catálogo conversa com as bandeiras prioritárias. Escreva o espaço no formulário abaixo.</p>}
        {destacadas.length > 0 && <ul className="rm-sug-l">{destacadas.map(cartao)}</ul>}
        {demais.length > 0 && (
          <details className="rm-antigo">
            <summary>Todas as comissões ({demais.length})</summary>
            <ul className="rm-sug-l">{demais.map(cartao)}</ul>
          </details>
        )}
        {catalogo && <p className="rm-dica">{catalogo.fonte ? 'Fonte: dados abertos da Câmara dos Deputados. ' : ''}Catálogo gerado em {new Date(catalogo.gerado).toLocaleDateString('pt-BR')}; confira os nomes na Casa.</p>}
        {!catalogo && lista.length > 0 && <p className="rm-dica">Nomes genéricos por bandeira: confira como a sua Casa chama cada comissão.</p>}
      </section>

      <section aria-labelledby="rm-reg-t">
        <h4 id="rm-reg-t">Registrar um espaço</h4>
        <div className="rm-form">
          <label className="campo"><span className="rot">Comissão ou espaço</span>
            <input type="text" list="rm-espacos-dl" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Comissão de Educação"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); envia(); } }} />
            <datalist id="rm-espacos-dl">{[...new Set([...lista.map((s) => s.nome), ...nomesAntigos])].map((n) => <option key={n} value={n} />)}</datalist>
          </label>
          <label className="campo"><span className="rot">Papel</span>
            <select value={papel} onChange={(e) => setPapel(e.target.value)}>{PAPEIS.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label className="campo"><span className="rot">Bandeira relacionada</span>
            <select value={bandeira} onChange={(e) => setBandeira(e.target.value)}>
              <option value="">Nenhuma</option>
              {opcoesBandeira.map((b) => <option key={b.id} value={b.rot}>{b.rot}{b.prioridade !== null ? ` (prioridade ${b.prioridade})` : ''}</option>)}
            </select>
          </label>
          <button type="button" className="bt pri peq" onClick={envia}>Registrar espaço</button>
        </div>
      </section>

      <section aria-labelledby="rm-reg-l-t">
        <h4 id="rm-reg-l-t">Espaços registrados <span className="rm-n">{espacos.length}</span></h4>
        {!espacos.length && <p className="rm-vazio">Nada registrado ainda.</p>}
        <ul className="rm-reg">
          {espacos.map((e, i) => {
            const al = alerta(e as Espaco, priorIds);
            return (
              <li key={e.id ?? i} data-espaco={i}>
                <div>
                  <strong>{e.comissao || 'Espaço sem nome'}</strong>
                  <span className="rm-reg-meta">{[e.papel || e.cargo, e.bandeira].filter(Boolean).join(' · ')}</span>
                  {al && <p className="rm-alerta" role="note">{al}</p>}
                </div>
                <button type="button" className="rm-link" aria-label={`Remover ${e.comissao || 'espaço sem nome'}`} onClick={() => remove(i)}>Remover</button>
              </li>
            );
          })}
        </ul>
        {faltaBandeira1(espacos as Espaco[], priorIds) && (
          <div className="apoio"><span className="tag">Dica do Guia</span>{DICA_GUIA}</div>
        )}
      </section>
    </div>
  );
}
