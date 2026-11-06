'use client';

import { useCallback, useEffect, useState } from 'react';
import { mensagemDe } from '../../../lib/admin/mensagens.ts';
import Casca from '../_componentes/Casca.tsx';
import Sessao, { useAdmin } from '../_componentes/Sessao.tsx';

const POR_PAGINA = 50;

// Endereços dos painéis externos (time, projeto e ref vêm do CLAUDE.md).
// Vercel: padrão /[team]/[project]/logs confirmado na documentação (vercel.com/docs/logs/runtime).
// Supabase: a documentação oficial (supabase.com/docs/guides/telemetry/logs) linka /dashboard/project/<ref>/logs;
// o caminho /logs/explorer da spec não aparece lá, por isso usamos o documentado.
const LINK_VERCEL = 'https://vercel.com/legisla/projeto-100-dias/logs';
const LINK_SUPABASE = 'https://supabase.com/dashboard/project/fldmekrexvzchynnmeuq/logs';

// Data e hora no fuso de Brasília, como dd/mm/aaaa hh:mm (sem depender da vírgula que o Intl insere conforme o motor).
const fmtHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
function dataHoraBr(iso: string): string {
  const p = Object.fromEntries(fmtHora.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

// Só metadados: a view v_admin_atividade não tem o texto do gabinete.
interface Atividade { criado_em: string; missao: number | null; exercicio: string | null; codigo: string }
// Linha de auditoria_admin; `detalhe` guarda nome, e-mail, papéis e código no momento da ação.
interface Auditoria { id: number; criado_em: string; autor: string | null; acao: string; alvo_tipo: string; alvo_id: string; detalhe: Record<string, unknown> | null }

// Frase legível a partir da ação e do detalhe (quem fez vai em coluna própria). Ação desconhecida cai no texto bruto.
function descricao(l: Auditoria): string {
  const d = l.detalhe ?? {};
  const t = (k: string) => (typeof d[k] === 'string' && d[k] ? (d[k] as string) : '?');
  const pessoa = (typeof d.email === 'string' && d.email) || t('nome');
  switch (l.acao) {
    case 'equipe.incluir': return `Incluiu ${pessoa} na equipe como ${t('papel')}`;
    case 'equipe.papel': return `Mudou o papel de ${t('nome')} na equipe, de ${t('de')} para ${t('para')}`;
    case 'equipe.remover': return `Removeu ${t('nome')} da equipe`;
    case 'membro.adicionar': return `Adicionou ${pessoa} como ${t('papel')} em ${t('codigo')}`;
    case 'membro.papel': return `Mudou o papel de ${t('nome')} em ${t('codigo')}, de ${t('de')} para ${t('para')}`;
    case 'membro.remover': return `Removeu ${t('nome')} de ${t('codigo')}`;
    case 'mandato.arquivar': return `Arquivou o mandato ${t('codigo')}`;
    case 'mandato.desarquivar': return `Desarquivou o mandato ${t('codigo')}`;
    case 'mandato.excluir': return `Excluiu o mandato ${t('codigo')} (${t('nome_parlamentar')})`;
    default: return `${l.acao} · ${l.alvo_tipo} ${l.alvo_id}`;
  }
}

type Estado<T> = { carga: 'carregando' } | { carga: 'erro'; mensagem: string } | { carga: 'ok'; linhas: T[]; temMais: boolean };

// Lista paginada no servidor: pede uma linha a mais que a página para saber se há "Próxima" sem contar o total
// (exatamente 50 linhas não abre página seguinte vazia).
function ListaLog<T>({ caminho, titulo, colunas, linha, vazio }: {
  caminho: string; titulo: string; colunas: string[]; linha: (l: T) => React.ReactNode[]; vazio: string
}) {
  const { api } = useAdmin();
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState<Estado<T>>({ carga: 'carregando' });

  const carrega = useCallback(async () => {
    setEstado({ carga: 'carregando' });
    try {
      const sep = caminho.includes('?') ? '&' : '?';
      const r = (await api.ler<T[] | null>(`${caminho}${sep}limit=${POR_PAGINA + 1}&offset=${(pagina - 1) * POR_PAGINA}`)) ?? [];
      setEstado({ carga: 'ok', linhas: r.slice(0, POR_PAGINA), temMais: r.length > POR_PAGINA });
    } catch (e) {
      setEstado({ carga: 'erro', mensagem: mensagemDe(e) });
    }
  }, [api, caminho, pagina]);
  useEffect(() => { carrega(); }, [carrega]);

  if (estado.carga === 'erro') {
    return (
      <div className="vazio">
        <div className="aviso" role="alert">{estado.mensagem}</div>
        <button type="button" className="btn pri" onClick={carrega}>Tentar de novo</button>
      </div>
    );
  }
  if (estado.carga === 'carregando') return <p className="carregando" role="status">Carregando…</p>;
  if (estado.linhas.length === 0 && pagina === 1) return <div className="vazio"><p>{vazio}</p></div>;

  const primeiro = (pagina - 1) * POR_PAGINA + 1;
  return (
    <>
      <div className="rolagem">
        <table aria-label={titulo} style={{ minWidth: 560 }}>
          <thead><tr>{colunas.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {estado.linhas.map((l, i) => (
              <tr key={i}>{linha(l).map((c, j) => <td key={j}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rodape">
        <span className="legend">Página {pagina}</span>
        <span className="bar">
          <span className="legend">{primeiro}–{primeiro + estado.linhas.length - 1}</span>
          <button type="button" className="btn sm" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <button type="button" className="btn sm" disabled={!estado.temMais} onClick={() => setPagina(pagina + 1)}>Próxima</button>
        </span>
      </div>
    </>
  );
}

// Mais recente primeiro; as chaves extras da ordenação deixam a página estável quando há mesma hora.
const CAMINHO_ATIVIDADE = 'v_admin_atividade?select=criado_em,missao,exercicio,codigo&order=criado_em.desc,codigo.asc,exercicio.asc,missao.asc';
const CAMINHO_AUDITORIA = 'auditoria_admin?select=id,criado_em,autor,acao,alvo_tipo,alvo_id,detalhe&order=criado_em.desc,id.desc';

const ABAS = [
  { id: 'atividade', rotulo: 'Atividade dos gabinetes' },
  { id: 'acoes', rotulo: 'Ações da equipe' },
  { id: 'sistema', rotulo: 'Sistema e erros' },
] as const;
type AbaId = (typeof ABAS)[number]['id'];

function Logs() {
  const [aba, setAba] = useState<AbaId>('atividade');
  return (
    <>
      <div className="abas" role="tablist" aria-label="Tipo de log">
        {ABAS.map((a) => (
          <button key={a.id} type="button" role="tab" id={`aba-${a.id}`} aria-selected={aba === a.id} aria-controls={`painel-${a.id}`} onClick={() => setAba(a.id)}>
            {a.rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`}>
        {aba === 'atividade' && (
          <ListaLog<Atividade>
            key="atividade" // key própria: cada aba começa na página 1
            caminho={CAMINHO_ATIVIDADE}
            titulo="Atividade dos gabinetes"
            colunas={['Data e hora', 'Missão', 'Mandato', 'Exercício', 'Texto']}
            linha={(l) => [dataHoraBr(l.criado_em), l.missao == null ? '—' : `M${l.missao}`, <span key="c" className="mono">{l.codigo}</span>, l.exercicio ?? '—', <span key="t" className="pill mu">texto oculto</span>]}
            vazio="Nenhuma atividade registrada ainda."
          />
        )}
        {aba === 'acoes' && (
          <ListaLog<Auditoria>
            key="acoes"
            caminho={CAMINHO_AUDITORIA}
            titulo="Ações da equipe"
            colunas={['Data e hora', 'Quem fez', 'O que fez']}
            linha={(l) => [dataHoraBr(l.criado_em), l.autor ?? '—', descricao(l)]}
            vazio="Nenhuma ação da equipe registrada ainda."
          />
        )}
        {aba === 'sistema' && (
          <div className="card">
            <h3>Sistema e erros</h3>
            <p className="hint">Os logs do servidor ficam na Vercel e no Supabase, e o navegador não pode lê-los. Cada botão abre o painel da ferramenta em outra aba.</p>
            <div className="bar">
              <a className="btn pri" href={LINK_VERCEL} target="_blank" rel="noopener noreferrer">Abrir logs na Vercel</a>
              <a className="btn pri" href={LINK_SUPABASE} target="_blank" rel="noopener noreferrer">Abrir logs no Supabase</a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function LogsPagina() {
  return (
    <Sessao>
      <Casca tela="logs" titulo="Logs">
        <Logs />
      </Casca>
    </Sessao>
  );
}
