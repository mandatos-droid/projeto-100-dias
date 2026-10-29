const MISSOES = [
  {
    dia: '15', titulo: 'Missão 1 · Prepare sua chegada com evidências',
    texto: 'Monte o Mapa Político: quem é a liderança, qual a conjuntura, onde estão as oportunidades de atuação e as fragilidades imediatas.',
  },
  {
    dia: '30', titulo: 'Missão 2 · Estruture a gestão de pessoas',
    texto: 'Escale o time que completa as habilidades da liderança, desenhe o organograma e combine os fluxos e as rotinas de trabalho.',
  },
  {
    dia: '45', titulo: 'Missão 3 · Defina o rumo do mandato',
    texto: 'Escolha o legado, os preditores prioritários de sucesso e as metas dos primeiros 100 dias.',
  },
  {
    dia: 'Desde o 1º dia', titulo: 'Missão 4 · Construa capital político',
    texto: 'Articule, escolha as comissões permanentes, mobilize apoiadores, ganhe relevância no partido e cuide da presença pública e das redes.',
  },
  {
    dia: '100', titulo: 'Missão 5 · Monitore para o projeto avançar',
    texto: 'Acompanhe o avanço das metas e faça o primeiro ciclo de feedback estruturado.',
  },
];

export default function Missoes() {
  return (
    <section className="ld-sec ld-sec--vinho" id="missoes" aria-labelledby="ld-missoes-t">
      <div className="ld-wrap">
        <p className="ld-eyebrow">O caminho</p>
        <h2 className="ld-h2" id="ld-missoes-t">5 missões, 100 dias</h2>
        <p className="ld-lead">Cada missão tem um dia ideal e entrega algo que o mandato usa na seguinte. Se o dia ideal já passou, adapte à realidade do mandato e passe por todas.</p>
        <ol className="ld-miss">
          {MISSOES.map((m) => (
            <li key={m.titulo}>
              {m.dia.length > 3
                ? <span className="ld-dia ld-dia--texto">{m.dia}</span>
                : <span className="ld-dia"><span><b data-conta={m.dia}>{m.dia}</b><small>dia</small></span></span>}
              <div>
                <h3>{m.titulo}</h3>
                <p>{m.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
