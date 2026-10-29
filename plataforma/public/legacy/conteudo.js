/* =====================================================================
   REGIMENTO EXTERNO · GUIA DOS 100 DIAS — conteúdo
   Fiel ao documento "V1 Regimento Externo 2.0 - GUIA DOS 100 DIAS".
   ===================================================================== */

var SUBTITULO='Planejamento Legisla Brasil de sobrevivência e estratégia política para alavancar seu mandato desde o começo da legislatura';

var INTRO=[
 '<strong>O Guia dos 100 Dias é um presente da Legisla Brasil para você!</strong>',
 'Sendo você parlamentar ou parte da assessoria, esperamos que aproveite todo o potencial deste material prático de sobrevivência para os 100 primeiros dias do mandato nesta Legislatura! Vamos te orientar a superar desafios que vão desde a profunda compreensão do projeto político, passa pela gestão de pessoas e chega à articulação política. Por meio de conteúdo instrucional e atividades autoaplicáveis você será capaz de encontrar e implementar a estratégia política que, desde os primeiros dias da Legislatura, pavimentará o caminho para alcançar os tão sonhados resultados prometidos em campanha, seja este o primeiro mandato ou não!',
 'Seguindo o passo a passo proposto, você desfruta de uma versão resumida da Metodologia Legisla Brasil, que foi pensada para ser facilmente adaptada a diferentes realidades e com alto potencial de alavancar o seu mandato!',
 '<strong>A Legisla Brasil deseja a você uma excelente legislatura!</strong>'
];

var NOTA_PRAZO='Caso o momento ideal já tenha passado, ou caso consigam superá-lo, oriente a implementação do Guia à realidade do Mandato, pois o importante é que passem por todas as Missões!';

var PREDITORES=[
 {id:'p1',n:'Priorizar a agenda',d:'Concentrar recursos, tempo e produção em um conjunto delimitado de temas',q:'A meta organiza o foco temático interno do mandato?'},
 {id:'p2',n:'Pautar os debates',d:'Inserir ou elevar determinado tema na agenda institucional ou pública',q:'A meta gera tração na agenda pública?'},
 {id:'p3',n:'Construir o partido',d:'Fortalecer a estrutura organizacional e política da legenda',q:'A meta amplia ou fortalece a estrutura partidária?'},
 {id:'p4',n:'Protagonizar espaços de decisão',d:'Ocupar ou estruturar posições formais com poder decisório',q:'A meta visa conquistar ou estruturar um espaço de poder decisório?'},
 {id:'p5',n:'Articular e mobilizar para a entrega de resultados',d:'Transformar estratégia e articulação em avanço institucional concreto',q:'A meta visa aprovação, tramitação ou avanço institucional direto?'}
];

var FRAGILIDADES=[
 'Domínio do Regimento Interno da Casa',
 'Compreensão sobre Leis Orçamentárias e Emendas',
 'Compreensão sobre processo legislativo',
 'Compreensão sobre o funcionamento das Comissões Temáticas, rotinas de Plenário',
 'Relação com o Poder Executivo',
 'Relação com órgãos de controle como Tribunal de Contas e Ministério Público',
 'Capacidade de articulação política (relação com outras lideranças políticas)',
 'Capacidade de mobilização social e criação de base de apoio (relação com a população)',
 'Relação sustentável e promissora com o partido',
 'Gestão de demandas dos cidadãos',
 'Comunicação Política',
 'Conhecimento profundo sobre as bandeiras prioritárias do mandato',
 'Montante de recursos disponíveis para uso do mandato e contratação de pessoal',
 'Uso dos Sistemas da Casa Legislativa',
 'Lei Geral de Proteção de Dados Pessoais — LGPD'
];

var ROTINAS=[
 ['Quadrimestralmente','Planejamento estratégico','Todos','2 períodos de 6h'],
 ['Mensalmente','Monitoramento de avanços do trabalho previsto para o mês — acompanhamento de metas','Todos','1h'],
 ['Semanalmente','Alinhamento de atualização coletiva e expectativas do trabalho da semana','Todos','1h'],
 ['Semanalmente','Reunião de distribuição de trabalho dentro de cada área do mandato','Assessores e Coordenação de uma área específica','45 min'],
 ['Semestralmente','Reunião de Feedback estruturado individual','Liderança e Assessores (individualmente)','30 min por reunião']
];

var GRUPOS_EQUIPE=[
 {g:'Chefias',itens:[
  ['Chefia de Gabinete','Lidera a estratégia política e as pessoas'],
  ['Coordenador/a Legislativo','Define a estratégia legislativa'],
  ['Coordenador/a de Comunicação','Define a estratégia de comunicação'],
  ['Coordenador/a de Articulação','Define a estratégia de articulação'],
  ['Líder de Mobilização','Define a estratégia territorial'],
  ['Coordenação Administrativa','Garante a organização e o funcionamento do gabinete']]},
 {g:'Especialistas',itens:[
  ['Especialista Temático','Produz inteligência e posicionamento técnico'],
  ['Assessor de Políticas Públicas','Analisa políticas e fiscaliza o Executivo'],
  ['Assessor de Emenda','Identifica oportunidades e acompanha recursos'],
  ['Assessor/a Legislativo/a','Analisa e operacionaliza a atividade legislativa'],
  ['Assessor/a de Articulação','Constrói e mantém relações políticas']]},
 {g:'Executores',itens:[
  ['Social-media','Executa a comunicação digital'],
  ['Vídeo-maker','Produz conteúdo audiovisual'],
  ['Comunicação em Tempo Real','Registra e traduz a atuação do parlamentar em tempo real'],
  ['Mobilizador/a Territorial','Executa a mobilização no território'],
  ['Assessor de Demandas','Recebe, organiza e encaminha demandas da sociedade'],
  ['Motorista','Garante deslocamento seguro e eficiente']]}
];

var FORMULA_META={
 linha:'VERBO + NÚMERO/PERCENTUAL + ENTREGA CONCRETA + PRAZO/FREQUÊNCIA + PÚBLICO-ALVO/LOCAL + EVIDÊNCIA DE SUCESSO',
 elementos:[
  ['Verbo no infinitivo','O que o mandato fará?','Realizar, aprovar, ampliar, articular'],
  ['Quantidade / proporção','Quanto precisa ser feito?','15%, 3 projetos, 2 vezes/mês'],
  ['Objeto da entrega','O que exatamente será realizado?','discursos, PL, visitas, atendimentos'],
  ['Recorte temporal','Em quanto tempo ou com qual frequência?','até dezembro, mensalmente, quinzenalmente'],
  ['Público-alvo / espaço / atores envolvidos','Para quem ou onde?','plenário, diretório partidário, bairros, cidades, imprensa nacional, professores, apoiadores, lideranças políticas']],
 exemplo:'Ampliar em 30% a participação de estudantes da rede pública em atividades de educação integral, até dezembro de 2027, priorizando territórios de maior vulnerabilidade social, por meio da articulação com a Secretaria Estadual de Educação',
 quebra:[['Verbo','Ampliar'],['Quantidade','30%'],['Entrega','participação em atividades de educação integral'],
  ['Prazo','até dezembro de 2027'],['Público-alvo','territórios vulneráveis'],
  ['Atores envolvidos','por meio da articulação com a Secretaria Estadual de Educação']]
};

var METAS_EXEMPLARES=[
 ['Pautar os debates','Realizar um discurso quinzenal em plenário reforçando o papel da fiscalização do mandato','Frequência definida, espaço institucional claro, objeto claro'],
 ['Articular e mobilizar para a entrega de resultados','Garantir a aprovação de um projeto de lei específico já em tramitação','Resultado binário e verificável (aprovado ou não aprovado), objeto legislativo nomeado'],
 ['Construir o partido','Contribuir para que a corrente política forme chapas em 15% dos diretórios municipais','Métrica quantitativa clara sobre estrutura partidária'],
 ['Priorizar a agenda','Garantir que 25% dos compromissos mensais e 20% dos atendimentos no gabinete sejam feitos em prol da Agenda Climática','Proporção verificável, com periodicidade definida e com agenda prioritária definida'],
 ['Protagonizar espaços de decisão','Exercer protagonismo na frente parlamentar da primeira infância com reconhecimento público em três veículos nacionais como especialista representante da pauta','Resultado de estruturação, verificável por uma quantidade específica de convites da imprensa para representar a pauta']
];

var OBJ_ESPECIFICOS=[
 ['Priorização de agenda','Expandir iniciativas antirracistas por toda região central de Jiripoca'],
 ['Pautar os debates','Ser referência nacional na defesa do fim do trabalho infantil'],
 ['Protagonismo nos espaços de decisão','Articular a Liderança de pelo menos 2 Fóruns Notórios da Casa'],
 ['Construção de partido','Expandir relevância como liderança do partido na Casa Legislativa'],
 ['Articular e mobilizar para a entrega de resultados','Destravar a entrega do Hospital da Universidade Federal de Jiripoca']
];

var CAMPOS_MONIT=[
 ['sucesso','Sucesso previsto para o mês','O avanço que deveria ser alcançado naquele mês em relação a cada sucesso projetado.'],
 ['result','Resultados e evidências','O que foi alcançado e os fatos que comprovam esse avanço.'],
 ['pct','Percentual de atingimento','Quanto da meta já foi alcançada até o momento.'],
 ['desafios','Desafios','Os problemas que dificultaram ou atrasaram o cumprimento da meta.'],
 ['oport','Oportunidades políticas','Situações que podem ajudar a meta a avançar ou ampliar seus resultados.'],
 ['read','Readequações necessárias','Mudanças de prazo ou expectativa necessárias para manter a meta viável.']
];

