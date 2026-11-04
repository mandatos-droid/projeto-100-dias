/* Missão 2 · tabela de equipe em ordem obrigatória (função pura sobre D.campos).
   Cada linha é uma cadeira ativa (m2.on); os seis valores moram nas chaves de sempre (m2.f{n}, m2.p{n}.*),
   mais `esc`, `comp` e `cat`, novas. Ler não altera nada; operar devolve um Patch. */
import { CHAVE_ON, CHEFIA, MAX_CADEIRAS, N_BASE, SEM_AREA, SEP, aplica, ativas, chaveArq, coordDe, liderDe, nomeDe, nomeLimpo, remove, type Campos, type Patch } from './cadeiras.ts';
import { CAMPOS_FICHA, chaveFicha, lista } from './equipe.ts';

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

/* ---------- migração do modelo de 20 cadeiras ---------- */
/** Escopo: o texto novo (`esc`) ou, no formato antigo, os chips de `escopo` seguidos do texto livre `espec`, separados por "; ". */
export function escopoTexto(c: Campos, i: number): string {
  const novo = valor(c, i, 'esc');
  if (novo !== '') return novo;
  return [...lista(c[chaveFicha(i, 'escopo')]), (c[chaveFicha(i, 'espec')] ?? '').trim()].filter((t) => t.trim() !== '').join('; ');
}

/** Competências comportamentais: o valor novo ou, se vazio, as habilidades de destaque do formato antigo (hab_dest) juntadas com ", ". */
export function competenciasTexto(c: Campos, i: number): string {
  const novo = valor(c, i, 'comp');
  return novo !== '' ? novo : lista(c[chaveFicha(i, 'hab_dest')]).join(', ');
}

/** Categoria sugerida para a cadeira do formato antigo: a 0 é Chefia; quem lidera alguém é Coordenação; o resto, Executora. */
export function categoriaPadrao(c: Campos, i: number): Categoria {
  if (i === CHEFIA) return 'Chefia';
  return ativas(c).some((j) => j !== i && liderDe(c, j) === i) ? 'Coordenação' : 'Executora';
}

/** Mandato do modelo antigo: sem `m2.n` e com alguma cadeira ativa que tem nome ou ficha. */
export const migrada = (c: Campos): boolean =>
  c['m2.n'] === undefined && ativas(c).some((i) => nomeDe(c, i) !== '' || CAMPOS_FICHA.some((k) => (c[chaveFicha(i, k)] ?? '').trim() !== ''));

/** Patch que passa o mandato migrado para o formato da tabela: grava m2.n e, em cada linha, escopo, competências, cargo (do modelo,
 *  se `cargoModelo` o der), categoria, área e liderança explícitos, só onde ainda estão vazios. Nada do formato antigo é apagado.
 *  Sem efeito (patch vazio) em mandato que já usa a tabela. */
export function materializa(c: Campos, cargoModelo: (i: number) => string = () => ''): Patch {
  if (!migrada(c)) return {};
  const patch: Patch = { 'm2.n': String(ativas(c).length) };
  linhas(c).forEach((l) => {
    (['esc', 'comp', 'cat', 'area'] as const).forEach((col) => {
      if (valor(c, l.i, col) === '' && l[col] !== '') patch[chaveCelula(l.i, col)] = l[col];
    });
    if (valor(c, l.i, 'cargo') === '') {
      const m = cargoModelo(l.i).trim();
      if (m !== '') patch[chaveCelula(l.i, 'cargo')] = m;
    }
    if ((c[chaveFicha(l.i, 'lider')] ?? '') === '') {
      const p = liderDe(c, l.i);
      patch[chaveFicha(l.i, 'lider')] = p === null ? '-' : String(p);
    }
  });
  return patch;
}

