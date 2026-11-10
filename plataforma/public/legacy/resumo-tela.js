/* =====================================================================
   RESUMO DO PREENCHIMENTO REESTRUTURADO (#/resumo). Não gerado: este arquivo é mantido à mão.
   A tela vira blocos recolhíveis (missão > exercício) com a barra de progresso e as ferramentas.
   Resumo.ex e Resumo.missao não mudam: o Painel ("Ver o que foi preenchido") e o download os reaproveitam (RES-12).
   Carregado depois de m1.js (todas as sobreposições de Resumo.ex já valem) e antes de sugestoes.js.
   ===================================================================== */
(function(){

var SELO={ok:'concluído',andamento:'em andamento',nao:'não iniciado'};
var VAZIO='não preenchido';
var ENT={amp:'&',lt:'<',gt:'>',quot:'"','#39':"'",nbsp:' '};

/* texto puro da primeira resposta preenchida (o 1º <dd> com texto) do corpo do exercício, em até 160 caracteres */
function previa(h){
  var dd=/<dd\b[^>]*>([\s\S]*?)<\/dd>/g,r;
  while((r=dd.exec(String(h||'')))){
    var t=r[1].replace(/<span class="foto"[^>]*>[\s\S]*?<\/span>/g,' ')
      .replace(/<(br|\/?(p|div|li|ul|ol|dl|dt|dd|h\d))\b[^>]*>/gi,' ').replace(/<[^>]*>/g,'')
      .replace(/&(amp|lt|gt|quot|#39|nbsp);/g,function(x,k){return ENT[k]}).replace(/\s+/g,' ').trim();
    if(t&&t!==VAZIO)return t.length>160?t.slice(0,159)+'…':t;
  }
  return VAZIO;
}

/* abertura inicial: o que não foi iniciado vem fechado (RES-01.3, RES-01.4) */
function abreExercicio(ex){return estadoEx(ex)!=='nao'}
function abreMissao(m){return m.exercicios.some(abreExercicio)}

function exercicio(m,ex){
  var e=estadoEx(ex),href='#/m/'+m.n+'/'+ex.id,rx=Resumo.ex(ex),corpo;
  if(e==='nao')corpo='<div class="m-vazia"><span>Nenhuma resposta registrada ainda.</span><a class="ir" href="'+href+'">Começar este exercício →</a></div>';
  else corpo=(ex.tipo==='funcoes'?'<div class="ilha" data-ilha="resumo-equipe"></div>':rx)+
    (e==='andamento'?'<a class="ir" href="'+href+'">Continuar este exercício →</a>':'');
  return '<details class="ex" data-estado="'+e+'"'+(abreExercicio(ex)?' open':'')+'><summary>'+
    '<span class="ex-t"><i class="chev" aria-hidden="true"></i><a class="ex-link" href="'+href+'">'+esc(ex.t)+'</a>'+
    '<span class="selo '+e+'">'+SELO[e]+'</span></span>'+
    '<span class="ex-p">'+esc(previa(rx))+'</span>'+
    '<span class="ex-n">'+esc(Telas.estadoTxt(ex,e))+'</span></summary>'+
    '<div class="ex-corpo">'+corpo+'</div></details>';
}

function missao(m){
  var p=progMissao(m);
  return '<details class="missao" id="res-m'+m.n+'" style="--c:'+m.cor+';--ct:'+(m.ct||m.cor)+'"'+(abreMissao(m)?' open':'')+'><summary>'+
    '<span class="m-eb">Missão '+m.n+'</span><span class="m-tit">'+esc(m.curto)+'</span>'+
    '<span class="m-prazo">'+esc(m.prazoTxt)+'</span>'+
    '<span class="m-cont"><b>'+p.feitos+'/'+p.total+'</b><i class="chev" aria-hidden="true"></i></span></summary>'+
    '<div class="m-corpo">'+m.exercicios.map(function(ex){return exercicio(m,ex)}).join('')+'</div></details>';
}

/* a tela inteira; quem chama liga Resumo.vivo antes (links das perguntas e ilhas do Resumo) */
function html(){
  return '<div class="etiqueta">Mandato</div><h1>Resumo do preenchimento</h1>'+
    '<p class="chamada">Tudo o que a equipe registrou, exercício por exercício. Use nas reuniões de alinhamento e na imersão de planejamento.</p>'+
    '<div class="ilha" data-ilha="resumo-retrato"></div>'+
    '<div class="barra"></div><div class="ferr"></div>'+
    MISSOES.map(function(m){return missao(m)}).join('');
}

window.ResumoTela={html:html,previa:previa,abreMissao:abreMissao,abreExercicio:abreExercicio};
})();