var BINGOS={
 articulacao:{n:'Articulação política',
  txt:'Articular bem não depende de conhecer muita gente, mas de ser levado em consideração quando as decisões importantes estão sendo tomadas. Isso se constrói com presença, diálogo e relações antes que o mandato precise de um apoio específico.',
  itens:['Sustentar diálogo aberto com a Secretaria-Geral da Mesa ou estrutura equivalente',
   'Reunir-se com a presidência ou a secretaria de uma comissão prioritária',
   'Articular a priorização de uma pauta estratégica para o mandato, para a liderança da bancada ou do bloco',
   'Sustentar canal de diálogo com assessorias de outros mandatos',
   'Identificar uma relatoria estratégica e iniciar a aproximação para ganhá-la',
   'Propor uma coautoria ou ação conjunta com outro mandato',
   'Dialogar com uma instituição ou organização relevantes e relacionadas a uma prioridade do território',
   'Promover um encontro informal com parlamentares para expandir possibilidades de apoiamentos futuros',
   'Articular uma rede de parlamentares para viabilizar o alcance de um resultado concreto'],
  atencao:'Uma ação não deve ser considerada concluída apenas porque aconteceu. Registre o que foi discutido, os compromissos assumidos, a pessoa responsável por dar continuidade aos próximos passos e sustente a estratégia para que os resultados esperados da articulação se concretizem.'},
 mobilizacao:{n:'Mobilização de apoiadores',
  txt:'A base que apoiou a campanha não desaparece com a posse, mas também não se mantém próxima sozinha. É preciso criar oportunidades para que apoiadores, voluntários, lideranças e organizações participem do mandato durante toda a legislatura. Ao mesmo tempo, o mandato deve buscar novos públicos e aproximar pessoas que ainda não conhecem ou não acompanham o seu trabalho.',
  itens:['Organizar uma base de apoiadores e voluntários',
   'Realizar uma roda de conversa sobre uma pauta prioritária',
   'Promover uma visita ao gabinete ou à Casa Legislativa',
   'Realizar uma edição do gabinete itinerante em bairros ou cidades',
   'Abrir um canal para receber ideias, demandas e propostas',
   'Testar uma iniciativa de orçamento ou emenda participativa',
   'Mobilizar voluntários para uma ação concreta',
   'Realizar uma atividade cultural ou formativa ligada a uma pauta',
   'Construir uma ação conjunta com organizações e lideranças',
   'Criar uma campanha de mobilização em torno de uma pauta prioritária do mandato',
   'Criar uma rotina de prestação de contas e devolutiva para apoiadores',
   'Realizar uma ação de escuta com um público que ainda não acompanha o mandato']},
 partido:{n:'Relevância no partido',
  txt:'O partido organiza bancadas, lideranças, posições coletivas e a ocupação de espaços dentro da Casa. Construir relevância partidária não significa apenas assumir um cargo. Também passa por participar das decisões, contribuir com a formulação política e fortalecer a presença da legenda no território.',
  itens:['Apresentar as prioridades do mandato à liderança partidária',
   'Participar de um núcleo, setorial ou grupo temático',
   'Construir uma iniciativa com outros mandatos da legenda',
   'Contribuir para uma posição ou documento partidário',
   'Apoiar uma atividade de formação política',
   'Participar de uma agenda territorial do partido',
   'Assumir uma responsabilidade em um espaço partidário',
   'Aproximar o mandato de diretórios e lideranças locais',
   'Propor uma agenda comum para a bancada'],
  destaque:'Entre os mandatos acompanhados pela Legisla Brasil, quase metade traz ações de fortalecimento partidário em seu planejamento, como aproximação com a direção do partido, formação de lideranças e fortalecimento de núcleos territoriais. Fonte: Playbook GIP, Legisla Brasil.'},
 redes:{n:'Redes sociais e presença pública',
  txt:'Crescer nas redes exige mais do que frequência de postagem. O mandato precisa saber quem deseja alcançar, manter uma rotina de comunicação e acompanhar o que está funcionando. Também significa usar as agendas prioritárias para conquistar espaço fora das redes próprias, inclusive na imprensa. Cada canal tem uma lógica e pode cumprir uma função diferente. Por isso, o mandato deve escolher onde consegue manter uma presença consistente e adequada aos públicos que deseja alcançar.',
  itens:['Definir os públicos prioritários e a função de cada canal',
   'Elaborar um planejamento de conteúdo ligado às prioridades do mandato',
   'Criar uma rotina de alinhamento com a coordenação de comunicação',
   'Mapear jornalistas, veículos, rádios, podcasts e páginas ligados às agendas do mandato',
   'Criar uma rotina de relacionamento e resposta à imprensa',
   'Apresentar pelo menos três agendas à imprensa e emplacar uma matéria ou entrevista em veículo estadual ou nacional',
   'Organizar o WhatsApp oficial e outros canais de contato direto',
   'Criar um fluxo de resposta e encaminhamento de mensagens e comentários',
   'Estruturar o LinkedIn para o posicionamento institucional e temático',
   'Transformar agendas, entregas e atuação no território em conteúdo',
   'Testar um novo canal ou formato adequado ao público que se deseja alcançar',
   'Acompanhar as métricas e revisar mensalmente a estratégia'],
  dica:'O conteúdo não precisa ser replicado da mesma forma em todos os canais. Uma pauta pode virar uma análise no LinkedIn, um vídeo curto no Instagram ou TikTok, uma conversa mais longa no YouTube, uma mensagem no WhatsApp e sugestão de pauta para a imprensa.'}
};

