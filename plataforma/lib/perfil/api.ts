import { ErroApi } from '../admin/api.ts';
import type { Api } from '../admin/api.ts';
import { ERRO_VAZIO, ERRO_NOME, ERRO_NASCIMENTO, ERRO_TELEFONE } from './validacao.ts';
import type { Campo, DadosPerfil } from './validacao.ts';

/* Camada de dados do perfil (migration 20261109120000_perfis.sql). As consultas propagam o ErroApi: falha de
   consulta nunca vira "sem perfil", para não mandar ao formulário quem já tem perfil. */

export const ERRO_SALVAR = 'Não foi possível salvar. Tente de novo.';

export type ResultadoSalvar = { ok: true } | { ok: false; erro: string; campo?: Campo };

type Rpc = Pick<Api, 'rpc'>;
type Ler = Pick<Api, 'ler'>;

// Campo recusado por perfil_salvar -> mensagem da spec. Gênero, raça e atuação fora da lista são, na tela,
// campos sem escolha (PAG-02.8).
const MENSAGEM: Record<string, string> = {
  nome: ERRO_NOME, nascimento: ERRO_NASCIMENTO, telefone: ERRO_TELEFONE,
  genero: ERRO_VAZIO, raca: ERRO_VAZIO, atua: ERRO_VAZIO, tempo: ERRO_VAZIO,
};

export async function perfilSalvar(api: Rpc, d: DadosPerfil): Promise<ResultadoSalvar> {
  let r: { ok: boolean; erro?: string } | null;
  try {
    r = await api.rpc<{ ok: boolean; erro?: string } | null>('perfil_salvar', {
      p_nome: d.nome, p_nascimento: d.nascimento, p_genero: d.genero, p_raca: d.raca,
      p_telefone: d.telefone, p_atua: d.atua, p_tempo: d.tempo,
    });
  } catch (e) {
    // rede ou servidor (PAG-02.13); 401 e as demais recusas seguem para quem chamou (renovação da sessão)
    if (e instanceof ErroApi && (e.status === 0 || e.status >= 500)) return { ok: false, erro: ERRO_SALVAR };
    throw e;
  }
  if (r?.ok) return { ok: true };
  const campo = r?.erro ?? '';
  return MENSAGEM[campo] ? { ok: false, erro: MENSAGEM[campo], campo: campo as Campo } : { ok: false, erro: ERRO_SALVAR };
}

// A RLS de perfis deixa a pessoa ler a própria linha (PAG-03.6).
export async function meuPerfil(api: Ler, userId: string): Promise<boolean> {
  const linhas = await api.ler<{ user_id: string }[] | null>(`perfis?select=user_id&user_id=eq.${encodeURIComponent(userId)}`);
  return (linhas ?? []).length > 0;
}

// Só quem está na equipe enxerga linhas de equipe_legisla; fora dela a consulta volta vazia.
export async function ehEquipeLegisla(api: Ler, userId: string): Promise<boolean> {
  const linhas = await api.ler<{ user_id: string }[] | null>(`equipe_legisla?select=user_id&user_id=eq.${encodeURIComponent(userId)}`);
  return (linhas ?? []).length > 0;
}
