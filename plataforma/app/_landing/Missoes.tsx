const MISSOES = [
  {
    dia: '15', ideal: 'Idealmente até o 15º dia',
    titulo: 'Missão 1 · Prepare sua chegada com evidências e conhecimento sobre o projeto político da liderança parlamentar',
    texto: 'Conheça e estruture bem o terreno antes de começar a caminhar. Antes de decidir para onde ir, é preciso entender de onde se parte: o Mapa Político combina um levantamento sobre o contexto social, político e institucional e outro sobre as práticas e pessoas que compõem o gabinete.',
    terao: [
      'Compreendido profundamente a persona da liderança parlamentar.',
      'Mapeado a conjuntura política que a cerca.',
      'Mapeado as oportunidades de ação política do mandato.',
      'Identificado as fragilidades imediatas a serem superadas.',
    ],
    mao: 'Mão na massa: oito perguntas-chave que formam o Mapa Político.',
  },
  {
    dia: '30', ideal: 'Idealmente até o 30º dia',
    titulo: 'Missão 2 · Estruture a gestão de pessoas, com uma equipe que complete as habilidades da liderança parlamentar',
    texto: 'Ao invés de encaixar pessoas em cargos, faça o exercício contrário: parta das competências que cada função exige.',
    terao: [
      'Montado uma equipe de sucesso.',
      'Elaborado um organograma funcional.',
      'Definido fluxos de trabalho e rotinas de comunicação.',
    ],
  },
  {
    dia: '45', ideal: 'Idealmente até o 45º dia',
    titulo: 'Missão 3 · Defina o rumo do mandato com um planejamento estratégico',
    texto: 'A organização do trabalho em torno de objetivos e metas comuns torna a transformação de promessas em entregas muito mais consistente.',
    terao: [
      'Definido o que vão ter alcançado ao fim de 4 anos: o Legado.',
      'Estabelecido o objetivo do primeiro ano da legislatura.',
      'Identificado os Preditores de Sucesso Parlamentar prioritários.',
      'Estabelecido metas claras para os primeiros 100 dias.',
    ],
    mao: 'Mão na massa: até 3 bandeiras, o Legado, os preditores de sucesso e as metas.',
  },
  {
    dia: 'Desde o 1º dia', ideal: 'Idealmente desde o 1º dia',
    titulo: 'Missão 4 · Construa seu capital político com articulação e mobilização',
    texto: 'Mandato nenhum avança sozinho. Capital político é a capacidade de ser ouvido, ocupar espaços de decisão, reunir apoio e fazer suas prioridades avançarem.',
    terao: [
      'Entendido como funciona a distribuição das Comissões Permanentes e mapeado as de maior interesse para o mandato.',
      'Escolhido pelo menos duas ações, em frentes diferentes, para ampliar a articulação, a mobilização ou a presença pública.',
      'Definido o que pretende alcançar, quem será responsável e o próximo passo de cada ação.',
    ],
    mao: 'As quatro frentes: articulação política, mobilização de apoiadores, relevância no Partido e redes sociais e presença pública.',
  },
  {
    dia: '100', ideal: 'Idealmente, amadureça o monitoramento até o 100º dia',
    titulo: 'Missão 5 · Monitore seu mandato para que o projeto político avance',
    texto: 'Os primeiros 100 dias não terminam com uma lista de tarefas cumpridas. Devem deixar uma forma de acompanhar resultados, aprender com o que aconteceu e decidir os próximos passos.',
    terao: [
      'Um Painel de Monitoramento atualizado.',
      'O primeiro ciclo de feedback realizado.',
      'O próximo ciclo de planejamento encaminhado.',
    ],
  },
];

export default function Missoes() {
  return (
    <section className="ld-sec ld-sec--vinho" id="missoes" aria-labelledby="ld-missoes-t">
      <div className="ld-wrap">
        <p className="ld-eyebrow">O caminho</p>
        <h2 className="ld-h2" id="ld-missoes-t">5 missões para os 100 primeiros dias</h2>
        <p className="ld-lead">Se o momento ideal já passou, ou se vocês conseguirem superá-lo, adaptem o Guia à realidade do mandato, pois o importante é que passem por todas as missões.</p>
        <ol className="ld-miss">
          {MISSOES.map((m) => (
            <li key={m.titulo}>
              {m.dia.length > 3
                ? <span className="ld-dia ld-dia--texto">{m.dia}</span>
                : <span className="ld-dia"><span><b data-conta={m.dia}>{m.dia}</b><small>dia</small></span></span>}
              <div>
                <p className="ld-idealmente">{m.ideal}</p>
                <h3>{m.titulo}</h3>
                <p>{m.texto}</p>
                <h4>Ao terminar você terá</h4>
                <ul>{m.terao.map((t) => <li key={t}>{t}</li>)}</ul>
                {m.mao && <p className="ld-mao">{m.mao}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
