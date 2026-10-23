'use client';
/* Aba "Entre áreas": como as áreas conversam entre si (finalidade, frequência e canal). Vira linha pontilhada no organograma. */
import { useState } from 'react';
import { coordsDe } from '@/lib/cadeiras';
import { COR_COORD } from '@/lib/equipe';
import { criaEntreAreas, entreAreasArquivadas, removeEntreAreas, rotinasEntreAreas, sugestoesEntreAreas, type EntreAreas as Par, type Freq } from '@/lib/rotinas';
import { cargoNome } from './cargos';
import { definirFoco } from './foco';
import { useEquipe } from './useEquipe';

const FREQS: Freq[] = ['Semanalmente', 'Mensalmente', 'Quadrimestralmente', 'Semestralmente'];
const nomeArea = (a?: string) => (a === 'Chefia de área' ? 'Chefia de gabinete' : a ?? '');

export default function EntreAreas() {
  const { c, agir } = useEquipe();
  const ativas = ['Chefia de área', ...coordsDe(c)];
  const [f, setF] = useState<Par>({ de: ativas[1] ?? ativas[0], para: ativas[0], finalidade: '', freq: 'Semanalmente', canal: '' });
  const [erro, setErro] = useState('');
  const sugestoes = sugestoesEntreAreas(c);
  const rotinas = rotinasEntreAreas(c);
  const guardadas = entreAreasArquivadas(c);

  const registra = (p: Par) => {
    const r = criaEntreAreas(c, p);
    if (r.erro) { setErro(r.erro); return false; }
    setErro('');
    return agir(r);
  };
  const envia = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.de === f.para) { setErro('Escolha duas áreas diferentes: a origem e o destino não podem ser a mesma área.'); return; }
    if (!f.finalidade.trim()) { setErro('Diga a finalidade da rotina: para que essas duas áreas vão conversar.'); return; }
    if (registra({ ...f, finalidade: f.finalidade.trim(), canal: f.canal.trim() })) setF({ ...f, finalidade: '', canal: '' });
  };
  const par = (de?: string, para?: string) => `${nomeArea(de)} → ${nomeArea(para)}`;

  return (
    <div className="es-entre">
      <p className="eq-ajuda">Registre como duas áreas conversam: para quê, com que frequência e por qual canal. Cada rotina vira uma linha pontilhada no organograma, sem mudar quem lidera quem.</p>

      {sugestoes.length > 0 && (<>
        <h4>Sugestões da Legisla</h4>
        <ul className="es-sug">
          {sugestoes.map((s) => (
            <li key={`${s.de}>${s.para}`}>
              <span><strong>{par(s.de, s.para)}</strong><small>{s.freq} · {s.finalidade}</small></span>
              <button type="button" className="bt sec peq es-bt" aria-label={`Aceitar sugestão: ${par(s.de, s.para)}`} onClick={() => registra(s)}>Aceitar sugestão</button>
            </li>
          ))}
        </ul>
      </>)}

      <h4>Rotinas entre áreas</h4>
      {rotinas.length === 0
        ? <p className="sem">Nenhuma rotina entre áreas ainda: aceite uma sugestão ou crie a sua abaixo.</p>
        : (
          <ul className="es-ent">
            {rotinas.map((r) => (
              <li key={r.id} data-rotina={r.id} style={{ borderLeftColor: COR_COORD[r.de ?? ''] ?? '#5E524C' }}>
                <span>
                  <strong>{par(r.de, r.para)}</strong>
                  <small>{r.freq} · {r.finalidade}{r.canal ? ` · ${r.canal}` : ''}</small>
                  <small>Convocam: {r.participantes.map((i) => cargoNome(c, i)).join(' e ')}</small>
                </span>
                <span className="es-ent-bts">
                  <button type="button" className="bt sec peq es-bt" aria-label={`Destacar no organograma: ${par(r.de, r.para)}`} onClick={() => definirFoco({ cadeiras: r.participantes, id: r.id })}>Destacar</button>
                  <button type="button" className="bt sec peq es-bt" aria-label={`Remover: ${par(r.de, r.para)}`} onClick={() => agir({ patch: removeEntreAreas(c, r.id) })}>Remover</button>
                </span>
              </li>
            ))}
          </ul>
        )}

      {guardadas.length > 0 && (
        <details className="es-off" open>
          <summary>Guardadas porque uma das áreas foi desmarcada ({guardadas.length})</summary>
          <ul>{guardadas.map((r) => <li key={r.id}>{par(r.de, r.para)} · {r.freq}</li>)}</ul>
          <p className="peq-t">Elas voltam sozinhas quando você marcar a área de novo.</p>
        </details>
      )}

      <h4>Criar uma rotina entre áreas</h4>
      <form className="es-form" onSubmit={envia} noValidate>
        <label className="eq-campo"><span className="rot">Origem</span>
          <select value={f.de} onChange={(e) => setF({ ...f, de: e.target.value })}>{ativas.map((a) => <option key={a} value={a}>{nomeArea(a)}</option>)}</select></label>
        <label className="eq-campo"><span className="rot">Destino</span>
          <select value={f.para} onChange={(e) => setF({ ...f, para: e.target.value })}>{ativas.map((a) => <option key={a} value={a}>{nomeArea(a)}</option>)}</select></label>
        <label className="eq-campo"><span className="rot">Finalidade</span>
          <input type="text" value={f.finalidade} placeholder="Para que essas áreas vão conversar" onChange={(e) => setF({ ...f, finalidade: e.target.value })} /></label>
        <label className="eq-campo"><span className="rot">Frequência</span>
          <select value={f.freq} onChange={(e) => setF({ ...f, freq: e.target.value as Freq })}>{FREQS.map((q) => <option key={q}>{q}</option>)}</select></label>
        <label className="eq-campo"><span className="rot">Canal</span>
          <input type="text" value={f.canal} placeholder="Reunião curta, grupo, conversa…" onChange={(e) => setF({ ...f, canal: e.target.value })} /></label>
        <button type="submit" className="bt pri peq es-bt">Registrar rotina</button>
      </form>
      {erro && <p className="es-motivo" role="alert">{erro}</p>}
    </div>
  );
}
