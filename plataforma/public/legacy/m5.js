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
