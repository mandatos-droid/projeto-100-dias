/* Contador de dias do Guia (CFG-01). `d` é o que `diaAtual()` devolve: dias desde a posse + 1 (1 = dia da posse),
   0 ou menos antes da posse, `null` sem data de posse. Há uma cópia desta regra em `public/legacy/novos.js` (o Guia
   vanilla não importa TypeScript); `tests/contador-dias-legado.test.ts` prova que as duas dão o mesmo resultado. */
export interface ContadorDias {
  /** Palavra antes do número ("faltam"); vazia quando não há. */
  pre: string;
  /** Número em destaque; `null` quando o texto não leva número. */
  num: number | null;
  /** Texto depois do número; "\n" marca onde a barra lateral quebra a linha. */
  pos: string;
  /** Frase corrida, para o cabeçalho móvel e o resumo baixado. */
  texto: string;
}

const monta = (pre: string, num: number | null, pos: string): ContadorDias => ({
  pre, num, pos, texto: [pre, num, pos].filter((p) => p !== '' && p !== null).join(' ').replace(/\n/g, ' '),
});
const dias = (n: number) => (n === 1 ? 'dia' : 'dias');
const faltam = (n: number) => (n === 1 ? 'falta' : 'faltam');

export function contadorDias(d: number | null): ContadorDias | null {
  if (d === null || !Number.isFinite(d)) return null;
  if (d <= 0) { const n = 1 - d; return monta(faltam(n), n, `${dias(n)}\npara a posse`); }
  if (d < 100) { const n = 100 - d; return monta(faltam(n), n, dias(n)); }
  if (d === 100) return monta('', null, 'último dia\ndos 100');
  return monta('', 100, 'dias\nconcluídos');
}
