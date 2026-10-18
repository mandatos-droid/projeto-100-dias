'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { carregaEleitos, carregaMapaBR } from '@/lib/dados';
import { corPartido, mistura, posEspectro } from '@/lib/partidos';
import { nf, pct, semAcento } from '@/lib/format';
import type { CasaChave, Eleito, Status } from '@/lib/types';
import { salva, statusDe, useLegado } from './ponte';
import { Chip, Foto, Hemiciclo, Marca, StatusBotoes, useCarga, type Membro } from './pecas';

const CASA_K: Record<Eleito['k'], CasaChave> = { f: 'federal', e: 'estadual', s: 'senado' };
const K_CASA: Record<CasaChave, Eleito['k']> = { federal: 'f', estadual: 'e', senado: 's' };
const rotuloCasa = (c: CasaChave, uf: string, curto = false) =>
  c === 'federal' ? (curto ? 'Câmara' : 'Câmara dos Deputados')
    : c === 'senado' ? 'Senado'
    : uf === 'DF' ? 'Câmara Legislativa'
    : uf === 'BR' ? (curto ? 'Assembleias' : 'Assembleias Legislativas') : (curto ? 'Assembleia' : 'Assembleia Legislativa');
const cargoDe = (e: Eleito) =>
  e.k === 'f' ? 'Deputado Federal' : e.k === 's' ? 'Senador' : e.uf === 'DF' ? 'Deputado Distrital' : 'Deputado Estadual';

const GENERO: [string, string][] = [['F', 'Mulheres'], ['M', 'Homens']];
const RACA: [string, string][] = [['B', 'Branca'], ['P', 'Parda'], ['N', 'Preta'], ['I', 'Indígena'], ['A', 'Amarela']];
const MANDATO: [string, string][] = [['r', 'Reeleição'], ['n', 'Primeiro mandato']];
const RELACAO: [string, string][] = [['aliado', 'Parceiros'], ['concorrente', 'Concorrentes'], ['neutro', 'Sem marcação']];
const COR_RACA: Record<string, string> = { B: '#d9c7a3', P: '#a8734a', N: '#3b2a26', I: '#b9473a', A: '#d6b43a', '': '#cfc8bd' };
const COR_GEN: Record<string, string> = { F: '#8a2d5c', M: '#6f8a9a' };
const COR_MAND: Record<string, string> = { r: '#571730', n: '#e0a526', '?': '#cfc8bd' };

const NOME_UF: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba',
  PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
};

type Filtros = Record<'partido' | 'genero' | 'raca' | 'mandato' | 'relacao', Set<string>>;
type Faceta = keyof Filtros;
const vazio = (): Filtros => ({ partido: new Set(), genero: new Set(), raca: new Set(), mandato: new Set(), relacao: new Set() });
const valor = (e: Eleito, f: Faceta): string =>
  f === 'partido' ? e.p : f === 'genero' ? e.g : f === 'raca' ? e.r : f === 'relacao' ? statusDe(e.s)
    : e.m === 'r' ? 'r' : e.m === '?' ? '?' : 'n';
const FACETAS: Faceta[] = ['partido', 'genero', 'raca', 'mandato', 'relacao'];
const passa = (e: Eleito, fl: Filtros, ignora?: Faceta) =>
  FACETAS.every((f) => f === ignora || !fl[f].size || fl[f].has(valor(e, f)));

function Opcao({ ativo, n, onClick, children }: { ativo: boolean; n: number; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip opc" aria-pressed={ativo} disabled={n === 0 && !ativo} onClick={onClick}>
      {children}<b>{nf.format(n)}</b>
    </button>
  );
}

function Ck({ ativo, n, onClick, children }: { ativo: boolean; n: number; onClick: () => void; children: ReactNode }) {
  return (
    <label className={`ck${n === 0 && !ativo ? ' off' : ''}`}>
      <input type="checkbox" checked={ativo} disabled={n === 0 && !ativo} onChange={onClick} />
      <span className="ck-r">{children}</span><b>{nf.format(n)}</b>
    </label>
  );
}

