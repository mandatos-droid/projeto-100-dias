/* =====================================================================
   MISSÃO 5 · ganchos sobre o Guia original (escrito à mão, não gerado).
   Carregado depois de m3.js. Só acrescenta blocos às tarefas; t, d, intro, fim e os textos de conteudo.js
   ficam como estão (tests/legado-m5.test.ts confere por hash).
   ===================================================================== */

/* ---------- monitoramento: botão para o Planejamento Estratégico (#/plano), acima da tabela do Guia ---------- */
(function(){
  if(typeof Comp==='undefined'||typeof Comp.monit!=='function')return;
  var _mo=Comp.monit;
  Comp.monit=function(ex){
    return '<p class="bts"><a class="bt pri" href="#/plano">Abrir Planejamento Estratégico</a></p>'+_mo.call(this,ex);
  };
})();

/* ---------- feedback: a lista "feedbacks" vira a ilha rumo-feedback (mapa do organograma e registro das conversas) ----------
   Mesmo padrão do m3.js/m4.js. O exercício segue sendo do tipo "lista" (chave feedbacks), então o Resumo e a contagem do Guia não mudam. */
(function(){
  if(typeof Comp==='undefined'||typeof Comp.lista!=='function')return;
  var _li=Comp.lista;
  Comp.lista=function(ex,dono){
    if(ex&&ex.chave==='feedbacks')return '<div class="ilha" data-ilha="rumo-feedback"></div>';
    return _li.call(this,ex,dono);
  };
})();

/* ---------- novo planejamento: botão no fim da tarefa "Calibragem e replanejamento" e na aba Planejamento ----------
   A tarefa (m5.imersao, checklist) mantém os textos e o checklist de conteudo.js; o botão (ilha rumo-novociclo) vem depois deles. */
(function(){
  var ILHA='<div class="ilha" data-ilha="rumo-novociclo"></div>';
  if(typeof Comp!=='undefined'&&typeof Comp.checklist==='function'){
    var _ck=Comp.checklist;
    Comp.checklist=function(ex){
      var h=_ck.apply(this,arguments);
      return ex&&ex.id==='m5.imersao'?h+ILHA:h;
    };
  }
  if(typeof Telas!=='undefined'&&typeof Telas.plano==='function'){
    var _pl=Telas.plano;
    Telas.plano=function(){
      _pl.apply(this,arguments);
      var t=document.getElementById('tela');
      if(!t)return;
      t.insertAdjacentHTML('beforeend',ILHA);
      if(window.Ilhas)window.Ilhas.ligar(t);
    };
  }
})();
