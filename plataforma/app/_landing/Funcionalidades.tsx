const V = '#571730';
const T = '#4ABFB2';
const C = '#EB5454';
const R = '#BA6BED';
const L = '#E6DCCE';

function Mapa() {
  const cores = [L, T, L, V, L, L, R, L, T, V, L, L, C, L, V, T, L, L, L, R];
  return (
    <svg viewBox="0 0 300 120" role="img" aria-label="Município colorido por votos">
      {cores.map((c, i) => (
        <rect key={i} x={20 + (i % 10) * 26} y={14 + Math.floor(i / 10) * 48} width="22" height="40" rx="3" fill={c} />
      ))}
    </svg>
  );
}

function Hemi() {
  const pts: [number, number, string][] = [];
  [8, 12, 16].forEach((n, li) => {
    for (let i = 0; i < n; i++) {
      const a = Math.PI - (Math.PI * i) / (n - 1);
      pts.push([150 + (40 + li * 22) * Math.cos(a), 108 - (40 + li * 22) * Math.sin(a), (li + i) % 5 === 0 ? T : (li * i) % 7 === 3 ? C : V]);
    }
  });
  return (
    <svg viewBox="0 0 300 120" role="img" aria-label="Hemiciclo com partidos em cores diferentes">
      {pts.map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="5" fill={c} />)}
    </svg>
  );
}

function Equipe() {
  return (
    <svg viewBox="0 0 300 120" role="img" aria-label="Organograma de equipe">
      <rect x="115" y="10" width="70" height="26" rx="4" fill={V} />
      <path d="M150 36v14M60 50h180M60 50v14M150 50v14M240 50v14" stroke={L} strokeWidth="2" fill="none" />
      {[25, 115, 205].map((x) => <rect key={x} x={x} y="64" width="70" height="26" rx="4" fill={T} />)}
      {[25, 115, 205].map((x) => <rect key={x} x={x + 10} y="98" width="50" height="14" rx="3" fill={L} />)}
    </svg>
  );
}

function Resumo() {
  return (
    <svg viewBox="0 0 300 120" role="img" aria-label="Barras de progresso por missão">
      {[0.9, 0.7, 0.45, 0.6, 0.2].map((p, i) => (
        <g key={i}>
          <rect x="30" y={14 + i * 21} width="240" height="12" rx="6" fill={L} />
          <rect x="30" y={14 + i * 21} width={240 * p} height="12" rx="6" fill={i % 2 ? T : V} />
        </g>
      ))}
    </svg>
  );
}

export default function Funcionalidades() {
  return (
    <section className="ld-sec" aria-labelledby="ld-func-t">
      <div className="ld-wrap">
        <p className="ld-eyebrow">O que a plataforma entrega</p>
        <h2 className="ld-h2" id="ld-func-t">Os dados já vêm, você decide</h2>
        <p className="ld-lead">Cada exercício do Guia tem um módulo que traz a informação pronta, para o mandato gastar o tempo na análise.</p>
        <div className="ld-feat">
          <article>
            <Mapa />
            <h3>Mapas do território</h3>
            <p>Votos, vereadores e filiados por município, o placar do seu partido e a posição dele diante do Executivo.</p>
          </article>
          <article>
            <Hemi />
            <h3>Hemiciclo da Casa</h3>
            <p>Veja quem foi eleito, filtre por partido e marque quem é parceiro e quem é concorrente.</p>
          </article>
          <article>
            <Equipe />
            <h3>Equipe recomendada</h3>
            <p>Escolha até 3 bandeiras e o tamanho do time (15, 20 ou 25) e receba a lista de cargos sugeridos.</p>
            <span className="ld-nota">Parte da recomendação é sugestão da plataforma, não regra do Guia.</span>
          </article>
          <article>
            <Resumo />
            <h3>Resumo e progresso</h3>
            <p>Cada pergunta vira um link para o exercício, os mapas aparecem sob as respostas e o avanço de cada missão fica à vista.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
