// Aba Usuários, escrita: funções puras que alimentam os diálogos do detalhe da pessoa.
// As gravações são as RPCs de 20261110130000_admin_usuarios_crud.sql (perfil, e-mail, exclusão) e as que o
// painel já tinha (admin_membro_*, admin_equipe_*).
import { ERRO_NASCIMENTO, ERRO_NOME, ERRO_TELEFONE, ERRO_VAZIO } from '../perfil/validacao.ts';
import type { CamposPerfil, DadosPerfil } from '../perfil/validacao.ts';
import type { PerfilDetalhe } from './usuarios.ts';

export const ERRO_SEM_PERFIL = 'Esta pessoa ainda não preencheu o perfil.';
export const ERRO_SALVAR_PERFIL = 'Não foi possível salvar o perfil. Tente de novo.';

// Perfil gravado -> campos do formulário (texto), prontos para o validaPerfil.
export function camposDoPerfil(p: PerfilDetalhe): CamposPerfil {
  return {
    nome: p.nome,
    nascimento: p.nascimento.slice(0, 10),
    genero: p.genero,
    raca: p.raca,
    telefone: p.telefone,
    atua: p.atua ? 'sim' : 'nao',
    tempo: p.tempo,
    // o admin edita dado que a pessoa já consentiu: as duas caixas do primeiro acesso não se aplicam
    consentimento: true,
    sensiveis: true,
  };
}

// Argumentos de admin_usuario_perfil_salvar.
export function argumentosPerfil(user: string, d: DadosPerfil) {
  return {
    p_user: user, p_nome: d.nome, p_nascimento: d.nascimento, p_genero: d.genero, p_raca: d.raca,
    p_telefone: d.telefone, p_atua: d.atua, p_tempo: d.tempo,
  };
}

// Erro de campo devolvido pelo banco ({ok:false, erro:<campo>}) -> mensagem da tela.
const POR_CAMPO: Record<string, string> = {
  nome: ERRO_NOME, nascimento: ERRO_NASCIMENTO, telefone: ERRO_TELEFONE,
  genero: ERRO_VAZIO, raca: ERRO_VAZIO, atua: ERRO_VAZIO, tempo: ERRO_VAZIO, sem_perfil: ERRO_SEM_PERFIL,
};
export const mensagemPerfil = (codigo: string | undefined): string => (codigo && POR_CAMPO[codigo]) || ERRO_SALVAR_PERFIL;

// Confirmação da exclusão: o e-mail digitado é o da conta, sem caixa e sem espaços nas pontas
// (o banco compara do mesmo jeito). Conta sem e-mail não tem o que digitar: confirma com texto vazio.
export function confereEmail(digitado: string, email: string | null): boolean {
  return digitado.trim().toLowerCase() === (email ?? '').trim().toLowerCase();
}

// Papéis que as funções admin_membro_* aceitam. Quem já está com outro (leitura, de convites antigos) mantém
// o valor atual na lista, para o seletor não mostrar um papel que não é o real.
export const PAPEIS_MANDATO = ['assessoria', 'coordenacao'] as const;
export function opcoesPapelMandato(atual: string): string[] {
  return (PAPEIS_MANDATO as readonly string[]).includes(atual) ? [...PAPEIS_MANDATO] : [atual, ...PAPEIS_MANDATO];
}

// Mandatos que a pessoa ainda não integra, para o seletor de "Adicionar a um mandato".
export interface OpcaoMandato { id: string; nome_parlamentar: string | null; arquivado_em: string | null }
export function mandatosDisponiveis(todos: readonly OpcaoMandato[], daPessoa: readonly { id: string }[]): OpcaoMandato[] {
  const ja = new Set(daPessoa.map((m) => m.id));
  return todos.filter((m) => !ja.has(m.id));
}
