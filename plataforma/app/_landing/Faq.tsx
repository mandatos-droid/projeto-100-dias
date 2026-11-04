const PERGUNTAS = [
  {
    p: 'Em que dia faço cada missão?',
    r: 'A Missão 1 idealmente até o 15º dia, a Missão 2 até o 30º, a Missão 3 até o 45º, a Missão 4 desde o 1º dia e a Missão 5 amadurecendo o monitoramento até o 100º. Os momentos ideais também valem entre o fim de um ciclo de planejamento e o início do outro.',
  },
  {
    p: 'E se o momento ideal já passou?',
    r: 'Oriente a implementação do Guia à realidade do mandato, pois o importante é que passem por todas as missões.',
  },
  {
    p: 'Quem deve usar?',
    r: 'Parlamentar ou parte da assessoria, seja este o primeiro mandato ou não.',
  },
  {
    p: 'Preciso fazer tudo sozinho?',
    r: 'Não. A Missão 3, por exemplo, pode ser feita coletivamente: na Legisla, a equipe fica imersa em dois períodos de 6 horas. O Guia também recomenda apresentar o Mapa Político a quem caminha com o mandato.',
  },
  {
    p: 'O que é o Mapa Político?',
    r: 'É o relatório da Missão 1, com as respostas a oito perguntas-chave sobre a persona, a conjuntura, as oportunidades e ameaças e as fragilidades e fortalezas. Ele fundamenta o Projeto Político da liderança parlamentar.',
  },
  {
    p: 'Quanto custa?',
    r: 'O Guia dos 100 Dias é um presente da Legisla Brasil.',
  },
];

export default function Faq() {
  return (
    <section className="ld-sec ld-sec--branco" aria-labelledby="ld-faq-t">
      <div className="ld-wrap ld-faq">
        <p className="ld-eyebrow">Dúvidas comuns</p>
        <h2 className="ld-h2" id="ld-faq-t">Perguntas frequentes</h2>
        {PERGUNTAS.map((q) => (
          <details key={q.p}>
            <summary>{q.p}</summary>
            <p>{q.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