function Menu({ id, titulo, qtd, aberta, setAberta, largo, children }: {
  id: string; titulo: string; qtd: number; aberta: string | null; setAberta: (v: string | null) => void; largo?: boolean; children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const on = aberta === id;
  useEffect(() => {
    if (!on) return;
    const fora = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberta(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberta(null); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [on, setAberta]);
  return (
    <div className="menu-f" ref={ref}>
      <button type="button" className={`menu-bt${qtd ? ' tem' : ''}`} aria-expanded={on} aria-haspopup="true" onClick={() => setAberta(on ? null : id)}>
        {titulo}{qtd > 0 && <span className="cnt">{qtd}</span>}<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {on && <div className={`menu-pop${largo ? ' largo' : ''}`} role="group" aria-label={titulo}>{children}</div>}
    </div>
  );
}

function Pilha({ titulo, partes }: { titulo: string; partes: { id: string; rot: string; n: number; cor: string }[] }) {
  const total = partes.reduce((a, b) => a + b.n, 0);
  if (!total) return null;
  return (
    <div className="pilha">
      <div className="pilha-t">{titulo}</div>
      <div className="pilha-b" role="img" aria-label={`${titulo}: ${partes.filter((p) => p.n).map((p) => `${p.rot} ${p.n}`).join(', ')}`}>
        {partes.filter((p) => p.n).map((p) => <i key={p.id} style={{ width: `${(p.n / total) * 100}%`, background: p.cor }} title={`${p.rot}: ${p.n}`} />)}
      </div>
      <div className="pilha-l">
        {partes.filter((p) => p.n).map((p) => (
          <span key={p.id}><i style={{ background: p.cor }} />{p.rot} <b>{Math.round((p.n / total) * 100)}%</b></span>
        ))}
      </div>
    </div>
  );
}

export default function Assentos() {
  const { D, m } = useLegado();
  const { dados: todos, erro, carregando } = useCarga(carregaEleitos, 'eleitos');
  const { dados: mapaBR } = useCarga(carregaMapaBR, 'mapa-br');
  const casaIni: CasaChave = (D.casaSel as CasaChave | undefined) ?? (D.tse as { casa?: CasaChave }).casa
    ?? (/Federal/.test(m.cargo) ? 'federal' : /Senador/.test(m.cargo) ? 'senado' : 'estadual');
  const [casa, setCasaL] = useState<CasaChave>(casaIni);
  const [escopo, setEscopoL] = useState<string>((D.escopoSel as string | undefined) ?? (m.uf || 'BR'));
  const [fl, setFl] = useState<Filtros>(vazio);
  const [sel, setSel] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [global, setGlobal] = useState('');
  const [menu, setMenu] = useState<string | null>(null);
  const [limite, setLimite] = useState(40);
  const fichaRef = useRef<HTMLDivElement>(null);
  const setCasa = (c: CasaChave) => { setCasaL(c); D.casaSel = c; salva(); setSel(null); setLimite(40); };
  const setEscopo = (u: string) => { setEscopoL(u); D.escopoSel = u; salva(); setSel(null); setLimite(40); };
  useEffect(() => { D.casaSel = casa; D.escopoSel = escopo; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const daCasa = useMemo(() => (todos ?? []).filter((e) => e.k === K_CASA[casa]), [todos, casa]);
  const base = useMemo(() => daCasa.filter((e) => escopo === 'BR' || e.uf === escopo), [daCasa, escopo]);
  const visiveis = base.filter((e) => passa(e, fl));
  const filtrando = FACETAS.some((f) => fl[f].size > 0);

  const membros: Membro[] = useMemo(() => base.map((e) => ({ key: e.s, nome: `${e.u} (${e.uf})`, partido: e.p, votos: e.v })), [base]);
  const vis = new Set(visiveis.map((e) => e.s));

  // contagem por opção de cada faceta, ignorando o filtro da própria faceta (padrão de busca facetada)
  const conta = (f: Faceta) => {
    const c = new Map<string, number>();
    base.forEach((e) => { if (passa(e, fl, f)) c.set(valor(e, f), (c.get(valor(e, f)) ?? 0) + 1); });
    return c;
  };
  const cPartido = conta('partido'), cGenero = conta('genero'), cRaca = conta('raca'), cMandato = conta('mandato'), cRelacao = conta('relacao');
  const partidos = [...new Set([...cPartido.keys(), ...fl.partido])]
    .sort((a, b) => (cPartido.get(b) ?? 0) - (cPartido.get(a) ?? 0) || posEspectro(a) - posEspectro(b));

  const alterna = (f: Faceta, id: string) => {
    const n = { ...fl, [f]: new Set(fl[f]) };
    if (n[f].has(id)) n[f].delete(id); else n[f].add(id);
    setFl(n); setLimite(40);
  };
  const rotuloFiltro = (f: Faceta, id: string) =>
    f === 'partido' ? id : (({ genero: GENERO, raca: RACA, mandato: MANDATO, relacao: RELACAO })[f].find(([k]) => k === id)?.[1] ?? id);

  // contagem por UF para o cartograma (respeita casa e filtros)
  const porUF: Record<string, number> = {};
  daCasa.forEach((e) => { if (passa(e, fl)) porUF[e.uf] = (porUF[e.uf] ?? 0) + 1; });
  const totalUF = useMemo(() => {
    const c: Record<string, number> = {};
    daCasa.forEach((e) => { c[e.uf] = (c[e.uf] ?? 0) + 1; });
    return c;
  }, [daCasa]);
  const maxUF = Math.max(1, ...Object.values(porUF));

  const q = semAcento(busca);
  const tabela = visiveis.filter((e) => !q || semAcento(e.u).includes(q) || semAcento(e.c).includes(q))
    .sort((a, b) => b.v - a.v || a.u.localeCompare(b.u));
  const atual = (todos ?? []).find((e) => e.s === sel);
  const meuSq = (D.tse as { sq?: string }).sq;
  const relDe = (e: Eleito) => ({ nome: e.u, partido: e.p, cargo: cargoDe(e), uf: e.uf, votos: e.v || undefined });

  const g = semAcento(global);
  const achados = g.length < 2 ? [] : (todos ?? []).filter((e) => semAcento(e.u).includes(g) || semAcento(e.c).includes(g)).slice(0, 8);
  const vaiPara = (e: Eleito) => {
    setCasaL(CASA_K[e.k]); D.casaSel = CASA_K[e.k];
    setEscopoL(e.uf); D.escopoSel = e.uf; salva();
    setFl(vazio()); setSel(e.s); setGlobal(''); setBusca('');
    setTimeout(() => fichaRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
  };

  const parceiros = visiveis.filter((e) => statusDe(e.s) === 'aliado').length;
  const concorrentes = visiveis.filter((e) => statusDe(e.s) === 'concorrente').length;
  const nPartidos = new Set(visiveis.map((e) => e.p)).size;
  const cont = (fn: (e: Eleito) => string) => {
    const c: Record<string, number> = {};
    visiveis.forEach((e) => { c[fn(e)] = (c[fn(e)] ?? 0) + 1; });
    return c;
  };
  const cG = cont((e) => e.g), cR = cont((e) => e.r), cM = cont((e) => (e.m === 'r' ? 'r' : e.m === '?' ? '?' : 'n'));
  const nomeEscopo = escopo === 'BR' ? 'Brasil' : NOME_UF[escopo];

  return (
    <div className="ilha-corpo ass">
      <h4>Parlamentares eleitos · {nomeEscopo} · {rotuloCasa(casa, escopo)}</h4>

      <div className="ass-busca">
        <label className="rot" htmlFor="ass-global">Procurar qualquer parlamentar eleito no Brasil</label>
        <input id="ass-global" type="search" autoComplete="off" value={global} onChange={(e) => setGlobal(e.target.value)}
          placeholder="Digite o nome (ex.: Erika, Tabata, Nikolas…)" />
        {achados.length > 0 && (
          <div className="sugestoes" role="listbox">
            {achados.map((e) => (
              <button key={e.s} type="button" role="option" aria-selected={false} onClick={() => vaiPara(e)}>
                <strong>{e.u}</strong> · {e.p} · {cargoDe(e)} · {e.uf}
              </button>
            ))}
          </div>
        )}
        {g.length >= 2 && achados.length === 0 && !carregando && <p className="peq-t">Nenhum parlamentar eleito com esse nome.</p>}
      </div>

      <div className="abas" role="tablist">
        {(['estadual', 'federal', 'senado'] as CasaChave[]).map((c) => {
          const n = (todos ?? []).filter((e) => e.k === K_CASA[c] && (escopo === 'BR' || e.uf === escopo)).length;
          return (
            <button key={c} type="button" role="tab" aria-selected={casa === c} onClick={() => setCasa(c)}>
              {rotuloCasa(c, escopo, true)} <span className="n-aba">{nf.format(n)}</span>
            </button>
          );
        })}
      </div>

      {carregando && <p className="sem">Carregando parlamentares…</p>}
      {erro && <div className="erro-cx">Não foi possível carregar os parlamentares eleitos.</div>}
      {todos && casa === 'senado' && (
        <div className="apoio"><span className="tag">Senado</span>Compõem o Senado os 54 eleitos em 2026 (mandato 2027–2035) e os 27 eleitos em 2022 (mandato até 2031). Para os de 2022 não há votos nem avaliação de reeleição.</div>
      )}
      {todos && base.length === 0 && (
        <div className="apoio atencao"><span className="tag">TSE</span>
          {escopo === 'RO' ? 'O TSE ainda não liberou o resultado de Rondônia para esta Casa.' : 'Sem parlamentares eleitos para esta seleção.'}</div>
      )}

      {todos && (
        <>
          <div className="filtros-h" aria-label="Filtros">
            <div className="barra-f">
              <span className="rot-f">Filtrar</span>
              <Menu id="genero" titulo="Gênero" qtd={fl.genero.size} aberta={menu} setAberta={setMenu}>
                {GENERO.map(([id, r]) => <Ck key={id} ativo={fl.genero.has(id)} n={cGenero.get(id) ?? 0} onClick={() => alterna('genero', id)}>{r}</Ck>)}
              </Menu>
              <Menu id="raca" titulo="Cor ou raça" qtd={fl.raca.size} aberta={menu} setAberta={setMenu}>
                {RACA.map(([id, r]) => <Ck key={id} ativo={fl.raca.has(id)} n={cRaca.get(id) ?? 0} onClick={() => alterna('raca', id)}>{r}</Ck>)}
                <p className="nota-f">Autodeclarada ao TSE.</p>
              </Menu>
              <Menu id="mandato" titulo="Mandato" qtd={fl.mandato.size} aberta={menu} setAberta={setMenu}>
                {MANDATO.map(([id, r]) => <Ck key={id} ativo={fl.mandato.has(id)} n={cMandato.get(id) ?? 0} onClick={() => alterna('mandato', id)}>{r}</Ck>)}
                <p className="nota-f">Reeleição = já eleito em 2022 para o mesmo cargo (cruzamento por nome e UF). Quem teve mandato antes e ficou fora de 2022 aparece como primeiro mandato.</p>
              </Menu>
              <Menu id="relacao" titulo="Relação" qtd={fl.relacao.size} aberta={menu} setAberta={setMenu}>
                {RELACAO.map(([id, r]) => (
                  <Ck key={id} ativo={fl.relacao.has(id)} n={cRelacao.get(id) ?? 0} onClick={() => alterna('relacao', id)}>
                    {id !== 'neutro' && <Marca tipo={id as 'aliado' | 'concorrente'} tam={11} />} {r}
                  </Ck>))}
              </Menu>
              <Menu id="partido" titulo="Partido" qtd={fl.partido.size} aberta={menu} setAberta={setMenu} largo>
                <div className="ck-grade">
                  {partidos.map((p) => (
                    <Ck key={p} ativo={fl.partido.has(p)} n={cPartido.get(p) ?? 0} onClick={() => alterna('partido', p)}>
                      <i className="ponto" style={{ background: corPartido(p) }} /> {p}
                    </Ck>))}
                </div>
              </Menu>
              {filtrando && <button type="button" className="link-bt" onClick={() => { setFl(vazio()); setLimite(40); }}>Limpar tudo</button>}
            </div>
            {filtrando && (
              <div className="ativos" aria-label="Filtros ativos">
                {FACETAS.flatMap((f) => [...fl[f]].map((id) => (
                  <button key={f + id} type="button" className="chip ativo" onClick={() => alterna(f, id)} title="Remover filtro">
                    {rotuloFiltro(f, id)} <span aria-hidden="true">×</span><span className="so-leitor"> remover filtro</span>
                  </button>)))}
              </div>
            )}
          </div>

          <div className="ass-grid">
            <aside className="ass-lado" aria-label="Território">
            <div className="bloco">
              <div className="bloco-t">
                <span>Território</span>
                {escopo !== 'BR' && <button type="button" className="link-bt" onClick={() => setEscopo('BR')}>← ver o Brasil</button>}
              </div>
              {mapaBR && (
                <svg className="mapa-br" viewBox={`0 0 ${mapaBR.w} ${mapaBR.h}`} role="group" aria-label="Mapa do Brasil por estado">
                  {mapaBR.uf.map((u) => {
                    const n = porUF[u.id] ?? 0, tot = totalUF[u.id] ?? 0;
                    const ativo = escopo === u.id;
                    const t = escopo === 'BR' ? 0.12 + 0.88 * (n / maxUF) : 0.12;
                    return (
                      <g key={u.id} className={`uf${ativo ? ' ativo' : ''}${tot ? '' : ' vazio'}`} role="button" tabIndex={tot ? 0 : -1}
                        aria-pressed={ativo} aria-label={`${NOME_UF[u.id]}: ${n} de ${tot} parlamentares`}
                        onClick={() => tot && setEscopo(ativo ? 'BR' : u.id)}
                        onKeyDown={(ev) => { if (tot && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); setEscopo(ativo ? 'BR' : u.id); } }}>
                        <title>{`${NOME_UF[u.id]} · ${n}${filtrando ? ` de ${tot}` : ''} parlamentares`}</title>
                        <path d={u.d} fill={ativo ? '#571730' : mistura('#571730', t)} />
                        <text x={u.cx} y={u.cy} textAnchor="middle" className={t > 0.5 || ativo ? 'claro' : ''}>
                          <tspan x={u.cx} dy="-0.2em" className="sg">{u.id}</tspan><tspan x={u.cx} dy="1.15em" className="qt">{n}</tspan>
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
              <button type="button" className="bt fant peq br-bt" aria-pressed={escopo === 'BR'} onClick={() => setEscopo('BR')}>
                Brasil inteiro
              </button>
              {m.uf && escopo !== m.uf && (
                <button type="button" className="link-bt" onClick={() => setEscopo(m.uf)}>Voltar ao estado do mandato ({m.uf})</button>
              )}
            </div>
            </aside>

          <section className="ass-main" aria-live="polite">
            <div className="kpis">
              <div className="kp"><b>{nf.format(visiveis.length)}</b><span>{filtrando ? `de ${nf.format(base.length)} parlamentares` : 'parlamentares eleitos'}</span></div>
              <div className="kp"><b>{nPartidos}</b><span>partidos</span></div>
              <div className="kp ok"><b><Marca tipo="aliado" tam={18} /> {parceiros}</b><span>parceiros</span></div>
              <div className="kp coral"><b><Marca tipo="concorrente" tam={18} /> {concorrentes}</b><span>concorrentes</span></div>
            </div>

            {base.length > 0 && (
              <>
                <Hemiciclo membros={membros} partidos={new Set()} filtroStatus="todos" visivel={vis} selecionado={sel}
                  proprio={meuSq} onSelecionar={(k) => { setSel(k === sel ? null : k); }} />
                <ul className="legenda" aria-label="Legenda das formas">
                  <li><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="#9a8f86" /></svg> sem marcação</li>
                  <li><Marca tipo="aliado" tam={13} /> parceiro</li>
                  <li><Marca tipo="concorrente" tam={13} /> concorrente</li>
                  <li><Marca tipo="proprio" tam={13} /> esta liderança</li>
                  <li>cor = partido · esmaecido = fora do filtro</li>
                </ul>
                {escopo === 'BR' && casa === 'estadual' && (
                  <p className="peq-t" style={{ textAlign: 'center' }}>Visão nacional das assembleias: passe o mouse nas cadeiras ou clique num estado no mapa para detalhar.</p>
                )}
              </>
            )}

            {visiveis.length > 0 && (
              <div className="perfil">
                <Pilha titulo="Gênero" partes={GENERO.map(([id, r]) => ({ id, rot: r, n: cG[id] ?? 0, cor: COR_GEN[id] }))} />
                <Pilha titulo="Cor ou raça" partes={RACA.map(([id, r]) => ({ id, rot: r, n: cR[id] ?? 0, cor: COR_RACA[id] }))} />
                <Pilha titulo="Mandato" partes={[...MANDATO, ['?', 'Eleitos em 2022']].map(([id, r]) => ({ id, rot: r, n: cM[id] ?? 0, cor: COR_MAND[id] }))} />
              </div>
            )}

            <div ref={fichaRef}>
              {atual && (
                <div className="ficha-sel">
                  <div className="topo">
                    <span className="com-foto"><Foto sq={atual.s} uf={atual.uf} ano={2026} nome={atual.u} tam={64} /><strong>{atual.u}</strong></span>
                    <button type="button" className="rm" onClick={() => setSel(null)} aria-label="Fechar">×</button>
                  </div>
                  <p className="peq-t">{atual.c}</p>
                  <p><Chip p={atual.p} /> <span className="selo ok">{cargoDe(atual)} · {atual.uf}</span>
                    {meuSq === atual.s && <span className="selo ok" style={{ marginLeft: 6 }}><Marca tipo="proprio" tam={11} /> esta liderança</span>}</p>
                  <p className="peq-t">
                    {atual.g === 'F' ? 'Mulher' : 'Homem'}{atual.r && ` · ${RACA.find(([k]) => k === atual.r)?.[1]}`}
                    {' · '}{atual.m === 'r' ? 'reeleição' : atual.m === '?' ? 'eleito(a) em 2022, mandato até 2031' : 'primeiro mandato no cargo'}
                  </p>
                  {atual.a === 2026 && (
                    <p style={{ margin: '4px 0 10px' }}><strong>{nf.format(atual.v)}</strong> votos · <strong>{pct(atual.x)}</strong> dos válidos em {atual.uf}</p>
                  )}
                  <StatusBotoes chave={atual.s} rel={relDe(atual)} />
                </div>
              )}
            </div>

            <div className="ilha-filtros">
              <input type="search" value={busca} onChange={(e) => { setBusca(e.target.value); setLimite(40); }} placeholder={`Buscar nesta lista (${nomeEscopo})`} aria-label="Buscar nesta lista" />
            </div>
            <div className="rolar rolagem">
              <table className="tb">
                <thead><tr><th>Parlamentar</th><th>Partido</th>{escopo === 'BR' && <th>UF</th>}<th>Perfil</th><th>Votos</th><th>Relação</th></tr></thead>
                <tbody>
                  {tabela.slice(0, limite).map((e) => {
                    const st: Status = statusDe(e.s);
                    return (
                      <tr key={e.s} className={sel === e.s ? 'sel' : ''} onClick={() => setSel(e.s)}>
                        <td><span className="com-foto"><Foto sq={e.s} uf={e.uf} ano={2026} nome={e.u} />
                          <span>{st !== 'neutro' && <Marca tipo={st} tam={12} />} <strong>{e.u}</strong>
                            {meuSq === e.s && <span className="selo ok" style={{ marginLeft: 6 }}>esta liderança</span>}</span></span></td>
                        <td><Chip p={e.p} /></td>
                        {escopo === 'BR' && <td>{e.uf}</td>}
                        <td className="peq-t">{e.g === 'F' ? 'Mulher' : 'Homem'} · {RACA.find(([k]) => k === e.r)?.[1] ?? '—'} · {e.m === 'r' ? 'reeleição' : e.m === '?' ? '2022' : '1º mandato'}</td>
                        <td>{e.a === 2022 ? '—' : nf.format(e.v)}</td>
                        <td onClick={(ev) => ev.stopPropagation()}><StatusBotoes chave={e.s} rel={relDe(e)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {tabela.length === 0 && <p className="sem">Nenhum parlamentar com esses filtros.</p>}
            </div>
            {tabela.length > limite && (
              <button type="button" className="bt fant peq" style={{ marginTop: 10 }} onClick={() => setLimite(limite + 80)}>
                Mostrar mais ({nf.format(tabela.length - limite)} restantes)
              </button>
            )}
          </section>
          </div>
        </>
      )}
    </div>
  );
}
