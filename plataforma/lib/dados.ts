import type { Eleito, ExecBR, ExecUF, FiliadosBR, FiliadosUF, GeoUF, Nacional, MunUF, UFData, UFIdx } from './types';

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
export type Hist = Record<string, Record<string, { v: number; p: [string, number][] }>>;
export const carregaHist = (uf: string) => carrega<Hist>(`/data/hist/${uf.toLowerCase()}.json`);
/** Filiados por partido e município (TSE, mensal) e quem ocupa o Executivo, com a coligação da eleição. */
export const carregaFiliadosUF = (uf: string) => carrega<FiliadosUF>(`/data/filiados/${uf.toLowerCase()}.json`);
export const carregaFiliadosBR = () => carrega<FiliadosBR>('/data/filiados/br.json');
export const carregaExecUF = (uf: string) => carrega<ExecUF>(`/data/exec/${uf.toLowerCase()}.json`);
export const carregaExecBR = () => carrega<ExecBR>('/data/exec/br.json');