/* ===================== AS CINCO MISSÕES ===================== */
var MISSOES=[
{
 n:1, cor:'#4ABFB2', ct:'#176F66', prazo:15, prazoTxt:'até o 15º dia',
 titulo:'Prepare sua chegada com evidências e conhecimento sobre o projeto político da liderança parlamentar',
 curto:'Prepare sua chegada',
 agenda:['A persona do Parlamentar','A conjuntura política','As oportunidades de atuação','As fragilidades imediatas'],
 abre:'Conheça e estruture bem o terreno antes de começar a caminhar!',
 resumo:'<p>Tomar posse em um mandato sem conhecer profundamente o contexto em que irá atuar é como iniciar uma viagem, rumo ao desconhecido, sem qualquer referencial de mapa, clima ou idioma, e esperar chegar a algum lugar. Por isso, antes mesmo da posse, reserve um tempo para construir um diagnóstico do ambiente social, político e institucional em que seu mandato estará inserido. Na Legisla Brasil, todo processo de planejamento estratégico começa por uma etapa de diagnóstico: antes de decidir para onde ir, é preciso entender de onde se parte. Nessa etapa elaboramos um Mapa Político no qual combinamos dois tipos de levantamento de informação e estudo, um sobre o contexto social, político e institucional em que o mandato vai atuar, e outro sobre as práticas e pessoas que vão compor o próprio gabinete.</p>',
 entrega:['Compreendido profundamente a persona da liderança parlamentar.','Mapeado a conjuntura política que o/a cerca.','Mapeado as oportunidades de ação política do mandato.','Identificado as fragilidades imediatas do mandato a serem superadas.'],
 momento:['Entre os 60 dias antes do início da legislatura e os primeiros 15 dias do exercício do mandato parlamentar, <strong>OU</strong>','Entre o fim do último ciclo de planejamento e início do outro'],
 lidera:['Parlamentar, <strong>OU</strong>','Conselheiro/a político/a do mandato, <strong>OU</strong>','Coordenador/a da campanha, <strong>OU</strong>','Chefia de Gabinete'],
 fecho:'<strong>Com base neste Mapa Político, você tem as informações necessárias para começar a rodar o mandato com intencionalidade e profissionalismo!</strong> Este levantamento de evidências e de autoconhecimento, além de criar o Mapa Político do mandato, vai fundamentar o Projeto Político da liderança parlamentar, que transcende a Legislatura e fundamenta a pertinência de sua atuação política no curto, médio e até longo prazo.',
 exercicios:[
  {id:'m1.persona', t:'A persona', d:'Três perguntas sobre a trajetória, o desempenho eleitoral e o desejo de futuro da liderança parlamentar.',
   tipo:'perguntas',
   intro:'<p>Elencamos as oito perguntas-chave que devem ser respondidas e vão fundamentar a elaboração do Mapa Político do seu mandato.</p><p><strong>Pesquise, reflita, responda-as e agrupe todos os dados em formato de relatório.</strong></p>'+
    '<div class="apoio"><span class="tag">Dica</span>Depois de pronto, apresente o relatório com quem caminha com o mandato, sejam os assessores já pré-selecionados ou para as pessoas de confiança e, se já estiver no segundo momento de aplicação da metodologia, discuta com sua equipe o conteúdo levantado.</div>',
   itens:[
    {k:'m1.q1',t:'Quem é a liderança parlamentar?',d:'<em>Faça um resumo</em> da trajetória pessoal e política da liderança parlamentar até aqui, entenda quem é esta persona e identifique quando e porquê a carreira política começa a fazer sentido em sua trajetória.'},
    {k:'m1.q2',ilha:'persona-tse',t:'Qual foi o seu desempenho eleitoral em todos os pleitos em que já concorreu?',d:'<em>Levante</em> todas as campanhas eleitorais que percorreu, os cargos desejados, a quantidade de votos, a escolha de partido(s) a fim de compreender a história política, as estratégias de campanha, as aproximações e distanciamentos que o/a fizeram chegar ao cargo que conquistou hoje.'},
    {k:'m1.q3',t:'Qual é o desejo da liderança parlamentar para o futuro?',d:'<em>Mapeie</em> quais são os pontos de chegada que a liderança deseja.'}]},

  {id:'m1.conjuntura', t:'A conjuntura', d:'Três perguntas sobre a legislatura, o partido e o território de origem.',
   tipo:'perguntas',
   itens:[
    {k:'m1.q4',ilha:'assentos',t:'Como está posta a legislatura atual?',d:'<em>Identifique</em> quem são os/as parlamentares eleitos(as) nesta legislatura, identifique quais são as potenciais parcerias e os potenciais concorrentes, seja por região, por pauta, por perfil pessoal ou disputa partidária. Quando passarem-se os 100 primeiros dias, será possível analisar também as comissões com titularidade em aberto, os cargos disponíveis em Frentes Parlamentares ou a composição da Mesa Diretora, por exemplo.'},
    {k:'m1.q5',ilha:'calor',t:'Qual é a conjuntura política regional e nacional de seu partido?',d:'<em>Contabilize</em> a quantidade de cargos feitos pelo partido na sua Casa Legislativa e também no território nacional, e em seu domicílio eleitoral. Levante setoriais e diretórios dos quais a liderança parlamentar pode passar a fazer parte e identifique que tipo de relação com o partido deseja ter, apresente os desafios e as oportunidades de expansão da relevância partidária da liderança parlamentar.'},
    {k:'m1.q6',ilha:'municipio',t:'Qual é a conjuntura política do seu estado ou município de origem?',d:'<em>Registre</em> quais são os principais atores políticos do entorno da liderança parlamentar. Leve em consideração os diversos poderes, e monte o cenário político instalado a partir de quem são seus aliados e concorrentes em potencial.'}]},

  {id:'m1.oportunidades', t:'As oportunidades e ameaças', d:'Duas perguntas sobre as expectativas do eleitorado e a conjuntura social do território.',
   tipo:'perguntas',
   itens:[
    {k:'m1.q7',ilha:'eleitorado',t:'Quais são as principais expectativas do eleitorado?',d:'<em>Elenque</em> quais foram os posicionamentos públicos e as promessas mais relevantes da sua campanha. Identifique também as regiões e os grupos sociais que mais apoiaram a candidatura e eleição, e também aqueles com potencial para maior aproximação ao longo dos anos que seguem.'},
    {k:'m1.q8',ilha:'social',t:'Qual é a conjuntura social do território?',d:'<em>Consulte</em> dados públicos oficiais e faça um profundo estudo da conjuntura social do território da liderança parlamentar. Caso esteja atuando a nível nacional, amplie o estudo para alcançar também esta esfera. Identifique quais são os problemas e as potencialidades do território e investigue brechas para sua atuação.'}]},

  {id:'m1.frag', t:'As fragilidades', d:'O que a liderança parlamentar ou a equipe ainda não domina, classificado entre mandato e parlamentar.',
   tipo:'frag',
   intro:'<p><strong>Quais são os conhecimentos e/ou práticas que a liderança parlamentar ou a equipe ainda não domina(m) para um bom exercício do mandato? Coloque um M, para fragilidades da equipe do mandato e um P para as fragilidades da liderança parlamentar.</strong></p><p><em>Mapeie</em> todas as fragilidades a serem superadas.</p>',
   fim:'<p><em>Caso sinta falta de algum outro tema, suba na lista e crie um plano de estudos para ir se familiarizando com os assuntos. Na nossa Biblioteca você encontra informações introdutórias, além de sites de referência sobre os assuntos acima. Recomendamos fortemente o estudo do que ainda não se tem conhecimento em profundidade para potencializar uma melhor atuação política nos meses que seguem!</em></p>'}
 ]
},

{
 n:2, cor:'#EB5454', ct:'#B83636', prazo:30, prazoTxt:'até o 30º dia',
 titulo:'Estruture a gestão de pessoas, com uma equipe que complete as habilidades da liderança parlamentar',
 curto:'Estruture a equipe',
 agenda:['A escalação do time','A elaboração do organograma','A pactuação dos fluxos e rotinas de trabalho'],
 abre:'A equipe é o que faz o projeto político avançar, estagnar ou retroceder.',
 resumo:'<p>Ainda que a liderança parlamentar ocupe a posição central no mandato, as pessoas que o/a cercam são, por vezes, o motivo do avanço, estagnação ou retrocesso de seu projeto político. É importante destacar que o trabalho de assessoria política tem sim suas especificidades, já que as rotinas e entregas são típicas da atividade política, mas ainda assim, é um trabalho. Um dos motivos de frustração e até esgotamento de assessores políticos pode se relacionar à falta de uma boa gestão de pessoas, incertezas sobre cargos e escopos de trabalho, e inexistência de fluxos de trabalho claros. Estas práticas são frequentemente negligenciadas no mundo do trabalho político e devem ser foco da sua atenção, desde já.</p><p>Quando a decisão da distribuição de cargos antecede a análise fria das competências pessoais dos assessores (na esperança de que as relações de confiança ou os compromissos políticos sejam capazes de dar a sustentação necessária às rotinas que a função demanda), há grande risco de rompimento de vínculos e frustrações, devido ao desempenho do trabalho abaixo do que se espera, podendo comprometer todo o restante da equipe e do trabalho que está sendo entregue para a população. Isso não significa que as pessoas não possam compor a equipe em outras áreas.</p>',
 entrega:['Montado uma equipe de sucesso','Elaborado um organograma funcional','Definido fluxos de trabalho e rotinas de comunicação'],
 momento:['Nos primeiros 30 dias do exercício do mandato parlamentar, <strong>OU</strong>','Entre o fim do último ciclo de planejamento e início do outro'],
 lidera:['Parlamentar, <strong>OU</strong>','Chefia de Gabinete','Chefia de Gabinete com Coordenações de área'],
 exercicios:[
  {id:'m2.funcoes', t:'A escalação do time', d:'Preencher cada função com os nomes já mapeados, a partir do escopo de trabalho esperado.',
   tipo:'funcoes',
   intro:'<p>Ao invés de encaixar pessoas em cargos, nossa recomendação é que faça o exercício contrário. A lista a seguir apresenta funções frequentemente encontradas em gabinetes parlamentares e o escopo de trabalho normalmente esperado de cada uma.</p>'+
    '<p><strong>O exercício proposto é preencher o nome das pessoas que já estão mapeadas para fazerem parte da equipe, <u>levando em consideração se dominam a maioria das competências esperadas para seus escopos de trabalho</u>. Caso não tenham pessoas com tais competências, sinalize com um asterisco para abertura de processo seletivo de ampla concorrência.</strong></p>'},

  {id:'m2.gestao', t:'Organograma e rotinas', d:'Escopo de cada cargo, organograma do mandato e rotinas de comunicação pactuadas.',
   tipo:'checklist',
   intro:'<p>Uma vez tendo selecionado o time é preciso, desde o princípio, estabelecer as estratégias de gestão de pessoas. O checklist a seguir servirá de base para o desafio de começar a gerir assessores políticos.</p>'+
    '<h4>1. Definição do escopo de trabalho de cada cargo</h4>'+
    '<p><strong>Objetivo:</strong> estabelecer com clareza as responsabilidades, atribuições e limites de atuação de cada cargo, evitando sobreposições e lacunas na execução das atividades do mandato.</p>'+
    '<p><strong>Importância:</strong> facilitar a distribuição e o cumprimento de tarefas, aumentar a autonomia da equipe e reduzir conflitos, retrabalho e dependência excessiva da liderança parlamentar ou da chefia de gabinete.</p>'+
    '<div class="apoio"><span class="tag">Próximo passo</span>Depois da definição de escopo é preciso compartilhar as expectativas com os assessores, por meio do escopo de trabalho, desde o momento da contratação. Uma vez tendo conhecimento sobre o escopo de trabalho, é possível fazer cobranças e reconhecimento, em cima do que foi combinado previamente.</div>'+
    '<h4>2. Elaboração do organograma do mandato</h4>'+
    '<p><strong>Objetivo:</strong> estruturar visualmente todas as áreas, cargos, níveis de responsabilidade e relações de coordenação do mandato.</p>'+
    '<p><strong>Importância:</strong> garantir clareza sobre a estrutura organizacional, facilitar o conhecimento das expectativas e das responsabilidades de cada assessor(a); apoiar a integração e a identificação da equipe.</p>'+
    '<div class="apoio"><span class="tag">Próximo passo</span>Compartilhar a estrutura do mandato dando conhecimento sobre as hierarquias, as possibilidades de ascensão e as interações entre áreas com toda a equipe. Este passo é fundamental para o senso de pertencimento e de responsabilidade de cada assessor/a.</div>'+
    '<div class="ilha" data-ilha="organograma"></div>'+
    '<h4>3. Estabelecimento dos fluxos de trabalho e rotinas de comunicação entre as equipes</h4>'+
    '<p><strong>Objetivo:</strong> definir quais são os momentos de encontro coletivo e dentro de áreas, apresentar como as demandas devem circular pelo mandato, quem deve ser acionado em cada situação, quais informações precisam ser compartilhadas e quais são as principais rotinas de alinhamento.</p>'+
    '<p><strong>Importância:</strong> criar previsibilidade e integração no trabalho, reduzir ruídos de comunicação e atrasos, melhorar a coordenação entre as áreas e permitir que o mandato funcione de forma menos dependente de orientações individuais do parlamentar.</p>'+
    '<div class="apoio"><span class="tag">Próximo passo</span>Iniciar as rotinas de integração da equipe. As rotinas da tabela a seguir têm sido recomendadas e frequentemente implementadas pelos mandatos parceiros da Legisla.</div>'+
    '<div class="ilha" data-ilha="rotinas"></div>'+
    '<div class="apoio atencao"><span class="tag">Atenção</span>Não é necessário chegar, imediatamente, até o que está previsto na orientação de "próximo passo". Você poderá fazê-lo até o fim dos primeiros 45 dias. O checklist abaixo traz o que deve ser estabelecido antes de partir para a próxima missão.</div>',
   itens:[
    {k:'m2.c1',t:'Escopo de trabalho de cada cargo definido'},
    {k:'m2.c2',t:'Organograma do mandato projetado visualmente'},
    {k:'m2.c3',t:'Fluxos de trabalho e rotinas de comunicação estabelecidos'}]}
 ]
},

{
 n:3, cor:'#571730', corNav:'#E8D9DE', ct:'#571730', prazo:45, prazoTxt:'até o 45º dia',
 titulo:'Defina o rumo do mandato com um planejamento estratégico',
 curto:'Defina o rumo',
 agenda:['O Legado do mandato','Os preditores prioritários de sucesso','As metas dos primeiros 100 dias'],
 abre:'Das bandeiras ao legado, dos preditores às metas dos 100 dias.',
 resumo:'<p>Para alguns, a ideia de elaboração de um planejamento estratégico para um mandato parlamentar pode causar estranhamento, para outros pode soar como uma ferramenta milagrosa, capaz de resolver todos os problemas. Nossa experiência demonstra que, ainda que não haja milagre, a implementação e monitoramento de planejamentos estratégicos contribuem, e muito, tanto para a alavancagem do mandato em exercício quanto para a viabilidade do projeto político da liderança parlamentar!</p><p>Ao longo nos especializamos em oportunizar os meios de implementação de estratégias políticas por meio da orientação de bons planejamentos, feitos sob medida para cada liderança parlamentar. Temos evidências de que a organização do trabalho político dos mandatos em torno de objetivos e metas comuns tornam a transformação de promessas em entregas muito mais consistentes e que ajudam a valorizar o bom e árduo trabalho dos assessores e da própria liderança parlamentar. Mas faz ainda mais do que isto, quando olhamos para as rotinas do gabinete! Os planejamentos alimentam o senso de construção coletiva do grupo e evitam a dispersão de recursos e esforços para longe do que realmente importa e se deseja construir. Começamos pela definição das bandeiras prioritárias do mandato. Depois, seguimos para o desenho do Legado Político. Passamos, então, para a definição do objetivo do ano, e dos seus objetivos específicos. Por fim, chegamos às metas. E é neste caminho que vamos guiar a elaboração do Planejamento Estratégico de vocês!</p><p>Todos os exercícios propostos para o cumprimento da Missão 3 podem ser feitos coletivamente. Recomendamos que o mandato se reúna e tire um tempo de qualidade para elaboração do planejamento. Na Legisla o realizamos ao longo de dois períodos de 6 horas em que a equipe fica imersa e focada na elaboração conjunta da Estratégia.</p>',
 entrega:['Definido o que vão ter alcançado, ao fim de 4 anos','Estabelecido qual é o Objetivo do primeiro ano da legislatura','Identificado quais são os Preditores de Sucesso Parlamentar prioritários para o primeiro ano da legislatura','Estabelecido Metas claras para serem seguidas nos primeiros 100 dias.'],
 momento:['Nos primeiros 45 dias do exercício do mandato parlamentar, <strong>OU</strong>','Entre o fim do último ciclo de planejamento e início do outro'],
 lidera:['<strong>Lidera:</strong> Chefia de Gabinete','<strong>Participam:</strong> Liderança parlamentar e todos os assessores'],
 fecho:'<strong>Chegamos ao fim da Missão 3!</strong> Sim, talvez ela seja a mais desafiadora, mas com grande potencial de direcionar o mandato exatamente para onde deseja caminhar. Transfira os dados do planejamento para uma planilha de fácil acesso por todos os assessores. Além de ser fundamental para o monitoramento do trabalho, ela evita a sobrecarga da liderança em ter que retomar a todo o tempo o que é prioritário e o que é de responsabilidade de cada um. Agora que vocês têm um planejamento é dever da liderança garantir que está sendo cumprido e que o mandato não está se deixando levar pelos incêndios a serem apagados todos os dias. Na Missão 2 nós mencionamos que o que estava posto em "próximos passos" poderiam ser realizados no futuro. Pois bem, o futuro chegou!',
 exercicios:[
  {id:'m3.bandeiras', t:'As bandeiras do mandato', d:'Selecionar até três agendas para o mandato se especializar.',
   tipo:'campos',
   intro:'<p>Quem tenta dar conta de muitas agendas, acaba dispersando esforços e não alcançando reconhecimento coletivo sobre seus feitos, já que são pulverizados. Além disso, esta indefinição de bandeiras prioritárias pode soar como oportunismo, uma vez que a liderança pode soar incoerente ao tentar atuar em todas as agendas, inclusive naquelas cuja legitimidade ou grau de identificação são baixos. Ainda que agentes políticos precisem saber debater temas de todas as esferas e devam ter um repertório amplo para embasar seus votos em plenário, <strong>recomendamos que selecione até 3 agendas para se especializar</strong>. Ainda que pareça difícil abrir mão de uma bandeira, em detrimento da outra, é importante mostrar que os critérios de priorização são aderentes à capacidade do mandato em desempenhar um bom trabalho, otimizar recursos e concentrar esforços. A seleção das agendas prioritárias não precisa ser comunicada externamente, mas serve como um referencial importante para a equipe, e que pode ser alterado, por exemplo, a período de tempo, como biênio, desde que sirva para expandir a capacidade de ação a partir do sucesso alcançado em pelo menos alguma das bandeiras anteriores.</p>'+
    '<div class="apoio exemplo"><span class="tag">Exemplos de agendas e bandeiras</span>segurança pública; educação; agricultura; saúde; direitos humanos; desenvolvimento econômico; cultura; clima e meio ambiente; mulheres; equidade racial; trabalho e emprego; modernização do Estado; indústria, comércio e empreendedorismo; esportes; ciência, tecnologia e inovação; lazer; mineração; assistência social; população lgbtqiap+.</div>',
   passos:[
    'à luz das informações vindas do Mapa Político, destaque todas as agendas e bandeiras que foram citadas ao longo de sua elaboração e registre-as em um mural. Elas podem aparecer sob a forma de grupos sociais que mais apoiaram a campanha, podem se mostrar também por meio da composição da persona da liderança parlamentar e até mesmo pela observação dos principais problemas sociais do território.',
    'apresente as agendas vindas da análise do Mapa Político à equipe e faça um levantamento de outras bandeiras que possam não ter aparecido, mas que também são importantes, e junte-as às demais. Ouçam os argumentos em torno da importância de cada uma das agendas serem prioritárias, a partir da escuta de todos os presentes e registre-os.',
    'estabeleça critérios de priorização das agendas, como por exemplo o grau de especialização da liderança parlamentar sobre o tema; a quantidade de apoiadores em torno de cada bandeira; as promessas de campanha; o impacto que o avanço em tais agendas geraria para o território. Distribua pontos para cada bandeira, à luz dos critérios que foram colocados como fundamentais. Ao fim desta etapa, apresente as três bandeiras prioritárias a todos, analisando se a liderança parlamentar concorda com a escolha final, e pactue, junto aos demais, que elas servem para orientar toda a operação da equipe.'],
   fim:'<div class="apoio"><span class="tag">No futuro</span>Lembre-se que a articulação da conquista da(s) vaga(s) em comissão deve dialogar com as bandeiras prioritárias do mandato. É importante concentrar esforços para que a vaga na comissão com titularidade contemple a principal bandeira prioritária do mandato. Caso seja inviável politicamente, considere a criação de Frente Parlamentar ou concentre esforços na relatoria ou autoria de projetos que contemplem suas bandeiras, para fortalecer sua influência e notoriedade na agenda.</div>',
   itens:[
    {k:'m3.mural',rot:'Mural de agendas e bandeiras levantadas',tipo:'ta',ph:'Marque as agendas que apareceram no Mapa Político (relatório da Missão 1) e acrescente outras que a equipe lembrar.'},
    {k:'m3.argumentos',rot:'Argumentos ouvidos da equipe',tipo:'ta',ph:'Registre os argumentos de cada bandeira'},
    {k:'m3.criterios',rot:'Critérios de priorização adotados',tipo:'ta',ph:'Quais critérios a equipe usou para pontuar cada bandeira'},
    {k:'m3.b1',rot:'Bandeira prioritária 1',tipo:'in',ph:'Ex.: educação'},
    {k:'m3.b2',rot:'Bandeira prioritária 2',tipo:'in',ph:'Ex.: clima e meio ambiente'},
    {k:'m3.b3',rot:'Bandeira prioritária 3',tipo:'in',ph:'Ex.: equidade racial'}],
   listaExtra:{chave:'comissoesDesejadas',rotulo:'Comissão pretendida',
     titulo:'Comissões e espaços que o mandato pretende compor',
     campos:[
      {k:'comissao',rot:'Comissão ou espaço',tipo:'in',ph:'Ex.: Comissão de Educação'},
      {k:'cargo',rot:'Cargo pretendido',tipo:'in',ph:'Ex.: titular, suplente, relatoria, vice-presidência'},
      {k:'bandeira',rot:'Bandeira prioritária relacionada',tipo:'in',ph:'Qual das três bandeiras esta comissão atende'}]}},

  {id:'m3.legado', t:'O Legado do mandato', d:'A manchete de jornal ideal ao fim da legislatura.',
   tipo:'campos',
   intro:'<p>Uma vez tendo sido definidas as agendas prioritárias para este ciclo de planejamento, é importante discutir coletivamente qual será o legado do mandato, ao fim da legislatura.</p>'+
    '<div class="apoio exemplo"><span class="tag">Exemplos de manchetes</span>'+
    '<p>"Joaquim José: conheça a estratégia inovadora do Deputado que colocou a Educação no centro do debate político e solucionou o problema da evasão escolar no Brasil"</p>'+
    '<p>"Marta Silva se reelege como a mais votada de Jiripoca, depois de direcionar emendas para instalação de fiação elétrica subterrânea em todos as grandes cidades do estado"</p>'+
    '<p>"Deputado Ariel se candidata ao Governo do Estado depois de provar, ainda na Assembleia, que é possível conciliar crescimento produtivo, proteção ambiental e desenvolvimento social"</p>'+
    '<p>"Da Câmara ao Senado, Simone Luz se torna a mais jovem parlamentar na Câmara Alta, após conseguir aprovação do PL que reduziu as barreiras ao empreendedorismo no Brasil"</p></div>',
   passos:[
    'divididos em grupos menores, definam qual seria a manchete de jornal ideal, que falaria da trajetória do mandato e de sua entrega política, ao fim desta legislatura. A proposta é apresentar elementos que demonstrem a principal entrega, ou o que marcou o mandato, e também projetar qual seria o cargo público que estaria sendo postulado, em quatro anos.',
    'cada grupo deve apresentar sua manchete para os demais e deve sustentar o porquê foi capaz de traduzir o legado da liderança parlamentar. Os colegas podem tecer comentários e, ao fim das apresentações, selecionar a melhor manchete ou unificar elementos de mais de uma para compor o Legado final do mandato. A proposta é que nesse momento sejam ambiciosos e possam sonhar alto. Ainda assim, a manchete deve ter recortes realistas, para que todos mirem alto, mas dentro das capacidades do mandato.'],
   fim:'<p>Este exercício serve como um farol para a equipe e, idealmente, deve se manter o mesmo, ao longo da legislatura, para que todos compreendam qual é a grande entrega objetivada pelo mandato e quais são os objetivos políticos de médio prazo. Ao fim do segundo ou terceiro ano, caso o cenário se distancie sobremaneira, é importante refazer o exercício e compartilhar o novo Legado.</p>',
   itens:[
    {k:'m3.legado',rot:'A manchete final: o Legado do mandato',tipo:'ta',ph:'Escreva a manchete que traduz o legado do mandato ao fim da legislatura'},
    {k:'m3.cargo',rot:'Cargo público postulado em quatro anos',tipo:'in',ph:'Qual cargo a manchete projeta'}]},

  {id:'m3.preditores', t:'Os preditores de sucesso', d:'Escolher três dos cinco preditores e traduzir cada um em objetivo específico.',
   tipo:'preditores',
   intro:'<p>Ao longo dos anos, a Legisla identificou as 5 áreas que mais se destacam em mandatos legislativos de sucesso. Por meio da metodologia Gabinetes de Impacto Positivo traduzimos estas áreas estratégicas em 5 Preditores de Sucesso Parlamentar que revelam como as boas práticas destes mandatos se manifestam. Percebemos que mandatos bem sucedidos priorizam suas agendas, pautam os debates, constroem o Partido, protagonizam espaços de decisão, e articulam e mobilizam para a entrega de resultados.</p>'+
    '<div class="apoio"><span class="tag">Nota</span>Nosso critério de sucesso é amplo e considera diversas variáveis, como por exemplo, quantidade de projetos de leis aprovados, capacidade de entregar benefícios concretos para a população e ocupação de cargos de destaque na Casa Legislativa, dentre outros exemplos.</div>'+
    '<p>Nem todos os mandatos bem sucedidos conseguem ter boas práticas ou destaques verificáveis em todos os preditores. Frequentemente é possível observar que se sobressaem em algumas combinações dos preditores. Por isso, nossa metodologia está baseada na escolha de três preditores de sucesso para serem priorizados pelos mandatos durante a elaboração do planejamento estratégico.</p>',
   passos:[
    'apresente os 5 preditores de sucesso da metodologia GIP para a equipe e escolham, coletivamente, os três a serem priorizados neste ano. Esta priorização deve vigorar ao longo do ano vigente, pois as iniciativas relacionadas aos preditores precisam de tempo para vigorarem como sucesso. Eles podem ser alterados apenas ao fim deste período, caso seja necessário.',
    'vocês podem usar o próprio preditor como objetivo específico do mandato, ou podem trocá-lo para uma frase que o represente e que seja de mais fácil compreensão para a equipe.']},

  {id:'m3.metas', t:'As metas dos primeiros 100 dias', d:'Até quatro metas por preditor, no formato SMART, com responsável e apoio.',
   tipo:'metas',
   intro:'<p>A esta altura o planejamento do mandato já definiu o farol de médio prazo (Legado) e a aposta de sucesso na qual vão investir com mais intencionalidade (preditores de sucesso e objetivos específicos). Agora, cada preditor de sucesso, ou objetivo específico, vai ser preenchido com mais materialidade. Serão criadas até quatro metas capazes de garantir que, se forem alcançadas, garantem também o cumprimento do objetivo específico ou o alcance daquele preditor de sucesso.</p>'+
    '<div class="apoio"><strong>Para escrita das metas recomendamos o uso do formato SMART, para garantir que sejam específicas, mensuráveis, alcançáveis, relevantes e temporais.</strong></div>'+
    '<p>Um levantamento interno da Legisla, feito sobre centenas de metas de mandatos atendidos, mostrou um padrão recorrente: a diferença entre uma meta forte e uma meta fraca quase nunca está na ambição, está na precisão.</p>'+
    '<div id="blocoMetasRef"></div>',
   passos:[
    'traga o Mapa Político para a roda! As evidências ali coletadas, acerca das oportunidades políticas e da conjuntura social, legislativa e partidária serão fundamentais nesta etapa. Elas serão o ponto de partida para os grupos consultarem e se inspirarem durante o processo de reflexão sobre as metas.',
    'assim como na missão anterior, definir metas costuma funcionar melhor em pequenos grupos. Organize agora as pessoas por afinidade temática, considerando o preditor de sucesso parlamentar que vocês priorizaram, e peça para que escrevam até 4 metas, por preditor, no formato SMART.',
    'cada grupo deve compartilhar as metas que foram escritas e os demais podem sugerir melhorias, coletivamente. Caso existam metas parecidas, é possível aglutiná-las ou excluir aquela que for menos interessante.',
    'após a decisão final das escritas vocês terão entre 10 e 16 metas para serem cumpridas até o fim dos 100 dias, ou, como costumamos fazer com os mandatos da Legisla, ao longo de 4 meses.',
    'toda meta precisa de uma pessoa que a acompanhe de muito perto e que seja responsável por reportar aos colegas e às lideranças como está o seu andamento. Para cada uma, é necessário definir quem é o responsável direto e quem lhe dá suporte, sem essa definição, metas compartilhadas tendem a não ser cumpridas por ninguém, porque todo mundo assume que a responsabilidade é de outra pessoa.'],
   fim:'<div class="apoio atencao"><span class="tag">Atenção</span>As metas não são tarefas diárias. Elas devem ser específicas, mas também ambiciosas, revelando um alvo a ser alcançado ao longo de quatro meses. Caso seja uma atividade pontual ou um processo rotineiro de trabalho, não devem ser contempladas como meta. Se a pessoa responsável pelo cumprimento da meta for menos experiente ou organizada, é função da liderança acompanhar o plano de trabalho semanal e as tarefas a serem desempenhadas diretamente com ela, para não sobrecarregar o planejamento coletivo com processos individuais.</div>'}
 ]
},

{
 n:4, cor:'#BA6BED', ct:'#7E2FB8', prazo:100, pos:72, continua:true, prazoTxt:'desde o 1º dia',
 titulo:'Construa seu capital político com articulação e mobilização',
 curto:'Construa capital político',
 agenda:['A articulação política','A escolha das Comissões Permanentes','A mobilização de apoiadores do mandato','A expansão da relevância no Partido','A relação com as lideranças das comissões e a Secretaria Geral da Mesa','O crescimento nas redes sociais e a presença pública'],
 abre:'Ser levado em consideração quando as decisões importantes estão sendo tomadas.',
 resumo:'<p>Mandato nenhum avança sozinho. Em um sistema político tão fragmentado quanto o brasileiro, quem articula bem chega mais longe do que quem só tem boas ideias. Capital político é a capacidade que o mandato constrói de ser ouvido, ocupar espaços de decisão, reunir apoio e fazer suas prioridades avançarem. Ele depende das relações mantidas dentro da Casa, da presença no partido, da mobilização de apoiadores e da forma como o mandato se comunica com a sociedade.</p><p>Não é preciso fazer tudo ao mesmo tempo. Nesta missão, vamos primeiro entender como funciona a escolha das Comissões Permanentes. Depois, você vai escolher, entre quatro frentes de articulação e mobilização, onde concentrar energia nos seus primeiros 100 dias.</p>',
 entrega:['Entendido como funciona a distribuição das Comissões Permanentes e mapeado aquelas de maior interesse para o mandato.','Escolhido pelo menos duas ações, em frentes diferentes, para ampliar sua capacidade de articulação, mobilização ou presença pública.','Definido o que pretende alcançar, quem será responsável e qual será o próximo passo de cada ação escolhida.'],
 momento:['Desde o primeiro dia do mandato, de forma contínua.'],
 lidera:['<strong>Lidera:</strong> Liderança parlamentar, OU Chefia de gabinete, OU Articulador/a político/a do mandato.','<strong>Participam:</strong> Coordenações das áreas Legislativa, Articulação, Mobilização Territorial e Comunicação.'],
 fecho:'Ao final desta missão, o mandato terá escolhido seus espaços prioritários e colocado em prática pelo menos duas ações para ampliar sua capacidade de articulação, mobilização e presença pública. Na Missão 5, será o momento de acompanhar os resultados e fazer os ajustes necessários.',
 exercicios:[
  {id:'m4.comissoes', t:'A escolha das Comissões Permanentes', d:'Mapear as comissões e espaços mais relacionados às bandeiras do mandato.',
   tipo:'lista', chave:'comissoes', rotulo:'Espaço',
   intro:'<p>Retome as prioridades e bandeiras definidas na Missão 3 e identifique as Comissões Permanentes mais relacionadas a elas. A escolha não deve considerar apenas a afinidade temática. Observe também onde tramitam as propostas importantes, quais espaços oferecem oportunidades reais de incidência e em quais deles o mandato pode construir uma atuação reconhecida.</p>'+
    '<p>A distribuição das vagas costuma considerar o tamanho das bancadas e dos blocos, e a indicação dos integrantes passa pelas lideranças partidárias. Na Câmara dos Deputados, são 30 comissões permanentes; nas Assembleias Legislativas estaduais, a quantidade e o número de comissões que cada liderança parlamentar pode integrar variam de uma Casa para outra. Por isso, consulte o Regimento Interno e compreenda como essa negociação funciona no seu Legislativo.</p>'+
    '<p>Além das Comissões Permanentes, fique de olho em relatorias, frentes parlamentares, grupos de trabalho, comissões temporárias, lideranças de bancada e outros espaços que possam ajudar o mandato a avançar em suas prioridades.</p>'+
    '<div class="apoio"><span class="tag">Destaque</span>Entre os mandatos acompanhados pela Legisla Brasil, aqueles com melhor desempenho ocupam, em média, mais cargos estratégicos na estrutura do Parlamento. Fonte: Playbook GIP, Legisla Brasil.</div>',
   fim:'<p>Converse com a liderança partidária e procure a Secretaria-Geral da Mesa, ou a estrutura equivalente na sua Casa, para conhecer os procedimentos, os prazos e as possibilidades de participação.</p>'+
    '<div class="apoio"><span class="tag">No futuro</span>Negocie relatorias, vice-presidências, presidências e outras funções nos espaços escolhidos. A titularidade importa, mas o protagonismo também se constrói relatando projetos, elaborando pareceres relevantes e participando das negociações que antecedem as decisões.</div>',
   campos:[
    {k:'prio',rot:'Prioridade do mandato',tipo:'in',ph:'Ex.: educação'},
    {k:'esp',rot:'Comissão ou espaço relacionado',tipo:'in',ph:'Ex.: Comissão de Educação'},
    {k:'pq',rot:'Por que estar nesse espaço?',tipo:'ta'},
    {k:'papel',rot:'Papel que pretende exercer',tipo:'in',ph:'Ex.: titular, relatoria'},
    {k:'mov',rot:'Primeiro movimento',tipo:'ta'}]},

  {id:'m4.acoes', t:'As ações dos 100 dias', d:'Pelo menos duas ações, em frentes diferentes, com responsável e prazo.',
   tipo:'bingo',
   intro:'<p>Escolha pelo menos duas sugestões para realizar antes do fim dos 100 primeiros dias. <strong>As ações devem estar em frentes diferentes.</strong> Se quiser ir além, complete uma ação de cada bingo.</p>'+
    '<p>Antes de escolher, retome o planejamento da Missão 3. As atividades precisam ajudar o mandato a cumprir as prioridades já definidas, e não criar uma nova lista de tarefas sem relação com o rumo que foi escolhido.</p>'},

  {id:'m4.metricas', t:'O acompanhamento da comunicação', d:'O que observar para saber se a comunicação está avançando.',
   tipo:'checklist',
   intro:'<p>Mais importante que aumentar o número de seguidores é saber se a comunicação está aproximando pessoas, mobilizando apoiadores e ajudando o mandato a pautar seus temas. Marque o que o mandato já acompanha de forma sistemática:</p>',
   itens:[
    {k:'m4.k1',t:'Alcance e crescimento da comunidade'},
    {k:'m4.k2',t:'Compartilhamentos, comentários e respostas'},
    {k:'m4.k3',t:'Mensagens recebidas e encaminhadas'},
    {k:'m4.k4',t:'Participação gerada por campanhas e convites'},
    {k:'m4.k5',t:'Presença das agendas do mandato na imprensa e no debate público'}]}
 ]
},

{
 n:5, cor:'#035252', ct:'#035252', prazo:100, prazoTxt:'começar a implementar antes do 100º dia',
 titulo:'Garanta o avanço do seu projeto político',
 curto:'Garanta o avanço',
 agenda:['O monitoramento do avanço das metas','O primeiro ciclo de feedback estruturado'],
 abre:'O que os 100 dias deixam instalado no mandato.',
 resumo:'<p>Os primeiros 100 dias não terminam com uma lista de tarefas cumpridas. Eles devem deixar para o mandato uma forma de acompanhar resultados, aprender com o que aconteceu e decidir os próximos passos.</p><p>Sem uma rotina de monitoramento, o planejamento corre o risco de virar um arquivo que a equipe consulta apenas quando precisa prestar contas. Monitorar é verificar se as metas estão avançando, reunir evidências, identificar dificuldades e definir o que precisa ser feito para que o trabalho continue.</p><p>Esse acompanhamento também ajuda a melhorar o funcionamento da equipe. O primeiro ciclo de feedback permite reconhecer avanços, corrigir problemas e combinar mudanças. Com essas informações, o mandato consegue preparar o próximo ciclo de planejamento sem começar tudo novamente.</p>',
 entrega:['Um Painel de Monitoramento atualizado;','O primeiro ciclo de feedback realizado;','O próximo ciclo de planejamento encaminhado.'],
 momento:['Desde o primeiro dia do mandato, de forma contínua.'],
 lidera:['<strong>Lidera:</strong> Liderança parlamentar, OU Chefia de gabinete, OU Pessoa responsável pelo planejamento.','<strong>Participam:</strong> Coordenações e demais integrantes da equipe, de acordo com as metas acompanhadas.'],
 fecho:'O mandato supera os 100 Primeiros Dias com o planejamento em execução, uma rotina de acompanhamento instalada, as condições necessárias para implementar o próximo ciclo e entregar ainda mais para a sociedade!',
 exercicios:[
  {id:'m5.monit', t:'O monitoramento do avanço das metas', d:'Registrar o avanço mensal de cada meta definida na Missão 3.',
   tipo:'monit',
   intro:'<p>Retome as metas definidas no planejamento estratégico e estabeleça uma reunião mensal para acompanhar seu avanço. Essa reunião não substitui os alinhamentos semanais. Enquanto as reuniões de rotina tratam das demandas mais imediatas, o monitoramento da evolução no atingimento das metas é um encontro mensal em que o mandato conversa sobre como caminhou com o que se comprometeu a alcançar, naquele período de 30 dias!</p>'+
    '<p>Abra a ferramenta de monitoramento e passe por cada meta com as pessoas responsáveis. Registre os números, territórios alcançados, protocolos realizados, respostas obtidas e outras evidências relacionadas aos resultados.</p>'},

  {id:'m5.feedback', t:'O primeiro ciclo de feedback estruturado', d:'Conversa individual entre cada integrante da equipe e sua liderança direta.',
   tipo:'lista', chave:'feedbacks', rotulo:'Conversa',
   intro:'<p>O feedback estruturado também precisa ser realizado periodicamente. Recomendamos que ocorra ao menos uma vez por semestre, mas que, nos primeiros 100 dias, seja o primeiro marco de ajustes e devolutivas a serem realizadas entre liderança e liderado individualmente. Estas conversas com devolutivas baseadas em evidências e situações concretas ajudam a acompanhar o que foi pactuado, melhorar as relações de trabalho e criar um ambiente de confiança e crescimento profissional.</p>'+
    '<p>Antes de realizar as conversas, retome o organograma e os escopos de trabalho apresentados à equipe. Verifique se o trabalho objetivado foi cumprido, se as funções foram compreendidas e se existem atividades realizadas pelas pessoas que ainda não foram incorporadas aos seus escopos. É importante trazer pontos de destaque e pontos de ajustes, e também é necessária uma escuta qualificada sobre o que o membro da assessoria tem a dizer sobre as colocações da liderança e também sobre a liderança.</p>'+
    '<p>A conversa deve ser individualizada e tanto liderança quanto liderado devem vir preparados para este momento. O objetivo é de desenvolvimento profissional, aumento da coesão da equipe e melhoria da qualidade das entregas.</p>'+
    '<h4>Primeiro passo: comece pela avaliação do trabalho realizado</h4>'+
    '<ul><li>Como está o cumprimento do plano de trabalho desde a pactuação do escopo e das entregas deste quadrimestre?</li><li>Quais fatos sustentam essa avaliação?</li></ul>'+
    '<h4>Segundo passo: liderança e integrante da equipe devem se preparar respondendo às mesmas perguntas</h4>'+
    '<ul><li>O que reconheço que fiz bem?</li><li>O que reconheço que preciso melhorar?</li><li>O que a outra pessoa faz bem?</li><li>O que a outra pessoa poderia melhorar?</li><li>Quais são as situações concretas que podem sustentar as respostas anteriores?</li><li>Como posso contribuir para que a outra pessoa melhore?</li></ul>'+
    '<p>Na prática, a pessoa da equipe avalia o próprio trabalho e também a atuação da liderança. A liderança faz o mesmo. O feedback não deve acontecer em apenas uma direção.</p>'+
    '<h4>Terceiro passo</h4>'+
    '<p>Registre os principais pontos discutidos e os encaminhamentos pactuados. Vocês devem sair da conversa com um plano de ação, para garantir que os ajustes de rota e de comunicação aconteçam.</p>'+
    '<div class="apoio atencao"><span class="tag">Atenção</span>Feedback estruturado não é uma cobrança feita apenas pela liderança. É uma conversa apoiada no que foi pactuado e em fatos sobre o trabalho realizado, na qual as duas partes podem reconhecer avanços e apontar o que precisa melhorar, de forma respeitosa, humana e instigante. A assessoria precisa sair desta conversa encorajada a melhorar o que não está bom e reconhecida pelo que faz bem!</div>',
   campos:[
    {k:'pessoa',rot:'Pessoa',tipo:'in'},
    {k:'lider',rot:'Liderança direta',tipo:'in'},
    {k:'data',rot:'Data da conversa',tipo:'in',ph:'Ex.: 18/03'},
    {k:'pontos',rot:'Principais pontos discutidos',tipo:'ta'},
    {k:'encam',rot:'Plano de ação pactuado',tipo:'ta'}]},

  {id:'m5.imersao', t:'Calibragem e replanejamento', d:'O checklist da imersão de planejamento do quadrimestre.',
   tipo:'checklist',
   intro:'<p><strong>Parabéns, vocês chegaram com sucesso ao fim dos 100 primeiros dias!</strong></p>'+
    '<p>O cumprimento das 5 Missões fez com que o mandato se organizasse e não perdesse oportunidades de articulação política, nos primeiros 100 dias. Agora é hora de refinar o planejamento e revisar o que realmente deve ficar para sustentar o horizonte do mandato durante quatro meses. A proposta é que vocês acabem os 100 dias e criem um novo planejamento estratégico. Este, por sua vez, deve ser mais robusto e deve ser capaz de superar as dificuldades do anterior, mantendo o que ainda fizer sentido e impulsionando o mandato, os assessores, a liderança parlamentar a irem além!</p>'+
    '<p>Estabeleça uma data para a realização de uma nova imersão, esta será mais curta, já que muito do que já foi estabelecido permanecerá, como: Mapa Político, Legado, Preditores de Sucesso, Objetivos Específicos. É importante que discutam sobre o que deu certo e quais foram os aprendizados obtidos na maratona dos 100 Dias!</p>',
   campos:[
    {k:'m5.dataImersao',rot:'Data da imersão de planejamento do quadrimestre',tipo:'in',ph:'Ex.: 12 e 13 de maio'},
    {k:'m5.quemImersao',rot:'Quem deve participar',tipo:'in',ph:'Ex.: toda a equipe'}],
   subtitulo:'Preencha o checklist do que precisa ser contemplado na Imersão de Planejamento do Quadrimestre',
   itens:[
    {k:'m5.i1',t:'Balanço dos Primeiros 100 Dias: percentuais de atingimento, resultados concretos, desafios e novas ameaças e oportunidades de atuação'},
    {k:'m5.i2',t:'Novos direcionamentos da Estratégia Política ainda não conhecidos por todos'},
    {k:'m5.i3',t:'O que não pode ser mudado: Legado, objetivos específicos e os preditores prioritários'},
    {k:'m5.i4',t:'Ponto de partida da liderança sobre as readequações a serem incorporadas no próximo ciclo de planejamento'},
    {k:'m5.i5',t:'Escuta qualificada das ideias dos assessores sobre o que pode ser mudado, o que deve ser mudado e o quê, de novo, precisa ser incorporado, sobretudo em relação às metas'},
    {k:'m5.i6',t:'Criação e distribuição de metas e responsabilidades'},
    {k:'m5.i7',t:'Ajustes dos fluxos de contato, reuniões de alinhamento, data do próximo ciclo de feedback estruturado'},
    {k:'m5.i8',t:'Pactuação das datas de monitoramento mensal das metas'},
    {k:'m5.i9',t:'Momento de confraternização e descontração para aumento do senso de pertencimento da equipe'}]}
 ]
}
];

