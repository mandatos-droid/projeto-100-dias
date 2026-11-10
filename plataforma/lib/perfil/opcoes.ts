// Opções do perfil do primeiro acesso: chave gravada no banco (perfis) e rótulo da spec (PAG-02.4 a 02.6).
// As chaves repetem os check de 20261109120000_perfis.sql. Sem UF: a spec decidiu o perfil sem UF.
export interface Opcao { chave: string; rotulo: string }

export const GENEROS: readonly Opcao[] = [
  { chave: 'mulher_cis', rotulo: 'Mulher cisgênero' },
  { chave: 'homem_cis', rotulo: 'Homem cisgênero' },
  { chave: 'mulher_trans', rotulo: 'Mulher transgênero' },
  { chave: 'homem_trans', rotulo: 'Homem transgênero' },
  { chave: 'travesti', rotulo: 'Travesti' },
  { chave: 'nao_binaria', rotulo: 'Pessoa não binária' },
  { chave: 'outra', rotulo: 'Outra identidade' },
  { chave: 'nao_informar', rotulo: 'Prefiro não informar' },
];

export const RACAS: readonly Opcao[] = [
  { chave: 'branca', rotulo: 'Branca' },
  { chave: 'preta', rotulo: 'Preta' },
  { chave: 'parda', rotulo: 'Parda' },
  { chave: 'amarela', rotulo: 'Amarela' },
  { chave: 'indigena', rotulo: 'Indígena' },
  { chave: 'nao_informar', rotulo: 'Prefiro não informar' },
];

// Atuação política: quem responde "Não" fica em nao_atua; quem responde "Sim" escolhe um dos TEMPOS.
export const ATUACOES: readonly Opcao[] = [
  { chave: 'nao_atua', rotulo: 'Não atuo na política' },
  { chave: 'menos_1', rotulo: 'Menos de 1 ano' },
  { chave: '1_2', rotulo: '1 a 2 anos' },
  { chave: '3_5', rotulo: '3 a 5 anos' },
  { chave: '6_10', rotulo: '6 a 10 anos' },
  { chave: 'mais_10', rotulo: 'Mais de 10 anos' },
];

export const TEMPOS: readonly Opcao[] = ATUACOES.filter((a) => a.chave !== 'nao_atua');
