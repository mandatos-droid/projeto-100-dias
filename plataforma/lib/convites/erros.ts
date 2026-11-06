export const SEM_PERMISSAO = 'Você não tem permissão para esta ação.';
export const DESCONHECIDO = 'Não foi possível concluir. Tente de novo.';

// Códigos devolvidos como dado por convite_previa e convite_aceitar ({ok:false, erro}).
const POR_CODIGO: Record<string, string> = {
  invalido: 'Este convite não vale mais. Peça um novo para quem convidou você.',
  email: 'Este convite é para outro e-mail. Entre com a conta indicada ou peça um novo convite.',
  limite: 'Muitas tentativas. Tente de novo em alguns minutos.',
};

// Exceções de regra do banco: nascem em português e passam como estão, mas só as conhecidas.
const EXCECOES = new Set([
  'Você só pode convidar com papel igual ou menor que o seu.',
  'Este mandato já tem 20 convites pendentes. Cancele algum para criar outro.',
  'O mandato precisa ter ao menos uma pessoa na coordenação.',
  'Informe um nome de até 80 caracteres.',
  'E-mail inválido.',
  SEM_PERMISSAO,
]);

// Texto para a tela a partir de um código, de `{ok:false, erro}` ou de um erro do cliente da API ({status, mensagem}).
export function mensagemDe(erro: unknown): string {
  if (typeof erro === 'string') return POR_CODIGO[erro] ?? DESCONHECIDO;
  const e = (erro ?? {}) as { erro?: unknown; status?: unknown; mensagem?: unknown };
  if (typeof e.erro === 'string') return POR_CODIGO[e.erro] ?? DESCONHECIDO;
  if (e.status === 403) return SEM_PERMISSAO; // o banco responde em inglês ("permission denied")
  if (typeof e.mensagem === 'string' && EXCECOES.has(e.mensagem)) return e.mensagem;
  return DESCONHECIDO;
}

// Recusas do Supabase Auth (cadastro e login), que chegam em inglês: pelo `error_code` (versões novas do GoTrue)
// ou pelo texto (`msg`, `error_description`, ou o Error de lib/admin/sessao.ts).
const POR_AUTH: [RegExp, string][] = [
  [/user_already_exists|email_exists|already (been )?registered/i, 'Este e-mail já tem conta. Entre com ele para aceitar o convite.'],
  [/weak_password|password should|weak password/i, 'Senha fraca. Escolha uma senha mais longa, com letras e números.'],
  [/email_not_confirmed|email not confirmed/i, 'Confirme o e-mail enviado e faça login.'],
  [/invalid_credentials|invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email_address_invalid|unable to validate email/i, 'E-mail inválido.'],
  [/rate_limit|rate limit|too many requests/i, POR_CODIGO.limite],
];

export function mensagemDoLogin(erro: unknown): string {
  const e = (erro ?? {}) as Record<string, unknown>;
  const texto = (typeof erro === 'string' ? [erro] : [e.error_code, e.msg, e.error_description, e.message])
    .filter((x): x is string => typeof x === 'string')
    .join(' ');
  return POR_AUTH.find(([re]) => re.test(texto))?.[1] ?? DESCONHECIDO;
}
