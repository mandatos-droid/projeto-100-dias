import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

// Votos de UMA candidatura em cada município (2026). O TSE não libera CORS e o arquivo local só guarda os
// 6 mais votados por município, então o servidor consulta os JSONs municipais do TSE e guarda o resultado em disco.
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const BASE = 'https://resultados.tse.jus.br/oficial/ele2026/6259/dados';
const CARGO: Record<string, (uf: string) => number> = { senado: () => 5, federal: () => 6, estadual: (uf) => (uf === 'df' ? 8 : 7) };
const TTL = 30 * 60 * 1000;
// Na Vercel só /tmp é gravável; local usa .cache-api/
const PASTA = process.env.VERCEL ? path.join(tmpdir(), 'cache-api') : path.join(process.cwd(), '.cache-api');
const emCurso = new Map<string, Promise<Resp>>();

type Resp = { atualizado: string; mun: Record<string, [number, number]> };

async function municipio(uf: string, cd: string, cargo: number, sq: string): Promise<[number, number] | null> {
  const url = `${BASE}/${uf}/${uf}${cd}-c${String(cargo).padStart(4, '0')}-e006259-u.json`;
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      const d = JSON.parse((await r.text()).replace(/^﻿/, ''));
      let votos = 0;
      for (const agr of d.carg?.[0]?.agr ?? [])
        for (const par of agr.par ?? [])
          for (const c of par.cand ?? []) if (c.sqcand === sq) votos = Number(c.vap) || 0;
      return [votos, Number(d.v?.vv) || 0];
    } catch {
      await new Promise((ok) => setTimeout(ok, 700 * (t + 1)));
    }
  }
  return null;
}

async function calcula(uf: string, casa: string, sq: string): Promise<Resp> {
  const cds: Record<string, Record<string, string>> = JSON.parse(
    await readFile(path.join(process.cwd(), 'public/data/cdmun.json'), 'utf-8'));
  const lista = Object.entries(cds[uf] ?? {});
  const cargo = CARGO[casa](uf);
  const mun: Resp['mun'] = {};
  let i = 0;
  await Promise.all(Array.from({ length: 16 }, async () => {
    while (i < lista.length) {
      const [cdi, cd] = lista[i++];
      const r = await municipio(uf, cd, cargo, sq);
      if (r) mun[cdi] = r;
    }
  }));
  return { atualizado: new Date().toISOString(), mun };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const uf = (p.get('uf') ?? '').toLowerCase(), casa = p.get('casa') ?? '', sq = p.get('sq') ?? '';
  if (!/^[a-z]{2}$/.test(uf) || !CARGO[casa] || !/^\d{6,20}$/.test(sq))
    return NextResponse.json({ erro: 'parâmetros inválidos' }, { status: 400 });

  const chave = `${uf}-${casa}-${sq}`, arq = path.join(PASTA, `${chave}.json`);
  try {
    if (Date.now() - (await stat(arq)).mtimeMs < TTL) return NextResponse.json(JSON.parse(await readFile(arq, 'utf-8')));
  } catch { /* sem cache */ }

  let job = emCurso.get(chave);
  if (!job) {
    job = calcula(uf, casa, sq).then(async (r) => {
      if (Object.keys(r.mun).length > 0) {
        // cache é só otimização: falha de gravação nunca derruba a resposta
        try { await mkdir(PASTA, { recursive: true }); await writeFile(arq, JSON.stringify(r)); } catch { /* sem cache */ }
      }
      return r;
    }).finally(() => emCurso.delete(chave));
    emCurso.set(chave, job);
  }
  try {
    const r = await job;
    if (Object.keys(r.mun).length === 0) return NextResponse.json({ erro: 'TSE indisponível' }, { status: 502 });
    return NextResponse.json(r);
  } catch {
    return NextResponse.json({ erro: 'falha na coleta' }, { status: 502 });
  }
}