/* ===================== CAIXA DE FERRAMENTAS ===================== */
var FERRAMENTAS={
 intro:'Além dos materiais de aprofundamento, disponíveis em nossa Biblioteca, disponibilizamos ferramentas práticas e modelos editáveis para apoiar a implementação das missões. A seguir, você tem acesso a diversos instrumentos autoaplicáveis que podem destravar a gestão do mandato, sua estratégia e relação com apoiadores e com os demais assessores!',
 modelos:[
  {t:'Modelo de Planejamento Estratégico para Mandatos',u:'https://app.mural.co/t/legislabrasil7226/m/legislabrasil7226/1719953202224/5b449dd935585ac552a36aa9bf6dba0900723320?sender=u84395d08d117ebd899158678'},
  {t:'Modelo de Planejamento Estratégico para Partidos',u:'https://bit.ly/planejamentoestrategicopartidos'},
  {t:'Modelo de Planilha de Monitoramento das Metas',u:null},
  {t:'Modelo de Planilha de Gestão de Pessoas e Organograma',u:'https://docs.google.com/spreadsheets/d/1xPJzFVPmJEfFgYZ4ULv9ZgtL2ushdRyyDPP-5GOgh-o/edit?gid=0#gid=0'}
 ],
 blocos:[
  {id:'gip', t:'Os cinco preditores de sucesso parlamentar (Playbook GIP)',
   html:'<p>A metodologia Gabinetes de Impacto Positivo (GIP), desenvolvida pela Legisla Brasil, identificou cinco práticas recorrentes em mandatos que conseguem estruturar melhor sua atuação. Cada preditor representa uma capacidade distinta.</p><div id="tabGIP"></div>',
   link:{t:'Playbook GIP completo',u:'https://drive.google.com/file/d/1Wk7vG7jPszKmJxTJ3OfIT3gy0HDbgFcQ/view?usp=sharing'}},
  {id:'negros', t:'A trajetória de assessores negros no Congresso',
   html:'<p>Publicado pela Legisla Brasil em parceria com a Mulheres Negras Decidem em 2025, este estudo investigou, por meio de entrevistas e observação participante na Câmara dos Deputados e no Senado Federal, os caminhos de entrada, a influência real na agenda legislativa e os obstáculos enfrentados por assessores e assessoras negras.</p>'+
   '<p><strong>Alguns achados centrais:</strong></p><ul>'+
   '<li>Entre as mulheres negras entrevistadas, a maior parte está concentrada nas faixas de renda mais baixas da amostra, enquanto os homens entrevistados aparecem distribuídos por todas as faixas, inclusive as mais altas, evidência de que a desigualdade racial se cruza com desigualdade de gênero dentro do próprio Legislativo, mesmo em funções técnicas.</li>'+
   '<li>Mulheres assessoras relataram, com mais frequência que os homens, ter alguém sob sua responsabilidade de cuidado (filhos, familiares), acumulando essa carga junto com o trabalho parlamentar.</li>'+
   '<li>Todas as mulheres entrevistadas consideraram as políticas internas de diversidade do Congresso insuficientes ou inexistentes, com críticas específicas à ausência de mecanismos contra o racismo institucional e à superficialidade de iniciativas simbólicas sem impacto concreto.</li></ul>'+
   '<p>O estudo termina com recomendações práticas para mandatos parlamentares, entre elas: mapear periodicamente a composição da equipe por raça, gênero e posição hierárquica; criar espaços regulares de escuta sobre questões de raça e sobrecarga de trabalho, com encaminhamentos concretos; e garantir critérios claros e transparentes de progressão de carreira e definição salarial.</p>'+
   '<p>Essas recomendações dialogam diretamente com o compromisso de diversidade mencionado na Missão sobre gestão de pessoas deste guia, vale revisitá-las ao montar ou revisar o organograma do mandato.</p>',
   link:{t:'Estudo completo em PDF',u:'https://drive.google.com/file/d/1H7tucARKmj1UFtU2MSdEAhEnJArK78Zd/view?usp=sharing'}},
  {id:'antirracista', t:'Guia de boas práticas legislativas',
   html:'<p>Publicado pela Legisla Brasil, reúne boas práticas para tornar o ambiente legislativo mais antirracista, cobrindo desde a composição de equipes até rotinas institucionais que reproduzem ou combatem desigualdades raciais dentro do Parlamento. A partir da pesquisa consolidamos um repositório de boas práticas percebidas a partir de evidências, experiências e desafios reais dos mandatos. Aqui você encontrará orientações claras e aplicáveis para promover equidade racial no cotidiano de mandatos, partidos, Casas Legislativas e organizações da sociedade civil.</p>',
   link:{t:'Guia de boas práticas para um legislativo antirracista',u:'https://legislabrasil.org/guia-de-boas-praticas-para-um-legislativo-antirracista/'}},
  {id:'canal', t:'Modelo de formulário de canal de acolhimento e gestão de demandas externas',
   html:'<p>Parte importante da atividade parlamentar é conseguir coletar os pedidos e sugestões da população, converter em política, e dar a devolutiva aos interlocutores. Por vezes o mandato faz gestão de demandas de modo ineficiente e perde a conexão com a população. A forma mais simples e, por vezes, mais eficaz é por meio de um formulário. Uma vez criado, o ideal é que todos os assessores sejam capazes de compartilhá-lo, quando pertinente, para que os apoiadores registrem suas demandas neste mesmo e único canal.</p>'+
   '<p>É importante que uma pessoa da assessoria seja responsável por fazer a gestão dos dados, distribuindo internamente para os responsáveis darem prosseguimento e recebendo as devolutivas a serem repassadas a quem a demandou. Além disso, os dados ali coletados podem servir para conhecer melhor os interesses dos apoiadores e também implementar uma estratégia de mobilização de pessoas. Ela deve acontecer não apenas no período eleitoral, mas deve ser contínua, gerando identificação e responsabilização coletiva pelo avanço das agendas prioritárias do mandato.</p>'+
   '<div id="modeloCanal"></div>'}
 ]
};

