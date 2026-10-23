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
    if(ex&&ex.id==='m3.bandeiras'){
      /* a lista de comissões segue como no Guia até a ilha de espaços assumir o lugar dela */
      return ilha('rumo-bandeiras')+(ex.listaExtra?'<h4>'+esc(ex.listaExtra.titulo)+'</h4>'+Comp.lista(ex.listaExtra,ex.id):'');
    }
    if(ex&&ex.id==='m3.legado')return ilha('rumo-legado');
    return _cp.call(this,ex);
  };
  Comp.preditores=function(){return ilha('rumo-preditores')};
  Comp.metas=function(){return ilha('rumo-metas')};
})();
