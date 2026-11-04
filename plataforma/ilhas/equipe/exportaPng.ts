/* Missão 2 · baixa o organograma (SVG de lib/exporta) como PNG, desenhado num canvas em dobro de resolução. */
import { aviso } from '../ponte';

const baixa = (href: string, nome: string) => { const a = document.createElement('a'); a.href = href; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); };

export function baixaPng(svg: string, arquivo: string) {
  const m = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  const w = m ? Number(m[1]) : 1200, h = m ? Number(m[2]) : 800;
  const img = new Image();
  img.onload = () => {
    const esc = 2, cv = document.createElement('canvas');
    cv.width = w * esc; cv.height = h * esc;
    const ctx = cv.getContext('2d');
    if (!ctx) { aviso('Não foi possível gerar a imagem neste navegador.'); return; }
    ctx.scale(esc, esc);
    ctx.drawImage(img, 0, 0, w, h);
    cv.toBlob((b) => {
      if (!b) { aviso('Não foi possível gerar a imagem neste navegador.'); return; }
      const url = URL.createObjectURL(b);
      baixa(url, arquivo);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  };
  img.onerror = () => aviso('Não foi possível gerar a imagem neste navegador.');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
