'use client';

import { useEffect, useState } from 'react';
import { catalogoExercicios } from '../../lib/convites/api.ts';
import { diaDoMandato, type DiaDoMandato } from '../../lib/convites/dias.ts';
import { mensagemDe } from '../../lib/convites/erros.ts';
import { statusMissoes, type ExercicioCatalogo, type StatusMissao } from '../../lib/convites/missoes.ts';
import { podeEditar, rotuloPapel } from '../../lib/convites/papeis.ts';
import { nomeDoMandato, useMandato, type MandatoDaPessoa } from './contexto.ts';

// Nomes curtos das 5 missões, os mesmos do Guia (MISSOES[].curto em conteudo.js).
const MISSOES = [
  { n: 1, nome: 'Prepare sua chegada' },
  { n: 2, nome: 'Estruture a equipe' },
  { n: 3, nome: 'Defina o rumo' },
  { n: 4, nome: 'Construa capital político' },
  { n: 5, nome: 'Garanta o avanço' },
];

const CLASSE_STATUS: Record<StatusMissao, string> = { 'Concluída': 'ok', 'Em andamento': 'av', 'A fazer': 'neutro' };

// Mesmo endereço de fotoUrl() em cadastro.js: o TSE guarda a foto pelo sq da candidatura.
function fotoUrl(sq: string, uf: string | null, ano: unknown): string {
  const pasta = ano === 2024 ? 'ele2024/619' : 'ele2026/6259';
  return `https://resultados.tse.jus.br/oficial/${pasta}/fotos/${String(uf ?? '').toLowerCase()}/${sq}.jpeg`;
}

function fotoDoMandato(m: MandatoDaPessoa): string | null {
  const tse = (m.dados as { tse?: { sq?: unknown; ano?: unknown } } | null)?.tse;
  const sq = tse?.sq;
  return typeof sq === 'string' || typeof sq === 'number' ? fotoUrl(String(sq), m.uf, tse?.ano) : null;
}

export function iniciais(nome: string | null): string {
  const p = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
}

// 'YYYY-MM-DD' -> 'DD/MM/AAAA', sem passar por Date (nada de fuso).
function dataBr(iso: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function textoDoDia(d: DiaDoMandato, posse: string | null): { titulo: string; pct: number } {
  if (d.estado === 'em-curso') return { titulo: `Dia ${d.dia} de 100`, pct: d.dia };
  if (d.estado === 'concluido') return { titulo: '100 dias concluídos', pct: 100 };
  if (d.estado === 'antes') return { titulo: `Posse em ${dataBr(posse)}`, pct: 0 };
  return { titulo: 'Data de posse não informada', pct: 0 };
}

function Foto({ mandato }: { mandato: MandatoDaPessoa }) {
  const url = fotoDoMandato(mandato);
  const [falhou, setFalhou] = useState(false);
  return (
    <div className="md-foto" aria-hidden="true">
      {iniciais(mandato.nome_parlamentar)}
      {url && !falhou && (
        // eslint-disable-next-line @next/next/no-img-element -- foto externa do TSE; some se não carregar e deixa as iniciais
        <img src={url} alt="" width={56} height={56} referrerPolicy="no-referrer" onError={() => setFalhou(true)} />
      )}
    </div>
  );
}

export default function AreaMandato() {
  const { api, mandato, papel } = useMandato();
  const [catalogo, setCatalogo] = useState<ExercicioCatalogo[] | null>(null);
  const [erroCatalogo, setErroCatalogo] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    catalogoExercicios(api).then(
      (c) => { if (vivo) setCatalogo(c); },
      (e) => { if (vivo) setErroCatalogo(mensagemDe(e)); },
    );
    return () => { vivo = false; };
  }, [api]);

  const feitos = (mandato.dados as { feitos?: Record<string, boolean> } | null)?.feitos;
  const status = catalogo ? statusMissoes(feitos, catalogo) : [];
  const statusDe = (n: number): StatusMissao => status.find((s) => s.missao === n)?.status ?? 'A fazer';
  const concluidas = MISSOES.filter((m) => statusDe(m.n) === 'Concluída').length;
  const dia = textoDoDia(diaDoMandato(mandato.data_posse, new Date()), mandato.data_posse);
  const info = [mandato.cargo, mandato.uf, mandato.partido, mandato.data_posse && `posse em ${dataBr(mandato.data_posse)}`].filter(Boolean).join(' · ');

  return (
    <>
      <section className="md-card md-cartao" aria-label="Dados do mandato">
        <Foto key={mandato.id} mandato={mandato} />
        <div className="md-cresce">
          <p className="md-rotulo">Mandato</p>
          <h1>{nomeDoMandato(mandato)}</h1>
          <p className="md-mut md-cartao-info">{info}</p>
          <p className="md-mut">Seu papel: <strong data-testid="papel-ativo">{rotuloPapel(papel)}</strong></p>
        </div>
        {podeEditar(papel) && <a className="md-bt md-bt--peq" href="/guia#/config">Editar dados</a>}
      </section>

      <section className="md-card md-andamento" aria-label="Andamento dos 100 dias">
        <div className="md-linha">
          <h2>{dia.titulo}</h2>
          {catalogo && <span className="md-mut">{concluidas} de {MISSOES.length} missões concluídas</span>}
        </div>
        <div className="md-prog" role="img" aria-label={`${dia.pct} por cento`}><i style={{ width: `${dia.pct}%` }} /></div>
      </section>

      <section className="md-missoes-bloco" aria-labelledby="md-missoes-t">
        <p className="md-rotulo" id="md-missoes-t">Missões</p>
        {erroCatalogo && <div className="md-aviso" role="alert">{erroCatalogo}</div>}
        {catalogo && (
          <ol className="md-missoes">
            {MISSOES.map((m) => {
              const s = statusDe(m.n);
              return (
                <li key={m.n} className="md-card md-missao" data-missao={m.n}>
                  <span className="md-missao-n">Missão {m.n}</span>
                  <h3>{m.nome}</h3>
                  <span className={`md-status md-status--${CLASSE_STATUS[s]}`}>{s}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}