var CANAL_ACOLHIMENTO={
 abertura:'Canal de Acolhimento: mandato [CARGO] [NOME]',
 texto:['Que alegria saber que, se você chegou até aqui, é porque tem interesse de saber mais do nosso trabalho e de nos ajudar a construir uma [CIDADE/ESTADO] melhor!',
  'Por isso, com o objetivo de te atender melhor e de te ouvir, pedimos que responda às perguntas a seguir.',
  'Coletamos aqui demandas da população para direcionar a atuação do mandato. Uso exclusivo interno, conforme LGPD (Lei Geral de Proteção de Dados Pessoais nº 13.709/2018). Para mais informações, envie um e-mail para [EMAIL].'],
 perguntas:[
  ['Qual é o seu nome?',null],
  ['Qual é seu telefone?',null],
  ['Você tem interesse em receber notícias sobre a atuação do mandato em que áreas?',['Periferia e comunidades','Educação','Cultura e/ou lazer','Infraestrutura e zeladoria urbana','Direitos humanos (equidade racial, mulheres, pessoas com deficiência etc.)','Saúde','Sustentabilidade e Meio ambiente','Trabalho e emprego','Assistência social','Segurança pública','Não tenho interesse em receber notícias sobre a atuação do mandato.']],
  ['Qual é sua data de nascimento?',null],
  ['Em que cidade você mora?',null],
  ['Em que bairro você mora?',null],
  ['Você é',['Mulher','Homem','Prefiro não responder','Outro']],
  ['Você gostaria de registrar um pedido, sugestão ou recado para nosso mandato?',['Sim, um pedido','Sim, uma sugestão','Sim, um recado','Não, obrigado']],
  ['Registre aqui o seu pedido',null],
  ['Em que oportunidade você teve acesso a este formulário?',['Participei de uma edição do [ADICIONAR NOME DO EVENTO DE MOBILIZAÇÃO]','Estive presente em uma audiência pública na [ADICIONAR CASA LEGISLATIVA]','Realizei visita ao gabinete','Recebi uma visita do vereador ou de alguém do mandato','Participei de uma palestra do vereador','Nas redes sociais do mandato (WhatsApp, Instagram, X, YouTube etc.)','Outro']],
  ['Você gostaria de apoiar nosso trabalho?',['Sim, quero ser apoiador(a) voluntário(a) do mandato','Sim, quero ser promotor(a) digital voluntário(a) do mandato','Sim, quero ser promotor(a) presencial voluntário(a) do mandato','Não, obrigado(a)','Outro']]
 ],
 voluntariado:[
  ['Apoiador(a)','é convidado(a) para participar de ações promovidas pelo mandato'],
  ['Promotor(a) digital do mandato','recebe conteúdo do mandato e o divulga para suas redes de amigos'],
  ['Promotor(a) presencial do mandato','organiza, em parceria com o mandato, edições do [NOME DO EVENTO QUE O MANDATO REALIZA] ou rodas de conversa com a [LIDERANÇA PARLAMENTAR], ou coleta demandas das pessoas à sua volta e fala com a população sobre as bandeiras do mandato']
 ]
};

