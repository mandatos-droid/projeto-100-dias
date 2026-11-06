import type { Api } from '../admin/api.ts';
import type { ExercicioCatalogo } from './missoes.ts';
import type { Papel } from './papeis.ts';

/* Uma função por chamada ao banco (migration 20261106120000_convites_equipe.sql). Erros HTTP chegam como ErroApi
   (lib/admin/api.ts); falhas esperadas de prévia e aceite chegam como dado ({ok:false, erro}), sem lançar. */

export interface ConviteCriado { id: string; token: string; expira_em: string }

export type Previa =
  | {
      ok: true; nome: string; papel: Papel; convidado_por: string | null;
      mandato: { nome_parlamentar: string | null; cargo: string | null; uf: string | null }; exige_email: boolean;
    }
  | { ok: false; erro: 'invalido' | 'limite' };

export type Aceite =
  | { ok: true; mandato_id: string; ja_membro: boolean }
  | { ok: false; erro: 'invalido' | 'email' | 'consentimento' | 'limite' };

export interface ConvitePendente { id: string; nome: string; papel: Papel; convidado_por_nome: string | null; expira_em: string }
export interface PessoaEquipe { user_id: string; nome: string | null; email: string | null; papel: Papel; criado_em: string }
export interface EventoEquipe {
  id: number; criado_em: string; ator_nome: string | null; tipo: string; alvo_nome: string | null; papel: string | null;
}

type Rpc = Pick<Api, 'rpc'>;

// As funções do banco não têm valor padrão: todo argumento vai, mesmo nulo.
export function criaConvite(api: Rpc, c: { mandato: string; nome: string; email?: string | null; papel: Papel }): Promise<ConviteCriado> {
  return api.rpc<ConviteCriado>('convite_criar', { p_mandato: c.mandato, p_nome: c.nome, p_email: c.email || null, p_papel: c.papel });
}

export function previaConvite(api: Rpc, token: string): Promise<Previa> {
  return api.rpc<Previa>('convite_previa', { p_token: token });
}

// Sem nome (quem já tem sessão), o banco usa o nome da conta.
export function aceitaConvite(api: Rpc, token: string, nome?: string | null): Promise<Aceite> {
  return api.rpc<Aceite>('convite_aceitar', { p_token: token, p_nome: nome || null });
}

export async function cancelaConvite(api: Rpc, id: string): Promise<void> {
  await api.rpc('convite_cancelar', { p_id: id });
}

export async function convitesPendentes(api: Rpc, mandato: string): Promise<ConvitePendente[]> {
  return (await api.rpc<ConvitePendente[] | null>('convites_pendentes', { p_mandato: mandato })) ?? [];
}

export async function equipeDoMandato(api: Rpc, mandato: string): Promise<PessoaEquipe[]> {
  return (await api.rpc<PessoaEquipe[] | null>('equipe_do_mandato', { p_mandato: mandato })) ?? [];
}

export async function trocaPapel(api: Rpc, mandato: string, user: string, papel: Papel): Promise<void> {
  await api.rpc('membro_trocar_papel', { p_mandato: mandato, p_user: user, p_papel: papel });
}

export async function removeMembro(api: Rpc, mandato: string, user: string): Promise<void> {
  await api.rpc('membro_remover', { p_mandato: mandato, p_user: user });
}

export async function saiDoMandato(api: Rpc, mandato: string): Promise<void> {
  await api.rpc('membro_sair', { p_mandato: mandato });
}

export async function catalogoExercicios(api: Rpc): Promise<ExercicioCatalogo[]> {
  return (await api.rpc<ExercicioCatalogo[] | null>('catalogo_exercicios')) ?? [];
}

// Os 10 eventos mais recentes do histórico da equipe (a RLS só devolve linhas a membros do mandato).
export async function lerEventosEquipe(api: Pick<Api, 'ler'>, mandato: string): Promise<EventoEquipe[]> {
  const caminho = `eventos_equipe?select=id,criado_em,ator_nome,tipo,alvo_nome,papel`
    + `&mandato_id=eq.${encodeURIComponent(mandato)}&order=criado_em.desc,id.desc&limit=10`;
  return (await api.ler<EventoEquipe[] | null>(caminho)) ?? [];
}
