/* Missão 2 · organograma completo em SVG (para virar PNG no navegador). Mesmo layout da tela, com legenda das áreas. */
import { type Campos } from './cadeiras.ts';
import { COR_COORD } from './equipe.ts';
import { layoutOrg } from './layoutOrg.ts';

const MARGEM = 24;
const LEGENDA_ALT = 44;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const corte = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const cor = (a: string) => COR_COORD[a] ?? '#5E524C';

/** `cargoNome(i)` devolve o nome do cargo da cadeira i (vem do modelo do Guia, que é global do legado). */
export function organogramaSvg(c: Campos, cargoNome: (i: number) => string): string {
  const l = layoutOrg(c);
  const minX = Math.min(...l.nos.map((n) => n.x)), minY = Math.min(...l.nos.map((n) => n.y));
  const maxX = Math.max(...l.nos.map((n) => n.x + n.w)), maxY = Math.max(...l.nos.map((n) => n.y + n.h));
  const dx = MARGEM - minX, dy = MARGEM - minY;
  const largura = Math.ceil(Math.max(maxX - minX + 2 * MARGEM, 120 + l.areas.length * 150));
  const altura = Math.ceil(maxY - minY + 2 * MARGEM + LEGENDA_ALT);
  const no = (i: number) => l.nos.find((n) => n.i === i)!;

  const linhas = l.arestas.map((a) => {
    const p = no(a.de), f = no(a.para);
    const x1 = p.x + p.w / 2 + dx, y1 = p.y + p.h + dy, x2 = f.x + f.w / 2 + dx, y2 = f.y + dy;
    if (a.tipo === 'entre') {
      const ya = p.y + p.h / 2 + dy, yb = f.y + f.h / 2 + dy;
      return `<g><line x1="${p.x + p.w / 2 + dx}" y1="${ya}" x2="${f.x + f.w / 2 + dx}" y2="${yb}" stroke="#5E524C" stroke-width="2" stroke-dasharray="6 5"/>` +
        `<text x="${(p.x + f.x + p.w) / 2 + dx}" y="${(ya + yb) / 2 - 4}" font-size="11" text-anchor="middle" fill="#5E524C">${esc(corte(a.rotulo ?? '', 40))}</text></g>`;
    }
    const m = (y1 + y2) / 2;
    return `<path d="M${x1} ${y1} V${m} H${x2} V${y2}" fill="none" stroke="${cor(a.coord)}" stroke-width="2"/>`;
  }).join('');

  const caixas = l.nos.map((n) => {
    const x = n.x + dx, y = n.y + dy;
    const titulo = n.vaga ? (n.aberto ? 'Processo seletivo' : 'Vaga em aberto') : n.nome;
    return `<g><rect class="caixa" x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="8" fill="#FFFFFF" stroke="#D9CEC0"${n.vaga ? ' stroke-dasharray="5 4"' : ''}/>` +
      `<rect x="${x}" y="${y}" width="${n.w}" height="6" rx="3" fill="${cor(n.coord)}"/>` +
      `<text x="${x + 12}" y="${y + 28}" font-size="11" font-weight="600" fill="${cor(n.coord)}">${esc(n.coord)}</text>` +
      `<text x="${x + 12}" y="${y + 52}" font-size="15" font-weight="700" fill="#2B2420">${esc(corte(titulo, 26))}</text>` +
      `<text x="${x + 12}" y="${y + 74}" font-size="12" fill="#5E524C">${esc(corte(cargoNome(n.i), 34))}</text></g>`;
  }).join('');

  const yl = altura - LEGENDA_ALT + 12;
  const legenda = `<g id="legenda">${l.areas.map((a, k) =>
    `<g><rect x="${MARGEM + k * 150}" y="${yl}" width="14" height="14" rx="3" fill="${cor(a)}"/>` +
    `<text x="${MARGEM + k * 150 + 20}" y="${yl + 12}" font-size="12" fill="#2B2420">${esc(a)}</text></g>`).join('')}</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" font-family="system-ui, sans-serif">` +
    `<rect width="${largura}" height="${altura}" fill="#FBF8F3"/>${linhas}${caixas}${legenda}</svg>`;
}
