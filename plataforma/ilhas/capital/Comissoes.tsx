'use client';
/* Missão 4 · escolha das Comissões Permanentes. Cargo e bandeiras vêm do mandato e da Missão 3; as comissões, do catálogo
   public/data/comissoes ({uf}.json da Assembleia, se alguém curou; senão br.json, da Câmara). Grava em D.comissoes no formato
   antigo ({prio, esp, pq, papel, mov}, texto legível) mais `sigla`, ignorada pelo legado. */
import { useEffect, useState } from 'react';
import { bandeiraDe } from '@/lib/bandeiras';
import { BANDEIRA_COMISSAO } from '@/lib/comissoesPorBandeira';
import type { Catalogo, Comissao } from '@/lib/espacos';
import { aviso } from '../ponte';
import { casaDe } from '../rumo/Espacos';
import { useRumo } from '../rumo/useRumo';
import './capital.css';

type Registro = { id?: string; sigla?: string; esp?: string; prio?: string; pq?: string; papel?: string; mov?: string };
type Linha = Comissao & { motivo?: string; bandeiras: string[] };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const uid = () => Math.random().toString(36).slice(2, 10);
const AVISO_NOMES = 'Nomes podem ser diferentes na sua Assembleia. Confira no Regimento Interno.';

export default function Comissoes() {
  const { d, m, rumo, bump } = useRumo();
  const cargo = m.cargo ?? '';
  const casa = casaDe(cargo);
  const uf = (m.uf ?? '').toLowerCase();
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState('');
  const [ajustando, setAjustando] = useState<string | null>(null);
  const [nomeNovo, setNomeNovo] = useState('');

  useEffect(() => {
    let vivo = true;
    setCatalogo(null); setErro(false);
    const tenta = (arquivo: string) => fetch(`/data/comissoes/${arquivo}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    (async () => {
      /* a Assembleia tem prioridade se alguém curou o {uf}.json; senão vale a lista da Câmara como referência */
      const j = (casa === 'estadual' && uf && (await tenta(uf))) || (await tenta('br'));
      if (!vivo) return;
      if (j && Array.isArray(j.comissoes)) setCatalogo(j as Catalogo); else setErro(true);
    })();
    return () => { vivo = false; };
  }, [casa, uf]);

  const registros = (Array.isArray(d.comissoes) ? d.comissoes : []) as Registro[];
  const prior = rumo.bandeiras.filter((b) => b.prioridade !== null).sort((a, b) => a.prioridade! - b.prioridade!);
  /* sem cargo conhecido não há sugestão: a lista da Câmara serve só de referência */
  const sugere = casa !== null && prior.length > 0;

  const linhas: Linha[] = (catalogo?.comissoes ?? []).map((c) => {
    const casam = sugere ? prior.filter((b) => c.sigla && (BANDEIRA_COMISSAO[b.id] ?? []).includes(c.sigla)) : [];
    const rots = casam.map((b) => bandeiraDe(b.id)?.rot ?? b.rot);
    const motivo = rots.length ? `Combina com ${rots.length > 1 ? 'suas bandeiras' : 'sua bandeira'} ${rots.join(' e ')}` : undefined;
    return { ...c, motivo, bandeiras: rots };
  });
  const ordem = (l: Linha) => prior.findIndex((b) => l.bandeiras.includes(bandeiraDe(b.id)?.rot ?? b.rot));
  const sugeridas = linhas.filter((l) => l.motivo).sort((a, b) => ordem(a) - ordem(b));
  const q = norm(busca);
  const demais = linhas.filter((l) => !l.motivo && (!q || norm(l.nome).includes(q) || norm(l.sigla ?? '').includes(q)));

  const registroDe = (c: Comissao) => registros.find((r) => (c.sigla && r.sigla === c.sigla) || (!r.sigla && norm(r.esp ?? '') === norm(c.nome)));
  const noCatalogo = new Set(linhas.map((l) => registroDe(l)).filter(Boolean));
  const outras = registros.filter((r) => !noCatalogo.has(r) && (r.esp ?? '').trim() !== '');

  const grava = (lista: Registro[]) => { d.comissoes = lista; bump(); };
  const alterna = (l: Linha) => {
    const r = registroDe(l);
    if (!r) { grava([...registros, { id: uid(), sigla: l.sigla, esp: l.nome, prio: l.bandeiras.join(', ') }]); return; }
    if ((r.pq || r.papel || r.mov) && !window.confirm(`Remover ${r.esp || l.nome}? As respostas dessa comissão serão apagadas.`)) return;
    grava(registros.filter((x) => x !== r));
  };
  const salvaNome = (l: Linha) => {
    const nome = nomeNovo.trim();
    if (!nome) { aviso('Escreva o nome da comissão na sua Assembleia.'); return; }
    const r = registroDe(l);
    if (r) { r.esp = nome; grava([...registros]); }
    else grava([...registros, { id: uid(), sigla: l.sigla, esp: nome, prio: l.bandeiras.join(', ') }]);
    setAjustando(null);
  };

  const linha = (l: Linha) => {
    const r = registroDe(l);
    const chave = l.sigla ?? l.nome;
    return (
      <li key={chave} className={`cp-lin${l.motivo ? ' sug' : ''}${r ? ' on' : ''}`} data-sigla={l.sigla}>
        <div className="cp-lin-topo">
          <label>
            <input type="checkbox" checked={!!r} onChange={() => alterna(l)} aria-label={`Escolher ${l.nome}`} />
            <span>{r?.esp || l.nome}{l.sigla && <small> · {l.sigla}</small>}{r && r.esp && r.esp !== l.nome && <small> · na Câmara: {l.nome}</small>}</span>
          </label>
          {casa === 'estadual' && (
            <button type="button" className="bt sec peq" onClick={() => { setAjustando(chave); setNomeNovo(r?.esp || l.nome); }}>Ajustar o nome</button>
          )}
        </div>
        {l.motivo && <p className="cp-motivo">{l.motivo}</p>}
        {ajustando === chave && (
          <div className="cp-nome">
            <label className="campo"><span className="rot">Nome na sua Assembleia</span>
              <input type="text" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); salvaNome(l); } }} />
            </label>
            <button type="button" className="bt pri peq" onClick={() => salvaNome(l)}>Salvar nome</button>
            <button type="button" className="bt fant peq" onClick={() => setAjustando(null)}>Cancelar</button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="ilha-corpo cp-esc">
      {prior.length > 0 && <p className="cp-band">Suas bandeiras: {prior.map((b) => bandeiraDe(b.id)?.rot ?? b.rot).join(' · ')}</p>}
      {casa !== null && casa !== 'federal' && <p className="cp-aviso" role="note">{AVISO_NOMES}</p>}
      {casa === null && <p className="cp-aviso" role="note">Não reconheci o cargo do mandato. Mostro as comissões da Câmara dos Deputados como referência de temas, sem sugestões. {AVISO_NOMES}</p>}
      {casa !== null && !prior.length && (
        <p className="cp-aviso" role="note">Ainda não há bandeiras prioritárias, então não há comissões sugeridas. <a href="#/m/3/m3.bandeiras">Escolher as bandeiras na Missão 3</a></p>
      )}

      {erro && <p className="cp-vazio" role="alert">Não consegui carregar a lista de comissões agora. Tente de novo mais tarde.</p>}
      {!catalogo && !erro && <p className="cp-vazio">Carregando as comissões...</p>}

      {sugeridas.length > 0 && (
        <section aria-labelledby="cp-sug-t">
          <h4 id="cp-sug-t">Sugeridas para você</h4>
          <ul className="cp-lista">{sugeridas.map(linha)}</ul>
        </section>
      )}

      {catalogo && (
        <section aria-labelledby="cp-todas-t">
          <h4 id="cp-todas-t">Todas as comissões</h4>
          <label className="campo cp-busca"><span className="rot">Buscar por nome ou sigla</span>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: saúde ou CSAUDE" />
          </label>
          {!demais.length && <p className="cp-vazio">Nenhuma comissão encontrada para essa busca.</p>}
          <ul className="cp-lista">{demais.map(linha)}</ul>
          <p className="cp-fonte">{catalogo.fonte ? 'Fonte: dados abertos da Câmara dos Deputados. ' : ''}Catálogo gerado em {new Date(catalogo.gerado).toLocaleDateString('pt-BR')}.</p>
        </section>
      )}

      {outras.length > 0 && (
        <section aria-labelledby="cp-outras-t">
          <h4 id="cp-outras-t">Outros espaços que o mandato já registrou</h4>
          <ul className="cp-outras">{outras.map((r, i) => <li key={r.id ?? i}>{r.esp}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
