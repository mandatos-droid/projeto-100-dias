/* Missão 5 · textos pedidos pela Alana (sugestões #128 a #131), copiados como ela escreveu.
   Ficam aqui, e não no conteudo.js, porque os textos do Guia são intocáveis (hash em tests/legado-m5.test.ts). */

/** #129: explicação do exercício de monitoramento (3 parágrafos). */
export const MONIT_INTRO: readonly string[] = [
  'O monitoramento do planejamento serve para o mandato acompanhar as vitórias e os desafios que justificam os resultados parciais de cada meta.',
  'O exercício proposto passa por duas etapas. Para cumprir a primeira você deve clicar na caixa abaixo, retornar ao planejamento e registrar quanto vocês caminharam este mês no atingimento da meta. Lembre-se que o percentual corresponde ao todo, e não ao mês!',
  'Depois de registrar os avanços em cada meta, volte para esta tela e aponte em formato de resumo o caminho percorrido.',
];

/** #128: rótulo da caixa única de cada meta e as perguntas que orientam o registro. */
export const MONIT_ROTULO = 'Registre o detalhamento de como esta Meta caminhou ao longo deste mês.';
export const MONIT_APOIO = 'Responda as perguntas a seguir para um bom registro:';
export const MONIT_PERGUNTAS: readonly string[] = [
  'O que deu certo e o que deu errado para que a meta tivesse tal resultado parcial?',
  'Quais foram as novas oportunidades políticas que surgiram ao longo do mês, por conta dos esforços para cumprimento da meta?',
];

/** #131: botão da aba Planejamento. */
export const BOTAO_MONIT = 'Registrar detalhes sobre o atingimento das metas no Monitoramento';

/** #130: orientação do feedback, antes da árvore do organograma. A anotação "Pedro Salvar orientação…" que abre a sugestão não faz parte do texto. */
export const FEEDBACK_ORIENTACAO: readonly string[] = [
  'Os registros a seguir devem ser realizados pela Chefia de Gabinete. As únicas pessoas que podem acessar o resumo a seguir são a liderança parlamentar e a chefia de Gabinete.',
  'Após a realização de cada ciclo de feedback estruturado as lideranças devem fazer a devolutiva para a Chefia de Gabinete sobre como cada conversa com seus liderados se deu.',
  'Abaixo você terá a oportunidade de preencher 4 informações sobre cada feedback realizado: Data; 2 Pontos de Destaque positivo que foram trazidos pela liderança ou que foram apontados pelo liderado; 2 Pontos de ajuste apresentados pela liderança para melhoria do desempenho do liderado; Resumo do plano de ação proposto pela liderança para seu liderado conseguir resultados mais aderentes com o que o mandato espera.',
  'Desse modo, a Chefia de Gabinete consegue acompanhar de modo sistemático todos os ciclos e tomar decisões sobre a governança do mandato e sobre a gestão de pessoas com base em evidências e de modo humanizado também.',
];

/** Aviso curto de acesso, perto do mapa. É só texto: nada é bloqueado. */
export const FEEDBACK_AVISO = 'Acesso restrito: só a liderança parlamentar e a Chefia de Gabinete veem estes registros.';
