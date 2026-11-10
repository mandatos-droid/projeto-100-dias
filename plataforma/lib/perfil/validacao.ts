import { partesBrasilia } from '../admin/escala.ts';
import { GENEROS, RACAS, TEMPOS } from './opcoes.ts';
import type { Opcao } from './opcoes.ts';

// Textos literais da spec (PAG-02.8 a 02.11).
export const ERRO_VAZIO = 'Preencha todos os campos e aceite o tratamento dos dados para continuar.';
export const ERRO_NOME = 'Informe seu nome completo.';
export const ERRO_NASCIMENTO = 'Informe uma data de nascimento válida.';
export const ERRO_TELEFONE = 'Informe um telefone com DDD.';

export type Campo = 'nome' | 'nascimento' | 'genero' | 'raca' | 'telefone' | 'atua' | 'tempo' | 'consentimento' | 'sensiveis';

// O que o formulário entrega: textos dos campos, 'sim' ou 'nao' na atuação, a caixa geral de
// consentimento e a caixa específica dos dados sensíveis.
export interface CamposPerfil {
  nome?: string | null; nascimento?: string | null; genero?: string | null; raca?: string | null;
  telefone?: string | null; atua?: string | null; tempo?: string | null;
  consentimento?: boolean | null; sensiveis?: boolean | null;
}

// Pronto para perfil_salvar: nome aparado, telefone só com dígitos, "Não" sem tempo.
export interface DadosPerfil {
  nome: string; nascimento: string; genero: string; raca: string; telefone: string; atua: boolean; tempo: string | null;
}

export type ResultadoPerfil = { ok: true; dados: DadosPerfil } | { ok: false; erro: string; campo: Campo };

// Mesmas regras de perfil_salvar.
const TELEFONE = /^(1[1-9]|[2-9][0-9])[0-9]{8,9}$/;
const DUAS_PALAVRAS = /\S+\s+\S+/;
const naLista = (lista: readonly Opcao[], v: string) => lista.some((o) => o.chave === v);
const doisDigitos = (n: number) => String(n).padStart(2, '0');

// Data real (YYYY-MM-DD do campo de data), de 1900-01-01 até hoje no fuso de Brasília.
function dataValida(texto: string, agora: Date): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return false;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return false;
  const h = partesBrasilia(agora);
  return texto >= '1900-01-01' && texto <= `${h.ano}-${doisDigitos(h.mes)}-${doisDigitos(h.dia)}`;
}

export function validaPerfil(c: CamposPerfil, agora: Date = new Date()): ResultadoPerfil {
  const nome = (c.nome ?? '').trim();
  const nascimento = (c.nascimento ?? '').trim();
  const genero = c.genero ?? '';
  const raca = c.raca ?? '';
  const telefoneDigitado = (c.telefone ?? '').trim();
  const atua = c.atua === 'sim' ? true : c.atua === 'nao' ? false : null;
  const tempo = c.tempo ?? '';

  // PAG-02.8: destaca o primeiro campo vazio, na ordem do formulário; o tempo só conta com "Sim"
  const faltando: [Campo, boolean][] = [
    ['nome', !nome], ['nascimento', !nascimento], ['genero', !naLista(GENEROS, genero)], ['raca', !naLista(RACAS, raca)],
    ['telefone', !telefoneDigitado], ['atua', atua === null], ['tempo', atua === true && !naLista(TEMPOS, tempo)],
    ['consentimento', !c.consentimento], ['sensiveis', !c.sensiveis],
  ];
  const vazio = faltando.find(([, falta]) => falta);
  if (vazio) return { ok: false, erro: ERRO_VAZIO, campo: vazio[0] };

  const tamanho = [...nome].length;
  if (tamanho < 2 || tamanho > 120 || !DUAS_PALAVRAS.test(nome)) return { ok: false, erro: ERRO_NOME, campo: 'nome' };
  if (!dataValida(nascimento, agora)) return { ok: false, erro: ERRO_NASCIMENTO, campo: 'nascimento' };
  // a tela aceita parênteses, espaço e hífen; grava só os dígitos
  const telefone = telefoneDigitado.replace(/[()\s-]/g, '');
  if (!TELEFONE.test(telefone)) return { ok: false, erro: ERRO_TELEFONE, campo: 'telefone' };

  return { ok: true, dados: { nome, nascimento, genero, raca, telefone, atua: atua === true, tempo: atua ? tempo : null } };
}
