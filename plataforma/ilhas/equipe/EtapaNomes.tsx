'use client';
/* Etapa 3: quem ocupa cada cadeira, em que coordenação e sob qual liderança imediata.
   Escopo, perfil e repertório não aparecem aqui: são preenchidos no painel do organograma (Tarefa 2). */
import { useState } from 'react';
import { SEM_AREA, ativas, coordDe, defineLider, liderDe, nomeDe, nomeLimpo } from '@/lib/cadeiras';
import { COORDENACOES, COR_COORD, chaveFicha, chaveNome } from '@/lib/equipe';
import { cargoNome, modeloFuncao, modeloNome } from './cargos';
import { useEquipe } from './useEquipe';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

export default function EtapaNomes() {
  const { c, agir } = useEquipe();
  const on = ativas(c);
  const [erros, setErros] = useState<Record<number, string>>({});
  const rotulo = (i: number) => (nomeLimpo(c, i) ? `${nomeLimpo(c, i)} (${cargoNome(c, i)})` : cargoNome(c, i));
  const repetidos = (i: number) => { const n = norm(nomeLimpo(c, i)); return n !== '' && on.filter((j) => norm(nomeLimpo(c, j)) === n).length > 1; };

  const muda = (i: number, chave: string, v: string) => agir({ patch: { [chave]: v } });
  const lidera = (i: number, v: string) => {
    const r = defineLider(c, i, v === '-' ? null : Number(v));
    if (r.ciclo) {
      setErros((e) => ({ ...e, [i]: `Isso formaria um ciclo: ${r.ciclo!.map(rotulo).join(' → ')} voltaria para ${rotulo(i)}. Escolha outra liderança.` }));
      return;
    }
    setErros((e) => { const { [i]: _, ...resto } = e; return resto; });
    agir(r);
  };

  return (
    <div>
      <p className="rc-ajuda">Escreva o nome de quem ocupa cada cadeira. Para uma cadeira sem ninguém ainda, escreva <strong>*</strong> e ela entra como processo seletivo de ampla concorrência. A coordenação e a liderança imediata já vêm sugeridas e você pode mudar: é a partir delas que o organograma é desenhado.</p>
      <ul className="es-nomes">
        {on.map((i) => {
          const lider = liderDe(c, i);
          const aberto = nomeLimpo(c, i) === '' && nomeDe(c, i).includes('*');
          return (
            <li key={i} className="es-nome" style={{ borderLeftColor: COR_COORD[coordDe(c, i)] ?? '#5E524C' }}>
              <header>
                <strong>{cargoNome(c, i)}</strong>
                {modeloFuncao(i) && <small>{modeloFuncao(i)}</small>}
                {aberto && <em className="es-tag">Processo seletivo de ampla concorrência</em>}
                {repetidos(i) && <em className="es-tag aviso">mesma pessoa em 2 cadeiras</em>}
              </header>
              <div className="eq-linha">
                <label className="eq-campo"><span className="rot">Pessoa</span>
                  <input type="text" aria-label={`Pessoa, ${cargoNome(c, i)}`} value={c[chaveNome(i)] ?? ''} placeholder="Nome, ou * para abrir processo seletivo" onChange={(e) => muda(i, chaveNome(i), e.target.value)} /></label>
                <label className="eq-campo"><span className="rot">Nome do cargo</span>
                  <input type="text" aria-label={`Nome do cargo, ${cargoNome(c, i)}`} value={c[chaveFicha(i, 'nome_cargo')] ?? ''} placeholder={modeloNome(i) || 'Nome do cargo'} onChange={(e) => muda(i, chaveFicha(i, 'nome_cargo'), e.target.value)} /></label>
                <label className="eq-campo"><span className="rot">Coordenação</span>
                  <select aria-label={`Coordenação, ${cargoNome(c, i)}`} value={coordDe(c, i)} onChange={(e) => muda(i, chaveFicha(i, 'coord'), e.target.value)}>
                    {[...COORDENACOES, SEM_AREA].map((a) => <option key={a} value={a}>{a === 'Chefia de área' ? 'Chefia de gabinete' : a}</option>)}
                  </select></label>
                <label className="eq-campo"><span className="rot">Liderança imediata</span>
                  <select aria-label={`Liderança imediata, ${cargoNome(c, i)}`} value={lider === null ? '-' : String(lider)} onChange={(e) => lidera(i, e.target.value)}>
                    <option value="-">Ninguém (topo)</option>
                    {on.filter((j) => j !== i).map((j) => <option key={j} value={j}>{nomeLimpo(c, j) ? `${nomeLimpo(c, j)} — ` : ''}{cargoNome(c, j)}</option>)}
                  </select></label>
              </div>
              {erros[i] && <p className="es-motivo" role="alert">{erros[i]}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
