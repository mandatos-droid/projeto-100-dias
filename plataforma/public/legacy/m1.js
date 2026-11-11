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

  /* ---- Persona · pergunta 3: até 3 conquistas em cartões próprios, e o próximo cargo (PER-07 a PER-09) ----
     A caixa única antiga (m1.q3) deixa de ser editável, mas o texto segue gravado e aparece como "Resposta anterior". */
  var q3=item(exDe('m1.persona'),'m1.q3');
  q3.d='<em>Elenque</em> quais são as principais conquistas ou grandes entregas que o mandato deseja ter alcançado antes do fim da legislatura. Registre até 3:';
  function respostaAnterior(){
    var v=D.campos&&D.campos['m1.q3'];
    if(!v||(typeof richVazio==='function'&&richVazio(v)))return '';
    return '<div class="apoio resposta-anterior"><span class="tag">Resposta anterior</span><div class="texto">'+(typeof rich==='function'?rich(v):esc(v))+'</div></div>';
  }
  q3.caixas=[
    {k:'m1.q3c1',resumo:'Conquista/Grande Entrega almejada 1',rot:'Conquista/Grande Entrega almejada 1',get antes(){return respostaAnterior()}},
    {k:'m1.q3c2',resumo:'Conquista/Grande Entrega almejada 2',rot:'Conquista/Grande Entrega almejada 2'},
    {k:'m1.q3c3',resumo:'Conquista/Grande Entrega almejada 3',rot:'Conquista/Grande Entrega almejada 3'},
    {k:'m1.q3b',resumo:'Próximo cargo que a liderança deseja ocupar',rot:'Qual é o próximo cargo que a liderança parlamentar gostaria de ocupar?',
      grupos:[['Legislativo',['Vereador(a)','Deputado(a) estadual/distrital','Deputado(a) federal','Senador(a)']],
        ['Executivo',['Secretário(a) municipal','Vice-prefeito(a)','Prefeito(a)','Secretário(a) estadual','Vice-governador(a)','Governador(a)','Ministro(a) de Estado','Vice-presidente','Presidente da República']]],
      extra:['Não sei / não desejo registrar']}];

  /* ---- Persona · pergunta 2: os pleitos já vêm preenchidos (TSE), então o comando é de análise, não de levantamento (SUG-87) ---- */
  var q2=item(exDe('m1.persona'),'m1.q2');
  q2.d='<em>Analise</em> as campanhas eleitorais que a liderança percorreu, a partir dos pleitos apresentados abaixo, já preenchidos com os dados do TSE: os cargos disputados, a quantidade de votos e o(s) partido(s) escolhido(s). Procure compreender a história política, as estratégias de campanha, as aproximações e distanciamentos que o/a fizeram chegar ao cargo que conquistou hoje. Se faltar algum pleito, lance-o à mão pelo “+”.';
  /* PER-06: logo abaixo dos dados (pleitos), o texto do papel da assessoria e só então a caixa de análise (mesma chave m1.q2) */
  q2.depois=true;
  q2.caixas=[{k:'m1.q2',rot:'Registre a sua análise da trajetória política',
    antes:'<div class="orienta"><p>Seu papel agora é registrar a história política que traz sentido aos dados. O que justifica esta trajetória? O que os demais assessores precisam saber para compreender o caminho percorrido?</p></div>'}];

  /* ---- Conjuntura · pergunta 1: os dados primeiro, depois a análise (SUG-17) ----
     Aliados, opositores e potenciais relacionamentos são marcados na tabela (seleção tabula melhor que texto livre); a caixa é só das pontes não óbvias. */
  var q4=item(exDe('m1.conjuntura'),'m1.q4');
  q4.d='<em>Identifique</em> quem são os/as parlamentares eleitos(as) nesta legislatura, a partir dos dados expostos abaixo. Em seguida, faça uma análise sobre o que esperar dos colegas e das possíveis alianças.';
  q4.depois=true;
  q4.caixas=[{k:'m1.q4b',resumo:'Pontes não óbvias',
    antes:'<div class="orienta"><p>Marque na tabela acima quem é <strong>Aliado</strong>, quem é <strong>Opositor</strong> e quem é um <strong>Potencial relacionamento</strong> para a liderança parlamentar, considerando a região, o perfil pessoal e a disputa partidária. O botão “i” explica cada categoria.</p></div>',
    rot:'E quais são as pontes não óbvias que podem ser construídas, a partir da criação de espaços de convergência que se baseiem em consensos mínimos e não necessariamente alinhamento completo? Elenque agora os nomes não óbvios, e que serão necessários para que as agendas e pautas avancem.'}];

  /* ---- Conjuntura (partido e território) e Oportunidades (social): texto, dados, caixa de análise (SUG-19) ----
     A pessoa não pesquisa mais: analisa o que está na tela. A caixa vai para depois dos dados e usa o comando da Alana. */
  var ANALISE='A partir dos dados apresentados acima, e de outros que você possa ter pesquisado, faça uma análise destacando o que mais te chama a atenção e como o mandato deve agir a partir desta conjuntura.';
  var q5=item(exDe('m1.conjuntura'),'m1.q5');
  q5.d='A análise da quantidade de cargos ocupados pelo partido na sua Casa Legislativa, no território nacional e em seu domicílio eleitoral, dos setoriais e diretórios de que a liderança parlamentar pode passar a fazer parte, do tipo de relação que deseja ter com o partido e dos desafios e oportunidades de expansão da relevância partidária da liderança parlamentar é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida.';
  [['m1.conjuntura','m1.q5','m1.q5'],['m1.conjuntura','m1.q6','m1.q6'],['m1.oportunidades','m1.q8','m1.q8a']].forEach(function(c){
    var it=item(exDe(c[0]),c[1]);
    it.depois=true;
    it.caixas=[{k:c[2],rot:ANALISE,resumo:c[2]==='m1.q8a'?'Análise da conjuntura social':undefined}];
  });

  /* ---------- mecanismo ---------- */
  function caixa(c){
    if(c.grupos)return (c.antes||'')+'<label class="campo"><span class="rot">'+esc(c.rot)+'</span><select data-k="'+c.k+'"><option value="">Selecione um cargo</option>'+
      c.grupos.map(function(g){return '<optgroup label="'+g[0]+'">'+g[1].map(function(o){return '<option value="'+esc(o)+'">'+esc(o)+'</option>'}).join('')+'</optgroup>'}).join('')+(c.extra||[]).map(function(o){return '<option value="'+esc(o)+'">'+esc(o)+'</option>'}).join('')+'</select></label>';
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

/* ---------- Faixa das 4 etapas do Mapa Político (SUG-21) ----------
   Cada exercício da Missão 1 é uma etapa; a faixa deixa claro que são 4 e qual é a atual. */
(function(){
  if(typeof MISSOES==='undefined'||typeof Guia==='undefined')return;
  var M1=MISSOES.filter(function(m){return m.n===1})[0];
  var frag=M1&&M1.exercicios.filter(function(e){return e.id==='m1.frag'})[0];
  if(!frag)return;
  frag.t='As fragilidades e fortalezas';
  var ETAPAS=[['m1.persona','A Persona'],['m1.conjuntura','A Conjuntura'],['m1.oportunidades','As Oportunidades e Ameaças'],['m1.frag','As Fragilidades e Fortalezas']];
  Guia.faixaEtapas=function(id){
    return '<nav class="m1-etapas" aria-label="As 4 etapas do Mapa Político"><ol>'+ETAPAS.map(function(e,i){
      var atual=e[0]===id;
      return '<li'+(atual?' aria-current="step"':'')+'><a href="#/m/1/'+e[0]+'"><b>'+(i+1)+'</b><span>'+e[1]+'</span></a></li>';
    }).join('')+'</ol></nav>';
  };
  var _r=Guia.render;
  Guia.render=function(){
    _r.apply(this,arguments);
    if(!this.m||this.m.n!==1||!this.ex)return;
    var tl=document.getElementById('tela'),et=tl&&tl.querySelector('.etiqueta');
    if(et)et.insertAdjacentHTML('beforebegin',this.faixaEtapas(this.ex.id));
  };
})();

/* ---------- Página única por etapa (PAG-01, PAG-03, PAG-04) ----------
   Na Missão 1 cada etapa mostra todas as perguntas de uma vez (modo "tudo" do Guia), sem o botão de alternar modo e sem
   "Anterior"/"Avançar" entre perguntas. Um endereço antigo de passo (#/m/1/etapa/N) abre a página única da etapa.
   As Missões 2 a 5 seguem no passo a passo: o modo anterior é devolvido ao sair da Missão 1. */
(function(){
  if(typeof Guia==='undefined')return;
  var forcou=false,antes='guiado';
  var _r=Guia.render;
  Guia.render=function(){
    var m1=!!(this.m&&this.m.n===1);
    if(m1){
      if(!forcou){antes=this.modo;forcou=true}
      this.modo='tudo';this.i=0;
    }else if(forcou){this.modo=antes;forcou=false}
    _r.apply(this,arguments);
    if(!m1)return;
    var tl=document.getElementById('tela'),bt=tl&&tl.querySelector('button[onclick="Guia.alternarModo()"]');
    if(bt&&bt.parentNode)bt.parentNode.removeChild(bt);
  };
  var _ir=Guia.ir;
  Guia.ir=function(n){
    if(this.m&&this.m.n===1){this.render();return}
    return _ir.call(this,n);
  };
  var _ab=Guia.abrir;
  Guia.abrir=function(nm,id){
    _ab.call(this,nm,id);
    if(!this.m||this.m.n!==1)return;
    var h=location.hash||'',base='#/m/1/'+this.ex.id;
    if(h!==base&&h.indexOf(base+'/')===0&&history.replaceState)history.replaceState(null,'',base);
  };
})();

/* ---------- Resumo: as respostas das caixas novas (m1.q3b, m1.q4b, m1.q8a) aparecem junto das da Missão 1 ---------- */
(function(){
  if(typeof Resumo==='undefined'||typeof MISSOES==='undefined')return;
  var _ex=Resumo.ex;
  Resumo.ex=function(ex){
    var h=_ex.apply(this,arguments);
    if(!ex||ex.tipo!=='perguntas'||!ex.itens)return h;
    var extra='';
    ex.itens.forEach(function(it){
      (it.caixas||[]).forEach(function(c){
        if(c.resumo)extra+='<dt>'+esc(c.resumo)+'</dt><dd>'+Resumo.v(c.k)+'</dd>';
      });
    });
    var i=h.lastIndexOf('</dl>');
    return extra&&i>=0?h.slice(0,i)+extra+h.slice(i):h;
  };
})();
