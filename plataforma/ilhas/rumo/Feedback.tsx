'use client';
/* Missão 5 · feedback estruturado. Nível 1: o mapa do organograma da Missão 2, com cada liderança, quantas pessoas ela
   lidera e quantas conversas já foram feitas. Nível 2: as pessoas da liderança (feita ou pendente). Nível 3: o registro
   da conversa (data, destaques, ajustes, plano de ação). Estado: D.feedbacks (lib/feedback.ts lê o formato novo e o antigo). */
import { useState } from 'react';
import { coordDe, liderDe } from '@/lib/cadeiras';
import { COR_COORD } from '@/lib/equipe';
import { apaga, contagens, edita, migraAntigo, paraGuia, registra, removidas, type Conversa, type LiderancaContada } from '@/lib/feedback';
import { cargoNome } from '../equipe/cargos';
import { useLegado } from '../ponte';
import './feedback.css';

const VAZIO = { data: '', destaques: '', ajustes: '', acao: '' };
const rotData = (v: Conversa) => v.data.trim() || 'sem data';

export default function Feedback() {
  const { D, bump } = useLegado();
  const c = D.campos;
  const conversas = migraAntigo(D.feedbacks, c);
  const mapa = contagens(c, conversas);
  const sairam = removidas(c, conversas);
  const [aberta, setAberta] = useState<number | null>(null);   // liderança aberta
  const [pessoa, setPessoa] = useState<number | null>(null);   // pessoa cuja conversa se registra
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(VAZIO);

  const ids = new Set(mapa.map((l) => l.i));
  /* a liderança vem pendurada na liderança dela quando esta também aparece no mapa; senão é raiz */
  const filhos = (i: number | null) => mapa.filter((l) => { const p = liderDe(c, l.i); return (p !== null && ids.has(p) ? p : null) === i; });
  const lider = mapa.find((l) => l.i === aberta);
  const quem = lider?.liderados.find((p) => p.i === pessoa);

  /** Grava a lista inteira em D.feedbacks, com os campos antigos espelhados para o Resumo do Guia. */
  const grava = (lista: Conversa[]) => { D.feedbacks = lista.map(paraGuia); bump(); };
  const limpa = () => { setEditando(null); setForm(VAZIO); };
  const abreLider = (i: number) => { setAberta(aberta === i ? null : i); setPessoa(null); limpa(); };
  const abrePessoa = (i: number) => { setPessoa(i); limpa(); };
  const salva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lider || !quem) return;
    grava(editando ? edita(conversas, editando, form) : registra(conversas, { cadeira: quem.i, pessoa: quem.nome, lider: lider.nome || cargoNome(c, lider.i), ...form }));
    limpa();
  };
  const comeca = (v: Conversa) => { setEditando(v.id); setForm({ data: v.data, destaques: v.destaques, ajustes: v.ajustes, acao: v.acao }); };
  const apagaConversa = (v: Conversa) => {
    if (!window.confirm('Apagar esta conversa? O texto dela será apagado.')) return;
    grava(apaga(conversas, v.id));
    if (editando === v.id) limpa();
  };
  const campo = (k: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const no = (l: LiderancaContada): React.ReactElement => {
    const sub = filhos(l.i);
    return (
      <li key={l.i} className="fb-no">
        <div className={'fb-card' + (aberta === l.i ? ' sel' : '')} data-lider={l.i} style={{ borderTopColor: COR_COORD[coordDe(c, l.i)] ?? '#5E524C' }}>
          <button type="button" className="fb-abre" aria-expanded={aberta === l.i} onClick={() => abreLider(l.i)}>
            <strong className="fb-nome">{l.nome || 'Vaga em aberto'}</strong>
            <span className="fb-cargo">{cargoNome(c, l.i)}</span>
            <span className="fb-da">dá feedback a {l.n} {l.n === 1 ? 'pessoa' : 'pessoas'}</span>
            <span className={'fb-cont' + (l.feitas === l.n ? ' ok' : '')}>feitas {l.feitas} de {l.n}</span>
          </button>
        </div>
        {sub.length > 0 && <ul className="fb-filhos">{sub.map(no)}</ul>}
      </li>
    );
  };

  const deles = quem ? conversas.filter((v) => v.cadeira === quem.i) : [];

  return (
    <div className="ilha-corpo rm-fb">
      {mapa.length === 0 ? (
        <p className="rm-alerta" role="note" data-sem-equipe>
          A equipe da Missão 2 ainda não tem cadeiras com nome para formar o mapa de feedback. <a href="#/m/2/m2.funcoes">Ir para a equipe da Missão 2</a>
        </p>
      ) : (
        <>
          <p className="rm-dica">Cada liderança dá feedback às pessoas que lidera no organograma da Missão 2. Clique em uma liderança para ver as pessoas dela.</p>
          <ul className="fb-arvore" aria-label="Mapa de feedback pelo organograma">{filhos(null).map(no)}</ul>
        </>
      )}

      {lider && (
        <section className="fb-painel" aria-label={`Pessoas que ${lider.nome || 'a liderança'} lidera`}>
          <h4>Pessoas que {lider.nome || cargoNome(c, lider.i)} lidera <span className="rm-n">feitas {lider.feitas} de {lider.n}</span></h4>
          <ul className="fb-pessoas">
            {lider.liderados.map((p) => (
              <li key={p.i} data-pessoa={p.i} className={pessoa === p.i ? 'sel' : ''}>
                <button type="button" className="fb-pessoa-bt" aria-expanded={pessoa === p.i} onClick={() => abrePessoa(p.i)}>{p.nome}</button>
                <span className={'fb-sit ' + (p.feita ? 'feita' : 'pendente')}>{p.feita ? 'feita' : 'pendente'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lider && quem && (
        <section className="fb-conversa" aria-label={`Conversas com ${quem.nome}`}>
          {deles.length > 0 && (
            <ul className="fb-historico">
              {deles.map((v) => (
                <li key={v.id} data-conversa={v.id}>
                  <b>{rotData(v)}</b>
                  {v.destaques && <span>Destaques: {v.destaques}</span>}
                  {v.ajustes && <span>Ajustes: {v.ajustes}</span>}
                  {v.acao && <span>Plano de ação: {v.acao}</span>}
                  <span className="fb-acoes">
                    <button type="button" className="rm-link" aria-label={`Editar conversa de ${rotData(v)}`} onClick={() => comeca(v)}>Editar</button>
                    <button type="button" className="rm-link" aria-label={`Apagar conversa de ${rotData(v)}`} onClick={() => apagaConversa(v)}>Apagar</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form className="fb-form" aria-label={`Conversa de feedback com ${quem.nome}`} onSubmit={salva}>
            <h4>{editando ? 'Editar conversa' : 'Nova conversa'} com {quem.nome}</h4>
            <label className="campo"><span className="rot">Data da conversa</span>
              <input type="text" placeholder="Ex.: 18/03" value={form.data} onChange={campo('data')} /></label>
            <label className="campo"><span className="rot">Pontos de destaque</span>
              <textarea value={form.destaques} onChange={campo('destaques')} /></label>
            <label className="campo"><span className="rot">Pontos de ajuste</span>
              <textarea value={form.ajustes} onChange={campo('ajustes')} /></label>
            <label className="campo"><span className="rot">Plano de ação pactuado</span>
              <textarea value={form.acao} onChange={campo('acao')} /></label>
            <div className="bts">
              <button type="submit" className="bt pri peq">Salvar conversa</button>
              {editando && <button type="button" className="bt sec peq" onClick={limpa}>Cancelar edição</button>}
            </div>
          </form>
        </section>
      )}

      {sairam.length > 0 && (
        <section className="fb-removidas" data-removidas aria-label="Conversas de pessoas que saíram do organograma">
          <h4>Conversas de pessoas que não estão mais no organograma</h4>
          <ul className="fb-historico">
            {sairam.map((v) => (
              <li key={v.id} data-conversa={v.id}>
                <b>{v.pessoa || 'Sem nome'} <em className="fb-sit pendente">pessoa removida</em></b>
                <span>{rotData(v)}{v.lider && ` · liderança: ${v.lider}`}</span>
                {v.destaques && <span>Destaques: {v.destaques}</span>}
                {v.ajustes && <span>Ajustes: {v.ajustes}</span>}
                {v.acao && <span>Plano de ação: {v.acao}</span>}
                <span className="fb-acoes"><button type="button" className="rm-link" aria-label={`Apagar conversa de ${v.pessoa || 'pessoa removida'}`} onClick={() => apagaConversa(v)}>Apagar</button></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
