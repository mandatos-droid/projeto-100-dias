/* =====================================================================
   MISSÃO 1 · ganchos sobre o Guia original (escrito à mão, não gerado).
   Carregado depois de m5.js. Textos e caixas das sugestões da Alana sobre o Mapa Político (#16 a #23),
   por override sobre MISSOES, Guia e Comp: conteudo.js não é editado (AD-003).
   Cada item de pergunta pode ganhar `caixas`: [{k, rot, antes?}] no lugar da caixa única; `depois:true` põe as caixas
   abaixo dos dados (ilha) em vez de no lugar da caixa. Respostas já salvas seguem nas mesmas chaves (m1.q3, m1.q5, m1.q6).
   ===================================================================== */

/* ---------- caixas de texto por pergunta ---------- */
(function(){
  if(typeof MISSOES==='undefined'||typeof Guia==='undefined'||typeof Comp==='undefined')return;
  var M1=MISSOES.filter(function(m){return m.n===1})[0];
  if(!M1)return;
  function item(ex,k){return ex.itens.filter(function(i){return i.k===k})[0]}
  function exDe(id){return M1.exercicios.filter(function(e){return e.id===id})[0]}

  /* ---- Persona · pergunta 3: o desejo para o futuro vira duas perguntas (SUG-16) ---- */
  var q3=item(exDe('m1.persona'),'m1.q3');
  q3.caixas=[
    {k:'m1.q3',rot:'Elenque quais são as 4 principais conquistas e entregas que o mandato deseja ter alcançado antes do fim da legislatura?'},
    {k:'m1.q3b',rot:'Qual é o próximo cargo que a liderança parlamentar deseja ocupar?'}];

  /* ---- Conjuntura · pergunta 1: os dados primeiro, depois a análise (SUG-17) ----
     Parceiros e concorrentes são marcados na tabela (seleção tabula melhor que texto livre); a caixa é só das pontes não óbvias. */
  var q4=item(exDe('m1.conjuntura'),'m1.q4');
  q4.d='<em>Identifique</em> quem são os/as parlamentares eleitos(as) nesta legislatura, a partir dos dados expostos abaixo. Em seguida, faça uma análise sobre o que esperar dos colegas e das possíveis alianças.';
  q4.depois=true;
  q4.caixas=[{k:'m1.q4b',
    antes:'<div class="orienta"><p>Marque na tabela acima quem é <strong>Parceiro</strong> e quem é <strong>Concorrente</strong> da liderança parlamentar, considerando a região, o perfil pessoal e a disputa partidária.</p></div>',
    rot:'E quais são as pontes não óbvias que podem ser construídas, a partir da criação de espaços de convergência que se baseiem em consensos mínimos e não necessariamente alinhamento completo? Elenque agora os nomes não óbvios, e que serão necessários para que as agendas e pautas avancem.'}];

  /* ---- Conjuntura (partido e território) e Oportunidades (social): texto, dados, caixa de análise (SUG-19) ----
     A pessoa não pesquisa mais: analisa o que está na tela. A caixa vai para depois dos dados e usa o comando da Alana. */
  var ANALISE='A partir dos dados apresentados acima, e de outros que você possa ter pesquisado, faça uma análise destacando o que mais te chama a atenção e como o mandato deve agir a partir desta conjuntura.';
  var q5=item(exDe('m1.conjuntura'),'m1.q5');
  q5.d='A análise da quantidade de cargos ocupados pelo partido na sua Casa Legislativa, no território nacional e em seu domicílio eleitoral, dos setoriais e diretórios de que a liderança parlamentar pode passar a fazer parte, do tipo de relação que deseja ter com o partido e dos desafios e oportunidades de expansão da relevância partidária da liderança parlamentar é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida.';
  [['m1.conjuntura','m1.q5','m1.q5'],['m1.conjuntura','m1.q6','m1.q6'],['m1.oportunidades','m1.q8','m1.q8a']].forEach(function(c){
    var it=item(exDe(c[0]),c[1]);
    it.depois=true;
    it.caixas=[{k:c[2],rot:ANALISE}];
  });

  /* ---------- mecanismo ---------- */
  function caixa(c){
    return (c.antes||'')+'<label class="campo"><span class="rot">'+esc(c.rot)+'</span>'+
      '<textarea data-k="'+c.k+'" placeholder="Escreva aqui a resposta da equipe"></textarea></label>';
  }
  function ta(k){return new RegExp('<textarea data-k="'+k.replace(/\./g,'\\.')+'"[^>]*></textarea>')}
  /* troca a caixa única do item (ou o espaço dela) pelas caixas do item */
  function injeta(h,it){
    var cx=it.caixas.map(caixa).join(''),pos=it.depois&&it.ilha?'<div class="ilha" data-ilha="'+it.ilha+'"></div>':null;
    var MARCA='\u0001',vazio='<label class="campo"></label>';
    h=h.replace(ta(it.k),MARCA).replace(vazio,'');
    if(pos&&h.indexOf(pos)>=0)return h.replace(MARCA,'').replace(pos,function(){return pos+cx});
    if(h.indexOf(MARCA)>=0)return h.replace(/(<\/label>)?\u0001(<\/label>)?/,function(_t,a,b){return (b||a||'')+cx}).replace(vazio,'');
    return h+cx;
  }
  var _gb=Guia.bloco;
  Guia.bloco=function(p,n){
    var h=_gb.call(this,p,n);
    if(p&&p.k==='pergunta'&&this.m&&this.m.n===1){
      var it=this.ex.itens[p.n];
      if(it&&it.caixas)return injeta(h,it);
    }
    return h;
  };
  var _cp=Comp.perguntas;
  Comp.perguntas=function(ex){
    var h=_cp.call(this,ex);
    if(!ex||!ex.itens)return h;
    ex.itens.forEach(function(it){if(it.caixas)h=injeta(h,it)});
    return h;
  };
})();

