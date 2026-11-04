import type { CSSProperties } from 'react';
// Hemiciclo: cadeiras em arcos concêntricos; uma delas, em coral, é a do mandato.
const LINHAS = [14, 20, 26, 32, 38];
const CORES = ['rgba(251,246,238,.2)', 'rgba(251,246,238,.2)', 'rgba(251,246,238,.2)', '#4ABFB2', 'rgba(251,246,238,.2)', '#BA6BED'];

function cadeiras() {
  const out: { x: number; y: number; c: string; r: number; voce: boolean; d: number }[] = [];
  LINHAS.forEach((n, li) => {
    const raio = 120 + li * 34;
    for (let i = 0; i < n; i++) {
      const ang = Math.PI - (Math.PI * i) / (n - 1);
      const idx = li * 7 + i;
      // atraso: as cadeiras surgem varrendo o arco da esquerda para a direita
      out.push({ x: 330 + raio * Math.cos(ang), y: 330 - raio * Math.sin(ang), c: CORES[idx % CORES.length], r: 8, voce: li === 2 && i === 9, d: Math.round((i / (n - 1)) * 800 + li * 50) });
    }
  });
  return out;
}

export default function Hero() {
  return (
    <>
    <div className="ld-topo">
      <div className="ld-wrap">
        <div className="ld-bar">
          <img src="/legacy/logo-2.png" alt="Legisla Brasil" width={114} height={34} />
          <a className="ld-bt ld-bt--claro ld-bt--peq" href="/guia">Acessar o Guia dos 100 Dias</a>
        </div>
      </div>
    </div>
    <header className="ld-hero">
      <div className="ld-wrap">
        <div className="ld-hero-grade">
          <div>
            <p className="ld-eyebrow">Planejamento Legisla Brasil de sobrevivência e estratégia política</p>
            <h1>Guia dos <em>100 dias</em></h1>
            <p className="ld-hero-sub">
              Material prático de sobrevivência para os 100 primeiros dias do mandato. Um presente da Legisla Brasil para você.
            </p>
            <p className="ld-hero-sub">
              Sendo você parlamentar ou parte da assessoria, o Guia vai te orientar a superar desafios que vão desde a profunda compreensão do projeto político, passam pela gestão de pessoas e chegam à articulação política.
            </p>
            <a className="ld-bt ld-bt--claro" href="/guia">Acessar o Guia dos 100 Dias</a>
            <p className="ld-hero-nota">Para o primeiro mandato ou não.</p>
          </div>

          <svg className="ld-hemiciclo" viewBox="0 0 660 360" role="img" aria-label="Hemiciclo com uma cadeira destacada">
            {cadeiras().map((s, i) => (
              <circle
                key={i} className={s.voce ? 'ld-cad ld-voce' : 'ld-cad'} cx={s.x} cy={s.y} r={s.voce ? 13 : s.r}
                fill={s.voce ? '#EB5454' : s.c} style={{ '--d': `${s.voce ? 1300 : s.d}ms` } as CSSProperties}
              />
            ))}
            {cadeiras().filter((s) => s.voce).map((s) => (
              <circle key="anel" className="ld-anel" cx={s.x} cy={s.y} r={13} />
            ))}
            <text className="ld-aqui" x="330" y="318" textAnchor="middle" fill="#FBF6EE" fontSize="22" fontWeight="700">Você está aqui</text>
          </svg>
        </div>

        <blockquote className="ld-viagem">
          Tomar posse em um mandato sem conhecer profundamente o contexto em que irá atuar é como iniciar uma viagem, rumo ao desconhecido, sem qualquer referencial de mapa, clima ou idioma, e esperar chegar a algum lugar.
          <cite>Missão 1 do Guia dos 100 Dias</cite>
        </blockquote>
      </div>
    </header>
    </>
  );
}
