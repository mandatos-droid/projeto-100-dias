'use client';
/* Missão 2 · Mão na massa 1: tabela de equipe em ordem obrigatória (escopo → competências → cargo → pessoa → categoria → área).
   A regra vive em lib/tabelaEquipe; aqui só a tela. Cada edição grava na hora (sem botão salvar). Em mandato do modelo antigo,
   a primeira edição grava de uma vez os valores derivados (materializa), para a leitura nova não perder nada. */
import { useEffect, useState } from 'react';
import { AREAS, SEM_AREA, aplica, type Campos } from '@/lib/cadeiras';
import { CATEGORIAS, COLUNAS, colunaLiberada, contagemCompletas, defineN, editaCelula, linhas, materializa, migrada, type ColunaId, type Linha } from '@/lib/tabelaEquipe';
import { modeloNome } from './cargos';
import { useEquipe } from './useEquipe';
import './equipe.css';

const CHEFIA_AREA = 'Chefia de área'; // valor gravado para a Chefia; o rótulo na tela é "Chefia de gabinete"
const rotuloArea = (a: string) => (a === CHEFIA_AREA ? 'Chefia de gabinete' : a === SEM_AREA ? 'Outra área' : a);

type Props = { l: Linha; pos: number; col: { id: ColunaId; rotulo: string }; onChange: (v: string) => void };

/** Uma célula: o controle fica desabilitado, com a legenda "Preencha antes: …", enquanto a coluna anterior está vazia. */
function Celula({ l, pos, col, onChange }: Props) {
  const livre = colunaLiberada(l, col.id);
  const valor = l[col.id];
  const [rascunho, setRascunho] = useState(valor);
  /* o rascunho guarda espaços digitados (a lib grava aparado); só se alinha ao valor gravado quando ele muda por fora */
  useEffect(() => { if (valor !== rascunho.trim()) setRascunho(valor); }, [valor]); // eslint-disable-line react-hooks/exhaustive-deps
  const idLeg = `es-tab-${l.i}-${col.id}-leg`;
  const comum = { id: `es-tab-${l.i}-${col.id}`, 'aria-label': `${col.rotulo}, linha ${pos + 1}`, disabled: !livre.ok, 'aria-describedby': livre.ok ? undefined : idLeg };
  let campo;
  if (col.id === 'cat' || col.id === 'area') {
    const base = col.id === 'cat' ? [...CATEGORIAS] : [...AREAS, SEM_AREA, ...(l.cat === 'Chefia' ? [CHEFIA_AREA] : [])];
    const opcoes = valor !== '' && !base.includes(valor as never) ? [...base, valor] : base;
    campo = (
      <select {...comum} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione</option>
        {opcoes.map((o) => <option key={o} value={o}>{col.id === 'area' ? rotuloArea(o) : o}</option>)}
      </select>
    );
  } else if (col.id === 'esc' || col.id === 'comp') {
    campo = <textarea {...comum} rows={3} value={rascunho} onChange={(e) => { setRascunho(e.target.value); onChange(e.target.value); }} />;
  } else {
    campo = <input {...comum} type="text" value={rascunho} placeholder={col.id === 'pessoa' ? 'Nome, ou * para abrir processo seletivo' : undefined} onChange={(e) => { setRascunho(e.target.value); onChange(e.target.value); }} />;
  }
  return (
    <>
      {campo}
      {!livre.ok && <small id={idLeg} className="es-tab-leg">Preencha antes: {livre.falta}</small>}
      {col.id === 'pessoa' && l.processoSeletivo && <small className="es-tab-leg ps">Processo seletivo a abrir</small>}
    </>
  );
}

export default function TabelaEquipe() {
  const { c, agir } = useEquipe();
  const antigo = migrada(c);
  const mat = antigo ? materializa(c, modeloNome) : {};
  /* o que a tela mostra: o mandato antigo já com os valores derivados; gravar leva o mesmo patch junto */
  const vista: Campos = { ...c };
  aplica(vista, mat);
  const iniciada = c['m2.n'] !== undefined || antigo;
  const ls = linhas(vista);
  const { completas, total } = contagemCompletas(vista);
  const [n, setN] = useState(c['m2.n'] ?? '');
  const gravado = vista['m2.n'] ?? '';
  useEffect(() => { setN(gravado); }, [gravado]);

  const grava = (patch: Record<string, string>) => agir({ patch: { ...mat, ...patch } });
  const aplicaN = () => {
    const r = defineN(vista, n);
    if (r.erro) { agir({ erro: r.erro }); return; }
    if (r.confirma && !window.confirm(`Diminuir para ${n} remove linhas já preenchidas: ${r.confirma.join(', ')}. Elas ficam guardadas, mas saem da tabela. Continuar?`)) { setN(gravado); return; }
    grava(r.patch);
  };

  const nomes = ls.map((l) => l.pessoa.toLowerCase()).filter((p) => p !== '' && !p.includes('*'));
  const repetidos = [...new Set(nomes.filter((p, k) => nomes.indexOf(p) !== k))].map((p) => ls.find((l) => l.pessoa.toLowerCase() === p)!.pessoa);

  return (
    <div className="ilha-corpo es-tab-ilha">
      <form className="es-tab-n" noValidate onSubmit={(e) => { e.preventDefault(); aplicaN(); }}>
        <label htmlFor="es-tab-n">{iniciada ? 'Quantas pessoas o mandato terá (contando a chefia)?' : 'Quantas pessoas o mandato terá ou espera ter nos primeiros 100 dias?'}</label>
        <input id="es-tab-n" type="number" inputMode="numeric" min={1} max={40} step={1} value={n} onChange={(e) => setN(e.target.value)} />
        <button type="submit" className="bt pri peq es-bt">{iniciada ? 'Ajustar' : 'Criar linhas'}</button>
      </form>

      {iniciada && (
        <>
          <p className="es-tab-contador" data-contador><strong>{completas} de {total}</strong> linhas completas</p>
          <p className="es-tab-ajuda">Preencha cada linha da esquerda para a direita: uma coluna só abre quando a anterior está preenchida. O que você já escreveu fica guardado se esvaziar uma coluna.</p>
          <div className="es-tab-rolagem">
            <table className="es-tab">
              <thead>
                <tr><th scope="col">Linha</th>{COLUNAS.map((x) => <th key={x.id} scope="col" title={x.dica}>{x.rotulo}</th>)}</tr>
              </thead>
              <tbody>
                {ls.map((l, pos) => (
                  <tr key={l.i} id={`es-linha-${l.i}`} data-linha={l.i} className={l.completa ? 'completa' : ''}>
                    <th scope="row" data-label="Linha">Linha {pos + 1}{l.completa && <em className="es-tag"> completa</em>}</th>
                    {COLUNAS.map((x) => (
                      <td key={x.id} data-label={x.rotulo}>
                        <Celula l={l} pos={pos} col={x} onChange={(v) => grava(editaCelula(vista, l.i, x.id, v))} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ls.some((l) => l.processoSeletivo) && (
            <p className="apoio es-tab-div" role="note">Caso não haja pessoas que se encaixem nos requisitos, encorajamos o mandato a abrir processo seletivo e aumentar a diversidade e a representatividade dentro da equipe!</p>
          )}
          {repetidos.length > 0 && <p className="es-motivo" role="note">O mesmo nome aparece em mais de uma linha: {repetidos.join(', ')}. Confira se é a mesma pessoa em dois cargos.</p>}
        </>
      )}
    </div>
  );
}