/** Uma linha por cadeira ativa, em ordem. Em mandato migrado, o que falta (escopo, categoria, área) vem do formato antigo. */
export function linhas(c: Campos): Linha[] {
  const antigo = migrada(c);
  return ativas(c).map((i) => {
    const v = Object.fromEntries(COLUNAS.map((x) => [x.id, valor(c, i, x.id)])) as Record<ColunaId, string>;
    if (antigo) {
      v.esc = escopoTexto(c, i);
      v.comp = competenciasTexto(c, i);
      if (v.cat === '') v.cat = categoriaPadrao(c, i);
      if (v.area === '') v.area = coordDe(c, i);
    }
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

/* ---------- liderança derivada (regra D8) ---------- */
const cat = (c: Campos, i: number) => valor(c, i, 'cat');
const area = (c: Campos, i: number) => valor(c, i, 'area');

/** Recalcula m2.p{n}.lider de todas as linhas com categoria e área: Chefia = topo ("-"); Coordenação responde à Chefia;
 *  Especialista e Executora respondem à Coordenação da própria área, ou à Chefia se a área não tem. Sem Chefia, fica no topo.
 *  Com mais de uma, vale a de menor índice. Devolve só o que difere do gravado. */
export function recalculaLideres(c: Campos): Patch {
  const on = ativas(c);
  const chefia = on.find((i) => cat(c, i) === 'Chefia');
  const patch: Patch = {};
  on.forEach((i) => {
    if (cat(c, i) === '' || area(c, i) === '') return;
    const coord = on.find((j) => j !== i && cat(c, j) === 'Coordenação' && area(c, j) === area(c, i));
    const alvo = cat(c, i) === 'Chefia' ? null
      : cat(c, i) === 'Coordenação' ? (chefia ?? null)
        : (coord ?? chefia ?? null);
    const v = alvo === null || alvo === i ? '-' : String(alvo);
    if ((c[chaveFicha(i, 'lider')] ?? '') !== v) patch[chaveFicha(i, 'lider')] = v;
  });
  return patch;
}

/** Grava a célula; ao mudar categoria ou área, junta no mesmo patch a liderança recalculada de todas as linhas. */
export function editaCelula(c: Campos, i: number, col: ColunaId, v: string): Patch {
  const patch: Patch = { [chaveCelula(i, col)]: v.trim() };
  if (col !== 'cat' && col !== 'area') return patch;
  const copia = { ...c };
  aplica(copia, patch);
  return { ...patch, ...recalculaLideres(copia) };
}

/** Avisos do organograma gerado. Sem linhas com categoria, não há o que avisar. */
export function avisosOrg(c: Campos): string[] {
  const on = ativas(c).filter((i) => cat(c, i) !== '');
  const avisos: string[] = [];
  const chefias = on.filter((i) => cat(c, i) === 'Chefia');
  if (on.length && chefias.length === 0) avisos.push('Defina a chefia');
  if (chefias.length > 1) avisos.push('Mais de uma chefia: todas aparecem no topo do organograma');
  const semCoord = new Set(on
    .filter((i) => ['Especialista', 'Executora'].includes(cat(c, i)) && area(c, i) !== '' && area(c, i) !== SEM_AREA)
    .map((i) => area(c, i))
    .filter((a) => !on.some((j) => cat(c, j) === 'Coordenação' && area(c, j) === a)));
  semCoord.forEach((a) => avisos.push(`Área sem coordenação: ${a}`));
  return avisos;
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

/** O mandato já como a tabela o mostra: em mandato migrado, uma cópia com os valores derivados gravados (materializa); senão, o próprio `c`.
 *  Não altera `c`. Serve para desenhar organograma e PDF sem gravar nada. */
export function vistaDaTabela(c: Campos, cargoModelo?: (i: number) => string): Campos {
  if (!migrada(c)) return c;
  const v = { ...c };
  aplica(v, materializa(c, cargoModelo));
  return v;
}

/** Há organograma a desenhar: ao menos uma linha com cargo, categoria e área. */
export const organogramaGerado = (c: Campos): boolean => linhas(c).some((l) => l.cat !== '' && l.area !== '' && l.cargo !== '');
