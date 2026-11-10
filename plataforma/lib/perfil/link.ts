import { tokenDoHash } from '../convites/link.ts';

// Texto colado nas instruções do primeiro acesso (PAG-04.4, 04.5): o link inteiro (`.../convite#token`)
// ou só o token. Link de outra página, com query ou sem token válido devolve null.
export function tokenDoLinkColado(texto: string | null | undefined): string | null {
  const t = (texto ?? '').trim();
  const i = t.indexOf('#');
  if (i < 0) return tokenDoHash(`#${t}`);
  return /\/convite\/?$/.test(t.slice(0, i)) ? tokenDoHash(t) : null;
}
