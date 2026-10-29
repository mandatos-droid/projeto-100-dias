/* =====================================================================
   MISSÃO 3 · ganchos sobre o Guia original (escrito à mão, não gerado).
   Carregado depois de m2.js. Troca só o corpo interativo dos exercícios por ilhas React;
   t, d, intro, passos, fim e os exemplos de conteudo.js ficam como estão (tests/legado-m3.test.ts confere por hash).
   ===================================================================== */

/* ---------- exercícios da Missão 3: o corpo vira ilha, o texto do Guia fica ---------- */
(function(){
  if(typeof Comp==='undefined')return;
  function ilha(n){return '<div class="ilha" data-ilha="'+n+'"></div>'}

  var _cp=Comp.campos;
  Comp.campos=function(ex){
    if(ex&&ex.id==='m3.bandeiras')return ilha('rumo-bandeiras');
    if(ex&&ex.id==='m3.legado')return ilha('rumo-legado');
    return _cp.call(this,ex);
  };
  /* o modo guiado monta um passo por campo (Guia.montar); aqui a ilha ocupa um passo só. A lista de comissões segue como passo próprio. */
  if(typeof Guia!=='undefined'){
    var _mt=Guia.montar;
    Guia.montar=function(ex){
      if(ex&&(ex.id==='m3.bandeiras'||ex.id==='m3.legado')){
        var p=[];
        if(ex.intro||ex.passos)p.push({k:'intro'});
        p.push({k:'componente'});
        /* "No futuro" (fim) vem antes das comissões: a lista de espaços fecha o exercício, abaixo do texto sobre o futuro */
        if(ex.fim)p.push({k:'fim'});
        if(ex.id==='m3.bandeiras'&&ex.listaExtra)p.push({k:'listaExtra'});
        return p;
      }
      return _mt.call(this,ex);
    };
  }
  /* Só a apresentação muda, o texto do Guia não: os passos "Como conduzir" também aparecem no passo da ilha, e os exemplos de agendas viram quadradinhos */
  if(typeof Guia!=='undefined'&&typeof Guia.bloco==='function'){
    var _bl=Guia.bloco;
    Guia.bloco=function(p,n){
      var h=_bl.call(this,p,n),ex=this.ex;
      if(!ex||ex.id!=='m3.bandeiras'||typeof h!=='string')return h;
      if(p.k==='intro'){
        h=h.replace(/(<div class="apoio exemplo"><span class="tag">[^<]*<\/span>)([^<]+)(<\/div>)/,function(_,ini,lista,fim){
          var itens=lista.split(';').map(function(t){return t.replace(/[.\s]+$/,'').trim()}).filter(Boolean);
          return ini+'<ul class="ex-chips">'+itens.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul>'+fim;
        });
      }
      if(p.k==='componente'&&ex.passos){
        var cor=(this.m&&this.m.cor)||'';
        var passos='<details class="rm-passos" open><summary>Como conduzir</summary><div class="orienta" style="--c:'+cor+'">'+
          ex.passos.map(function(t,i){return '<p><strong>'+['Primeiro','Segundo','Terceiro','Quarto','Quinto'][i]+' passo:</strong> '+t+'</p>'}).join('')+'</div></details>';
        h=h.replace('<div class="ilha"',passos+'<div class="ilha"');
      }
      return h;
    };
  }
  /* o passo "Comissões e espaços que o mandato pretende compor" troca a lista genérica pela ilha; as outras listas do Guia ficam como são */
  var _li=Comp.lista;
  Comp.lista=function(ex,dono){
    if(ex&&ex.chave==='comissoesDesejadas')return ilha('rumo-espacos');
    return _li.call(this,ex,dono);
  };
  Comp.preditores=function(){return ilha('rumo-preditores')};
  Comp.metas=function(){return ilha('rumo-metas')};
})();

/* ---------- conclusão dos exercícios: a checagem lê o estado novo (D.rumo), sem tocar em nucleo.js ----------
   m3.bandeiras conta com ao menos uma prioritária (D.rumo ou m3.b1..b3); m3.legado, com a edição fechada ou o texto da manchete
   (só o cargo escolhido ainda não é Legado). Mandato antigo, só com texto em m3.*, segue contando pelo texto. */
