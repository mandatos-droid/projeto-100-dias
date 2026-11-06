export const ERRO_NOME = 'Informe um nome de até 80 caracteres.';
export const ERRO_EMAIL = 'E-mail inválido.';

export type ResultadoConvite = { ok: true; nome: string; email: string } | { ok: false; erro: string };

// Mesma regra de convite_criar: um único @, sem espaço, ponto no domínio, até 254 caracteres.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validaConvite(campos: { nome?: string | null; email?: string | null }): ResultadoConvite {
  const nome = (campos.nome ?? '').trim();
  const email = (campos.email ?? '').trim().toLowerCase();
  if (nome.length < 1 || nome.length > 80) return { ok: false, erro: ERRO_NOME };
  if (email && (email.length > 254 || !FORMATO_EMAIL.test(email))) return { ok: false, erro: ERRO_EMAIL };
  return { ok: true, nome, email };
}
