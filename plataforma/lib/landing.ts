/** Se a landing recebeu o retorno do login (token ou erro no hash), devolve o destino em /guia; senão null. */
export function destinoAuth(hash: string): string | null {
  return /[#&](access_token|error_description)=/.test(hash) ? `/guia${hash}` : null;
}
