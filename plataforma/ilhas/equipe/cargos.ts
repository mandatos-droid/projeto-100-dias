/* Nomes dos cargos do modelo (CARGOS_EQUIPE, global do Guia legado) e da cadeira de cada índice. */
import { chaveFicha } from '@/lib/equipe';
import { N_BASE, type Campos } from '@/lib/cadeiras';

type Cargo = [string, string, string]; // [cargo, função, escopo esperado]
const modelo = () => (window as unknown as { CARGOS_EQUIPE: Cargo[] }).CARGOS_EQUIPE;

/** os dois especialistas temáticos do modelo; aparecem como "Temático", sem bandeira (a bandeira é da Missão 3) */
export const TEMATICOS = [5, 6];

export const modeloNome = (i: number) => modelo()[i]?.[0] ?? '';
export const modeloFuncao = (i: number) => modelo()[i]?.[1] ?? '';
export const modeloEscopo = (i: number) => modelo()[i]?.[2] ?? '';
export const cargoNome = (c: Campos, i: number) =>
  (c[chaveFicha(i, 'nome_cargo')] ?? '').trim() || (i < N_BASE ? modeloNome(i) : 'Cadeira acrescentada');
