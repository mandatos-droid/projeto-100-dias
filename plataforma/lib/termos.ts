/* Terminologia: "objetivo específico" passa a "objetivo estratégico" (RM3-40). Só texto visível; chaves de dados não mudam. */

const ESPECIFICO = /(objetivos?)(\s+)(específic)([oa])(s?)/gi;

export function paraEstrategico(texto: string): string {
  return texto.replace(ESPECIFICO, (_t, obj: string, espaco: string, radical: string, final: string, plural: string) => {
    const palavra = radical + final + plural;
    const novo = palavra === palavra.toUpperCase() ? 'ESTRATÉGICO' : radical[0] === radical[0].toUpperCase() ? 'Estratégico' : 'estratégico';
    return obj + espaco + novo + plural;
  });
}
