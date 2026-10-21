import type { Eleito, ExecBR, ExecUF, FiliadosBR, FiliadosUF, GeoUF, Nacional, MunCand, MunUF, UFData, UFIdx } from './types';

const cache = new Map<string, Promise<unknown>>();
function carrega<T>(url: string): Promise<T> {
  let p = cache.get(url) as Promise<T> | undefined;
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Falha ao carregar ${url}`);
      return r.json();
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

export const carregaUF = (uf: string) => carrega<UFData>(`/data/uf/${uf.toLowerCase()}.json`);
export const carregaMun = (uf: string) => carrega<MunUF>(`/data/mun/${uf.toLowerCase()}.json`);
export const carregaGeo = (uf: string) => carrega<GeoUF>(`/geo/${uf.toLowerCase()}.json`);
export const carregaUFs = () => carrega<UFIdx[]>('/data/ufs.json');
export const carregaNacional = () => carrega<Nacional>('/data/nacional.json');
export const carregaEleitos = () => carrega<Eleito[]>('/data/eleitos.json');
export const carregaMapaBR = () => carrega<{ w: number; h: number; uf: { id: string; d: string; cx: number; cy: number }[] }>('/geo/br.json');
/** Votos por partido em 2022 (presidente a deputado) e 2020 (prefeito, vereador), por município. */
export type HistBloco = { v: number; p: [string, number][]; c?: MunCand[] }; // c: 6 mais votados (só 2022)
export type Hist = Record<string, Record<string, HistBloco>>;
export const carregaHist = (uf: string) => carrega<Hist>(`/data/hist/${uf.toLowerCase()}.json`);
/** Pleitos anteriores por sequencial TSE da candidatura atual (2026, ou 2024 para eleitos municipais), cruzados pelo título eleitoral. */
export type PleitoTSE = [number, string, string, string, string, string, number, number, string]; // ano, cargo, uf, município, partido, número, votos, % nominais, situação
export const carregaPleitos = (uf: string) => carrega<Record<string, PleitoTSE[]>>(`/data/pleitos/${uf.toLowerCase()}.json`);
/** Filiados por partido e município (TSE, mensal) e quem ocupa o Executivo, com a coligação da eleição. */
export const carregaFiliadosUF = (uf: string) => carrega<FiliadosUF>(`/data/filiados/${uf.toLowerCase()}.json`);
export const carregaFiliadosBR = () => carrega<FiliadosBR>('/data/filiados/br.json');
export const carregaExecUF = (uf: string) => carrega<ExecUF>(`/data/exec/${uf.toLowerCase()}.json`);
export const carregaExecBR = () => carrega<ExecBR>('/data/exec/br.json');
