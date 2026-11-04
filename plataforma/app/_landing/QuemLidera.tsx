const LINHAS = [
  ['1', 'Parlamentar, conselheiro/a político/a, coordenador/a da campanha ou chefia de gabinete', 'Quem caminha com o mandato'],
  ['2', 'Parlamentar, chefia de gabinete ou chefia de gabinete com coordenações de área', 'A equipe'],
  ['3', 'Chefia de gabinete', 'Parlamentar e todos os assessores'],
  ['4', 'Parlamentar, chefia de gabinete ou articulador/a político/a do mandato', 'Coordenações Legislativa, Articulação, Mobilização Territorial e Comunicação'],
  ['5', 'Parlamentar, chefia de gabinete ou pessoa responsável pelo planejamento', 'Coordenações e demais integrantes da equipe, de acordo com as metas acompanhadas'],
];

export default function QuemLidera() {
  return (
    <section className="ld-sec" id="quem-lidera" aria-labelledby="ld-quem-t">
      <div className="ld-wrap">
        <p className="ld-eyebrow">Quem conduz</p>
        <h2 className="ld-h2" id="ld-quem-t">Quem lidera cada missão</h2>
        <p className="ld-lead">Sendo você parlamentar ou parte da assessoria, o Guia indica quem é ideal para liderar a implementação de cada missão e quem deve participar.</p>
        <div className="ld-tab-rolagem">
          <table className="ld-tab">
            <thead><tr><th scope="col">Missão</th><th scope="col">Quem lidera</th><th scope="col">Quem participa</th></tr></thead>
            <tbody>
              {LINHAS.map(([m, l, p]) => <tr key={m}><td>{m}</td><td>{l}</td><td>{p}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
