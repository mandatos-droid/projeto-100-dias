// Registro de uso das funcionalidades do Guia (ADM-14): qual ilha conta como abertura de qual funcionalidade
// e a regra de no máximo 1 gravação por minuto para o mesmo mandato e a mesma funcionalidade.

// Ids estáveis gravados em uso_funcionalidades.funcionalidade; são os mesmos de lib/admin/usoFuncionalidades.ts.
const POR_ILHA: Record<string, string> = {
  'persona-tse': 'persona',
  calor: 'conjuntura',
  municipio: 'municipio',
  eleitorado: 'eleitorado',
  social: 'social',
  'equipe-tabela': 'cadeiras',
  organograma: 'organograma',
  'quadro-rotinas': 'organograma',
};

/** Funcionalidade que a ilha (valor de data-ilha) representa, ou null se não é uma funcionalidade medida. */
export function funcionalidadeDe(ilha: string): string | null {
  if (/^ficha-\d+$/.test(ilha)) return 'cadeiras';
  return Object.hasOwn(POR_ILHA, ilha) ? POR_ILHA[ilha] : null;
}

/**
 * Devolve `deveGravar(mandato, funcionalidade)`: true na primeira abertura e em toda abertura que chega
 * `janelaMs` ou mais depois da última gravada; repetições dentro da janela dão false. O relógio é injetável
 * para o teste; a memória fica só na closure (some ao recarregar a página, o que basta para a janela de 1 min).
 */
export function criaRegistrador(janelaMs = 60000, agora: () => number = Date.now) {
  const ultima = new Map<string, number>();
  return function deveGravar(mandato: string | null | undefined, funcionalidade: string | null | undefined): boolean {
    if (!mandato || !funcionalidade) return false;
    const chave = `${mandato}|${funcionalidade}`;
    const t = agora();
    const antes = ultima.get(chave);
    if (antes !== undefined && t - antes < janelaMs) return false;
    ultima.set(chave, t);
    return true;
  };
}
