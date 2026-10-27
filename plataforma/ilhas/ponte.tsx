'use client';
import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Conj2, ConjSocial, Eleitorado, Pleito, Relacao, Status } from '@/lib/types';
import Persona from './Persona';
import Assentos from './Assentos';
import Conjuntura from './Conjuntura';
import Municipio from './Municipio';
import EleitoradoIlha, { EleitoradoResumo } from './Eleitorado';
import SocialIlha, { SocialResumo } from './Social';
import { Ficha } from './Equipe';
import Rotinas from './equipe/Rotinas';
import Entrega from './equipe/Entrega';
import Bandeiras from './rumo/Bandeiras';
import Espacos from './rumo/Espacos';
import Legado from './rumo/Legado';
import Preditores from './rumo/Preditores';
import Metas from './rumo/Metas';
import Plano from './rumo/Plano';
import PlanoResumo from './rumo/PlanoResumo';
import Feedback from './rumo/Feedback';
import NovoCiclo from './rumo/NovoCiclo';
import Comissoes from './capital/Comissoes';
import Matriz from './capital/Matriz';
import Organograma from './equipe/Organograma';
import Escalacao from './equipe/Escalacao';
import { AssentosResumo, ConjunturaResumo, MunicipioResumo } from './Resumos';

/* ---------- acesso ao estado do Guia original (globais D e Store) ---------- */
type Legado = {
  D: {
    campos: Record<string, string>; relacoes: Record<string, Relacao>; tse: Record<string, unknown>;
    /* pleitos lançados à mão (anos anteriores, outros cargos) */
    pleitos?: Pleito[];
    /* escolhas feitas nos mapas, guardadas para o Resumo repetir a mesma visão */
    munSel?: string | null;
    casaSel?: string;
    escopoSel?: string; // 'BR' ou sigla da UF
    conj2?: Conj2;      // conjuntura partidária (pergunta m1.q5)
    eleitorado?: Eleitorado;
    social?: ConjSocial;
    /* Missão 3: estado estruturado e listas do Guia (formato em lib/rumo.ts) */
    rumo?: unknown; metas?: unknown; preditores?: unknown; comissoesDesejadas?: unknown;
    /* Missão 4: comissões escolhidas e ações dos 100 dias (formato do Guia, lib/capital.ts) */
    comissoes?: unknown; acoes?: unknown; comissoesM3?: unknown; // comissoesM3: nomes de comissoesDesejadas já importados para a Missão 4
    /* Missão 5: conversas de feedback (formato em lib/feedback.ts; o antigo pessoa/lider/data/pontos/encam também vale) */
    feedbacks?: unknown;
  };
  Store: { mandato: Record<string, string>; salvar(): void; atualizar(c: Record<string, unknown>): Promise<void> };
  aviso(t: string): void;
};
const L = () => window as unknown as Legado;

export const mandato = () => L().Store.mandato;
export const dadosGuia = () => L().D;
export const aviso = (t: string) => L().aviso(t);

export function salva() {
  L().Store.salvar();
}

/** Força nova renderização da ilha depois de uma mudança no estado do Guia. */
export function useLegado() {
  const [, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((x) => x + 1);
    window.addEventListener('guia:mudou', f);
    return () => window.removeEventListener('guia:mudou', f);
  }, []);
  const bump = () => {
    salva();
    window.dispatchEvent(new Event('guia:mudou'));
  };
  return { D: dadosGuia(), m: mandato(), bump };
}

export function statusDe(key: string): Status {
  return dadosGuia().relacoes[key]?.status ?? 'neutro';
}

export function marca(key: string, rel: Omit<Relacao, 'status'>, atual: Status, novo: Status) {
  const d = dadosGuia();
  const alvo = atual === novo ? 'neutro' : novo;
  if (alvo === 'neutro') delete d.relacoes[key];
  else d.relacoes[key] = { ...rel, status: alvo };
  salva();
  window.dispatchEvent(new Event('guia:mudou'));
}

export function atualizaMandato(c: Record<string, unknown>) {
  return L().Store.atualizar(c);
}

/* ---------- montagem das ilhas ---------- */
const ILHAS: Record<string, () => React.ReactElement> = {
  'persona-tse': () => <Persona />,
  assentos: () => <Assentos />,
  calor: () => <Conjuntura />,
  municipio: () => <Municipio />,
  eleitorado: () => <EleitoradoIlha />,
  'eleitorado-resumo': () => <EleitoradoResumo />,
  social: () => <SocialIlha />,
  'social-resumo': () => <SocialResumo />,
  'assentos-resumo': () => <AssentosResumo />,
  'calor-resumo': () => <ConjunturaResumo />,
  'municipio-resumo': () => <MunicipioResumo />,
  'equipe-escalacao': () => <Escalacao />,
  organograma: () => <Organograma />,
  rotinas: () => <Rotinas />,
  entrega: () => <Entrega />,
  'rumo-bandeiras': () => <Bandeiras />,
  'rumo-espacos': () => <Espacos />,
  'rumo-legado': () => <Legado />,
  'rumo-preditores': () => <Preditores />,
  'rumo-metas': () => <Metas />,
  'rumo-feedback': () => <Feedback />,
  'rumo-novociclo': () => <NovoCiclo />,
  plano: () => <Plano />,
  'plano-resumo': () => <PlanoResumo />,
  'capital-comissoes': () => <Comissoes />,
  'capital-acoes': () => <Matriz />,
};
const raizes = new Set<Root>();

export function instalaIlhas() {
  (window as unknown as { Ilhas: unknown }).Ilhas = {
    ligar(raiz: HTMLElement) {
      const antigas = [...raizes];
      raizes.clear();
      setTimeout(() => antigas.forEach((r) => r.unmount()), 0);
      raiz.querySelectorAll<HTMLElement>('[data-ilha]').forEach((el) => {
        const nome = el.dataset.ilha ?? '';
        const f = nome.startsWith('ficha-') ? () => <Ficha i={Number(nome.slice(6))} /> : ILHAS[nome];
        if (!f) return;
        const r = createRoot(el);
        raizes.add(r);
        r.render(f());
      });
    },
  };
}
