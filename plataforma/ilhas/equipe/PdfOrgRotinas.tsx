'use client';
/* Missão 2 · botão "Gerar PDF do organograma e rotinas". Usa a impressão do navegador ("Salvar como PDF"): o bloco .pdf-org fica
   no <body>, oculto na tela; ao imprimir, body.imprimindo-org esconde o resto e deixa só o organograma (página 1) e o quadro de rotinas.
   Sem organograma (tabela vazia), imprime só as rotinas e avisa. */
import { createPortal } from 'react-dom';
import { organogramaSvg, quadroRotinasHtml } from '@/lib/exporta';
import { lerQuadro } from '@/lib/quadroRotinas';
import { organogramaGerado, vistaDaTabela } from '@/lib/tabelaEquipe';
import { aviso } from '../ponte';
import { cargoNome, modeloNome } from './cargos';
import { useEquipe } from './useEquipe';
import './equipe.css';

const CLASSE = 'imprimindo-org';

export default function PdfOrgRotinas() {
  const { c } = useEquipe();
  const vista = vistaDaTabela(c, modeloNome);
  const comOrganograma = organogramaGerado(vista);
  const rotinas = quadroRotinasHtml(lerQuadro(c));
  const svg = comOrganograma ? organogramaSvg(vista, (i) => cargoNome(vista, i)) : '';

  const gera = () => {
    if (!comOrganograma) aviso('O organograma ainda não existe: o PDF terá só as rotinas. Preencha a tabela da Mão na massa 1 para incluí-lo.');
    const fim = () => { document.body.classList.remove(CLASSE); window.removeEventListener('afterprint', fim); };
    document.body.classList.add(CLASSE);
    window.addEventListener('afterprint', fim);
    try { window.print(); } finally { fim(); }
  };

  return (
    <div className="es-pdf es-nao-imprime">
      <button type="button" className="bt pri es-bt" onClick={gera}>Gerar PDF do organograma e rotinas</button>
      <p className="es-tab-ajuda">Abre a impressão do navegador: escolha "Salvar como PDF". A página 1 traz o organograma; a seguir, o quadro de rotinas.</p>
      {typeof document !== 'undefined' && createPortal(
        <div className="pdf-org" aria-hidden="true">
          {comOrganograma && (
            <section className="pdf-org-pag" data-pdf="organograma">
              <h2>Organograma do mandato</h2>
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            </section>
          )}
          <section className="pdf-org-rotinas" data-pdf="rotinas">
            <h2>Rotinas do mandato</h2>
            <div dangerouslySetInnerHTML={{ __html: rotinas }} />
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
