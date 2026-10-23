'use client';
/* Painel da cadeira: tudo o que se define de uma cadeira depois de nomeada. Desktop: coluna à direita; celular: gaveta inferior. */
import { useEffect, useRef, useState } from 'react';
import { CHEFIA, SEM_AREA, ativas, coordDe, defineLider, liderDe, nomeDe, nomeLimpo, remove } from '@/lib/cadeiras';
import { COORDENACOES, COR_COORD, ESCOPOS, HABILIDADES, SEP, chaveFicha, chaveNome, lista } from '@/lib/equipe';
import Chips from './Chips';
import { cargoNome, modeloEscopo, modeloFuncao, modeloNome } from './cargos';
import { useEquipe } from './useEquipe';

export default function PainelCadeira({ i, onFechar }: { i: number; onFechar: () => void }) {
  const { c, agir } = useEquipe();
  const raiz = useRef<HTMLElement>(null);
  const [erro, setErro] = useState('');
  const on = ativas(c);
  const rotulo = (j: number) => (nomeLimpo(c, j) ? `${nomeLimpo(c, j)} (${cargoNome(c, j)})` : cargoNome(c, j));
  const L = (k: Parameters<typeof chaveFicha>[1]) => lista(c[chaveFicha(i, k)]);
  const grava = (k: Parameters<typeof chaveFicha>[1]) => (v: string[]) => agir({ patch: { [chaveFicha(i, k)]: v.join(SEP) } });
  const texto = (k: Parameters<typeof chaveFicha>[1], v: string) => agir({ patch: { [chaveFicha(i, k)]: v } });
  const cor = COR_COORD[coordDe(c, i)] ?? '#5E524C';
  const lider = liderDe(c, i);

  /* ao abrir (ou trocar de cadeira), o foco vai ao primeiro campo */
  useEffect(() => { setErro(''); raiz.current?.querySelector<HTMLElement>('input,select,textarea')?.focus(); }, [i]);

  const fecha = () => {
    onFechar();
    document.querySelector(`.es-no[data-cadeira="${i}"]`)?.closest<HTMLElement>('.react-flow__node')?.focus();
  };
  const tira = () => {
    const r = remove(c, i);
    const liderados = on.filter((j) => j !== i && liderDe(c, j) === i);
    if (liderados.length || r.confirma) {
      const acima = lider === null ? 'ficam sem liderança (topo)' : `passam a ser lideradas por ${rotulo(lider)}`;
      const msg = `Remover ${cargoNome(c, i)}?` +
        (r.confirma ? `

${r.confirma.join(', ')} sai do gabinete (uma cópia fica guardada).` : '') +
        (liderados.length ? `

${liderados.length === 1 ? 'A cadeira liderada' : `As ${liderados.length} cadeiras lideradas`} (${liderados.map(rotulo).join('; ')}) ${acima}.` : '');
      if (!window.confirm(msg)) return;
    }
    if (agir(r)) onFechar();
  };
  const lidera = (v: string) => {
    const r = defineLider(c, i, v === '-' ? null : Number(v));
    if (r.ciclo) { setErro(`Isso formaria um ciclo: ${r.ciclo.map(rotulo).join(' → ')} voltaria para ${rotulo(i)}. Escolha outra liderança.`); return; }
    setErro('');
    agir(r);
  };

  return (
    <aside ref={raiz} className="es-painel" role="complementary" aria-label={`Painel da cadeira ${cargoNome(c, i)}`} style={{ borderTopColor: cor }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); fecha(); } }}>
      <button type="button" className="eq-x" onClick={fecha} aria-label="Fechar painel">×</button>
      <span className="es-no-area" style={{ color: cor }}>{coordDe(c, i) === 'Chefia de área' ? 'Chefia de gabinete' : coordDe(c, i)}</span>
      <h4>{cargoNome(c, i)}</h4>
      {modeloFuncao(i) && <p className="cf">{modeloFuncao(i)}</p>}

      <label className="eq-campo"><span className="rot">Pessoa</span>
        <input type="text" value={c[chaveNome(i)] ?? ''} placeholder="Nome, ou * para abrir processo seletivo" onChange={(e) => agir({ patch: { [chaveNome(i)]: e.target.value } })} /></label>
      {nomeDe(c, i).includes('*') && nomeLimpo(c, i) === '' && <p className="es-aviso-peq">Processo seletivo de ampla concorrência</p>}
      <label className="eq-campo"><span className="rot">Nome do cargo</span>
        <input type="text" value={c[chaveFicha(i, 'nome_cargo')] ?? ''} placeholder={modeloNome(i) || 'Nome do cargo'} onChange={(e) => texto('nome_cargo', e.target.value)} /></label>
      <label className="eq-campo"><span className="rot">Coordenação</span>
        <select value={coordDe(c, i)} onChange={(e) => texto('coord', e.target.value)}>
          {[...COORDENACOES, SEM_AREA].map((a) => <option key={a} value={a}>{a === 'Chefia de área' ? 'Chefia de gabinete' : a}</option>)}
        </select></label>
      <label className="eq-campo"><span className="rot">Liderança imediata</span>
        <select value={lider === null ? '-' : String(lider)} onChange={(e) => lidera(e.target.value)}>
          <option value="-">Ninguém (topo)</option>
          {on.filter((j) => j !== i).map((j) => <option key={j} value={j}>{rotulo(j)}</option>)}
        </select></label>
      {erro && <p className="es-motivo" role="alert">{erro}</p>}

      <h5 className="es-sec">Escopo de trabalho</h5>
      {modeloEscopo(i) && <details className="es-esperado"><summary>O que o modelo espera deste cargo</summary><p>{modeloEscopo(i)}</p></details>}
      <Chips rotulo="Escopo de trabalho" opcoes={ESCOPOS} valor={L('escopo')} onChange={grava('escopo')} />
      <label className="eq-campo"><span className="rot">Especificidades do cargo</span>
        <textarea value={c[chaveFicha(i, 'espec')] ?? ''} placeholder="O que é particular deste cargo neste mandato" onChange={(e) => texto('espec', e.target.value)} /></label>

      <h5 className="es-sec">Perfil e repertório</h5>
      <span className="rot">Habilidades de destaque</span>
      <Chips rotulo="Habilidades de destaque" opcoes={HABILIDADES} valor={L('hab_dest')} onChange={grava('hab_dest')} />
      <span className="rot">Habilidades a serem desenvolvidas</span>
      <Chips rotulo="Habilidades a serem desenvolvidas" opcoes={HABILIDADES} valor={L('hab_dev')} onChange={grava('hab_dev')} />
      <span className="rot">Repertório técnico de destaque</span>
      <Chips rotulo="Repertório técnico de destaque" opcoes={ESCOPOS} valor={L('rep_dest')} onChange={grava('rep_dest')} />
      <span className="rot">Repertório técnico a ser desenvolvido</span>
      <Chips rotulo="Repertório técnico a ser desenvolvido" opcoes={ESCOPOS} valor={L('rep_dev')} onChange={grava('rep_dev')} />
      {i !== CHEFIA && <div className="es-perigo"><button type="button" className="bt sec peq es-bt" onClick={tira}>Remover esta cadeira</button></div>}
    </aside>
  );
}
