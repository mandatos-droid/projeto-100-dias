/* Missão 2 · recomendação de cargos a partir das bandeiras do mandato.
   Função pura: recebe os ids das bandeiras em ordem de prioridade e devolve, para cada um dos 20 cargos de
   CARGOS_EQUIPE (índice 0-based, mesma ordem de lib/equipe.ts PADRAO), se ele é recomendado e por quê.
   Recomenda CARGOS e perfis, nunca pessoas (o Guia manda partir da competência, não do relacionamento). */
import { bandeiraDe, MAX_BANDEIRAS } from './bandeiras';
import { lista, SEP } from './equipe';

/* guardadas em D.campos (string), então seguem o mesmo salvamento, nuvem e painel do resto do Guia */
export const CHAVE_AREAS = 'm2.areas';                 // ids em ordem de prioridade, separados por SEP
export const CHAVE_APLICADAS = 'm2.areas_aplicadas';   // cópia das áreas na última vez que a recomendação foi aplicada
export const areasDe = (c: Record<string, string>, chave = CHAVE_AREAS) =>
  lista(c[chave]).filter((a) => bandeiraDe(a)).slice(0, MAX_BANDEIRAS);
export const junta = (ids: string[]) => ids.join(SEP);

export type Grupo = 'fixo' | 'tematico' | 'ajustavel' | 'opcional';
export type Item = {
  i: number; grupo: Grupo; motivo: string;
  area?: string;   // id da bandeira que originou a recomendação
  espec?: string;  // texto sugerido para "Especificidades do cargo" na ficha de gestão
};
export type Recomendacao = { itens: Item[]; avisos: string[] };

/* o Guia (Missão 2) só liga ao tema o escopo dos especialistas temáticos; o restante é regra estrutural */
const FIXOS: Record<number, string> = {
  0: 'Lidera a estratégia política e as pessoas em qualquer mandato.',
  1: 'Define a estratégia legislativa e coordena a linha legislativa, inclusive os especialistas.',
  2: 'Operacionaliza a atividade legislativa; acompanhe as comissões ligadas às bandeiras.',
  7: 'Define a estratégia de comunicação, que deve ser ligada às prioridades do mandato.',
  8: 'Executa a comunicação digital.',
  9: 'Produz o conteúdo audiovisual.',
  10: 'Registra e traduz a atuação do parlamentar em tempo real.',
  11: 'Define a estratégia de articulação política.',
  12: 'Constrói e mantém relações políticas.',
  17: 'Garante a organização e o funcionamento do gabinete.',
  18: 'Recebe, organiza e encaminha as demandas da sociedade.',
  19: 'Garante o deslocamento seguro e eficiente.',
};
const MOBILIZACAO = [13, 14, 15, 16];
const SEM_BANDEIRA = 'Escolha mais uma bandeira para ativar este especialista.';

const rot = (id: string) => bandeiraDe(id)?.rot ?? id;

export function recomenda(areas: string[]): Recomendacao {
  const ids = areas.filter((a) => bandeiraDe(a));
  const itens: Item[] = [];
  const avisos: string[] = [];

  Object.entries(FIXOS).forEach(([i, motivo]) => itens.push({ i: Number(i), grupo: 'fixo', motivo }));

  [5, 6].forEach((i, n) => {
    const a = ids[n];
    if (!a) { itens.push({ i, grupo: 'opcional', motivo: SEM_BANDEIRA }); return; }
    itens.push({
      i, grupo: 'tematico', area: a,
      motivo: `${rot(a)} é a bandeira ${n + 1}${n === 0 ? ': a que deve ter prioridade na titularidade em comissão' : ''}.`,
      espec: `Bandeira ${n + 1} do mandato: ${rot(a)}. Produz parecer técnico, dados e propostas nesta área, e dialoga com especialistas e organizações do setor.`,
    });
  });

  /* 3ª bandeira: o Guia prevê só 2 especialistas temáticos; cobrimos pelo assessor de políticas públicas */
  const descoberta = ids[2];
  itens.push({
    i: 3, grupo: 'ajustavel', area: descoberta ?? ids[0],
    motivo: descoberta
      ? `Cobre ${rot(descoberta)}, a 3ª bandeira, que fica sem especialista temático.`
      : 'Analisa e fiscaliza políticas públicas; o perfil temático acompanha a bandeira 1.',
    espec: ids.length ? `Perfil temático desejado: ${rot(descoberta ?? ids[0])}.` : undefined,
  });
  itens.push({
    i: 4, grupo: 'ajustavel', area: ids[0],
    motivo: ids.length
      ? 'Identifica destinações de recursos e demandas municipais ligadas às bandeiras.'
      : 'Identifica destinações de recursos e acompanha a execução.',
    espec: ids.length ? `Priorizar demandas de: ${ids.map(rot).join(', ')}.` : undefined,
  });
  MOBILIZACAO.forEach((i) => itens.push({
    i, grupo: 'ajustavel',
    motivo: i === 13
      ? 'Lidera a estratégia territorial. Dimensione pelo território e pela base, não pela bandeira (Missão 4).'
      : 'Reforço territorial. Dimensione pelo tamanho da base (Missão 4); não depende da bandeira.',
  }));

  if (ids.length >= 3) avisos.push(`Só há 2 especialistas temáticos no Guia. ${rot(ids[2])} fica coberta pelo assessor de políticas públicas; se quiser mais um especialista, abra uma vaga extra à mão.`);
  if (ids.length === 0) avisos.push('Escolha de 1 a 3 bandeiras para ativar os cargos temáticos.');
  avisos.push('Recomendamos cargos e competências, não pessoas: cargo sem nome entra como processo seletivo de ampla concorrência (*).');

  return { itens: itens.sort((a, b) => a.i - b.i), avisos };
}
