/* Missão 2 · tabela de equipe em ordem obrigatória (função pura sobre D.campos).
   Cada linha é uma cadeira ativa (m2.on); os seis valores moram nas chaves de sempre (m2.f{n}, m2.p{n}.*),
   mais `esc`, `comp` e `cat`, novas. Ler não altera nada; operar devolve um Patch. */
import { CHAVE_ON, CHEFIA, MAX_CADEIRAS, N_BASE, SEP, aplica, ativas, chaveArq, nomeDe, nomeLimpo, remove, type Campos, type Patch } from './cadeiras.ts';
import { CAMPOS_FICHA, chaveFicha } from './equipe.ts';

export type ColunaId = 'esc' | 'comp' | 'cargo' | 'pessoa' | 'cat' | 'area';
export const COLUNAS: { id: ColunaId; rotulo: string; dica: string }[] = [
  { id: 'esc', rotulo: 'Escopo', dica: 'O trabalho que essa pessoa vai fazer' },
  { id: 'comp', rotulo: 'Competências comportamentais', dica: 'Como essa pessoa precisa agir para fazer esse trabalho' },
  { id: 'cargo', rotulo: 'Nome do cargo', dica: 'O nome do cargo que reúne esse trabalho' },
  { id: 'pessoa', rotulo: 'Nome da pessoa', dica: 'Quem ocupa o cargo; escreva * se ainda não há pessoa (processo seletivo)' },
  { id: 'cat', rotulo: 'Categoria', dica: 'Chefia, Coordenação, Especialista ou Executora' },
  { id: 'area', rotulo: 'Área', dica: 'A área do mandato a que o cargo pertence' },
];

export const CATEGORIAS = ['Chefia', 'Coordenação', 'Especialista', 'Executora'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** chave de uma coluna da cadeira i (m2.f{n} para a pessoa; m2.p{n}.{campo} para as demais) */
export const chaveCelula = (i: number, col: ColunaId): string =>
  col === 'pessoa' ? `m2.f${i + 1}` : `m2.p${i + 1}.${{ esc: 'esc', comp: 'comp', cargo: 'nome_cargo', cat: 'cat', area: 'coord' }[col]}`;

export type Linha = {
  i: number;
  esc: string; comp: string; cargo: string; pessoa: string; cat: string; area: string;
  /** a pessoa foi escrita como "*": vaga a abrir por processo seletivo */
  processoSeletivo: boolean;
  completa: boolean;
};

const valor = (c: Campos, i: number, col: ColunaId): string =>
  col === 'pessoa' ? nomeDe(c, i) : (c[chaveCelula(i, col)] ?? '').trim();

export const completa = (l: Pick<Linha, ColunaId>): boolean => COLUNAS.every((x) => l[x.id].trim() !== '');

/** Uma linha por cadeira ativa, em ordem. */
export function linhas(c: Campos): Linha[] {
  return ativas(c).map((i) => {
    const v = Object.fromEntries(COLUNAS.map((x) => [x.id, valor(c, i, x.id)])) as Record<ColunaId, string>;
    return { i, ...v, processoSeletivo: v.pessoa.includes('*'), completa: completa(v) };
  });
}

/** A coluna só libera quando todas as anteriores estão preenchidas; senão devolve o rótulo da primeira que falta. */
export function colunaLiberada(l: Pick<Linha, ColunaId>, col: ColunaId): { ok: boolean; falta?: string } {
  for (const x of COLUNAS) {
    if (x.id === col) return { ok: true };
    if (l[x.id].trim() === '') return { ok: false, falta: x.rotulo };
  }
  return { ok: true };
}

/** "X de N linhas completas" */
export function contagemCompletas(c: Campos): { completas: number; total: number } {
  const ls = linhas(c);
  return { completas: ls.filter((l) => l.completa).length, total: ls.length };
}

/* ---------- quantidade de pessoas ---------- */
const grava = (ids: number[]) => [...new Set(ids)].sort((a, b) => a - b).join(SEP);
const NOVAS: ColunaId[] = ['esc', 'comp', 'cat'];

/** Linha sem nada escrito: nem as seis colunas, nem os campos da ficha antiga. */
const vazia = (c: Campos, i: number): boolean =>
  COLUNAS.every((x) => valor(c, i, x.id) === '') && CAMPOS_FICHA.every((k) => (c[chaveFicha(i, k)] ?? '').trim() === '');

/** Define quantas pessoas (linhas) o mandato tem, contando a Chefia. Aceita 1 a 40.
 *  Aumentar cria linhas de índice 20+, sem área nem liderança. Diminuir tira primeiro as linhas vazias; se não bastarem,
 *  `confirma` traz os nomes das preenchidas que sairiam e `patch` só deve ser aplicado depois da confirmação.
 *  `remove` lista os índices das linhas que o patch tira. A Chefia nunca sai. */
export function defineN(c: Campos, n: number | string): { patch: Patch; remove?: number[]; confirma?: string[]; erro?: string } {
  const q = typeof n === 'string' ? (/^\s*\d+\s*$/.test(n) ? Number(n) : NaN) : n;
  if (!Number.isInteger(q) || q < 1 || q > MAX_CADEIRAS) return { patch: {}, erro: `Informe de 1 a ${MAX_CADEIRAS} pessoas.` };
  const on = ativas(c);
  const patch: Patch = { 'm2.n': String(q) };
  if (q === on.length) return { patch };

  if (q > on.length) {
    const novos: number[] = [];
    for (let i = N_BASE; on.length + novos.length < q; i++) if (!on.includes(i)) novos.push(i);
    patch[CHAVE_ON] = grava([...on, ...novos]);
    return { patch };
  }

  const candidatas = on.filter((i) => i !== CHEFIA).sort((a, b) => b - a);
  const saem = [...candidatas.filter((i) => vazia(c, i)), ...candidatas.filter((i) => !vazia(c, i))].slice(0, on.length - q);
  const copia: Campos = { ...c, [CHAVE_ON]: grava(on) };
  saem.forEach((i) => {
    const p = remove(copia, i).patch;
    NOVAS.forEach((col) => { p[chaveCelula(i, col)] = ''; });
    if (!vazia(copia, i)) { // guarda também os campos novos na cópia da cadeira retirada
      const arq = p[chaveArq(i)] ? JSON.parse(p[chaveArq(i)]) : { nome: nomeDe(copia, i), ficha: {} };
      NOVAS.forEach((col) => { if (valor(copia, i, col) !== '') arq.ficha[col] = valor(copia, i, col); });
      p[chaveArq(i)] = JSON.stringify(arq);
    }
    Object.assign(patch, p);
    aplica(copia, p);
  });
  const preenchidas = saem.filter((i) => !vazia(c, i));
  const nomes = preenchidas.map((i) => nomeLimpo(c, i) || valor(c, i, 'cargo') || `Linha ${on.indexOf(i) + 1}`);
  return preenchidas.length ? { patch, remove: saem, confirma: nomes } : { patch, remove: saem };
}
