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

/* ---------- Ajuste de texto da Missão 4 (sugestão #209) ----------
   conteudo.js não é editado (AD-003): o título e a frase final da intro entram aqui, na carga, como em m3.js.
   "As ações dos 100 dias" vira "Articulação e Mobilização" e sai "Se quiser ir além, complete uma ação de cada bingo." */
(function(){
  if(typeof MISSOES==='undefined')return;
  MISSOES.forEach(function(m){
    if(m.n!==4)return;
    m.exercicios.forEach(function(e){
      if(e.id!=='m4.acoes')return;
      e.t='Articulação e Mobilização';
      if(typeof e.intro==='string')e.intro=e.intro.replace(' Se quiser ir além, complete uma ação de cada bingo.','');
    });
  });
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
      var meta=a.meta&&a.metaTexto&&(Array.isArray(D.metas)?D.metas:[]).some(function(m){return m&&typeof m==='object'&&typeof m.texto==='string'&&m.texto.trim()&&(m.id===a.meta||('txt:'+m.texto.trim())===a.meta)});
      return '<dt>'+esc(fr.n||'Ação')+'</dt><dd><strong>'+esc(a.titulo||'')+'</strong>'+
        (a.modo==='resumo'?(a.resumo?'<br>Resumo: '+rich(a.resumo):''):
        (a.alcancar?'<br>Objetivo: '+rich(a.alcancar):'')+
        (a.resp?'<br>Responsável: '+esc(a.resp):'')+(a.prazo?' · Prazo: '+esc(dataBr(a.prazo)):'')+
        (a.saber?'<br>Verificação: '+rich(a.saber):'')+
        (a.prox?'<br>Próximo passo: '+rich(a.prox):''))+
        (meta?'<br>Meta do planejamento: '+esc(a.metaTexto):'')+'</dd>';
    }).join('')+'</dl>';
  }
  /* mesmos textos de data de lib/comunicacao.ts (ultimoRegistroDatado): "em 04/11/2026", "semana de 02/11 a 08/11/2026" ou "mês de novembro de 2026" */
  var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  function iso(d){return d.toISOString().slice(0,10)}
  function segunda(sem){var m=/^(\d{4})-W(\d{2})$/.exec(sem);if(!m)return null;var j=new Date(Date.UTC(+m[1],0,4));return new Date(j.getTime()-((j.getUTCDay()||7)-1)*864e5+(+m[2]-1)*7*864e5)}
  function semana(){
    var c=D.comunicacao;
    if(!c||typeof c!=='object')return '';
    var sem=c.semanas,mes=c.meses,datas=c.datas;
    var okSem=sem&&typeof sem==='object',okMes=mes&&typeof mes==='object';
    if(!okSem&&!okMes)return '';
    var li=[];
    SECOES.forEach(function(s){
      var cand=[];
      if(okSem)Object.keys(sem).filter(function(k){return /^\d{4}-W\d{2}$/.test(k)&&sem[k]&&typeof sem[k]==='object'&&sem[k][s[0]]&&typeof sem[k][s[0]]==='object'}).forEach(function(k){
        var seg=segunda(k),dom=new Date(seg.getTime()+6*864e5),d=datas&&datas[k]&&datas[k][s[0]];
        cand.push({fim:d||iso(dom),rot:d?'em '+dataBr(d):'semana de '+dataBr(iso(seg)).slice(0,5)+' a '+dataBr(iso(dom)),v:sem[k][s[0]]});
      });
      if(okMes)Object.keys(mes).filter(function(k){return /^\d{4}-(0[1-9]|1[0-2])$/.test(k)&&mes[k]&&typeof mes[k]==='object'&&mes[k][s[0]]&&typeof mes[k][s[0]]==='object'}).forEach(function(k){
        var a=+k.slice(0,4),m=+k.slice(5);
        cand.push({fim:iso(new Date(Date.UTC(a,m,0))),rot:'mês de '+MESES[m-1]+' de '+a,v:mes[k][s[0]]});
      });
      cand.sort(function(x,y){return x.fim<y.fim?-1:x.fim>y.fim?1:0});
      for(var i=cand.length-1;i>=0;i--){
        var v=cand[i].v;
        var txt=s[2].filter(function(c){return typeof v[c[0]]==='number'&&isFinite(v[c[0]])}).map(function(c){return esc(c[1])+' '+v[c[0]]});
        if(txt.length){li.push('<li><strong>'+esc(s[1])+'</strong> ('+esc(cand[i].rot)+'): '+txt.join(' · ')+'</li>');break}
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

/* ---------- Missão 4 em página única com cartões .np-sec-card (mesmo mecanismo de m1.js, m2.js e m3.js) ----------
   Preserva Comp.lista, Comp.bingo, Comp.checklist, Resumo.ex e os textos de conteudo.js intactos (tests/legado-m4.test.ts). */
(function(){
  if(typeof Guia==='undefined'||typeof Comp==='undefined')return;

  var _gb=Guia.bloco;
  Guia.bloco=function(p,n){
    var h=_gb.call(this,p,n);
    if(!this.m||this.m.n!==4||this.modo!=='tudo'||!this.ex||typeof h!=='string')return h;
    if(p&&p.k==='componente'){
      if(this.passos&&this.passos.length>1){
        h=h.replace(/^<h1[^>]*>[\s\S]*?<\/h1>\s*(?:<div class="texto"><\/div>\s*)?/,'');
      }
      return h;
    }
    return '<div class="np-sec-card">'+h+'</div>';
  };

  var forcou=false,antes='guiado';
  var _r=Guia.render;
  Guia.render=function(){
    var m4=!!(this.m&&this.m.n===4);
    if(m4){
      if(!forcou){antes=this.modo;forcou=true}
      this.modo='tudo';this.i=0;
    }else if(forcou){this.modo=antes;forcou=false}
    _r.apply(this,arguments);
    if(!m4)return;
    var tl=document.getElementById('tela'),bt=tl&&tl.querySelector('button[onclick="Guia.alternarModo()"]');
    if(bt&&bt.parentNode)bt.parentNode.removeChild(bt);
    if(tl&&tl.querySelectorAll){
      tl.querySelectorAll('.passo-corpo > hr.regra').forEach(function(hr){if(hr.parentNode)hr.parentNode.removeChild(hr)});
    }else if(tl&&tl.innerHTML){
      tl.innerHTML=tl.innerHTML.replace(/<hr class="regra">/g,'');
    }
  };
  var _ir=Guia.ir;
  Guia.ir=function(n){
    if(this.m&&this.m.n===4){this.render();return}
    return _ir.call(this,n);
  };
  var _ab=Guia.abrir;
  Guia.abrir=function(nm,id){
    _ab.call(this,nm,id);
    if(!this.m||this.m.n!==4)return;
    this.modo='tudo';
  };
})();