(function(){
  if(typeof temConteudo==='undefined')return;
  function ehObj(v){return typeof v==='object'&&v!==null&&!Array.isArray(v)}
  function campos(){return (typeof D!=='undefined'&&D&&D.campos)||{}}
  function rumo(){return typeof D!=='undefined'&&D&&ehObj(D.rumo)?D.rumo:{}}
  function preenchido(k){return String(campos()[k]==null?'':campos()[k]).trim()!==''}

  function bandeirasFeito(){
    var bs=Array.isArray(rumo().bandeiras)?rumo().bandeiras:[];
    return bs.some(function(b){return ehObj(b)&&typeof b.prioridade==='number'})||['m3.b1','m3.b2','m3.b3'].some(preenchido);
  }
  function legadoFeito(){
    var l=ehObj(rumo().legado)?rumo().legado:{};
    return l.fechado===true||preenchido('m3.legado');
  }

  var _tc=temConteudo;
  temConteudo=function(ex){
    if(ex&&ex.id==='m3.bandeiras')return bandeirasFeito();
    if(ex&&ex.id==='m3.legado')return legadoFeito();
    return _tc(ex);
  };
})();

/* ---------- aba Planejamento Estratégico (#/plano), item no menu e resumo no Painel ----------
   Tudo por override: app.js (rotear, lateral, Telas.painel) não é tocado. Store.eventos segue sendo gravado; só deixa de aparecer no Painel. */
(function(){
  if(typeof Telas==='undefined'||typeof App==='undefined')return;
  function ilha(n){return '<div class="ilha" data-ilha="'+n+'"></div>'}
  function liga(t){if(window.Ilhas)window.Ilhas.ligar(t)}

  Telas.plano=function(){
    var t=document.getElementById('tela');
    t.innerHTML='<div class="etiqueta">Missão 3 · Defina o Rumo</div>'+
      '<h1 class="largo">Planejamento Estratégico</h1>'+
      '<p class="chamada">O Legado, os objetivos específicos e as metas do mandato em uma só árvore, com o status de cada meta e o atingimento de cada objetivo.</p>'+
      ilha('plano');
    t.className='tela largo';
    liga(t);
  };

  /* #/plano: o rotear original não conhece a rota (cairia no Painel), então ela é tratada aqui com os mesmos passos finais */
  var _ro=App.rotear;
  App.rotear=function(){
    var h=location.hash||'#/';
    if(h.replace('#/','').split('/')[0]!=='plano')return _ro.call(this);
    this.menu(false);
    document.getElementById('tela').className='tela';
    Telas.plano();
    if(this.ultima!==h)window.scrollTo(0,0);
    this.ultima=h;
    this.marcar();this.lateral();
  };

  /* item do menu, entre as missões e a Caixa de ferramentas (grupo "Apoio") */
  var _lat=App.lateral;
  App.lateral=function(){
    _lat.call(this);
    var nav=document.getElementById('ladoNav');if(!nav||nav.querySelector('a.it[href="#/plano"]'))return;
    var grupos=nav.querySelectorAll('.nav-grupo'),apoio=null;
    for(var i=0;i<grupos.length;i++)if(grupos[i].textContent.trim()==='Apoio')apoio=grupos[i];
    var a=document.createElement('a');a.className='it';a.href='#/plano';
    a.innerHTML='<span class="nn">◈</span><span class="tx">Planejamento Estratégico</span>';
    nav.insertBefore(a,apoio);
    this.marcar();
  };

  /* Painel: o bloco "Últimos registros" dá lugar ao resumo do plano; sem eventos o resumo entra antes do botão final */
  var _pn=Telas.painel;
  Telas.painel=function(){
    _pn.call(this);
    var t=document.getElementById('tela'),alvo=null,hs=t.querySelectorAll('h2');
    for(var i=0;i<hs.length;i++)if(hs[i].textContent.trim()==='Últimos registros')alvo=hs[i];
    var bloco=document.createElement('div');bloco.className='ilha';bloco.setAttribute('data-ilha','plano-resumo');
    if(alvo){
      var lista=alvo.nextElementSibling;
      if(lista&&lista.tagName==='UL')lista.parentNode.removeChild(lista);
      alvo.parentNode.replaceChild(bloco,alvo);
    }else{
      var bts=t.querySelectorAll('.bts'),ult=bts[bts.length-1];
      if(ult)ult.parentNode.insertBefore(bloco,ult);else t.appendChild(bloco);
    }
    liga(t);
  };
})();
