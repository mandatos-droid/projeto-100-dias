import { ATUACOES, GENEROS, RACAS, type Opcao } from '../perfil/opcoes.ts';

/* Aba Minha conta da Área do mandato (AMA-02.8, 02.9): o e-mail da conta e o perfil da própria pessoa (perfis, migration
   20261109120000_perfis.sql), só para leitura, no formato da tela. As chaves de gênero, raça e atuação viram os rótulos do
   formulário do primeiro acesso (lib/perfil/opcoes.ts).
   SPEC_DEVIATION: AMA-02.8 lista a UF entre os campos, mas `perfis` não tem UF.
   Reason: o perfil foi decidido sem UF em 2026-11-09 (20261109120000_perfis.sql); mostrar a UF exigiria coluna e migration
   novas, e esta feature não tem migration. */

/** Linha de `perfis` que a própria pessoa lê (a RLS só devolve a dela). */
export interface Perfil {
  nome: string; nascimento: string; genero: string; raca: string; telefone: string; atua: boolean; tempo: string | null;
}

export interface LinhaConta { rotulo: string; valor: string }

export const CORRIGIR = 'Para corrigir seus dados, escreva para contato@legislabrasil.org';
export const COLUNAS_PERFIL = 'nome,nascimento,genero,raca,telefone,atua,tempo';

/** A leitura da aba: só a linha da própria pessoa. */
export function consultaPerfil(userId: string): string {
  return `perfis?select=${COLUNAS_PERFIL}&user_id=eq.${encodeURIComponent(userId)}`;
}

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA' pelo texto, sem passar por Date (nada de fuso). Fora do formato, vazio. */
export function dataBr(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Telefone gravado só com dígitos (DDD + 8 ou 9): '11987654321' -> '(11) 98765-4321'. Fora disso, como veio. */
export function telefoneBr(digitos: string | null | undefined): string {
  const t = digitos ?? '';
  const m = /^(\d{2})(\d{4,5})(\d{4})$/.exec(t);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : t;
}

// Chave fora da lista aparece como veio, para nada sumir da tela.
const rotulo = (lista: readonly Opcao[], chave: string | null | undefined) => lista.find((o) => o.chave === chave)?.rotulo ?? chave ?? '';

/** "Não atuo na política" ou o tempo de atuação ("3 a 5 anos"), como no formulário do primeiro acesso. */
export function atuacao(atua: boolean, tempo: string | null): string {
  return rotulo(ATUACOES, atua ? tempo : 'nao_atua');
}

/** O que a aba mostra, na ordem da spec. Sem perfil (equipe Legisla), só o e-mail. */
export function linhasDaConta(email: string | null, perfil: Perfil | null): LinhaConta[] {
  const linhas: LinhaConta[] = [{ rotulo: 'E-mail', valor: email ?? '' }];
  if (!perfil) return linhas;
  return [
    ...linhas,
    { rotulo: 'Nome', valor: perfil.nome },
    { rotulo: 'Data de nascimento', valor: dataBr(perfil.nascimento) },
    { rotulo: 'Gênero', valor: rotulo(GENEROS, perfil.genero) },
    { rotulo: 'Raça', valor: rotulo(RACAS, perfil.raca) },
    { rotulo: 'Telefone', valor: telefoneBr(perfil.telefone) },
    { rotulo: 'Atuação política', valor: atuacao(perfil.atua, perfil.tempo) },
  ];
}
