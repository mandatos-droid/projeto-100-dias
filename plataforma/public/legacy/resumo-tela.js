/* =====================================================================
   RESUMO DO PREENCHIMENTO REESTRUTURADO (#/resumo). Não gerado: este arquivo é mantido à mão.
   A tela vira blocos recolhíveis (missão > exercício) com a barra de progresso e as ferramentas.
   Resumo.ex e Resumo.missao não mudam: o Painel ("Ver o que foi preenchido") e o download os reaproveitam (RES-12).
   Carregado depois de m1.js (todas as sobreposições de Resumo.ex já valem) e antes de sugestoes.js.
   ===================================================================== */
(function(){

var SELO={ok:'concluído',andamento:'em andamento',nao:'não iniciado'};
var VAZIO='não preenchido';
/* frases de "nada ainda" da Missão 1 (LEG-13, ELE/AGE): contam como vazio, como o VAZIO */
var SEM_DADO=['Nada registrado ainda.','Nada classificado ainda.'];
var ENT={amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",nbsp:' '};

/* texto puro da primeira resposta preenchida (o 1º <dd> com texto) do corpo do exercício, em até 160 caracteres */
function previa(h){
  var dd=/<dd\b[^>]*>([\s\S]*?)<\/dd>/g,r;
  while((r=dd.exec(String(h||'')))){
    var t=r[1].replace(/<span class="foto"[^>]*>[\s\S]*?<\/span>/g,' ')
      .replace(/<(br|\/?(p|div|li|ul|ol|dl|dt|dd|h\d))\b[^>]*>/gi,' ').replace(/<[^>]*>/g,'')
      .replace(/&(amp|lt|gt|quot|#39|nbsp);/g,function(x,k){return ENT[k]}).replace(/\s+/g,' ').trim();
    if(t&&t!==VAZIO&&SEM_DADO.indexOf(t)<0)return t.length>160?t.slice(0,159)+'…':t;
  }
  return VAZIO;
}

/* abertura inicial: só o vazio vem fechado (RES-01.3, RES-01.4). "Não iniciado" com resposta já visível no Resumo.ex
   também abre: temConteudo não conta as caixas extras (ex.: o próximo cargo da Persona, m1.q3b). */
function abre(e,rx){return e!=='nao'||previa(rx)!==VAZIO}
function abreExercicio(ex){return abre(estadoEx(ex),Resumo.ex(ex))}
function abreMissao(m){return m.exercicios.some(abreExercicio)}

function exercicio(m,ex){
  var e=estadoEx(ex),href='#/m/'+m.n+'/'+ex.id,rx=Resumo.ex(ex),aberto=abre(e,rx),corpo;
  if(!aberto)corpo='<div class="m-vazia"><span>Nenhuma resposta registrada ainda.</span><a class="ir" href="'+href+'">Começar este exercício →</a></div>';
  else corpo=(ex.tipo==='funcoes'?'<div class="ilha" data-ilha="resumo-equipe"></div>':rx)+
    (e==='andamento'?'<a class="ir" href="'+href+'">Continuar este exercício →</a>':'');
  return '<details class="ex" data-estado="'+e+'"'+(aberto?' open':'')+'><summary>'+
    '<span class="ex-t"><i class="chev" aria-hidden="true"></i><a class="ex-link" href="'+href+'">'+esc(ex.t)+'</a>'+
    '<span class="selo '+e+'">'+SELO[e]+'</span></span>'+
    '<span class="ex-p">'+esc(previa(rx))+'</span>'+
    '<span class="ex-n">'+esc(Telas.estadoTxt(ex,e))+'</span></summary>'+
    '<div class="ex-corpo">'+corpo+'</div></details>';
}

function missao(m){
  var p=progMissao(m);
  return '<details class="missao" id="res-m'+m.n+'" data-pend="'+(p.total-p.feitos)+'" style="--c:'+m.cor+';--ct:'+(m.ct||m.cor)+'"'+(abreMissao(m)?' open':'')+'><summary>'+
    '<span class="m-eb">Missão '+m.n+'</span><span class="m-tit">'+esc(m.curto)+'</span>'+
    '<span class="m-prazo">'+esc(m.prazoTxt)+'</span>'+
    '<span class="m-cont"><b>'+p.feitos+'/'+p.total+'</b><i class="chev" aria-hidden="true"></i></span></summary>'+
    '<div class="m-corpo">'+m.exercicios.map(function(ex){return exercicio(m,ex)}).join('')+'</div></details>';
}

/* barra: percentual geral, "N de T exercícios concluídos", a única ação e um segmento (botão) por missão (RES-02, RES-03) */
function barra(feitos,total){
  return '<div class="barra"><div class="barra-l1"><div class="geral"><b>'+progGeral()+'%</b><span>'+feitos+' de '+total+' exercícios concluídos</span></div>'+
    '<div class="acoes"><button type="button" class="bt pri" onclick="Baixar.tudo()">Baixar resumo completo (HTML)</button></div></div>'+
    '<nav class="segs" aria-label="Ir para a missão">'+MISSOES.map(function(m){
      var p=progMissao(m);
      return '<button type="button" class="seg" data-n="'+m.n+'" aria-current="false" aria-label="Ir para a Missão '+m.n+': '+esc(m.curto)+'"'+
        ' style="--c:'+m.cor+';--p:'+p.pct+'%"><span class="t"><span>M'+m.n+' · '+esc(m.curto)+'</span><span>'+p.feitos+'/'+p.total+'</span></span>'+
        '<span class="f"><i></i></span></button>'}).join('')+'</nav></div>';
}

function textoPendentes(n){
  return n===0?'Todos os exercícios estão concluídos.':n===1?'1 exercício ainda sem conclusão':n+' exercícios ainda sem conclusão';
}

/* ferramentas da lista (RES-04) */
function ferramentas(pend){
  return '<div class="ferr"><button type="button" class="lk" data-acao="expandir">Expandir tudo</button>'+
    '<button type="button" class="lk" data-acao="recolher">Recolher tudo</button>'+
    '<label class="chave"><input type="checkbox" data-acao="so-falta"> Mostrar só o que falta preencher</label>'+
    '<span class="pend-total" aria-live="polite">'+textoPendentes(pend)+'</span></div>'+
    '<p class="sem-pend" data-pend="'+pend+'" hidden>Nenhum exercício pendente.</p>';
}

/* a tela inteira; quem chama liga Resumo.vivo antes (links das perguntas e ilhas do Resumo) */
function html(){
  var t=0,f=0;
  MISSOES.forEach(function(m){var p=progMissao(m);t+=p.total;f+=p.feitos});
  return '<div class="res2"><div class="etiqueta">Mandato</div><h1>Resumo do preenchimento</h1>'+
    '<p class="chamada">Tudo o que a equipe registrou, exercício por exercício. Use nas reuniões de alinhamento e na imersão de planejamento.</p>'+
    '<div class="ilha" data-ilha="resumo-retrato"></div>'+
    barra(f,t)+ferramentas(t-f)+
    MISSOES.map(function(m){return missao(m)}).join('')+'</div>';
}

/* comportamentos: segmentos, ferramentas, scroll-spy e impressão. Os ouvintes da janela da visita anterior saem antes
   (o roteador chama Telas.resumo a cada visita). */
function ligar(raiz){
  var w=window,ant=w.__resumoOuvintes;
  if(ant)Object.keys(ant).forEach(function(k){w.removeEventListener(k,ant[k])});
  function todos(){return [].slice.call(raiz.querySelectorAll('details.missao,details.ex'))}
  var ms=[].slice.call(raiz.querySelectorAll('details.missao')),segs=[].slice.call(raiz.querySelectorAll('.seg'));
  var so=raiz.querySelector('[data-acao="so-falta"]'),semPend=raiz.querySelector('.sem-pend');
  var r2=raiz.querySelector('.res2'),barraEl=raiz.querySelector('.barra'),topo=document.querySelector('.topo-movel');

  /* alturas que o CSS usa: a barra fica abaixo do .topo-movel (celular) e o título da missão, abaixo da barra (RES-02.4, 02.5) */
  function mede(){
    r2.style.setProperty('--topo-movel',(topo?topo.offsetHeight:0)+'px');
    r2.style.setProperty('--barra-alt',barraEl.offsetHeight+'px');
  }
  /* segmento ativo: a última missão visível com o topo a 160 px ou menos do topo da janela; a 1ª se nenhuma (RES-02.4) */
  function marca(){
    var atual=ms[0];
    ms.forEach(function(d){if(!d.hidden&&d.getBoundingClientRect().top<=160)atual=d});
    segs.forEach(function(b,i){b.setAttribute('aria-current',ms[i]===atual?'true':'false')});
  }
  segs.forEach(function(b,i){
    b.onclick=function(){
      var d=ms[i],reduz=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
      d.open=true;
      mede();
      d.scrollIntoView({block:'start',behavior:reduz?'auto':'smooth'}); // sem location.hash: o hash é do roteador (AD-R4)
    };
  });
  raiz.querySelector('[data-acao="expandir"]').onclick=function(){todos().forEach(function(d){d.open=true})};
  raiz.querySelector('[data-acao="recolher"]').onclick=function(){todos().forEach(function(d){d.open=false})};
  /* "só o que falta": esconde (hidden) sem mexer no aberto/fechado de cada bloco, que volta como estava (RES-04.8) */
  so.onchange=function(){
    [].forEach.call(raiz.querySelectorAll('details.ex[data-estado="ok"],details.missao[data-pend="0"]'),function(d){d.hidden=so.checked});
    semPend.hidden=!(so.checked&&semPend.getAttribute('data-pend')==='0');
    marca();
  };

  var quadro=0,antes=null;
  var ouv={
    scroll:function(){
      if(quadro||!raiz.isConnected)return;
      quadro=w.requestAnimationFrame(function(){quadro=0;marca()});
    },
    /* girar o celular ou redimensionar a janela muda a altura do .topo-movel e da barra */
    resize:function(){if(raiz.isConnected)mede()},
    /* impressão: tudo aberto e, depois, cada bloco como estava (RES-05.1) */
    beforeprint:function(){
      if(!raiz.isConnected)return;
      antes=todos().map(function(d){return d.open});
      todos().forEach(function(d){d.open=true});
    },
    afterprint:function(){
      if(!antes||!raiz.isConnected)return;
      todos().forEach(function(d,i){d.open=antes[i]});
      antes=null;
    }
  };
  Object.keys(ouv).forEach(function(k){w.addEventListener(k,ouv[k])});
  w.__resumoOuvintes=ouv;
  mede();
  marca();
}

/* ---------- cartões de aliados, opositores e potenciais (RES-07) ----------
   Só com Resumo.vivo (a tela). O download roda sem vivo e segue com a lista de texto original (RES-07.6, RES-12.3). */
var listaTexto=ResumoIlhas.lista; // a original de novos.js, intacta
/* titulo e fmt de novos.js são locais daquele arquivo: mesmas regras aqui (nome do TSE em caixa alta; números pt-BR) */
var PARTICULAS={de:1,da:1,do:1,das:1,dos:1,e:1};
function titulo(s){
  return String(s||'').toLowerCase().split(' ').map(function(p,i){return (i>0&&PARTICULAS[p])?p:p.charAt(0).toUpperCase()+p.slice(1)}).join(' ');
}
function fmt(n){return Number(n||0).toLocaleString('pt-BR')}
/* as 5 categorias de relação na ordem da Alana (LEG-03); as chaves gravadas não mudam */
var GRUPOS=[{st:'aliado',cl:'al',rot:'Aliados',um:'Aliado'},{st:'aliado_concorrente',cl:'al',rot:'Aliados, mas concorrentes',um:'Aliado, mas concorrente'},
  {st:'concorrente',cl:'op',rot:'Oponentes',um:'Oponente'},{st:'oponente_concorrente',cl:'op',rot:'Oponentes e concorrentes',um:'Oponente e concorrente'},
  {st:'potencial',cl:'po',rot:'Indefinidas',um:'Indefinida'}];

function cartao(x,local){
  var meta=[x.partido,x.cargo,local&&x.mun?x.mun:''].filter(Boolean).map(esc).join(' · ');
  return '<div class="pessoa">'+ResumoIlhas.foto(x.k,x.uf,x.cargo,x.nome,46)+'<div><strong>'+esc(titulo(x.nome))+'</strong>'+
    (meta?'<span class="meta">'+meta+'</span>':'')+
    (x.votos!=null?'<span class="votos">'+fmt(x.votos)+' votos</span>':'')+'</div></div>';
}
ResumoIlhas.lista=function(arr,grupo){
  if(!Resumo.vivo)return listaTexto.call(this,arr,grupo);
  var g=GRUPOS.filter(function(x){return arr.length&&arr[0].status===x.st})[0]||GRUPOS[0];
  return '<div class="cards '+g.cl+'">'+arr.map(function(x){return cartao(x,grupo==='municipio')}).join('')+'</div>';
};

/* relações da Casa (sem município) ou do município, já separadas por grupo; as de outro status ficam de fora */
function relacoesPor(ilha){
  var r=D.relacoes||{},out={aliado:[],aliado_concorrente:[],concorrente:[],oponente_concorrente:[],potencial:[]};
  Object.keys(r).forEach(function(k){
    var x=r[k];if(!x||!out[x.status])return;
    var local=!!x.mun;
    if(ilha==='assentos'&&local)return;
    if(ilha==='municipio'&&!local)return;
    out[x.status].push(Object.assign({k:k},x));
  });
  return out;
}
var htmlTexto=ResumoIlhas.html;
ResumoIlhas.html=function(ilha){
  if(!Resumo.vivo||(ilha!=='assentos'&&ilha!=='municipio'))return htmlTexto.call(this,ilha);
  var g=relacoesPor(ilha),grupos=GRUPOS.filter(function(x){return g[x.st].length});
  if(!grupos.length)return htmlTexto.call(this,ilha); // nenhuma relação: "Nada classificado ainda." (LEG-13) ou "não preenchido"
  var rot=ilha==='assentos'?'na Casa Legislativa':'no município',self=this;
  return '<dt style="color:var(--tinta)">Parceiros e concorrentes '+rot+'</dt><dd>'+(ilha==='assentos'?'<p><strong>Você tem '+grupos.map(function(x){var n=g[x.st].length;return n+' '+(n===1?x.um:x.rot)}).join('; ')+'</strong></p>':'')+grupos.map(function(x){
    return '<div class="grp '+x.cl+'"><span>'+x.rot+' · '+g[x.st].length+'</span></div>'+self.lista(g[x.st],ilha)}).join('')+'</dd>'+
    this.mapa(ilha,ilha==='assentos'?'Hemiciclo da Casa':'Mapa político do estado');
};

/* ---------- fragilidades com selo M (mandato) ou P (parlamentar) (RES-11) ----------
   Só para o exercício de tipo frag e só com Resumo.vivo: o Painel e o download seguem com a saída original (RES-12). */
var exTexto=Resumo.ex;
Resumo.ex=function(ex){
  if(!Resumo.vivo||!ex||ex.tipo!=='frag')return exTexto.call(this,ex);
  var fs=(D.frags||[]).filter(function(f){return f.mp});
  return '<dl class="cmp"><dt>Fragilidades classificadas <span class="frag-leg">(M = mandato · P = parlamentar)</span></dt><dd>'+
    (fs.length?'<ul class="frag">'+fs.map(function(f){
      return '<li><b class="'+esc(f.mp)+'">'+esc(f.mp)+'</b> <span>'+esc(f.t)+'</span></li>'}).join('')+'</ul>':this.sem)+'</dd></dl>';
};

/* a nova tela substitui a de novos.js (que também ligava Resumo.vivo e as ilhas) */
Telas.resumo=function(){
  var t=document.getElementById('tela');
  Resumo.vivo=true;
  try{t.innerHTML=html()}finally{Resumo.vivo=false}
  t.className='tela largo';
  ligar(t);
  if(window.Ilhas)Ilhas.ligar(t);
};

window.ResumoTela={html:html,previa:previa,abreMissao:abreMissao,abreExercicio:abreExercicio};
})();
