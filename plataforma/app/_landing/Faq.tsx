const PERGUNTAS = [
  {
    p: 'Quanto tempo leva?',
    r: 'O Guia acompanha os 100 primeiros dias do mandato, com um dia ideal para cada missão. Você responde no seu ritmo e pode voltar quando quiser.',
  },
  {
    p: 'Quem pode usar?',
    r: 'Parlamentares e quem caminha com o mandato: assessoria, chefia de gabinete, coordenação de campanha e conselheiros políticos.',
  },
  {
    p: 'E se os 100 dias já passaram?',
    r: 'Adapte o Guia à realidade do mandato. O importante é passar por todas as missões, mesmo depois do dia ideal.',
  },
  {
    p: 'É gratuito?',
    r: 'Sim. O Guia dos 100 Dias é um presente da Legisla Brasil, e o cadastro é livre.',
  },
];

export default function Faq() {
  return (
    <section className="ld-sec" aria-labelledby="ld-faq-t">
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
