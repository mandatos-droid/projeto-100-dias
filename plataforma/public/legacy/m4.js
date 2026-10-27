/* =====================================================================
   MISSÃO 4 · ganchos sobre o Guia original (escrito à mão, não gerado).
   Carregado depois de m3.js. Troca só o corpo interativo dos 3 exercícios por ilhas React;
   t, d, intro, fim, entrega e os bingos de conteudo.js ficam como estão (tests/legado-m4.test.ts confere por hash).
   Os dados seguem nas mesmas listas e campos do Guia (D.comissoes, D.acoes, m4.k1..k5): nada é migrado.
   ===================================================================== */

/* ---------- exercícios da Missão 4: o corpo vira ilha, o texto do Guia fica ---------- */
(function(){
  if(typeof Comp==='undefined')return;
  function ilha(n){return '<div class="ilha" data-ilha="'+n+'"></div>'}

  /* m4.comissoes é do tipo "lista": o passo "componente" chama Comp.lista(ex) sem o dono */
  var _li=Comp.lista;
  Comp.lista=function(ex,dono){
    if(ex&&ex.chave==='comissoes')return ilha('capital-comissoes');
    return _li.call(this,ex,dono);
  };
  /* m4.acoes é o único "bingo" do Guia */
  var _bi=Comp.bingo;
  Comp.bingo=function(ex){
    if(ex&&ex.id==='m4.acoes')return ilha('capital-acoes');
    return _bi.call(this,ex);
  };
  /* m4.metricas é o "checklist" da Missão 4; outros checklists seguem como estão */
  var _ck=Comp.checklist;
  Comp.checklist=function(ex){
    if(ex&&ex.id==='m4.metricas')return ilha('capital-comunicacao');
    return _ck.call(this,ex);
  };
})();
