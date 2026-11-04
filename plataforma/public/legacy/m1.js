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

  /* ---- Persona · pergunta 3: o desejo para o futuro vira duas perguntas (SUG-16) ---- */
  var q3=item(exDe('m1.persona'),'m1.q3');
  q3.caixas=[
    {k:'m1.q3',rot:'Elenque quais são as 4 principais conquistas e entregas que o mandato deseja ter alcançado antes do fim da legislatura?'},
    {k:'m1.q3b',rot:'Qual é o próximo cargo que a liderança parlamentar deseja ocupar?'}];

  /* ---- Conjuntura · pergunta 1: os dados primeiro, depois a análise (SUG-17) ----
     Parceiros e concorrentes são marcados na tabela (seleção tabula melhor que texto livre); a caixa é só das pontes não óbvias. */
  var q4=item(exDe('m1.conjuntura'),'m1.q4');
  q4.d='<em>Identifique</em> quem são os/as parlamentares eleitos(as) nesta legislatura, a partir dos dados expostos abaixo. Em seguida, faça uma análise sobre o que esperar dos colegas e das possíveis alianças.';
  q4.depois=true;
  q4.caixas=[{k:'m1.q4b',
    antes:'<div class="orienta"><p>Marque na tabela acima quem é <strong>Parceiro</strong> e quem é <strong>Concorrente</strong> da liderança parlamentar, considerando a região, o perfil pessoal e a disputa partidária.</p></div>',
    rot:'E quais são as pontes não óbvias que podem ser construídas, a partir da criação de espaços de convergência que se baseiem em consensos mínimos e não necessariamente alinhamento completo? Elenque agora os nomes não óbvios, e que serão necessários para que as agendas e pautas avancem.'}];

  /* ---------- mecanismo ---------- */
  function caixa(c){
    return (c.antes||'')+'<label class="campo"><span class="rot">'+esc(c.rot)+'</span>'+
      '<textarea data-k="'+c.k+'" placeholder="Escreva aqui a resposta da equipe"></textarea></label>';
  }
  function ta(k){return new RegExp('<textarea data-k="'+k.replace(/\./g,'\\.')+'"[^>]*></textarea>')}
  /* troca a caixa única do item (ou o espaço dela) pelas caixas do item */
  function injeta(h,it){
    var cx=it.caixas.map(caixa).join(''),pos=it.depois&&it.ilha?'<div class="ilha" data-ilha="'+it.ilha+'"></div>':null;
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
  var _cp=Comp.perguntas;
  Comp.perguntas=function(ex){
    var h=_cp.call(this,ex);
    if(!ex||!ex.itens)return h;
    ex.itens.forEach(function(it){if(it.caixas)h=injeta(h,it)});
    return h;
  };
})();