/* ===================== BIBLIOTECA ===================== */
var REGIMENTOS_FEDERAL=[
 ['Câmara dos Deputados','https://www2.camara.leg.br/atividade-legislativa/legislacao/regimento-interno-da-camara-dos-deputados'],
 ['Senado Federal','https://www25.senado.leg.br/web/atividade/regimento-interno'],
 ['Regimento Comum do Congresso Nacional','https://www.congressonacional.leg.br/legislacao-e-publicacoes/regimento-do-congresso-nacional']
];

var REGIMENTOS_UF={
 AC:'https://www.al.ac.leg.br/?page_id=81219',
 AL:'https://www.al.al.leg.br/institucional/regimento-interno/regimento-interno.pdf/view',
 AP:'http://www.al.ap.gov.br/ver_texto_consolidado.php?iddocumento=21560',
 AM:'https://www.aleam.gov.br/wp-content/uploads/2026/07/regimento-interno.pdf',
 BA:'https://www.al.ba.gov.br/atividade-legislativa/legislacao/regimento-interno',
 CE:'https://www.al.ce.gov.br/paginas/regimento-interno?menu=16',
 DF:'https://ple.cl.df.gov.br/#/norma/consultar/38005?buscar=true',
 ES:'https://www3.al.es.gov.br/arquivo/documents/legislacao/html/res27002009.html',
 GO:'https://saba.al.go.leg.br/v1/view/transparencia/public/wEf3qY5ToNFyKEAtA_h83CzgMuXNbxqb4Wm43TFm6SM=',
 MA:'https://legislacao.al.ma.leg.br/ged/regimento-interno/detalhe.html',
 MT:'https://www.al.mt.gov.br/norma-juridica/',
 MS:'https://al.ms.gov.br/Portals/0/Documentos/RegimentoInterno.pdf',
 MG:'https://www.almg.gov.br/atividade-parlamentar/leis/regimento-interno/',
 PA:'https://www.alepa.pa.gov.br/Servicos/Download?Id=1',
 PB:'https://www.al.pb.leg.br/regimento-interno',
 PR:'https://storage2.assembleia.pr.leg.br/file/public-media/documentos/regimento_interno/Regimento%20Interno%20ALEP-%20R-%2002-06-2026%20%20atualizado%20Resolu%C3%A7%C3%A3o%204-2026%20-%20R.pdf',
 PE:'https://legis.alepe.pe.gov.br/texto.aspx?id=71171',
 PI:'https://www.al.pi.leg.br/servicos/esic-ouvidoria/Ouvidoria/20231017092415/novo-regimento-interno-da-alepi-09-08-2023.pdf/view',
 RJ:'https://www3.alerj.rj.gov.br/lotus_notes/default.asp?id=74',
 RN:'https://www.al.rn.leg.br/regimento-interno/Regimento_Interno_ALRN_junho_2025_DL.pdf',
 RS:'https://ww4.al.rs.gov.br/legislacao-estadual',
 RO:'https://www.al.ro.leg.br/downloads/regimento-interno',
 RR:'https://al.rr.leg.br/wp-content/uploads/2023/11/Regimento-Interno-ALERR.pdf',
 SC:'https://leis.alesc.sc.gov.br/alesc/regulamentacao-interna',
 SP:'https://www.al.sp.gov.br/leis/regimento-interno/',
 SE:'https://aleselegis.al.se.leg.br/legislacao/norma.aspx?id=6957&numero=33',
 TO:'https://www.al.to.leg.br/documento'
};
var OBS_REGIMENTO={MT:'portal de busca, não PDF único'};

