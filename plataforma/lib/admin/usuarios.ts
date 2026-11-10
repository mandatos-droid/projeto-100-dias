// Aba Usuários do /admin: estado da lista na URL, rótulos e paginação (funções puras).
// Os dados vêm de public.admin_usuarios e public.admin_usuario_detalhe (20261110120000_admin_usuarios.sql).
import { rotuloPapel, type Papel } from '../convites/papeis.ts';
import { ATUACOES, GENEROS, RACAS, type Opcao } from '../perfil/opcoes.ts';
import { partesBrasilia } from './escala.ts';

export const TAMANHO_PAGINA = 25;
export const BUSCA_MAX = 100;

export type FiltroPapel = 'todos' | Papel | 'legisla';
export const FILTROS_PAPEL: readonly { valor: FiltroPapel; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'coordenacao', rotulo: 'Coordenação' },
  { valor: 'assessoria', rotulo: 'Assessoria' },
  { valor: 'leitura', rotulo: 'Somente leitura' },
  { valor: 'legisla', rotulo: 'Equipe Legisla' },
];

// Estado da lista. Na URL: q, papel, mandato, sem_perfil=1, pagina (só o que difere do padrão).
export interface Consulta { q: string; papel: FiltroPapel; mandato: string; semPerfil: boolean; pagina: number }
export const CONSULTA_PADRAO: Consulta = { q: '', papel: 'todos', mandato: '', semPerfil: false, pagina: 1 };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ehFiltroPapel = (p: string | null): p is FiltroPapel => FILTROS_PAPEL.some((f) => f.valor === p);

// Valor inválido volta ao padrão: página que não é inteiro positivo vira 1, papel desconhecido vira "todos",
// mandato que não é uuid fica vazio; a busca é cortada em 100 caracteres.
export function lerConsulta(params: URLSearchParams | string): Consulta {
  const p = typeof params === 'string' ? new URLSearchParams(params) : params;
  const papel = p.get('papel');
  const mandato = p.get('mandato') ?? '';
  const pagina = p.get('pagina') ?? '';
  return {
    q: (p.get('q') ?? '').slice(0, BUSCA_MAX),
    papel: ehFiltroPapel(papel) ? papel : 'todos',
    mandato: UUID.test(mandato) ? mandato : '',
    semPerfil: p.get('sem_perfil') === '1',
    pagina: /^[0-9]+$/.test(pagina) && Number(pagina) >= 1 ? Number(pagina) : 1,
  };
}

// Query string sem "?", só com o que difere do padrão.
export function montaConsulta(c: Consulta): string {
  const p = new URLSearchParams();
  if (c.q) p.set('q', c.q.slice(0, BUSCA_MAX));
  if (c.papel !== 'todos') p.set('papel', c.papel);
  if (c.mandato) p.set('mandato', c.mandato);
  if (c.semPerfil) p.set('sem_perfil', '1');
  if (c.pagina > 1) p.set('pagina', String(c.pagina));
  return p.toString();
}

export const temFiltro = (c: Consulta): boolean => !!c.q || c.papel !== 'todos' || !!c.mandato || c.semPerfil;

// Argumentos de public.admin_usuarios para a página pedida.
export function argumentosLista(c: Consulta) {
  return {
    p_busca: c.q.trim() ? c.q.slice(0, BUSCA_MAX) : null,
    p_papel: c.papel === 'todos' ? null : c.papel,
    p_mandato: c.mandato || null,
    p_sem_perfil: c.semPerfil,
    p_limite: TAMANHO_PAGINA,
    p_offset: (c.pagina - 1) * TAMANHO_PAGINA,
  };
}

// ---------- rótulos ----------

const FUSO = 'America/Sao_Paulo';
const fmtHora = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dois = (n: number) => String(n).padStart(2, '0');

// Data de um instante em Brasília: dd/mm/aaaa.
export function rotuloData(iso: string): string {
  const { ano, mes, dia } = partesBrasilia(iso);
  return `${dois(dia)}/${dois(mes)}/${ano}`;
}

// Último login em Brasília (dd/mm/aaaa hh:mm); sem login, "Nunca".
export function rotuloUltimoAcesso(iso: string | null): string {
  if (!iso) return 'Nunca';
  const p = Object.fromEntries(fmtHora.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${rotuloData(iso)} ${p.hour}:${p.minute}`;
}

const rotuloDePapel = (p: string) => (['coordenacao', 'assessoria', 'leitura'].includes(p) ? rotuloPapel(p as Papel) : p);

// Mandato na linha da lista: "Parlamentar · Papel", com "(arquivado)" quando for o caso.
export function rotuloMandato(m: { nome: string | null; papel: string; arquivado: boolean }): string {
  return `${m.nome ?? 'Sem nome'} · ${rotuloDePapel(m.papel)}${m.arquivado ? ' (arquivado)' : ''}`;
}

// Marca da pessoa na lista: "Sem perfil", o papel na equipe Legisla ou nada.
export function marcaPessoa(l: { sem_perfil: boolean; equipe_papel: string | null }): string | null {
  if (l.equipe_papel) return `Equipe Legisla · ${l.equipe_papel}`;
  if (l.sem_perfil) return 'Sem perfil';
  return null;
}

export interface PerfilDetalhe {
  nome: string; nascimento: string; genero: string; raca: string; telefone: string; atua: boolean; tempo: string | null
}

const rotuloDe = (lista: readonly Opcao[], chave: string | null) => lista.find((o) => o.chave === chave)?.rotulo ?? chave ?? '—';

// Telefone só com dígitos (DDD + 8 ou 9 dígitos) para (DD) NNNNN-NNNN ou (DD) NNNN-NNNN; outro formato fica como está.
export function rotuloTelefone(t: string): string {
  const m = /^(\d{2})(\d{4,5})(\d{4})$/.exec(t);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : t;
}

// Perfil do detalhe em texto, com os rótulos do primeiro acesso. Nascimento é data sem hora: só reordena.
export function rotulosPerfil(p: PerfilDetalhe) {
  return {
    nome: p.nome,
    nascimento: p.nascimento.slice(0, 10).split('-').reverse().join('/'),
    genero: rotuloDe(GENEROS, p.genero),
    raca: rotuloDe(RACAS, p.raca),
    telefone: rotuloTelefone(p.telefone),
    atua: p.atua ? 'Sim' : 'Não',
    tempo: p.atua ? rotuloDe(ATUACOES, p.tempo) : '—',
  };
}

// ---------- paginação ----------

// Intervalo mostrado ("primeiro–ultimo de total") e número de páginas de 25. Página fora do intervalo vai ao limite.
export function paginas(total: number, pagina: number): { primeiro: number; ultimo: number; paginas: number; pagina: number } {
  const n = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));
  const p = Math.min(Math.max(1, Math.floor(pagina) || 1), n);
  if (total <= 0) return { primeiro: 0, ultimo: 0, paginas: 1, pagina: 1 };
  return { primeiro: (p - 1) * TAMANHO_PAGINA + 1, ultimo: Math.min(p * TAMANHO_PAGINA, total), paginas: n, pagina: p };
}
