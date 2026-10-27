'use client';
/* Missão 4 · clipping de imprensa. Busca as notícias da semana (rota /api/clipping), lista, deixa ocultar as que não são do mandato,
   etiquetar com as bandeiras da Missão 3 (uma a uma ou em lote) e acrescentar aparições à mão.
   Grava só título, veículo, data e link em D.comunicacao.clipping (regras puras em lib/comunicacao.ts). */
import { useState } from 'react';
import { bandeiraDe } from '@/lib/bandeiras';
import { adicionaManual, etiquetaNoticias, lerComunicacao, mesclaBusca, ocultaNoticias, type ItemBusca, type Noticia } from '@/lib/comunicacao';
import { lerRumo } from '@/lib/rumo';
import { useLegado } from '../ponte';
import './capital.css';

const uid = () => Math.random().toString(36).slice(2, 10);
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dataBr = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : 'sem data');
const FALHA = 'Não consegui buscar agora. Adicione manualmente';

export default function Clipping() {
  const { D, m, bump } = useLegado();
  const com = lerComunicacao(D.comunicacao);
  const bandeiras = lerRumo(D).bandeiras.filter((b) => b.prioridade !== null).sort((a, b) => a.prioridade! - b.prioridade!)
    .map((b) => ({ id: b.id, rot: bandeiraDe(b.id)?.rot ?? b.rot }));
  const rotDe = (id: string) => bandeiras.find((b) => b.id === id)?.rot ?? bandeiraDe(id)?.rot ?? id;

  const [buscando, setBuscando] = useState(false);
  const [falha, setFalha] = useState('');
  const [aviso, setAviso] = useState('');
  const [lote, setLote] = useState(false);
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState({ titulo: '', veiculo: '', url: '', data: hoje() });
  const [erroForm, setErroForm] = useState('');

  const visiveis = com.clipping.filter((n) => !n.oculta);
  const ocultas = com.clipping.filter((n) => n.oculta);
  const grava = (clipping: Noticia[]) => { D.comunicacao = { ...lerComunicacao(D.comunicacao), clipping }; bump(); };

  async function busca() {
    const nome = (m.nome_parlamentar ?? '').trim();
    setFalha(''); setAviso('');
    if (!nome) { setFalha('Informe o nome parlamentar no cadastro do mandato para buscar. Enquanto isso, adicione manualmente'); return; }
    setBuscando(true);
    try {
      const w = window as unknown as { Nuvem?: { tok?: string } };
      const r = await fetch('/api/clipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(w.Nuvem?.tok ? { Authorization: `Bearer ${w.Nuvem.tok}` } : {}) },
        body: JSON.stringify({ nome, mandatoId: m.id ?? '', dias: 7 }),
      });
      const corpo = await r.json().catch(() => null);
      if (!r.ok || !Array.isArray(corpo?.itens)) {
        setFalha(r.status === 429 ? 'Você atingiu o limite de 10 buscas por hora. Tente mais tarde ou adicione manualmente' : FALHA);
        return;
      }
      const res = mesclaBusca(lerComunicacao(D.comunicacao).clipping, corpo.itens as ItemBusca[], uid);
      if (res.novas) grava(res.clipping);
      setAviso(res.novas ? `${res.novas} ${res.novas === 1 ? 'notícia nova' : 'notícias novas'}. Oculte as que não são do mandato.` : 'Nenhuma notícia nova nos últimos 7 dias.');
    } catch {
      setFalha(FALHA);
    } finally {
      setBuscando(false);
    }
  }

  const alterna = (id: string) => setMarcadas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const alternaEtiqueta = (n: Noticia, b: string) => grava(etiquetaNoticias(com.clipping, [n.id], n.bandeiras.includes(b) ? 'remove' : 'add', b));
  const aplicaLote = (acao: 'add' | 'limpa' | 'ocultar', b = '') => {
    if (acao === 'ocultar') grava(ocultaNoticias(com.clipping, marcadas, true));
    else grava(etiquetaNoticias(com.clipping, marcadas, acao, b));
    if (acao === 'ocultar') setMarcadas([]);
  };
  const salvaManual = () => {
    const r = adicionaManual(com.clipping, form, uid);
    if (!r.ok) { setErroForm(r.erro); return; }
    grava(r.clipping);
    setForm({ titulo: '', veiculo: '', url: '', data: hoje() });
    setErroForm(''); setManual(false);
  };

  const linha = (n: Noticia) => (
    <li key={n.id} className="cp-not" data-noticia={n.id}>
      {lote && !n.oculta && <input type="checkbox" className="cp-not-ck" aria-label={`Selecionar: ${n.titulo}`} checked={marcadas.includes(n.id)} onChange={() => alterna(n.id)} />}
      <div className="cp-not-c">
        <p className="cp-not-t">
          {/^https?:\/\//i.test(n.url) ? <a href={n.url} target="_blank" rel="noopener noreferrer">{n.titulo}</a> : n.titulo}
          {n.manual && <span className="cp-not-man"> (manual)</span>}
        </p>
        <p className="cp-not-m">{[n.veiculo || 'veículo não informado', dataBr(n.data)].join(' · ')}</p>
        {!n.oculta && (
          <div className="cp-chips" role="group" aria-label={`Bandeiras de: ${n.titulo}`}>
            {n.bandeiras.length === 0 && <span className="cp-chip-sem">Sem bandeira</span>}
            {bandeiras.map((b) => (
              <button key={b.id} type="button" className="cp-chip" aria-pressed={n.bandeiras.includes(b.id)} onClick={() => alternaEtiqueta(n, b.id)}>{b.rot}</button>
            ))}
            {n.bandeiras.filter((b) => !bandeiras.some((x) => x.id === b)).map((b) => (
              <button key={b} type="button" className="cp-chip" aria-pressed="true" onClick={() => alternaEtiqueta(n, b)}>{rotDe(b)}</button>
            ))}
          </div>
        )}
      </div>
      <button type="button" className="bt fant peq" onClick={() => grava(ocultaNoticias(com.clipping, [n.id], !n.oculta))}>
        {n.oculta ? 'Restaurar' : 'Ocultar'}<span className="sr"> {n.titulo}</span>
      </button>
    </li>
  );

  return (
    <section className="cp-clip" aria-labelledby="cp-clip-t">
      <h4 id="cp-clip-t">Clipping: notícias da semana</h4>
      <p className="cp-fonte">A busca procura o nome parlamentar entre aspas nos últimos 7 dias (fonte: Google Notícias, não oficial). Guardamos só título, veículo, data e link.</p>
      <div className="bts">
        <button type="button" className="bt pri peq" disabled={buscando} onClick={busca}>{buscando ? 'Buscando…' : 'Buscar notícias da semana'}</button>
        <button type="button" className="bt fant peq" aria-expanded={manual} onClick={() => { setManual(!manual); setErroForm(''); }}>Adicionar aparição manual</button>
        {visiveis.length > 1 && <button type="button" className="bt fant peq" aria-pressed={lote} onClick={() => { setLote(!lote); setMarcadas([]); }}>Marcar vários</button>}
      </div>
      {falha && <p className="cp-erro" role="alert">{falha}</p>}
      {aviso && <p className="cp-band" role="status">{aviso}</p>}

      {manual && (
        <form className="cp-form cp-clip-form" noValidate onSubmit={(e) => { e.preventDefault(); salvaManual(); }}>
          <label className="campo"><span className="rot">Título</span><input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></label>
          <label className="campo"><span className="rot">Veículo</span><input type="text" value={form.veiculo} onChange={(e) => setForm({ ...form, veiculo: e.target.value })} /></label>
          <label className="campo"><span className="rot">Link (opcional)</span><input type="url" inputMode="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
          <label className="campo"><span className="rot">Data</span><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></label>
          {erroForm && <p className="cp-erro" role="alert">{erroForm}</p>}
          <div className="bts">
            <button type="submit" className="bt pri peq">Adicionar à lista</button>
            <button type="button" className="bt fant peq" onClick={() => setManual(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {lote && (
        <div className="cp-lote" role="group" aria-label="Ações em lote">
          <p className="cp-band">{marcadas.length} {marcadas.length === 1 ? 'selecionada' : 'selecionadas'}</p>
          <div className="cp-chips">
            {bandeiras.map((b) => <button key={b.id} type="button" className="cp-chip" disabled={!marcadas.length} onClick={() => aplicaLote('add', b.id)}>Etiquetar com {b.rot}</button>)}
            <button type="button" className="cp-chip" disabled={!marcadas.length} onClick={() => aplicaLote('limpa')}>Sem bandeira</button>
            <button type="button" className="cp-chip" disabled={!marcadas.length} onClick={() => aplicaLote('ocultar')}>Ocultar selecionadas</button>
            <button type="button" className="cp-chip" onClick={() => setMarcadas(visiveis.map((n) => n.id))}>Selecionar todas</button>
          </div>
        </div>
      )}
      {bandeiras.length === 0 && visiveis.length > 0 && <p className="cp-vazio">Para etiquetar, escolha antes as bandeiras prioritárias na Missão 3.</p>}

      {visiveis.length > 0
        ? <ul className="cp-clip-lista">{visiveis.map(linha)}</ul>
        : <p className="cp-vazio">Nenhuma notícia na lista. Busque as da semana ou adicione uma aparição manual.</p>}

      {ocultas.length > 0 && (
        <details className="cp-ocultas">
          <summary>Ocultas ({ocultas.length})</summary>
          <ul className="cp-clip-lista">{ocultas.map(linha)}</ul>
        </details>
      )}
    </section>
  );
}
