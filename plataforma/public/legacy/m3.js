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
        if(ex.id==='m3.bandeiras'&&ex.listaExtra)p.push({k:'listaExtra'});
        if(ex.fim)p.push({k:'fim'});
        return p;
      }
      return _mt.call(this,ex);
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
