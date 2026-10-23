/* =====================================================================
   MISSÃO 2 · ganchos sobre o Guia original (escrito à mão, não gerado).
   Carregado depois de novos.js. Cada gancho sobrescreve uma função do legado.
   ===================================================================== */

/* ---------- A escalação do time: uma ilha de 3 etapas no lugar da lista de 20 campos de nome ---------- */
(function(){
  Comp.funcoes=function(){return '<div class="ilha" data-ilha="equipe-escalacao"></div>'};

  var m=MISSOES.filter(function(x){return x.n===2})[0];
  if(!m)return;
  var f=m.exercicios.filter(function(e){return e.id==='m2.funcoes'})[0];
  var g=m.exercicios.filter(function(e){return e.id==='m2.gestao'})[0];

  if(f){
    f.d='Escolher as áreas, ajustar as cadeiras e dar nome, coordenação e liderança a cada uma.';
    f.intro='<p>Ao invés de encaixar pessoas em cargos, comece pela estrutura: primeiro as áreas do mandato, depois as cadeiras de cada área e só então os nomes.</p>'+
      '<p><strong>O exercício tem 3 etapas.</strong> Na 1ª você escolhe as áreas. Na 2ª ajusta as cadeiras. Na 3ª escreve o nome de quem ocupa cada cadeira, a coordenação e a liderança imediata, <u>levando em consideração se a pessoa domina a maioria das competências esperadas para o cargo</u>. Se ainda não há ninguém com essas competências, escreva <strong>*</strong> no lugar do nome para abrir processo seletivo de ampla concorrência.</p>'+
      '<p>As atribuições e o perfil de cada cargo você define no próximo exercício, direto no organograma.</p>';
  }

  /* ---------- Organograma e rotinas: organograma interativo, rotinas geradas e a entrega ---------- */
  if(g){
    g.d='Escopo de cada cargo no organograma, rotinas das áreas e entrega final da Missão.';
    g.intro='<p>Com o time escalado, é hora de definir o trabalho de cada cadeira e como o mandato se encontra e se comunica. Tudo o que você preencher aqui alimenta o resultado final da Missão: cadeiras, escopo de cada cargo, organograma e rotinas.</p>'+
      '<h4>1. Organograma e escopo de trabalho de cada cargo</h4>'+
      '<p><strong>Objetivo:</strong> estabelecer com clareza as responsabilidades, atribuições e limites de atuação de cada cargo, evitando sobreposições e lacunas, e estruturar visualmente todas as áreas, cargos e relações de coordenação do mandato.</p>'+
      '<p><strong>Importância:</strong> facilitar a distribuição e o cumprimento de tarefas, aumentar a autonomia da equipe, reduzir conflitos, retrabalho e dependência excessiva do parlamentar ou da chefia de gabinete, e apoiar a integração e a identificação da equipe.</p>'+
      '<div class="apoio"><span class="tag">Como fazer</span>Clique na caixa de uma cadeira para definir o escopo de trabalho, as especificidades, o perfil e o repertório. Cada caixa mostra quanto já foi preenchido.</div>'+
      '<div class="ilha" data-ilha="organograma"></div>'+
      '<div class="apoio"><span class="tag">Próximo passo</span>Compartilhe o escopo de trabalho e a estrutura do mandato com toda a equipe, desde o momento da contratação: hierarquias, possibilidades de ascensão e interações entre áreas. Com o escopo conhecido, é possível cobrar e reconhecer em cima do que foi combinado.</div>'+
      '<h4>2. Fluxos de trabalho e rotinas de comunicação entre as equipes</h4>'+
      '<p><strong>Objetivo:</strong> definir os momentos de encontro coletivo e dentro de cada área, como as demandas circulam pelo mandato, quem é acionado em cada situação e quais são as principais rotinas de alinhamento.</p>'+
      '<p><strong>Importância:</strong> criar previsibilidade e integração, reduzir ruídos de comunicação e atrasos, melhorar a coordenação entre as áreas e permitir que o mandato funcione de forma menos dependente de orientações individuais do parlamentar.</p>'+
      '<div class="apoio"><span class="tag">Como fazer</span>As rotinas nascem das cadeiras que você montou. Veja as rotinas de cada área, a cadeia de rotinas com as cadeiras envolvidas e registre as conversas entre áreas.</div>'+
      '<div class="ilha" data-ilha="rotinas"></div>'+
      '<h4>3. A entrega da Missão 2</h4>'+
      '<p>Aqui está o resultado: cadeiras, escopo de cada cargo, organograma e rotinas. Exporte o organograma ou imprima a página para compartilhar com a equipe.</p>'+
      '<div class="ilha" data-ilha="entrega"></div>'+
      '<div class="apoio atencao"><span class="tag">Atenção</span>Não é necessário chegar, imediatamente, até o que está previsto em "próximo passo". Você poderá fazê-lo até o fim dos primeiros 45 dias. O checklist abaixo traz o que deve ser estabelecido antes de partir para a próxima missão.</div>';
  }
})();
