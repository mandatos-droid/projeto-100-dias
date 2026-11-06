/**
 * Se a landing recebeu o retorno do login (token ou erro no hash), devolve o destino; senão null.
 * Com convite pendente (token guardado antes de ir ao Google) o destino é /convite; sem, /guia.
 */
export function destinoAuth(hash: string, conviteGuardado?: string | null): string | null {
  if (!/[#&](access_token|error_description)=/.test(hash)) return null;
  return `${conviteGuardado ? '/convite' : '/guia'}${hash}`;
}
