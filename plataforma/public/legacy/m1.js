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

  /* ---- Conjuntura · 2.1: texto, 2 orientações e as 5 categorias; sem a pergunta das "pontes" (LEG-04, LEG-05) ----
     Aliados, oponentes e indefinidos são marcados na tabela (ilha), então a pergunta não tem caixa de texto: m1.q4 e m1.q4b
     continuam gravadas, só deixam de ser mostradas. As definições são as do documento da Alana. */
  var q4=item(exDe('m1.conjuntura'),'m1.q4');
  q4.d='Analise qual é o tipo de relação que a liderança parlamentar tem com as pessoas eleitas.</p>'+
    '<p>Siga as seguintes orientações para realizar a análise:</p>'+
    '<ol><li>Crie categorias iniciais de análise, por meio do filtro, para iniciar sua avaliação.</li>'+
    '<li>A partir dos nomes filtrados, classifique como é a relação atual da liderança parlamentar com os perfis dos colegas parlamentares listados. Caso tenha necessidade, mude o filtro e faça novas classificações. Não é necessário esgotar este processo com todas as cadeiras da Casa.</li></ol>'+
    '<p><strong>Categorias de classificação:</strong></p>'+
    '<ul class="categorias-relacao">'+
    '<li><strong>Aliado:</strong> para aqueles com quem já tem uma boa relação e o mandato sabe que pode contar durante votações, por exemplo.</li>'+
    '<li><strong>Aliado, mas concorrente:</strong> para aqueles com quem já tem uma boa relação, mas cujas agendas defendidas ou o território da base de apoio lhes impõem uma competição direta.</li>'+
    '<li><strong>Oponente:</strong> para as lideranças com quem a liderança parlamentar já teve algum embate ou cujos posicionamentos são contrários ao que defende.</li>'+
    '<li><strong>Oponente e concorrente:</strong> para colegas com quem a relação é ou tende a ser desafiadora, e ainda existe uma disputa direta de agendas ou território.</li>'+
    '<li><strong>Indefinida:</strong> para perfis com quem haja potencial de construção de espaços de convergência e que pode ser aliado ou oponente, a depender da pauta debatida, e cuja relação ainda precisa ser desenvolvida.</li></ul>'+
    '<p>Os dados abaixo são a base da sua análise.';
  q4.depois=true;
  /* depois da tabela de parlamentares: a caixa aberta que antes era "Principais atores políticos do entorno" (sugestões #156 e #158) */
  q4.caixas=[{k:'m1.q4c',resumo:'Estratégias iniciais para conquistar novas pessoas aliadas',
    rot:'A partir das relações mapeadas, registre abaixo quais são as estratégias iniciais para conquistar novas pessoas aliadas, ainda nestes primeiros 100 dias, a partir da aproximação com aqueles que classificou como "Indeterminada". Lembre-se de considerar a importância de encontrar os pontos de possíveis consensos para avanço do projeto político.'}];

  /* ---- Conjuntura · 2.2: contexto antes dos dados; depois deles, os dois textos de PAR-09 (PAR-01, PAR-09) ---- */
  var q5=item(exDe('m1.conjuntura'),'m1.q5');
  q5.d='A análise da quantidade de cargos ocupados pelo partido na sua Casa Legislativa, no território nacional e em seu domicílio eleitoral, dos setoriais e diretórios de que a liderança parlamentar pode passar a fazer parte, do tipo de relação que deseja ter com o partido e dos desafios e oportunidades de expansão da relevância partidária da liderança parlamentar é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida.';
  q5.depois=true;
  /* ordem da sugestão #205: texto sobre a relação com o partido, enunciado dos 2 dados e só então a caixa; o seletor de dados na tela saiu */
  q5.caixas=[{texto:'Identifique que tipo de relação com o partido a liderança parlamentar deseja ter, à luz destes dados, refletindo como o mandato pode contribuir para o fortalecimento do partido e como pode se posicionar diante do poder Executivo.'},
    {k:'m1.q5',rot:'Selecione 2 dados e registre como a liderança parlamentar deseja que o mandato reaja a eles.'}];

  /* ---- Conjuntura · sem a pergunta 2.3 nem a caixa de atores: a antiga m1.q6 foi removida (sugestões #156 e #158) ----
     A resposta antiga continua gravada em m1.q6 (só deixa de ser mostrada). */
  var conj=exDe('m1.conjuntura');
  conj.itens=conj.itens.filter(function(i){return i.k!=='m1.q6'});
  conj.d='Duas perguntas sobre a legislatura e o partido.';

  /* ---- Oportunidades (social): a caixa de análise vai para depois dos dados (SUG-19) ---- */
  var ANALISE='A partir dos dados apresentados acima, e de outros que possa ter pesquisado, destaque os 10 indicadores que o mandato poderia ter como referência para sustentar seu trabalho desde o começo da Legislatura.';
  var opo=exDe('m1.oportunidades');
  opo.d='Três perguntas sobre as expectativas do eleitorado, a conjuntura social do território e as agendas prioritárias.';
  /* 3.1: o texto da Alana já era o do Guia original (SOC-01); fica aqui conferido, antes das colunas de registro */
  item(opo,'m1.q7').d='<em>Elenque</em> quais foram os posicionamentos públicos e as promessas mais relevantes da sua campanha. Identifique também as regiões e os grupos sociais que mais apoiaram a candidatura e eleição, e também aqueles com potencial para maior aproximação ao longo dos anos que seguem.';
  /* 3.2: texto novo, dados e só então a caixa de análise (SOC-02, SOC-07) */
  var q8=item(opo,'m1.q8');
  q8.ilha='agendas-sociais'; /* cartões por agenda no lugar do mapa social (SOC-02, SOC-03); a ilha 'social' sai da Missão 1 */
  q8.d='Neste exercício usaremos dados sociais públicos, que são apresentados por meio dos indicadores vindos dos Objetivos de Desenvolvimento Sustentável - ODS.</p>'+
    '<p>Os 17 ODS contemplam um guarda-chuva de mais de 200 indicadores.</p>'+
    '<p>Apresentamos alguns a seguir, para que seu mandato se inspire em evidências para apoiar a tomada de decisão sobre as soluções que desejam entregar para a sociedade.';
  /* 3.3: as agendas prioritárias, escolhidas na ilha (AGE-01); a pergunta é nova e não tem caixa de texto */
  opo.itens.push({k:'m1.q9',ilha:'prioritarias',t:'Quais são as agendas prioritárias?',
    d:'Considerando os dados acima e as promessas de campanha, selecione quais são as Agendas que serão trabalhadas prioritariamente pela liderança parlamentar ao longo dos 100 Primeiros dias, mas também ao longo deste primeiro ano:',caixas:[]});
  q8.depois=true;
  q8.caixas=[{k:'m1.q8a',rot:ANALISE,resumo:'Análise da conjuntura social'}];

  /* ---------- mecanismo ---------- */
  function caixa(c){
    if(c.texto)return '<div class="orienta"><p>'+c.texto+'</p></div>';
    if(c.grupos)return (c.antes||'')+'<label class="campo"><span class="rot">'+esc(c.rot)+'</span><select data-k="'+c.k+'"><option value="">Selecione um cargo</option>'+
      c.grupos.map(function(g){return '<optgroup label="'+g[0]+'">'+g[1].map(function(o){return '<option value="'+esc(o)+'">'+esc(o)+'</option>'}).join('')+'</optgroup>'}).join('')+(c.extra||[]).map(function(o){return '<option value="'+esc(o)+'">'+esc(o)+'</option>'}).join('')+'</select></label>';
    return (c.antes||'')+'<label class="campo"><span class="rot">'+esc(c.rot)+'</span>'+
      '<textarea data-k="'+c.k+'" placeholder="Escreva aqui a resposta da equipe"></textarea></label>';
  }
  function ta(k){return new RegExp('<textarea data-k="'+k.replace(/\./g,'\\.')+'"[^>]*></textarea>')}
  function caixasDe(it){
    if(it.k==='m1.q3'&&it.caixas.length===4){
      var ant=it.caixas[0].antes||'';
      var cols=it.caixas.slice(0,3).map(function(c){
        return caixa({k:c.k,resumo:c.resumo,rot:c.rot});
      }).join('');
      return ant+'<div class="np-3col">'+cols+'</div>'+caixa(it.caixas[3]);
    }
    return it.caixas.map(caixa).join('');
  }
  /* troca a caixa única do item (ou o espaço dela) pelas caixas do item */
  function injeta(h,it){
    var cx=caixasDe(it),pos=it.depois&&it.ilha?'<div class="ilha" data-ilha="'+it.ilha+'"></div>':null;
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
  var _gb2=Guia.bloco;
  Guia.bloco=function(p,n){
    var h=_gb2.call(this,p,n);
    var eid=this.ex&&this.ex.id;
    if(eid==='m1.persona'||eid==='m1.oportunidades')return '<div class="np-sec-card">'+h+'</div>';
    if(eid==='m1.conjuntura'){
      var cid=p&&p.k==='pergunta'&&p.n===0?'cj-21':p&&p.k==='pergunta'&&p.n===1?'cj-22':'';
      return '<div class="np-sec-card"'+(cid?' id="'+cid+'"':'')+'>'+h+'</div>';
    }
    if(eid==='m1.frag'&&p&&p.k==='componente'){
      var sep='<div class="np-frag-layout">',ix=h.indexOf(sep);
      return ix>=0?'<div class="np-sec-card">'+h.slice(0,ix)+'</div>'+h.slice(ix):'<div class="np-sec-card">'+h+'</div>';
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
  /* FRA-01: título e instrução M/P como no documento da Alana (a lista, com "Sistemas" no plural, já vem do conteudo.js) */
  ex.intro='<p><strong>Quais são os conhecimentos e/ou práticas que a liderança parlamentar ou a equipe ainda não domina(m) para um bom exercício do mandato?</strong></p>'+
    '<p>Selecione Gabinete para fragilidades da equipe do mandato e Parlamentar para as fragilidades da liderança parlamentar.</p>'+
    '<p><em>Mapeie</em> todas as fragilidades a serem superadas.</p>';
  /* FRA-03: o convite a ampliar a lista vem logo depois dela */
  var CASO='<div class="texto"><p><em>Caso sinta falta de algum outro tema, suba na lista e crie um plano de estudos para ir se familiarizando com os assuntos. Na nossa Biblioteca você encontra informações introdutórias, além de sites de referência sobre os assuntos acima. Recomendamos fortemente o estudo do que ainda não se tem conhecimento em profundidade para potencializar uma melhor atuação política nos meses que seguem!</em></p></div>';
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
    if(!e||e.id!=='m1.frag')return h;
    return '<div class="np-frag-layout">'+
      '<div class="np-sec-card">'+h+CASO+'</div>'+
      '<div class="np-frag-sticky">'+
        '<div class="np-sec-card">'+Comp.diagFrag().replace('nos passos anteriores','na lista acima')+'</div>'+
        '<div class="np-sec-card"><div class="texto">'+e.fim+'</div></div>'+
      '</div>'+
    '</div>';
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
    var eid=this.ex&&this.ex.id;
    if(tl&&(eid==='m1.persona'||eid==='m1.conjuntura'||eid==='m1.oportunidades')){
      var anc=eid==='m1.conjuntura'?'<nav class="np-ancoras" aria-label="Atalhos desta etapa">'+
        '<button type="button" onclick="document.getElementById(\'cj-21\').scrollIntoView({behavior:\'smooth\'})">2.1 Legislatura e Hemiciclo</button>'+
        '<button type="button" onclick="document.getElementById(\'cj-22\').scrollIntoView({behavior:\'smooth\'})">2.2 Força do Partido e Municípios</button></nav>':'';
      if(tl.querySelectorAll){
        tl.querySelectorAll('.passo-corpo > hr.regra').forEach(function(hr){if(hr.parentNode)hr.parentNode.removeChild(hr)});
        var pc=tl.querySelector('.passo-corpo');
        if(anc&&pc&&pc.insertAdjacentHTML)pc.insertAdjacentHTML('beforebegin',anc);
      }else if(tl.innerHTML){
        tl.innerHTML=tl.innerHTML.replace(/<hr class="regra">/g,'');
        if(anc)tl.innerHTML=tl.innerHTML.replace('<div class="passo-corpo">',anc+'<div class="passo-corpo">');
      }
    }
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

/* ---------- Capa da Missão 1 (#/m/1) no layout Nova Proposta ---------- */
(function(){
  if(typeof Telas==='undefined'||!Telas.missao||typeof MISSOES==='undefined')return;
  var _tm=Telas.missao;
  Telas.missao=function(n){
    if(n!==1)return _tm.apply(this,arguments);
    var m=MISSOES.filter(function(x){return x.n===1})[0];
    if(!m)return this.painel();
    var p=progMissao(m);
    var h='<div class="etiqueta">Missão '+m.n+' · '+esc(m.prazoTxt)+
      (dataPrazo(m)&&!m.continua?' · até '+dBRc(dataPrazo(m)):'')+'</div>'+
      '<div class="np-card" style="border-left:6px solid '+m.cor+';margin-bottom:1.5rem">'+
        '<h1 class="largo" style="font-size:clamp(1.85rem,3.4vw,2.65rem)">'+esc(m.titulo)+'</h1>'+
        '<p class="chamada" style="margin-bottom:0">'+esc(m.abre)+'</p>'+
      '</div>'+
      '<div class="np-m1-pilares">'+m.agenda.map(function(a,i){
        return '<div class="np-pilar" style="--c:'+m.cor+'"><b>'+(i+1)+'</b><span>'+esc(a)+'</span></div>';
      }).join('')+'</div>'+
      '<div class="np-card" style="margin-bottom:1.5rem">'+
        '<div class="texto">'+m.resumo+'</div>'+
        '<div class="quadro">'+
          '<div><h4>Ao terminar você terá</h4><ul>'+m.entrega.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></div>'+
          '<div><h4>Momento ideal</h4><ul>'+m.momento.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></div>'+
          '<div><h4>Quem conduz</h4><ul>'+m.lidera.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></div>'+
        '</div>'+
        '<p style="font-size:13.5px;color:var(--tinta-3);margin:0">'+esc(NOTA_PRAZO)+'</p>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.75rem">'+
        '<h2 style="margin:0">Mão na massa <span style="font-family:Commissioner;font-size:15px;font-weight:700;color:var(--tinta-3)">'+p.feitos+' de '+p.total+'</span></h2>'+
      '</div>'+
      '<div class="np-ex-grid">'+m.exercicios.map(function(ex,idx){
        var e=estadoEx(ex);
        return '<button type="button" class="np-ex-card ex-item '+e+'" onclick="location.hash=\'#/m/'+m.n+'/'+ex.id+'\'">'+
          '<div style="display:flex;align-items:center;gap:12px;width:100%;flex-wrap:wrap"><span class="sinal"></span><span class="ex-t" style="margin:0">'+(idx+1)+'. '+esc(ex.t)+'</span><span class="selo '+e+'" style="margin-left:auto">'+Telas.estadoTxt(ex,e)+'</span></div>'+
          '<p class="ex-d">'+esc(ex.d)+'</p>'+
          '<span style="font-size:0.84rem;font-weight:700;color:var(--vinho)">Abrir etapa →</span></button>';
      }).join('')+'</div>'+
      (m.fecho?'<div class="apoio exemplo" style="margin-top:1.25rem"><span class="tag">Pronto</span>'+m.fecho+'</div>':'');
    document.getElementById('tela').innerHTML=h;
  };
})();

/* ---------- Andamento: cartões, carrosséis e seletores novos também contam como "em andamento" (GER-03) ----------
   O temConteudo do núcleo olha só as caixas de texto (D.campos). Aqui, responder só em D.eleitorado, D.agendasPrio,
   D.conj2.reacoes, nas conquistas (m1.q3c1..c3; o cargo opcional m1.q3b não conta, como no Resumo) ou em m1.q6 já marca a etapa. nucleo.js não é editado (AD-003). */
(function(){
  if(typeof temConteudo==='undefined')return;
  var _tc=temConteudo;
  function cheio(k){return String((D.campos||{})[k]||'').trim()!==''}
  function algum(ks){return ks.some(cheio)}
  temConteudo=function(ex){
    if(_tc.apply(this,arguments))return true;
    if(!ex||String(ex.id).indexOf('m1.')!==0)return false;
    if(ex.id==='m1.persona')return algum(['m1.q3c1','m1.q3c2','m1.q3c3']);
    if(ex.id==='m1.conjuntura'){
      var re=(D.conj2&&D.conj2.reacoes)||[];
      return algum(['m1.q4c','m1.q6'])||re.some(function(r){return r&&(String(r.dado||'').trim()||String(r.texto||'').trim())});
    }
    if(ex.id==='m1.oportunidades')
      return !!(D.eleitorado&&(D.eleitorado.itens||[]).length)||(D.agendasPrio||[]).length>0||cheio('m1.q8a');
    return false;
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
    /* a caixa de atores saiu da tela (#156); o que já tinha sido escrito nela continua aparecendo no Resumo */
    if(ex.id==='m1.conjuntura'&&String((D.campos||{})['m1.q6']||'').trim()!=='')extra+='<dt>Principais atores políticos do entorno</dt><dd>'+Resumo.v('m1.q6')+'</dd>';
    ex.itens.forEach(function(it){
      (it.caixas||[]).forEach(function(c){
        if(c.resumo)extra+='<dt>'+esc(c.resumo)+'</dt><dd>'+Resumo.v(c.k)+'</dd>';
      });
    });
    var i=h.lastIndexOf('</dl>');
    return extra&&i>=0?h.slice(0,i)+extra+h.slice(i):h;
  };
})();

/* ---------- HTML do Mapa Político (FEC-02, FEC-03, FEC-05) ----------
   Mesmo conteúdo da aba Resumo (Resumo.missao da Missão 1), mais os cartões de município (2.2) e de agenda (3.2) em HTML
   estático. Os dados dos cartões vêm de `Ilhas.dadosMapaPolitico()` (ilhas/dadosMapa.ts); o carrossel e o filtro rodam
   por um <script> inline, então o arquivo funciona fora da plataforma. Fica aqui e não no resumo.js, que o
   extrair_legado.py sobrescreve (AD-003). */
(function(){
  if(typeof Baixar==='undefined'||typeof Resumo==='undefined'||typeof MISSOES==='undefined')return;
  var FAIXAS=['Muito baixo','Baixo','Médio','Alto','Muito alto'];
  var MSG_SEM_IND='Não foi possível carregar os indicadores do seu estado agora.';
  var fmtN=function(n){return n==null?'—':Number(n).toLocaleString('pt-BR')};
  var fmtP=function(n){return n==null?'—':Number(n).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'};

  /* Roda dentro do arquivo baixado: sem dependência da plataforma. Vira texto por toString(). */
  function roteiro(){
    document.querySelectorAll('[data-slides]').forEach(function(caixa){
      var slides=caixa.querySelectorAll('[data-slide]'),i=0;
      var ind=caixa.querySelector('[data-ind]'),ant=caixa.querySelector('[data-ant]'),prox=caixa.querySelector('[data-prox]');
      function mostra(){
        slides.forEach(function(s,k){s.hidden=k!==i});
        ind.textContent='Slide '+(i+1)+' de '+slides.length;
        ant.disabled=i===0;prox.disabled=i>=slides.length-1;
      }
      ant.addEventListener('click',function(){if(i>0){i--;mostra()}});
      prox.addEventListener('click',function(){if(i<slides.length-1){i++;mostra()}});
      mostra();
    });
    document.querySelectorAll('[data-filtro]').forEach(function(sel){
      sel.addEventListener('change',function(){
        var c=sel.closest('[data-cartao]'),v=sel.value,n=0;
        c.querySelectorAll('tbody tr').forEach(function(tr){
          var ok=v==='todas'||tr.getAttribute('data-faixa')===v;
          tr.hidden=!ok;if(ok)n++;
        });
        var vz=c.querySelector('[data-vazio]'),tb=c.querySelector('table');
        if(vz)vz.hidden=n>0;
        if(tb)tb.hidden=n===0;
      });
    });
  }

  var CSS='.cartoes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:8px 0}'+
    '.cartao{border:1px solid #E6DCCE;border-radius:8px;padding:10px 12px;background:#FFFDF9}'+
    '.cartao h4{margin:0 0 6px;font-size:15px}.cartao h5{margin:8px 0 2px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#5E524C}'+
    '.cartao dl{margin:0}.cartao dt{margin-top:4px}.cartao table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}'+
    '.cartao th,.cartao td{border-bottom:1px solid #E6DCCE;padding:3px 4px;text-align:left}'+
    '.cartao label{font-size:12px;color:#5E524C}.slides-nav{display:flex;gap:12px;align-items:center;justify-content:center;margin:8px 0}'+
    '.slides-nav button{font:inherit;padding:4px 12px;border:1px solid #571730;background:#fff;color:#571730;border-radius:6px;cursor:pointer}'+
    '.slides-nav button:disabled{opacity:.4;cursor:default}[hidden]{display:none!important}';

  function cartaoAgenda(a){
    var h='<article class="cartao" data-cartao><h4>'+esc(a.rot)+'</h4>';
    if(!(a.linhas||[]).length)return h+'<p class="sem">Sem notas deste estado para esta agenda.</p></article>';
    h+='<label>Classificação <select data-filtro><option value="todas">Todas</option>'+
      FAIXAS.map(function(f){return '<option value="'+f+'">'+f+'</option>'}).join('')+'</select></label>'+
      '<table><thead><tr><th>Indicador</th><th>ODS relacionada</th><th>Nota</th></tr></thead><tbody>'+
      a.linhas.map(function(l){
        return '<tr data-faixa="'+esc(l.faixa)+'"><td>'+esc(l.indicador)+'</td><td>ODS '+esc(l.ods)+(l.odsRot?' · '+esc(l.odsRot):'')+
          '</td><td><strong>'+fmtN(l.nota)+'</strong> <small>'+esc(l.faixa)+'</small></td></tr>'}).join('')+
      '</tbody></table><p class="sem" data-vazio hidden>Nenhum indicador nesta classificação.</p></article>';
    return h;
  }
  /* cartões de agenda em slides de 4 (SOC-06) */
  Baixar.cartoesAgenda=function(agendas){
    if(!agendas||!agendas.length)return '<dd><p class="sem">'+MSG_SEM_IND+'</p></dd>';
    var slides=[];
    for(var i=0;i<agendas.length;i+=4)slides.push(agendas.slice(i,i+4));
    return '<dd><div data-slides>'+slides.map(function(g,k){
      return '<div class="cartoes" data-slide'+(k?' hidden':'')+'>'+g.map(cartaoAgenda).join('')+'</div>'}).join('')+
      '<div class="slides-nav"><button type="button" data-ant>Anterior</button><span data-ind>Slide 1 de '+slides.length+
      '</span><button type="button" data-prox>Próximo</button></div></div></dd>';
  };
  /* cartões dos municípios mais votados (PAR-04 a PAR-07) */
  Baixar.cartoesMunicipio=function(mun){
    if(!mun)return '';
    if(mun.aviso)return '<dd><p class="sem">'+esc(mun.aviso)+'</p></dd>';
    if(!(mun.cartoes||[]).length)return '';
    return '<dd><div class="cartoes">'+mun.cartoes.map(function(c){
      return '<article class="cartao"><h4>'+(c.pos?c.pos+'º · ':'')+esc(c.nome)+'</h4>'+
        (c.votos?'<small>'+fmtN(c.votos)+' votos da liderança</small>':'')+
        '<h5>Placar</h5><dl><dt>Vereadores no município</dt><dd>'+fmtN(c.vereadores)+'</dd>'+
        '<dt>Vereadores do '+esc(c.partido)+'</dt><dd>'+fmtN(c.vereadoresPartido)+'</dd>'+
        '<dt>Prefeito(a)</dt><dd>'+(c.prefeito?esc(c.prefeito.nome)+' ('+esc(c.prefeito.partido)+')':'—')+'</dd>'+
        '<dt>Filiados do '+esc(c.partido)+'</dt><dd>'+fmtN(c.filiados)+'</dd></dl>'+
        '<h5>Força</h5><dl><dt>Votos do '+esc(c.partido)+' em '+esc(c.nome)+'</dt><dd>'+fmtP(c.pctMun)+'</dd>'+
        '<dt>Votos do '+esc(c.partido)+' em '+esc(c.nomeUF)+'</dt><dd>'+fmtP(c.pctUF)+'</dd></dl>'+
        '<h5>Executivo</h5><p>'+(c.posicao?esc(c.posicao):'<span class="sem">Posição não escolhida</span>')+'</p></article>'}).join('')+'</div></dd>';
  };

  /* O HTML da Missão 1. `extras` = resultado de Ilhas.dadosMapaPolitico(); sem ele, os cartões mostram só a mensagem. */
  Baixar.htmlMapaPolitico=function(extras){
    var m1=MISSOES.filter(function(m){return m.n===1})[0];
    var sem=Resumo.sem,vivo=Resumo.vivo,ant=Baixar.extras;
    var miolo;
    Resumo.sem='<span class="sem">Não respondida</span>';Resumo.vivo=false;Baixar.extras=extras||{};
    try{miolo=Resumo.missao(m1)}finally{Resumo.sem=sem;Resumo.vivo=vivo;Baixar.extras=ant}
    return this.pagina('Mapa Político — Missão 1',miolo)
      .replace('</style>',function(){return CSS+'</style>'})
      .replace('</body>',function(){return '<script>('+roteiro.toString()+')();</script></body>'});
  };
  Baixar.mapaPolitico=async function(){
    var extras={};
    try{if(window.Ilhas&&Ilhas.dadosMapaPolitico)extras=(await Ilhas.dadosMapaPolitico())||{}}catch(e){extras={}}
    this.arq('mapa-politico-'+this.base()+'.html',this.htmlMapaPolitico(extras),'text/html');
    aviso('HTML do Mapa Político baixado.');
  };
})();

/* ---------- Fechamento: "Pronto!", botão do HTML e compilado das respostas (FEC-01, FEC-02, FEC-04) ----------
   Vem depois do fim de m1.frag (a última etapa). O compilado é o mesmo HTML da aba Resumo, com os módulos de leitura montados. */
(function(){
  if(typeof Comp==='undefined'||typeof Resumo==='undefined'||typeof MISSOES==='undefined')return;
  var PRONTO='Parabéns! Com base neste amplo estudo de preparação da sua chegada você gerou o seu Mapa Político. Agora você tem as informações necessárias para começar a rodar o mandato com intencionalidade e profissionalismo! Este levantamento de evidências e de autoconhecimento vai fundamentar o Projeto Político da liderança parlamentar, que transcende a Legislatura e fundamenta a pertinência de sua atuação política no curto, médio e até longo prazo.';
  var _fr=Comp.frag;
  Comp.frag=function(e){
    var h=_fr.call(this,e);
    if(!e||e.id!=='m1.frag')return h;
    var m1=MISSOES.filter(function(m){return m.n===1})[0],vivo=Resumo.vivo,comp;
    Resumo.vivo=true;
    try{comp=Resumo.missao(m1)}finally{Resumo.vivo=vivo}
    return h+'<div class="np-sec-card" style="border-top:5px solid var(--vinho)"><section class="m1-pronto" aria-labelledby="m1-pronto-t"><h3 id="m1-pronto-t">Pronto!</h3>'+
      '<div class="texto"><p>'+PRONTO+'</p></div>'+
      '<h4>Compilado das respostas da Missão 1</h4><div class="m1-compilado">'+comp+'</div></section></div>';
  };
})();
