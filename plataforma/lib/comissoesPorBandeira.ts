/* Missão 4 · ligação bandeira → comissões da Câmara dos Deputados (siglas de public/data/comissoes/br.json).
   Tabela feita à mão: a API da Câmara não informa o tema de cada comissão. tests/comissoesPorBandeira.test.ts
   confere cada sigla contra o br.json. Chave = id da taxonomia em lib/bandeiras.ts. */

export const BANDEIRA_COMISSAO: Record<string, string[]> = {
  'seguranca': ['CSPCCO'],
  'educacao': ['CE'],
  'agricultura': ['CAPADR'],
  'saude': ['CSAUDE'],
  'direitos-humanos': ['CDHMIR'],
  'desenvolvimento-economico': ['CDE'],
  'cultura': ['CCULT'],
  'clima': ['CMADS'],
  'mulheres': ['CMULHER'],
  'equidade-racial': ['CDHMIR'],
  'trabalho': ['CTRAB'],
  'modernizacao': ['CASP'],
  'industria': ['CICS'],
  'esportes': ['CESPO'],
  'ciencia': ['CCTI'],
  'lazer': ['CTUR'],
  'mineracao': ['CME'],
  'assistencia': ['CPASF'],
  'lgbtqiap': ['CDHMIR'],
};
