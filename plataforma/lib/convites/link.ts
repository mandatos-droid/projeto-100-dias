const TOKEN = /^[A-Za-z0-9_-]{22}$/;

// O token vai no fragmento: o navegador não o envia ao servidor nem ao Referer (AD-009).
export function montaLink(origem: string, token: string): string {
  return `${origem}/convite#${token}`;
}

// Aceita o hash (`#token`) ou o link completo colado; só devolve token de 22 caracteres base64url.
export function tokenDoHash(hash: string): string | null {
  const texto = (hash ?? '').trim();
  const i = texto.indexOf('#');
  if (i < 0) return null;
  const token = texto.slice(i + 1);
  return TOKEN.test(token) ? token : null;
}
