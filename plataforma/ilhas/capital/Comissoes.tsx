'use client';
/* Missão 4 · escolha das Comissões Permanentes. Cargo e bandeiras vêm do mandato e da Missão 3; as comissões, do catálogo
   public/data/comissoes ({uf}.json da Assembleia, se alguém curou; senão br.json, da Câmara). Grava em D.comissoes no formato
   antigo ({prio, esp, pq, papel, mov}, texto legível) mais `sigla`, ignorada pelo legado. */
import { useEffect, useState } from 'react';
import { bandeiraDe } from '@/lib/bandeiras';
import { PAPEIS, lerMovimentos, papelNorm } from '@/lib/capital';
import { BANDEIRA_COMISSAO } from '@/lib/comissoesPorBandeira';
import type { Catalogo, Comissao } from '@/lib/espacos';
import Gaveta from '../Gaveta';
import { aviso } from '../ponte';
import CartaoComissao, { type RegistroComissao } from './CartaoComissao';
import { casaDe } from '@/lib/espacos';
import { useRumo } from '../rumo/useRumo';
import './capital.css';

type Registro = RegistroComissao & { id?: string; sigla?: string; esp?: string; prio?: string };
type Linha = Comissao & { motivo?: string; bandeiras: string[] };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const uid = () => Math.random().toString(36).slice(2, 10);
const AVISO_NOMES = 'Nomes podem ser diferentes na sua Assembleia. Confira no Regimento Interno.';
const chaveDeReg = (r: Registro, idx?: number) => r.sigla || r.id || r.esp || (idx !== undefined ? String(idx) : '');