/* ---------- Fragilidades: comando, checklist e plano de estudo numa página só (SUG-22, SUG-23) ----------
   O passo "Para fechar" some: o diagnóstico e o bloco "Tornando fragilidades em fortalezas!" vêm depois do checklist. */
(function(){
  if(typeof MISSOES==='undefined'||typeof Guia==='undefined'||typeof Comp==='undefined')return;
  var ex=MISSOES.filter(function(m){return m.n===1})[0].exercicios.filter(function(e){return e.id==='m1.frag'})[0];
  if(!ex)return;
  ex.fim='<h4>Tornando fragilidades em fortalezas!</h4>'+
    '<p>Agora que já conseguiu identificar o que o mandato e a liderança ainda não dominam, crie um plano de estudo para ambos, com prazo certo para ter transformado a fragilidade mapeada em fortaleza.</p>'+
    '<p>Mesmo quem já trabalha com política há um tempo precisa se qualificar e até mesmo aprofundar seus conhecimentos técnicos!</p>'+
    '<p>Quem sabe mais sobre os temas do Legislativo consegue articular melhor com os pares e assessores, negociar com presidências de comissão e da Mesa Diretora, com base no Regimento, e passa a ser visto como referência de excelência - o que pode influenciar, inclusive, no momento da disputa por cargos de decisão ou de relatorias relevantes.</p>'+
    '<p><a href="#/biblioteca">Clique no link da nossa Biblioteca</a> e acesse alguns conteúdos para começar sua jornada ou encaminhe aos assessores!</p>'+
    '<p>Além disso, recorra à Escola do Legislativo da Casa em que está, pois elas costumam ter treinamentos periódicos e até realizar mentorias individuais que facilitam, e muito, o processo de fazer com que o seu mandato seja ainda mais especialista.</p>';

  var _mt=Guia.montar;
  Guia.montar=function(e){
    if(e&&e.id==='m1.frag')return [{k:'componente'}];
    return _mt.call(this,e);
  };
  var _fr=Comp.frag;
  Comp.frag=function(e){
    var h=_fr.call(this,e);
    if(e&&e.id==='m1.frag')h+=Comp.diagFrag().replace('nos passos anteriores','na lista acima')+'<div class="texto">'+e.fim+'</div>';
    return h;
  };
})();