var BIBLIOTECA=[
 {id:'regimento', t:'Regimento Interno', destaque:true,
  html:'<p>O Regimento Interno estabelece as regras de funcionamento da Casa Legislativa. É nele que estão definidos, entre outros assuntos:</p>'+
  '<ul><li>os direitos e deveres dos parlamentares;</li><li>o funcionamento da Mesa Diretora;</li><li>as atribuições das lideranças;</li><li>a composição e as competências das comissões;</li><li>os tipos de proposição que podem ser apresentados;</li><li>as etapas de tramitação;</li><li>os prazos e requerimentos;</li><li>os quóruns e procedimentos de votação;</li><li>os instrumentos de fiscalização;</li><li>as regras para uso da palavra, recursos e questões de ordem.</li></ul>'+
  '<p>Conhecer o Regimento ajuda o mandato a entender não apenas o que pode fazer, mas quando, por quais caminhos e com o apoio de quais atores.</p>'+
  '<p>A composição das comissões costuma considerar a proporcionalidade dos partidos e blocos, mas a forma de distribuição das vagas e de indicação dos integrantes varia de uma Casa para outra. O mesmo acontece com a escolha de presidências, relatorias, lideranças e outros espaços de decisão. Por isso, exemplos do Congresso Nacional não devem ser automaticamente aplicados às Assembleias Legislativas.</p>'+
  '<p><strong>Ao consultar o Regimento da sua Casa, procure responder:</strong></p>'+
  '<ul><li>Quem controla a pauta?</li><li>Como são escolhidas as comissões e suas presidências?</li><li>Quem distribui as relatorias?</li><li>Quais proposições a liderança parlamentar pode apresentar?</li><li>Quais matérias têm tramitação conclusiva ou terminativa nas comissões?</li><li>Como funcionam os pedidos de urgência?</li><li>Quais são os prazos para emendas, pareceres e recursos?</li><li>Quais instrumentos de fiscalização estão disponíveis?</li><li>Como acontecem as votações e quais são os quóruns exigidos?</li><li>Quais instrumentos podem acelerar, adiar ou impedir uma decisão?</li></ul>'+
  '<div id="listaRegimentos"></div>'},
 {id:'lgpd', t:'Proteção de dados e LGPD',
  html:'<p>Os gabinetes recebem dados de cidadãos, apoiadores, lideranças e organizações por meio de atendimentos, formulários, eventos e canais digitais. Essas informações devem ser coletadas e utilizadas de acordo com a Lei Geral de Proteção de Dados Pessoais, a LGPD.</p>'+
  '<p>Na prática, o mandato deve coletar apenas os dados necessários, informar sua finalidade, restringir o acesso, evitar compartilhamentos indevidos e definir formas seguras de armazenamento e descarte. Dados sensíveis, como informações sobre saúde, raça, religião e opinião política, exigem atenção especial.</p>',
  link:{t:'Texto da Lei Geral de Proteção de Dados',u:'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm'}},
 {id:'ibge', t:'IBGE Cidades',
  html:'<p>O IBGE Cidades é uma ferramenta importante para o mandato conhecer melhor a realidade socioeconômica do território em que atua. O site reúne dados sobre população, educação, saúde, trabalho e renda, economia, infraestrutura e outros indicadores municipais. Essas informações ajudam a identificar problemas e desigualdades, comparar o município com outras realidades e embasar a definição de prioridades, propostas e ações do mandato.</p>',
  link:{t:'Dados socioeconômicos da sua cidade e estado',u:'https://www.ibge.gov.br/cidades-e-estados'}},
 {id:'processo', t:'Processo legislativo',
  html:'<p>O entendimento do processo legislativo é fundamental para que o mandato como um todo saiba como uma proposta tramita, quais são as etapas de análise e votação, o papel das comissões, do Plenário e dos diferentes atores envolvidos. Conhecer esse caminho permite à liderança parlamentar e assessores identificarem oportunidades de atuação, definirem estratégias de articulação e acompanharem de forma mais efetiva projetos de interesse do mandato, desde a apresentação até a aprovação, sanção ou veto.</p>'+
  '<p>Não deve ser de responsabilidade única e exclusiva da Assessoria Legislativa o conhecimento básico sobre processo legislativo. A ela cabe a tecnicidade e a profundidade, mas a todos os demais é importante o conhecimento básico, para que exerçam um bom e estratégico trabalho de assessoria parlamentar.</p>',
  link:{t:'Entenda o processo legislativo',u:'https://www.camara.leg.br/entenda-o-processo-legislativo/'}},
 {id:'comissoes', t:'Comissões',
  html:'<p>As Comissões são espaços centrais de atuação parlamentar, onde projetos são analisados, debatidos e votados, além de serem realizadas atividades de fiscalização e participação da sociedade. Conhecer as comissões permite ao mandato identificar onde suas pautas estão sendo discutidas, acompanhar a tramitação de propostas, participar dos debates e construir estratégias de articulação com outros parlamentares e atores relevantes.</p>',
  link:{t:'Comissões da Câmara dos Deputados',u:'https://www.camara.leg.br/comissoes'}},
 {id:'controle', t:'Relação com órgãos de controle',
  html:'<p>Conhecer o papel e as atribuições dos órgãos de controle, como o Tribunal de Contas e o Ministério Público, ajuda o mandato a compreender os mecanismos de fiscalização da administração pública e a utilizar adequadamente esses canais. Esse conhecimento fortalece a capacidade de fiscalizar recursos e políticas públicas, identificar possíveis irregularidades e encaminhar demandas de forma mais qualificada.</p>'},
 {id:'partidarias', t:'Relações partidárias',
  html:'<p>Construir uma boa relação com o partido é importante para ampliar a capacidade de articulação política do mandato e garantir alinhamento em torno de suas prioridades. Uma relação sustentável permite à liderança parlamentar construir apoio, participar das decisões partidárias, fortalecer suas pautas e desenvolver parcerias políticas de médio e longo prazo.</p>',
  link:{t:'Lideranças e bancadas partidárias',u:'https://www.camara.leg.br/deputados/liderancas-e-bancadas-partidarias'}},
 {id:'recursos', t:'Recursos disponíveis para os mandatos',
  html:'<p>Conhecer os recursos financeiros, a estrutura disponível e os limites para contratação de pessoal permite ao mandato planejar sua operação de forma realista e estratégica. Essas informações ajudam a dimensionar a equipe, organizar prioridades, distribuir recursos e utilizar adequadamente a estrutura oferecida pela Casa Legislativa.</p>',
  links:[{t:'Gastos parlamentares',u:'https://www.camara.leg.br/transparencia/gastos-parlamentares?ano=2026'},
   {t:'Verba de gabinete e contratação de pessoal',u:'https://www2.camara.leg.br/comunicacao/assessoria-de-imprensa/guia-para-jornalistas/verba-de-gabinete'}]},
 {id:'sistemas', t:'Uso dos sistemas da Casa Legislativa',
  html:'<p>Dominar os sistemas e ferramentas disponibilizados pela Casa Legislativa é essencial para que o mandato consiga executar suas atividades com autonomia e eficiência. O conhecimento dessas ferramentas facilita o acompanhamento de projetos, apresentação de proposições, gestão das atividades legislativas, comunicação e organização interna do gabinete. A Câmara reúne em um único espaço os principais serviços digitais destinados a parlamentares e gabinetes.</p>',
  link:{t:'Serviços digitais para parlamentares e gabinetes',u:'https://www.camara.leg.br/internet/servicos-tic/index.htm'}}
];

