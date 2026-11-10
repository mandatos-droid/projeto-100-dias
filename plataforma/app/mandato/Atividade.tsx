'use client';

import { useEffect, useState } from 'react';
import { lerEventosEquipe, type EventoEquipe } from '../../lib/convites/api.ts';
import { ERRO_CARREGAR } from '../../lib/mandato/legado.ts';
import { PAPEIS, rotuloPapel, type Papel } from '../../lib/convites/papeis.ts';
import { iniciais, useMandato } from './contexto.ts';

const FUSO = 'America/Sao_Paulo';
const LIMITE = 10;
const CORES = ['a', 'b', 'c', 'd'];

const primeiroNome = (nome: string | null): string => nome?.trim().split(/\s+/)[0] || 'Alguém';
const papelTxt = (p: string | null): string => (PAPEIS.includes(p as Papel) ? rotuloPapel(p as Papel) : 'sem papel definido');

// Um texto por tipo de evento de `eventos_equipe`. Quem fez entra pelo primeiro nome; a pessoa-alvo, pelo nome inteiro.
export function textoDoEvento(e: Pick<EventoEquipe, 'tipo' | 'ator_nome' | 'alvo_nome' | 'papel'>): string {
  const ator = primeiroNome(e.ator_nome);
  const alvo = e.alvo_nome?.trim() || 'uma pessoa';
  switch (e.tipo) {
    case 'convite_criado': return `${ator} convidou ${alvo} como ${papelTxt(e.papel)}`;
    case 'convite_aceito': return `${alvo} entrou na equipe como ${papelTxt(e.papel)}`;
    case 'convite_cancelado': return `${ator} cancelou o convite de ${alvo}`;
    case 'papel_trocado': return `${ator} mudou o papel de ${alvo} para ${papelTxt(e.papel)}`;
    case 'membro_removido': return `${ator} removeu ${alvo} da equipe`;
    case 'membro_saiu': return `${ator} saiu da equipe`;
    default: return `${ator} fez uma alteração na equipe`;
  }
}

const dia = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: FUSO }); // YYYY-MM-DD no dia de Brasília

// "hoje, 10:42", "ontem, 09:05" ou "05/02/2027, 21:15", sempre no horário de Brasília.
export function quandoDoEvento(iso: string, agora: Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: FUSO, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  const hora = `${p.hour}:${p.minute}`;
  const anterior = new Date(agora.getTime() - 86_400_000);
  if (dia(d) === dia(agora)) return `hoje, ${hora}`;
  if (dia(d) === dia(anterior)) return `ontem, ${hora}`;
  return `${p.day}/${p.month}/${p.year}, ${hora}`;
}

// Atividade recente: os 10 eventos mais recentes de eventos_equipe, do mais novo para o mais antigo (a ordem vem do banco).
export default function Atividade() {
  const { api, mandato } = useMandato();
  const [eventos, setEventos] = useState<EventoEquipe[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    lerEventosEquipe(api, mandato.id).then(
      (l) => { if (vivo) setEventos(l.slice(0, LIMITE)); },
      (e) => { if (vivo) setErro(ERRO_CARREGAR); },
    );
    return () => { vivo = false; };
  }, [api, mandato.id, tentativa]);

  const agora = new Date();
  return (
    <section className="md-card md-atividade" aria-labelledby="md-atividade-t">
      <h2 id="md-atividade-t">Atividade recente</h2>
      {erro && <div className="md-aviso" role="alert">{erro}</div>}
      {erro && (
        <div><button type="button" className="md-bt" onClick={() => { setErro(null); setTentativa((n) => n + 1); }}>Tentar de novo</button></div>
      )}
      {eventos && eventos.length === 0 && <p className="md-mut">Nenhuma atividade ainda.</p>}
      {eventos && eventos.length > 0 && (
        <ul className="md-lista">
          {eventos.map((e, i) => (
            <li key={e.id}>
              <span className={`md-av md-av--${CORES[i % CORES.length]}`} aria-hidden="true">{iniciais(e.ator_nome)}</span>
              <span className="md-cresce md-evento-texto">{textoDoEvento(e)}</span>
              <time className="md-mut" dateTime={e.criado_em}>{quandoDoEvento(e.criado_em, agora)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
