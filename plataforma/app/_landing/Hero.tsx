// Hemiciclo: cadeiras em arcos concêntricos; uma delas, em coral, é a do mandato.
const LINHAS = [14, 20, 26, 32, 38];
const CORES = ['rgba(251,246,238,.2)', 'rgba(251,246,238,.2)', 'rgba(251,246,238,.2)', '#4ABFB2', 'rgba(251,246,238,.2)', '#BA6BED'];

function cadeiras() {
  const out: { x: number; y: number; c: string; r: number; voce: boolean }[] = [];
  LINHAS.forEach((n, li) => {
    const raio = 120 + li * 34;
    for (let i = 0; i < n; i++) {
      const ang = Math.PI - (Math.PI * i) / (n - 1);
      const idx = li * 7 + i;
      out.push({ x: 330 + raio * Math.cos(ang), y: 330 - raio * Math.sin(ang), c: CORES[idx % CORES.length], r: 8, voce: li === 2 && i === 9 });
    }
  });
  return out;
}

export default function Hero() {
  return (
    <header className="ld-hero">
      <div className="ld-wrap">
        <div className="ld-bar">
          <img src="/legacy/logo-2.png" alt="Legisla Brasil" width={114} height={34} />
          <a className="ld-bt ld-bt--claro ld-bt--peq" href="/guia">Começar meu Mapa Político</a>
        </div>

        <div className="ld-hero-grade">
          <div>
            <h1>Os primeiros <em>100 dias</em> moldam o resto do mandato</h1>
            <p className="ld-hero-sub">
              O Guia dos 100 Dias é o passo a passo da Legisla Brasil para o seu mandato chegar com mapa, equipe e plano. Já vem com os dados do TSE preenchidos.
            </p>
            <a className="ld-bt ld-bt--claro" href="/guia">Começar meu Mapa Político</a>
            <p className="ld-hero-nota">Gratuito e de cadastro livre.</p>
          </div>

          <svg className="ld-hemiciclo" viewBox="0 0 660 360" role="img" aria-label="Hemiciclo com uma cadeira destacada: a do seu mandato">
            {cadeiras().map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.voce ? 13 : s.r} fill={s.voce ? '#EB5454' : s.c} />
            ))}
            <text x="330" y="318" textAnchor="middle" fill="#FBF6EE" fontSize="22" fontWeight="700">Você está aqui</text>
          </svg>
        </div>

        <ul className="ld-dor">
          <li>Chega sem saber quem são os parceiros e os concorrentes na Casa.</li>
          <li>Monta a equipe no improviso, sem organograma nem rotina de trabalho.</li>
          <li>Deixa a articulação e as comissões para depois, e o capital político escorre.</li>
        </ul>
      </div>
    </header>
  );
}
