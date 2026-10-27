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

/* ---------- Resumo (e a Missão 5, que o lê): mostra os dados novos da Missão 4 sem perder os antigos ----------
   Comissões: D.comissoes já guarda pq, papel e mov em texto legível, então a lista do Guia basta.
   Ações: o prazo novo vem como AAAA-MM-DD e aparece como DD/MM/AAAA; prazo antigo em texto livre aparece como estava.
   Comunicação: depois das caixinhas, o último registro semanal de cada seção (D.comunicacao, formato em lib/comunicacao.ts). */
(function(){
  if(typeof Resumo==='undefined'||typeof Resumo.ex!=='function')return;
  var _ex=Resumo.ex;
  /* mesmos rótulos de lib/comunicacao.ts (tests/legado-m4.test.ts confere que não divergem) */
  var SECOES=[
    ['k1','Alcance e crescimento da comunidade',[['seguidores','Seguidores (total)'],['novos','Novos seguidores na semana'],['alcance','Alcance ou visualizações']]],
    ['k2','Compartilhamentos, comentários e respostas',[['compartilhamentos','Compartilhamentos'],['comentarios','Comentários recebidos'],['respostas','Respostas dadas pelo mandato']]],
    ['k3','Mensagens recebidas e encaminhadas',[['recebidas','Mensagens recebidas'],['encaminhadas','Mensagens encaminhadas']]],
    ['k4','Participação gerada por campanhas e convites',[['convites','Convites enviados'],['participaram','Pessoas que participaram']]],
    ['k5','Presença das agendas do mandato na imprensa e no debate público',[['aparicoes','Aparições na imprensa'],['notas','Notas e entrevistas dadas']]]
  ];
  function dataBr(v){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v==null?'':v));return m?m[3]+'/'+m[2]+'/'+m[1]:String(v==null?'':v)}
  function acoes(){
    var lista=Array.isArray(D.acoes)?D.acoes:[];
    if(!lista.length)return '<dl class="cmp"><dt>Ações escolhidas</dt><dd>'+Resumo.sem+'</dd></dl>';
    return '<dl class="cmp">'+lista.map(function(a){
      var fr=(typeof BINGOS!=='undefined'&&BINGOS[a.bingo])||{};
      return '<dt>'+esc(fr.n||'Ação')+'</dt><dd><strong>'+esc(a.titulo||'')+'</strong>'+
        (a.alcancar?'<br>Objetivo: '+rich(a.alcancar):'')+
        (a.resp?'<br>Responsável: '+esc(a.resp):'')+(a.prazo?' · Prazo: '+esc(dataBr(a.prazo)):'')+
        (a.saber?'<br>Verificação: '+rich(a.saber):'')+
        (a.prox?'<br>Próximo passo: '+rich(a.prox):'')+'</dd>';
    }).join('')+'</dl>';
  }
  function semana(){
    var sem=D.comunicacao&&D.comunicacao.semanas;
    if(!sem||typeof sem!=='object')return '';
    var chaves=Object.keys(sem).filter(function(s){return /^\d{4}-W\d{2}$/.test(s)&&sem[s]&&typeof sem[s]==='object'}).sort();
    var li=[];
    SECOES.forEach(function(s){
      for(var i=chaves.length-1;i>=0;i--){
        var v=sem[chaves[i]][s[0]];
        if(!v||typeof v!=='object')continue;
        var txt=s[2].filter(function(c){return typeof v[c[0]]==='number'&&isFinite(v[c[0]])}).map(function(c){return esc(c[1])+' '+v[c[0]]});
        if(txt.length){li.push('<li><strong>'+esc(s[1])+'</strong> ('+chaves[i]+'): '+txt.join(' · ')+'</li>');break}
      }
    });
    return li.length?'<dl class="cmp"><dt>Acompanhamento semanal (último registro de cada seção)</dt><dd><ul class="marcados">'+li.join('')+'</ul></dd></dl>':'';
  }
  Resumo.ex=function(ex){
    if(ex&&ex.id==='m4.acoes')return acoes();
    var h=_ex.call(this,ex);
    if(ex&&ex.id==='m4.metricas')h+=semana();
    return h;
  };
})();