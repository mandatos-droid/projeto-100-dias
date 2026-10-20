export type Cand = {
  s: string; // sequencial TSE
  n: string; // número
  u: string; // nome de urna
  c: string; // nome civil
  p: string; // partido
  f: string; // federação
  v: number; // votos nominais
  x: number; // % dos votos válidos do cargo na UF
  e: 0 | 1;  // eleito
  t: string; // situação
};
export type Casa = { cargo: string; vagas: number; cands: Cand[]; atualizado: string; aviso: string };
export type CasaChave = 'estadual' | 'federal' | 'senado';
export type UFData = {
  uf: string;
  nome: string;
  cadeiras: Record<string, Record<string, number>>;
} & Record<CasaChave, Casa>;

export type PartidoVotos = [string, number][];
export type MunCand = [string, string, number, string, 0 | 1]; // nome, partido, votos, sq, eleito
export type Bloco = { v: number; p: PartidoVotos; c?: MunCand[] };
export type Mun = {
  nm: string;
  presidente?: Bloco; governador?: Bloco; senador?: Bloco; federal?: Bloco; estadual?: Bloco;
  m24?: {
    pref: { v: number; p: PartidoVotos; cands: MunCand[] };
    ver: { v: number; p: PartidoVotos; eleitos: [string, string, number, string][]; el: Record<string, number> };
  };
};
export type MunUF = { atualizado: string | null; mun: Record<string, Mun> };
export type GeoUF = { w: number; h: number; mun: { id: string; nm: string; d: string }[] };
export type UFIdx = { uf: string; nome: string; cadeiras: Record<string, number>; vagas: Record<CasaChave, number> };
export type Nacional = Record<'federal' | 'senado' | 'estadual' | 'prefeitos' | 'vereadores', Record<string, number>>;

export type Status = 'aliado' | 'concorrente' | 'neutro';
export type Relacao = {
  status: Status; nome: string; partido: string; cargo: string; uf: string; mun?: string; votos?: number;
};
export type Pleito = {
  id: string; ano: number; cargo: string; uf: string; municipio?: string; partido: string; numero?: string;
  votos: number; pct?: number; situacao: string; obs?: string;
};
export type Mandato = {
  id: string;
  nomeCivil: string;
  nomeParlamentar: string;
  cargo: string;
  uf: string;        // sigla, ex.: "GO"
  municipio: string; // código IBGE (cdi) ou ''
  partido: string;
  sq2026: string;    // sequencial TSE do candidato vinculado (2026)
  criadoEm: string;
  dados: {
    respostas: Record<string, string>;      // mesmas chaves do Guia: m1.q1 … m1.q6
    relacoes: Record<string, Relacao>;      // aliado / concorrente por pessoa
    visitas: Record<string, boolean>;       // módulos abertos
  };
};

/** Parlamentar eleito (public/data/eleitos.json, gerado por scripts/build_eleitos.py). */
export type Eleito = {
  s: string; u: string; c: string; p: string; uf: string;
  k: 'f' | 'e' | 's';            // Câmara, Assembleia/CLDF, Senado
  v: number; x: number;          // votos e % dos válidos (0 para senadores eleitos em 2022)
  g: 'M' | 'F';
  r: 'B' | 'P' | 'N' | 'A' | 'I' | '';
  m: 'r' | 'o' | 'n' | '?';      // reeleito · veio de outro cargo · primeiro mandato · não avaliado (senadores de 2022)
  a: 2026 | 2022;                // ano da eleição
};

/** Expectativas do eleitorado (pergunta m1.q7): promessas e grupos sociais ligados a municípios. Fica em D.eleitorado. */
export type TipoEl = 'promessa' | 'apoio' | 'potencial';
export type ItemEl = { id: string; tipo: TipoEl; texto: string; muns: string[] }; // muns vazio = estado inteiro
export type Eleitorado = { itens: ItemEl[] };

/** Conjuntura social do território (pergunta m1.q8): problemas e potencialidades por agenda temática e nível. Fica em D.social. */
export type NivelSoc = 'BR' | 'UF' | 'MUN';
export type TipoSoc = 'problema' | 'potencialidade';
export type ItemSoc = {
  id: string; nivel: NivelSoc; tipo: TipoSoc; agenda: string; texto: string;
  uf: string;          // UF do registro (vazio no nível nacional)
  alvos: string[];     // siglas (nível UF) ou códigos IBGE (nível MUN); vazio no nacional
  nomes: string[];     // nomes dos alvos, guardados para a lista não depender do mapa carregado
};
export type ConjSocial = { itens: ItemSoc[] };

/** Registro da Conjuntura partidária (pergunta m1.q5): fica em D.conj2, no mesmo JSON do mandato.
 *  Mandatos antigos podem trazer `foros`/`foroExtra` (setoriais, removidos da tela): são ignorados. */
export type TagMun = 'base' | 'expansao' | 'risco';
export type EsferaExec = 'pres' | 'gov' | 'pref';
export type PosExec = 'governo' | 'base' | 'oposicao' | 'independente';
export type Conj2 = {
  muns: Record<string, { tag: TagMun; nota: string }>;
  posicao?: Partial<Record<EsferaExec, PosExec>>; // escolha da equipe; sem ela vale a sugestão pela coligação
  relacao: string;
  relacaoPq: string;
  desafios: string[];
  oportunidades: string[];
};

/** Filiados (public/data/filiados, gerado por scripts/build_filiados.py a partir do TSE).
 *  Cada partido: [total, [masc, fem], [faixas etárias], [escolaridade]] (categorias em ilhas/Conjuntura.tsx). */
export type FilAcum = [number, number[], number[], number[]];
export type FiliadosUF = { ref: string; geracao: string; uf: Record<string, FilAcum>; mun: Record<string, Record<string, FilAcum>> };
export type FiliadosBR = { ref: string; geracao: string; br: Record<string, FilAcum>; uf: Record<string, Record<string, FilAcum>> };

/** Executivo (public/data/exec, gerado por scripts/build_executivo.py): eleito e coligação da eleição.
 *  `pend` = 2º turno ainda sem resultado (os candidatos que disputam). */
export type RegExec = { n: string; p: string; c: string[] };
export type ExecEleito = RegExec | { pend: RegExec[] } | null;
export type ExecUF = { gov: ExecEleito; pref: Record<string, RegExec> };
export type ExecBR = { ref: string; pres: ExecEleito };