export default function Comissoes() {
  const { d, m, rumo, espacos, bump } = useRumo();
  const cargo = m.cargo ?? '';
  const casa = casaDe(cargo);
  const uf = (m.uf ?? '').toLowerCase();
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState('');
  const [ajustando, setAjustando] = useState<string | null>(null);
  const [nomeNovo, setNomeNovo] = useState('');
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [focoChave, setFocoChave] = useState<string | null>(null);
  const [origemGaveta, setOrigemGaveta] = useState<HTMLElement | null>(null);

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
  /* Missão 3: as comissões de comissoesDesejadas entram já marcadas, uma única vez por nome (se a pessoa desmarcar, não voltam) */
  useEffect(() => {
    if (!catalogo) return;
    const lista = catalogo.comissoes;
    const vistos: string[] = Array.isArray(d.comissoesM3) ? (d.comissoesM3 as string[]) : [];
    const novos = espacos.filter((e) => norm(e.comissao ?? '') !== '' && !vistos.includes(norm(e.comissao)));
    if (!novos.length) return;
    const atuais = (Array.isArray(d.comissoes) ? d.comissoes : []) as Registro[];
    const entram: Registro[] = [];
    novos.forEach((e) => {
      const n = norm(e.comissao);
      const iguais = lista.filter((c) => norm(c.nome) === n);
      const casa = iguais.length === 1 ? iguais : lista.filter((c) => norm(c.nome).startsWith(n)); // nome genérico da Missão 3: "Comissão de Saúde"
      if (casa.length !== 1) return;
      const c = casa[0];
      if ([...atuais, ...entram].some((r) => r.sigla === c.sigla)) return;
      entram.push({ id: uid(), sigla: c.sigla, esp: c.nome, prio: e.bandeira ?? '', ...(PAPEIS.includes(papelNorm(e.papel)) ? { papel: papelNorm(e.papel) } : {}) });
    });
    d.comissoesM3 = [...vistos, ...novos.map((e) => norm(e.comissao))];
    if (entram.length) d.comissoes = [...atuais, ...entram];
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogo]);
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

  const abreGaveta = (chave: string | null, origem?: HTMLElement | null) => {
    setFocoChave(chave);
    setOrigemGaveta(origem ?? null);
    setGavetaAberta(true);
  };
  const grava = (lista: Registro[]) => { d.comissoes = lista; bump(); };
  const removeReg = (r: Registro, fallbackNome: string) => {
    if ((r.pq || r.papel || r.mov) && !window.confirm(`Remover ${r.esp || fallbackNome}? As respostas dessa comissão serão apagadas.`)) return false;
    grava(registros.filter((x) => x !== r));
    if (focoChave === chaveDeReg(r)) setFocoChave(null);
    return true;
  };
  const alterna = (l: Linha, origem?: HTMLElement | null) => {
    const r = registroDe(l);
    if (!r) {
      const novo: Registro = { id: uid(), sigla: l.sigla, esp: l.nome, prio: l.bandeiras.join(', ') };
      grava([...registros, novo]);
      abreGaveta(chaveDeReg(novo), origem);
      return;
    }
    removeReg(r, l.nome);
  };
  const salvaNome = (l: Linha) => {
    const nome = nomeNovo.trim();
    if (!nome) { aviso('Escreva o nome da comissão na sua Assembleia.'); return; }
    const r = registroDe(l);
    if (r) { r.esp = nome; grava([...registros]); }
    else {
      const novo: Registro = { id: uid(), sigla: l.sigla, esp: nome, prio: l.bandeiras.join(', ') };
      grava([...registros, novo]);
    }
    setAjustando(null);
  };

  const linha = (l: Linha) => {
    const r = registroDe(l);
    const chave = l.sigla ?? l.nome;
    const movs = r ? lerMovimentos(r) : [];
    const papel = r ? papelNorm(r.papel) : '';
    const temResumo = !!(r && (r.pq || papel || movs.length > 0));
    return (
      <li key={chave} className={`cp-lin${l.motivo ? ' sug' : ''}${r ? ' on' : ''}`} data-sigla={l.sigla}>
        <div className="cp-lin-topo">
          <label>
            <input type="checkbox" checked={!!r} onChange={(e) => alterna(l, e.currentTarget)} aria-label={`Escolher ${l.nome}`} />
            <span>{r?.esp || l.nome}{l.sigla && <small> · {l.sigla}</small>}{r && r.esp && r.esp !== l.nome && <small> · na Câmara: {l.nome}</small>}</span>
          </label>
          <div className="cp-lin-acoes">
            {r && (
              <button type="button" className="bt pri peq" onClick={(e) => abreGaveta(chaveDeReg(r), e.currentTarget)}>
                Configurar
              </button>
            )}
            {casa === 'estadual' && (
              <button type="button" className="bt sec peq" onClick={() => { setAjustando(chave); setNomeNovo(r?.esp || l.nome); }}>Ajustar o nome</button>
            )}
          </div>
        </div>
        {l.motivo && <p className="cp-motivo">{l.motivo}</p>}
        {temResumo && (
          <p className="cp-resumo-com">
            {papel && <>Papel: <b>{papel}</b></>}
            {papel && movs.length > 0 && ' · '}
            {movs.length > 0 && `${movs.length} ${movs.length === 1 ? 'movimento' : 'movimentos'}`}
            {!papel && movs.length === 0 && r?.pq}
          </p>
        )}
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

  const focoValido = focoChave && registros.some((r, idx) => chaveDeReg(r, idx) === focoChave) ? focoChave : null;
  const comListaDrawer = focoValido
    ? registros.filter((r, idx) => chaveDeReg(r, idx) === focoValido)
    : registros;

  return (
    <div className="ilha-corpo cp-esc">
      <div className="np-sec-card">
        <div className="cp-topo-barra">
          <div className="cp-topo-avisos">
            {prior.length > 0 && <p className="cp-band">Suas bandeiras: {prior.map((b) => bandeiraDe(b.id)?.rot ?? b.rot).join(' · ')}</p>}
            {casa !== null && casa !== 'federal' && <p className="cp-aviso" role="note">{AVISO_NOMES}</p>}
            {casa === null && <p className="cp-aviso" role="note">Não reconheci o cargo do mandato. Mostro as comissões da Câmara dos Deputados como referência de temas, sem sugestões. {AVISO_NOMES}</p>}
            {casa !== null && !prior.length && (
              <p className="cp-aviso" role="note">Ainda não há bandeiras prioritárias, então não há comissões sugeridas. <a href="#/m/3/m3.bandeiras">Escolher as bandeiras na Missão 3</a></p>
            )}
          </div>
          <button type="button" className="bt pri peq" onClick={(e) => abreGaveta(null, e.currentTarget)}>
            Espaços escolhidos para negociar ({registros.length})
          </button>
        </div>

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
            <p className="cp-fonte cp-instrucao">Existem outras Comissões que o mandato deseja participar? Assinale-as a seguir considerando a quantidade de recursos disponíveis para a realização de um trabalho relevante.</p>
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

      <Gaveta
        aberta={gavetaAberta}
        titulo={`Espaços escolhidos para negociar (${registros.length})`}
        ariaLabel="Espaços escolhidos para negociar"
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
                aviso('Espaços salvos!');
              }}
            >
              Salvar espaços
            </button>
          </>
        }
      >
        {registros.length > 1 && (
          <div className="cp-gaveta-chips">
            <button type="button" className="rm-chip" aria-pressed={focoValido === null} onClick={() => setFocoChave(null)}>
              Ver todas ({registros.length})
            </button>
            {registros.map((r, idx) => {
              const ch = chaveDeReg(r, idx);
              return (
                <button key={ch} type="button" className="rm-chip" aria-pressed={focoValido === ch} onClick={() => setFocoChave(ch)}>
                  {r.sigla || r.esp || `Espaço ${idx + 1}`}
                </button>
              );
            })}
          </div>
        )}
        {comListaDrawer.length > 0 ? (
          comListaDrawer.map((r, idx) => {
            const ch = chaveDeReg(r, idx);
            const nome = r.esp || r.sigla || 'Espaço';
            return (
              <div key={ch} className="np-card cp-gaveta-item">
                <div className="cp-gaveta-cab">
                  <strong className="cp-gaveta-nome">
                    {nome}
                    {r.sigla && r.esp && <small> · {r.sigla}</small>}
                  </strong>
                  <button type="button" className="rm-link" onClick={() => removeReg(r, nome)}>
                    Remover
                  </button>
                </div>
                <CartaoComissao reg={r} nome={nome} posse={m.data_posse} onMuda={bump} />
              </div>
            );
          })
        ) : (
          <p className="cp-vazio">Nenhuma comissão selecionada no momento.</p>
        )}
      </Gaveta>
    </div>
  );
}
