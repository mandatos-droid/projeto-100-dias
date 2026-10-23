'use client';
import { useState } from 'react';
import { nf, pct } from '@/lib/format';
import type { LinhaPleito, Resumo } from '@/lib/demo';
import type { Eleito } from '@/lib/types';

export type EstadoPleitos = { estado: 'carregando' | 'ok' | 'erro'; linhas: LinhaPleito[] };

// Foto oficial da candidatura no site do TSE (2026). Sem foto ou sem rede, fica a inicial do nome.
function Foto({ e }: { e: Eleito }) {
  const [falhou, setFalhou] = useState(false);
  const url = `https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/${e.uf.toLowerCase()}/${e.s}.jpeg`;
  return (
    <span className="ld-foto">
      {(e.u.trim()[0] ?? '?').toUpperCase()}
      {!falhou && <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFalhou(true)} />}
    </span>
  );
}

function Historico({ pleitos }: { pleitos: EstadoPleitos }) {
  if (pleitos.estado === 'carregando') return <p className="ld-msg">Buscando o histórico no TSE…</p>;
  if (pleitos.estado === 'erro') return <p className="ld-msg ld-msg--erro">Histórico indisponível agora</p>;
  if (pleitos.linhas.length === 0) return <p className="ld-msg">Sem pleitos anteriores no TSE</p>;
  return (
    <div className="ld-hist-rolagem">
      <table className="ld-hist">
        <thead>
          <tr><th>Ano</th><th>Cargo</th><th>Partido</th><th>Votos</th><th>Situação</th></tr>
        </thead>
        <tbody>
          {pleitos.linhas.map((l, i) => (
            <tr key={i}>
              <td>{l.ano}</td>
              <td>{l.cargo}{l.municipio ? ` · ${l.municipio}` : ''}</td>
              <td>{l.partido}</td>
              <td>{nf.format(l.votos)}</td>
              <td>{l.situacao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CartaoEleito({ eleito: e, resumo: r, pleitos }: { eleito: Eleito; resumo: Resumo; pleitos: EstadoPleitos }) {
  const senador2022 = e.k === 's' && e.a === 2022;
  return (
    <article className="ld-card" aria-live="polite">
      <div className="ld-card-topo">
        <Foto e={e} />
        <div>
          <h3>{e.u}</h3>
          <p className="ld-card-sub">{r.cargo} · {e.p} · {e.uf}{r.trajetoria ? ` · ${r.trajetoria}` : ''}</p>
        </div>
      </div>

      <ul className="ld-metricas">
        {!senador2022 && <li><b>{nf.format(e.v)}</b><span>votos nominais</span></li>}
        {!senador2022 && <li><b>{pct(e.x)}</b><span>dos votos válidos</span></li>}
        {r.posicao && <li><b>Nº {r.posicao.n} de {r.posicao.de}</b><span>por votos na Casa e UF</span></li>}
        <li><b>{r.cadeirasPartido}</b><span>{r.cadeirasPartido === 1 ? 'cadeira' : 'cadeiras'} do {e.p} na Casa e UF</span></li>
      </ul>

      <h4>Eleições anteriores</h4>
      <Historico pleitos={pleitos} />

      <p className="ld-fonte">Fonte: TSE, dados públicos de candidatura e resultado.</p>

      <div className="ld-card-cta">
        <p>Este é só o começo do seu Mapa Político. Salve e siga para as 5 missões.</p>
        <a className="ld-bt" href="/guia">Salvar meu mapa</a>
      </div>
    </article>
  );
}
