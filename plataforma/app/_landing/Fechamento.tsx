export default function Fechamento() {
  return (
    <>
      <section className="ld-sec ld-sec--vinho ld-fecha" aria-labelledby="ld-fecha-t">
        <div className="ld-wrap">
          <h2 className="ld-h2" id="ld-fecha-t">Chegue ao mandato com o mapa na mão</h2>
          <p className="ld-lead">Comece pela Missão 1. Os dados do TSE já estão esperando.</p>
          <a className="ld-bt ld-bt--claro" href="/guia">Começar meu Mapa Político</a>
        </div>
      </section>
      <footer className="ld-foot">
        <div className="ld-wrap">
          <img src="/legacy/logo-2.png" alt="Legisla Brasil" width={100} height={30} />
          <p>Guia dos 100 Dias, um presente da Legisla Brasil. Dados: TSE e IDSC-BR.</p>
        </div>
      </footer>
    </>
  );
}