var CARGOS_EQUIPE=[
 ['Chefia de gabinete','Liderança  de Estratégia Política e de Pessoas','Implementação de planejamento estratégico; Orientação de prioridades; Domínio do funcionamento do mandato e do Legislativo; tomada de decisão; articulação política; gestão de crises; relacionamento institucional; capacidade de traduzir a estratégia parlamentar em execução; gestão de informações sensíveis; acompanhamento de resultados; gestão de pessoas, monitoramento direto do trabalho de coordenadores e  acompanhamento do trabalho dos todos os demais assessores.'],
 ['Coordenador/a Legislativo/a','Estrategista Legislativo/a','Domínio do processo legislativo; análise e elaboração de proposições; interpretação regimental; acompanhamento da pauta legislativa; estratégia de tramitação; coordenação da equipe legislativa; articulação com lideranças, comissões e órgãos legislativos; análise de cenários; capacidade de orientar a liderança parlamentar sobre oportunidades e riscos legislativos;  coordenação do trabalho de assessores legislativos, de políticas públicas, emendas e especialista temático(a)'],
 ['Assessor/a Legislativo/a','Especialista Legislativo/a','Conhecimento do processo legislativo; pesquisa legislativa; acompanhamento de proposições; elaboração de notas técnicas e minutas; monitoramento de sessões, comissões e votações; organização de informações; análise básica de projetos e emendas; cumprimento de prazos; atenção a detalhes.'],
 ['Assessor/a de políticas públicas e fiscalização','Especialista em Políticas Públicas e Fiscalização','Conhecimento de políticas públicas; capacidade de análise de programas governamentais; orçamento público básico; monitoramento e avaliação de políticas; fiscalização da administração pública; análise de dados e indicadores; elaboração de requerimentos e instrumentos de fiscalização; pesquisa documental; identificação de problemas e oportunidades de incidência.'],
 ['Assessor/a de emendas parlamentares','Especialista em Emendas Parlamentares','Conhecimento do ciclo orçamentário; compreensão das modalidades de emendas; legislação e regras aplicáveis; identificação de oportunidades de destinação de recursos; análise de demandas municipais/institucionais; acompanhamento da execução; monitoramento de empenho, liquidação e pagamento; relacionamento com órgãos públicos; organização documental; capacidade de identificar riscos de execução.'],
 ['Especialista temático(a) 1','Parecerista Temático','Domínio técnico aprofundado área temática prioritária para o mandat; capacidade  pesquisa, análise de dados e elaboração de parecer técnico temático para orientar tomada de decisão; acompanhamento de políticas públicas e legislação; produção de subsídios para atuação parlamentar; capacidade de identificar tendências e oportunidades; elaboração de propostas; interlocução com especialistas, organizações e atores do setor.'],
 ['Especialista temático(a) 2','Parecerista Temático','Domínio técnico aprofundado área temática prioritária para o mandat; capacidade  pesquisa, análise de dados e elaboração de parecer técnico temático para orientar tomada de decisão; acompanhamento de políticas públicas e legislação; produção de subsídios para atuação parlamentar; capacidade de identificar tendências e oportunidades; elaboração de propostas; interlocução com especialistas, organizações e atores do setor.'],
 ['Coordenador/a de Comunicação Política/ Estratégica','Estrategista de Comunicação Política','planejamento editorial; gestão de marca e posicionamento do mandato; relacionamento com imprensa; gestão de crises; coordenação de equipe e fornecedores; comunicação integrada entre redes, imprensa e canais institucionais; leitura de contexto político; capacidade de transformar ações do mandato em narrativas públicas; coordenação do trabalho de assessores de comunicação'],
 ['Social-media','Executor/a de Comunicação Digital','Produção de textos; redes sociais; fotografia e/ou vídeo; edição de conteúdo; planejamento e execução de publicações; conhecimento de ferramentas digitais; adequação de linguagem aos diferentes públicos; monitoramento de métricas; agilidade; capacidade de trabalhar com calendário e demandas urgentes.'],
 ['Vídeo-maker','','Produção audiovisual e multimídia; edição de foto/vídeo; produção para redes sociais; domínio de ferramentas de edição; adaptação de conteúdos para diferentes formatos; organização de arquivos; agilidade em entrega do material coletado em eventos e atividades parlamentares'],
 ['Assessor(a) de Comunicação em Tempo Real','Sombra da liderança parlamentar','produção audiovisual e multimídia; captação de foto/vídeo; cobertura de agendas; adaptação de conteúdos para diferentes formatos; organização de arquivos; agilidade em cobertura de eventos e atividades parlamentares'],
 ['Coordenador/a de Articulação e Mobilização - chefia','Estrategista de Expansão de Alianças e de Apoiadores','Leitura do ambiente político; mapeamento de atores; construção e manutenção de relações; negociação; gestão de coalizões e alianças; comunicação estratégica; capacidade de representar o mandato; identificação de oportunidades e riscos políticos; coordenação da articulação territorial e institucional; discrição e confiabilidade; coordenação do trabalho de assessores de articulação política.'],
 ['Assessor(a) de Articulação política','Articulador/a Político/a','Mapeamento de atores; relacionamento interpessoal; priorização de agendas estratégicas; contato com lideranças; acompanhamento de compromissos políticos; registro e atualização de informações; capacidade de identificar demandas e encaminhá-las internamente; boa comunicação; discrição; capacidade de construir confiança'],
 ['Líder de Mobilizador(a) territorial','Estrategista de Mobilização Territorial','Gestão territorial; planejamento de mobilização; mapeamento de organizações e lideranças locais; coordenação de equipes; construção de redes; organização de agendas com lideranças políticas territoriais; leitura das demandas locais; gestão de conflitos; capacidade de transformar demandas territoriais em informações úteis ao mandato; monitoramento de resultados;  coordenação do trabalho de assessores de mobilização política'],
 ['Assessor(a) de Mobilização  territorial','Mobilizador/a Territorial','Conhecimento do território; relacionamento com lideranças e organizações; mobilização de públicos; organização de eventos e reuniões; levantamento de demandas; registro de informações; acompanhamento de agendas; comunicação interpessoal; capacidade de criar e manter redes locais.'],
 ['Assessor(a) de Mobilização  territorial','Mobilizador/a Territorial','Conhecimento do território; relacionamento com lideranças e organizações; mobilização de públicos; organização de eventos e reuniões; levantamento de demandas; registro de informações; acompanhamento de agendas; comunicação interpessoal; capacidade de criar e manter redes locais.'],
 ['Assessor(a) de Mobilização  territorial','Mobilizador/a Territorial','Conhecimento do território; relacionamento com lideranças e organizações; mobilização de apoiadores; organização de eventos e reuniões; levantamento de demandas; registro de informações; acompanhamento de agendas; comunicação interpessoal; capacidade de criar e manter redes locais.'],
 ['Coordenação Administrativa','Secretariado Executivo Político','Organização de agenda; gestão de compromissos; organização documental; logística de reuniões e viagens; compra de passagens e marcação de hospedagens;  controle de prazos de pagamentos; relação com assessores; proteção de informações sensíveis; recepção inicial de públicos internos e externos no gabinete; coordenação do trabalho do/a assessor de demandas e do/a motorista'],
 ['Assessor(a) de Demandas','','Atendimento e triagem de demandas vindas da população; distribuição de demandas e acompanhamento de prazos de respostas; organização de informações; gestão de relacionamento com públicos externos.'],
 ['Motorista','Responsável por Deslocamentos e Logística Parlamentar','Direção segura e defensiva; conhecimento básico da cidade e rotas; pontualidade; manutenção e conservação do veículo; planejamento de deslocamentos; discrição; postura profissional; flexibilidade de horários; capacidade de lidar com mudanças de agenda; zelo pela segurança e privacidade do parlamentar e da equipe.'],
];
