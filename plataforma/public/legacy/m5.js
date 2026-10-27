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
