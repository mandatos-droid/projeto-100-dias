import { NextRequest, NextResponse } from 'next/server';
import { LIMITE_BUSCAS_POR_HORA, Limitador, buscaNoticias, trataClipping } from '../../../lib/clipping.ts';

// Busca de notícias do clipping (Missão 4). Exige login do Supabase, limita a 10 buscas por hora por mandato
// e devolve só título, veículo, data e link. O limite vive na memória do servidor (reinicia no deploy).
export const dynamic = 'force-dynamic';

const URL_SB = process.env.SUPABASE_URL || 'https://fldmekrexvzchynnmeuq.supabase.co';
// a chave "anon" é pública (já vai ao navegador em nucleo.js); o acesso real é decidido pelo token do usuário
const CHAVE_SB = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZG1la3JleHZ6Y2h5bm5tZXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxODAwNDMsImV4cCI6MjEwNzc1NjA0M30.voyLYw8vq_pM-_XwSdxZmGjrqKilfB0pl1hYhvFUuL4';
const limitador = new Limitador(LIMITE_BUSCAS_POR_HORA, 3600000);

const cab = (token: string) => ({ apikey: CHAVE_SB, Authorization: `Bearer ${token}` });

async function usuario(token: string): Promise<string | null> {
  const r = await fetch(`${URL_SB}/auth/v1/user`, { headers: cab(token), cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const u = await r.json();
  return typeof u?.id === 'string' ? u.id : null;
}

async function membro(token: string, mandatoId: string, uid: string): Promise<boolean> {
  const q = `mandato_id=eq.${encodeURIComponent(mandatoId)}&user_id=eq.${encodeURIComponent(uid)}&select=user_id&limit=1`;
  const r = await fetch(`${URL_SB}/rest/v1/membros?${q}`, { headers: cab(token), cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!r.ok) return false;
  const l = await r.json();
  return Array.isArray(l) && l.length > 0;
}

export async function POST(req: NextRequest) {
  let corpo: unknown = null;
  try { corpo = await req.json(); } catch { /* corpo inválido vira 400 nas regras */ }
  const r = await trataClipping(req.headers.get('authorization'), corpo, { usuario, membro, busca: buscaNoticias, limitador });
  return NextResponse.json(r.corpo, { status: r.status });
}
