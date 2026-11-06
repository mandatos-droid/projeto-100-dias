export const SEM_PERMISSAO = 'Você não tem permissão para esta ação.';
export const FALHA_CARGA = 'Não foi possível carregar.';
export const SEM_CONTA = 'Nenhuma conta com este e-mail. A pessoa precisa entrar na plataforma uma vez.';
export const EMAIL_INVALIDO = 'Digite um e-mail válido.';

// Texto para a tela a partir de um erro do cliente da API ({status, mensagem}) ou de qualquer falha de rede.
// As travas de regra nascem em português no banco; aqui só entram os casos técnicos.
export function mensagemDe(erro: unknown): string {
  const e = (erro ?? {}) as { status?: unknown; mensagem?: unknown };
  const status = typeof e.status === 'number' ? e.status : 0;
  if (status === 403) return SEM_PERMISSAO; // o banco responde em inglês ("permission denied")
  if (status >= 500 || status === 0) return FALHA_CARGA;
  return typeof e.mensagem === 'string' && e.mensagem ? e.mensagem : FALHA_CARGA;
}

// Formato mínimo: algo@dominio.sufixo, sem espaços. A conferência real é a busca da conta.
export function emailValido(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
