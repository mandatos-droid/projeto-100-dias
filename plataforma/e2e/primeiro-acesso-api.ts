import type { Page } from '@playwright/test';
import { mocaMandato, type EstadoMandato } from './mandato-api';
import { rpcs, type Chamada } from './convite-api';

/* Apoio dos e2e de /primeiro-acesso. Estende mandato-api.ts (que estende convite-api.ts): as leituras de `perfis` e
   `equipe_legisla` e a função `perfil_salvar` vêm prontas a partir de `EstadoPerfil`. Toda chamada ao Supabase é
   interceptada; requisição sem mapa é abortada e registrada em `naoMapeadas()`. /guia e /mandato viram páginas vazias
   (só provam a navegação); /convite também, para o teste não depender da página do convite. */

export interface EstadoPerfil extends EstadoMandato {
  /** A pessoa já tem linha em `perfis` (padrão: não). Vira true depois de um `perfil_salvar` ok. */
  temPerfil?: boolean;
  /** A pessoa está em `equipe_legisla` (padrão: não). */
  legisla?: boolean;
  /** Falha de `perfis` ou `equipe_legisla` na leitura (para provar que falha de consulta não abre o formulário). */
  perfilLeitura?: 'rede' | 'servidor';
  /** Resposta de `perfil_salvar` (padrão: {ok:true}). Recebe os argumentos p_*. */
  salvar?: (args: Record<string, unknown>) => { status?: number; corpo?: unknown; rede?: boolean };
}

/** Dados de um formulário válido, nos mesmos campos de `perfil_salvar`. */
export const PERFIL_VALIDO = {
  p_nome: 'Carlos Lima', p_nascimento: '1990-05-17', p_genero: 'homem_cis', p_raca: 'parda',
  p_telefone: '11987654321', p_atua: true, p_tempo: '3_5',
};

/** Páginas de destino viram stubs: a página só precisa provar que a navegação chegou lá. */
export async function stubDestinos(page: Page) {
  await page.route((u) => ['localhost', '127.0.0.1'].includes(u.hostname) && ['/mandato', '/convite'].includes(u.pathname), (rota) =>
    rota.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: '<!doctype html><title>destino</title><h1>Destino aberto</h1>' }));
}

export async function mocaPerfil(page: Page, estado: EstadoPerfil = {}) {
  let temPerfil = estado.temPerfil ?? false;
  await mocaMandato(page, {
    ...estado,
    rpc: {
      perfil_salvar: (args) => {
        const r = estado.salvar?.(args) ?? { corpo: { ok: true } };
        if (!r.rede && !r.status && (r.corpo as { ok?: boolean } | undefined)?.ok) temPerfil = true;
        return r;
      },
      ...estado.rpc,
    },
    ler: {
      equipe_legisla: () => (estado.perfilLeitura === 'rede' ? { rede: true } : estado.perfilLeitura === 'servidor' ? { status: 500, corpo: { message: 'boom' } }
        : { corpo: estado.legisla ? [{ user_id: 'uid-carlos' }] : [] }),
      perfis: () => (estado.perfilLeitura === 'rede' ? { rede: true } : estado.perfilLeitura === 'servidor' ? { status: 500, corpo: { message: 'boom' } }
        : { corpo: temPerfil ? [{ user_id: 'uid-carlos' }] : [] }),
      ...estado.ler,
    },
  });
  await stubDestinos(page);
}

/** Argumentos da chamada `perfil_salvar` (corpo do POST). */
export const argumentosSalvar = (c: Chamada) => c.corpo as Record<string, unknown>;
export const salvamentos = () => rpcs('perfil_salvar');
