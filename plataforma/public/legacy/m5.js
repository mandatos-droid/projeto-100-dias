/* =====================================================================
   MISSÃO 5 · ganchos sobre o Guia original (escrito à mão, não gerado).
   Carregado depois de m3.js. Só acrescenta blocos às tarefas; t, d, intro, fim e os textos de conteudo.js
   ficam como estão (tests/legado-m5.test.ts confere por hash).
   ===================================================================== */

/* ---------- monitoramento conforme a Alana (sugestões #127 a #129 e #131) ----------
   O monitoramento consiste em voltar ao Planejamento, registrar quanto cada meta andou (percentual do todo) e, aqui, resumir o mês.
   Uma caixa por meta e por mês (Mês 1 a 3). A chave é mon.<idMeta>.<mês>.det: o Resumo do Preenchimento e a contagem "em andamento"
   do Guia já leem CAMPOS_MONIT e as chaves mon.*, então basta deixar CAMPOS_MONIT com esse único campo (conteudo.js não muda).
   Os textos abaixo são os de ilhas/rumo/textosAlana.ts; tests/legado-m5.test.ts confere que os dois lugares dizem o mesmo. */
(function(){
  if(typeof CAMPOS_MONIT!=='undefined'&&CAMPOS_MONIT&&CAMPOS_MONIT.splice){
    CAMPOS_MONIT.splice(0,CAMPOS_MONIT.length,['det','Detalhamento do mês','Como a meta caminhou ao longo do mês.']);
  }
  if(typeof Comp==='undefined'||typeof Comp.monit!=='function')return;

  var INTRO=[
    'O monitoramento do planejamento serve para o mandato acompanhar as vitórias e os desafios que justificam os resultados parciais de cada meta.',
    'O exercício proposto passa por duas etapas. Para cumprir a primeira você deve clicar na caixa abaixo, retornar ao planejamento e registrar quanto vocês caminharam este mês no atingimento da meta. Lembre-se que o percentual corresponde ao todo, e não ao mês!',
    'Depois de registrar os avanços em cada meta, volte para esta tela e aponte em formato de resumo o caminho percorrido.'
  ];
  var ROTULO='Registre o detalhamento de como esta Meta caminhou ao longo deste mês.';
  var APOIO='Responda as perguntas a seguir para um bom registro:';
  var PERGUNTAS=[
    'O que deu certo e o que deu errado para que a meta tivesse tal resultado parcial?',
    'Quais foram as novas oportunidades políticas que surgiram ao longo do mês, por conta dos esforços para cumprimento da meta?'
  ];
  var MESES=[1,2,3];
  var SEM_METAS='As metas da Missão 3 aparecem aqui assim que forem escritas.';

  function e(t){return typeof esc==='function'?esc(t):String(t)}
  function r(t){return typeof rich==='function'?rich(t):e(t)}

  /* atingimento da meta como na aba Planejamento (lib/atingimento.ts): com sucessos, atingidos sobre o total (congelado fora);
     sem sucessos, o passo de 10% do status. null = fora da conta. */
  function pctMeta(m){
    if(m.status==='congelada')return null;
    if(Array.isArray(m.sucessos)&&m.sucessos.length){
      var suc=m.sucessos.filter(function(x){return x&&x.status!=='congelada'});
      if(!suc.length)return null;
      return Math.round(suc.filter(function(x){return x.status==='concluida'}).length/suc.length*100);
    }
    if(m.status==='concluida')return 100;
    var x=/^concluida(\d+)$/.exec(m.status||'');
    return x?+x[1]:0;
  }
  function rotStatus(st){
    if(st==='concluida')return 'Concluída';
    if(st==='congelada')return 'Congelada';
    var x=/^concluida(\d+)$/.exec(st||'');
    return x?'Concluída '+x[1]+'%':'Não concluída';
  }
  function simbolo(st){return st==='concluida'?'✓':st==='nao_concluida'||!st?'○':st==='congelada'?'✱':'◐'}

  function cartao(m,i,foco){
    var c=(typeof D!=='undefined'&&D.campos)||{};
    var p=pctMeta(m),st=m.status||'nao_concluida';
    /* objetivo estratégico da meta: o texto escrito na Missão 3 ou, sem ele, o nome do preditor (como o Guia fazia) */
    var pr=m.pred&&typeof PREDITORES!=='undefined'?PREDITORES.filter(function(x){return x.id===m.pred})[0]:null;
    var obj=m.pred?(c['m3.obj.'+m.pred]||(pr?pr.n:'')):'';
    var h='<div class="din" data-meta="'+e(m.id)+'"'+(foco?' data-foco':'')+'>'+
      '<span class="idx">Meta '+String(i+1).padStart(2,'0')+(obj?' · '+e(obj):'')+'</span>'+
      '<p style="font-weight:700;margin:10px 0 2px">'+(r(m.texto)||'(meta ainda sem texto)')+'</p>'+
      '<p style="font-size:13.5px;color:var(--tinta-3);margin:0 0 10px">Responsável: '+e(m.resp||'a definir')+'</p>'+
      '<div class="meta-pct" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:0 0 14px">'+
        '<span class="rm-st" data-status="'+e(st)+'"><i aria-hidden="true">'+simbolo(st)+'</i>'+rotStatus(st)+'<small>'+(p===null?'—':p+'%')+'</small></span>'+
        '<span class="rm-dica" style="margin:0">Atingimento registrado no Planejamento · <a href="#/plano">alterar</a></span>'+
      '</div>';
    MESES.forEach(function(mes){
      var k='mon.'+m.id+'.'+mes+'.det',algo=(c[k]||'').trim()!=='';
      h+='<details'+(algo||foco?' open':'')+' data-mes="'+mes+'" style="border-top:1px solid var(--linha-2);padding:12px 0">'+
        '<summary style="cursor:pointer;font-weight:700;font-size:15px">Mês '+mes+(algo?' ✓':'')+'</summary>'+
        '<label class="campo" style="margin-top:14px"><span class="rot">'+ROTULO+'</span>'+
        '<span class="aj">'+APOIO+'<br>'+PERGUNTAS.map(function(q){return '• '+q}).join('<br>')+'</span>'+
        '<textarea data-k="'+k+'" style="min-height:120px" placeholder="Escreva aqui o resumo do mês"></textarea></label></details>';
    });
    return h+'</div>';
  }

  Comp.monit=function(ex){
    var w=typeof window!=='undefined'?window:null;
    var metas=(typeof D!=='undefined'&&D.metas)||[];
    var c=(typeof D!=='undefined'&&D.campos)||{};
    var foco=w&&w.MonitFoco;
    if(w)w.MonitFoco=undefined;
    if(foco&&!metas.some(function(m){return m.id===foco}))foco=null;
    var comRegistro=metas.filter(function(m){
      return MESES.some(function(ms){return String(c['mon.'+m.id+'.'+ms+'.det']||'').trim()!==''});
    }).length;

    var h='<div class="np-monit-cab">'+
      '<div class="texto">'+INTRO.map(function(t){return '<p>'+t+'</p>'}).join('')+'</div>'+
      '<h4>Como conduzir</h4><div class="orienta" style="--c:#035252">'+
      '<p><strong>Primeiro passo:</strong> abra o Planejamento Estratégico e registre, em cada meta, o quanto já foi cumprido do todo.</p>'+
      '<p><strong>Segundo passo:</strong> volte aqui e, em cada meta, resuma o caminho percorrido neste mês.</p></div>'+
      '<div class="np-monit-acoes">'+
        '<p class="bts" style="margin:0"><a class="bt pri" href="#/plano">Abrir Planejamento Estratégico</a></p>'+
        '<span class="selo '+(comRegistro===metas.length&&metas.length>0?'ok':'andamento')+'" data-monit-selo>'+comRegistro+' de '+metas.length+' metas monitoradas</span>'+
      '</div>';
    if(metas.length){
      h+='<div class="np-monit-filtro" role="group" aria-label="Filtro por mês">'+
        '<span class="np-monit-filtro-rot">Abrir mês:</span>'+
        MESES.map(function(ms){
          return '<button type="button" class="rm-chip" data-mes-filtro="'+ms+'" aria-pressed="false">Mês '+ms+'</button>';
        }).join('')+
      '</div>';
    }
    h+='</div>';
    if(!metas.length)return h+'<p class="vazio">'+SEM_METAS+'</p>';
    h+='<div class="np-monit-grid2">';
    metas.forEach(function(m,i){h+=cartao(m,i,foco&&m.id===foco)});
    h+='</div>';
    /* depois de o Guia pôr o HTML na tela, rola até a meta que a pessoa estava vendo no Planejamento */
    if(foco&&typeof document!=='undefined'&&typeof setTimeout==='function'){
      setTimeout(function(){
        var el=document.querySelector('[data-foco]');
        if(el&&el.scrollIntoView)el.scrollIntoView({block:'start'});
      },0);
    }
    return h;
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
    /* a ilha entra no #tela logo antes de o original religar as ilhas (uma só ligação; religar duas vezes quebraria as raízes React) */
    Telas.plano=function(){
      var I=window.Ilhas,lig=I&&I.ligar;
      if(lig)I.ligar=function(t){I.ligar=lig;if(t&&t.insertAdjacentHTML)t.insertAdjacentHTML('beforeend',ILHA);return lig.call(I,t)};
      try{_pl.apply(this,arguments)}finally{if(lig)I.ligar=lig}
    };
  }
})();

/* ---------- feedback só para parlamentar e chefe de gabinete ----------
   No banco as conversas ficam em feedbacks_mandato (RLS: só parlamentar e chefe de gabinete), não em mandatos.dados.
   Aqui o Store.abrir busca essa linha depois de abrir o mandato, e só para quem pode vê-la; os outros papéis ficam com
   D.feedbacks vazio e a tela mostra o aviso de sem acesso. O Store.gravar não envia a chave quando a busca falhou
   (senão gravaria uma lista vazia por cima das conversas) nem quando a pessoa não tem acesso. */
(function(){
  if(typeof Store==='undefined'||typeof Store.abrir!=='function'||Store._feedbackSeparado)return;
  Store._feedbackSeparado=true;
  function meuPapel(){
    var eu=Store.usuario&&Store.usuario.id,l=Store.membros||[];
    for(var i=0;i<l.length;i++)if(l[i].user_id===eu)return l[i].papel;
    return null;
  }
  Store.meuPapel=meuPapel;
  Store.podeVerFeedback=function(){var p=meuPapel();return p==='parlamentar'||p==='chefe_gabinete'};
  Store.feedbackFalhou=false;
  var abrir=Store.abrir,gravar=Store.gravar;
  Store.abrir=async function(id){
    var m=await abrir.apply(this,arguments);
    Store.feedbackFalhou=false;
    if(typeof NUVEM!=='undefined'&&NUVEM){
      this.dados.feedbacks=[];
      if(this.podeVerFeedback()){
        try{
          var l=await Nuvem.rest('feedbacks_mandato?mandato_id=eq.'+id+'&select=dados');
          if(l&&l[0]&&Array.isArray(l[0].dados))this.dados.feedbacks=l[0].dados;
        }catch(e){Store.feedbackFalhou=true}
      }
    }
    return m;
  };
  Store.gravar=async function(){
    var d=this.dados,guarda=d&&d.feedbacks,tira=typeof NUVEM!=='undefined'&&NUVEM&&(Store.feedbackFalhou||!this.podeVerFeedback());
    if(tira)delete d.feedbacks;
    try{return await gravar.apply(this,arguments)}finally{if(tira)d.feedbacks=guarda}
  };
})();

/* ---------- Missão 5 em página única com cartões .np-sec-card, 2 colunas e filtro de meses ----------
   Preserva Comp.monit, Comp.lista, Comp.checklist, Telas.plano e textos de conteudo.js (tests/legado-m5.test.ts). */
(function(){
  if(typeof Guia==='undefined'||typeof Comp==='undefined')return;

  function e(t){return typeof esc==='function'?esc(t):String(t==null?'':t)}

  var _gb=Guia.bloco;
  Guia.bloco=function(p,n){
    if(!this.m||this.m.n!==5||this.modo!=='tudo'||!this.ex)return _gb.call(this,p,n);
    var eid=this.ex.id;
    if(eid==='m5.monit'){
      if(p&&p.k==='intro')return '';
      if(p&&p.k==='componente'){
        var h=_gb.call(this,p,n);
        if(typeof h!=='string')return h;
        h=h.replace(/^<h1[^>]*>[\s\S]*?<\/h1>\s*(?:<div class="texto"><\/div>\s*)?/,'');
        var mSelo=/<span class="selo [^"]*" data-monit-selo>[\s\S]*?<\/span>/.exec(h);
        var seloHtml=mSelo?mSelo[0]:'';
        if(mSelo)h=h.replace(mSelo[0],'');
        var cabMk='<div class="np-monit-cab">',gridMk='<div class="np-monit-grid2">',vazioMk='<p class="vazio">';
        var iCab=h.indexOf(cabMk),iFim=h.indexOf(gridMk);
        if(iFim<0)iFim=h.indexOf(vazioMk);
        var cab=(iCab>=0&&iFim>iCab)?h.slice(iCab,iFim):h;
        var resto=(iFim>=0)?h.slice(iFim):'';
        return '<div class="np-sec-card np-monit-topo">'+
          '<div class="np-monit-cab-topo">'+
            '<h1 class="largo" style="font-size:clamp(28px,4.2vw,42px)">'+e(this.ex.t)+'</h1>'+
            seloHtml+
          '</div>'+
          '<div class="texto">'+(this.ex.intro||'')+'</div>'+
          cab+
        '</div>'+resto;
      }
    }
    if(eid==='m5.feedback'){
      var h2=_gb.call(this,p,n);
      if(typeof h2!=='string')return h2;
      if(p&&p.k==='componente'){
        return h2.replace(/^<h1[^>]*>[\s\S]*?<\/h1>\s*(?:<div class="texto"><\/div>\s*)?/,'');
      }
      return '<div class="np-sec-card">'+h2+'</div>';
    }
    if(eid==='m5.imersao'){
      var chkHtml=Comp.checklist(this.ex);
      var iSub=chkHtml.indexOf('<h4>'),iIlha=chkHtml.indexOf('<div class="ilha" data-ilha="rumo-novociclo"></div>');
      if(p&&p.k==='intro'){
        var camposHtml=iSub>=0?chkHtml.slice(0,iSub):'';
        var c=(typeof D!=='undefined'&&D&&D.campos)||{};
        var itens=this.ex.itens||[];
        var feitos=itens.filter(function(it){return !!c[it.k]}).length;
        return '<div class="np-sec-card np-imersao-topo">'+
          '<div class="np-imersao-cab">'+
            '<h1 class="largo" style="font-size:clamp(28px,4.2vw,42px)">'+e(this.ex.t)+'</h1>'+
            '<span class="selo '+(feitos===itens.length&&itens.length>0?'ok':'andamento')+'" data-imersao-cont>'+feitos+' de '+itens.length+' itens do checklist</span>'+
          '</div>'+
          '<div class="texto">'+(this.ex.intro||'')+'</div>'+
          camposHtml+
        '</div>';
      }
      if(p&&p.k==='componente'){
        var listaChk=(iSub>=0&&iIlha>iSub)?chkHtml.slice(iSub,iIlha):chkHtml;
        var ilhaHtml=iIlha>=0?chkHtml.slice(iIlha):'<div class="ilha" data-ilha="rumo-novociclo"></div>';
        return '<div class="np-2col np-imersao-split">'+
          '<div class="np-sec-card np-imersao-chk-card"><div class="chks">'+listaChk+'</div></div>'+
          '<div class="np-sec-card np-imersao-ciclo-card">'+ilhaHtml+'</div>'+
        '</div>';
      }
    }
    var hPad=_gb.call(this,p,n);
    if(typeof hPad!=='string')return hPad;
    if(p&&p.k==='componente'){
      hPad=hPad.replace(/^<h1[^>]*>[\s\S]*?<\/h1>\s*(?:<div class="texto"><\/div>\s*)?/,'');
    }
    return '<div class="np-sec-card">'+hPad+'</div>';
  };

  var forcou=false,antes='guiado';
  var _r=Guia.render;
  Guia.render=function(){
    var m5=!!(this.m&&this.m.n===5);
    if(m5){
      if(!forcou){antes=this.modo;forcou=true}
      this.modo='tudo';this.i=0;
    }else if(forcou){this.modo=antes;forcou=false}
    _r.apply(this,arguments);
    if(!m5||typeof document==='undefined')return;
    var tl=document.getElementById('tela'),bt=tl&&tl.querySelector('button[onclick="Guia.alternarModo()"]');
    if(bt&&bt.parentNode)bt.parentNode.removeChild(bt);
    if(tl&&tl.querySelectorAll){
      tl.querySelectorAll('.passo-corpo > hr.regra').forEach(function(hr){if(hr.parentNode)hr.parentNode.removeChild(hr)});

      /* Filtro superior de meses em m5.monit: inicia sem seleção (vazios recolhidos; preenchidos e MonitFoco ficam abertos) */
      if(this.ex&&this.ex.id==='m5.monit'){
        var ativo=null,grid=tl.querySelector('.np-monit-grid2'),seloM=tl.querySelector('[data-monit-selo]');
        var btns=tl.querySelectorAll('.np-monit-filtro [data-mes-filtro]');
        btns.forEach(function(b){
          b.addEventListener('click',function(){
            var ms=+b.getAttribute('data-mes-filtro');
            ativo=ativo===ms?null:ms;
            btns.forEach(function(x){x.setAttribute('aria-pressed',+x.getAttribute('data-mes-filtro')===ativo?'true':'false')});
            if(!grid)return;
            grid.querySelectorAll('details[data-mes]').forEach(function(det){
              var m=+det.getAttribute('data-mes');
              var ta=det.querySelector('textarea[data-k]'),rico=det.querySelector('.rico-area');
              var k=ta&&ta.getAttribute('data-k');
              var salvo=(typeof D!=='undefined'&&D.campos&&k?D.campos[k]:'')||'';
              var cheio=!!(String(salvo).trim()||(ta&&ta.value.trim())||(rico&&rico.textContent.trim()));
              det.open=cheio||(ativo!==null&&m===ativo);
            });
          });
        });
        if(grid&&seloM){
          var atuMonit=function(){
            var cards=grid.querySelectorAll('.din[data-meta]'),com=0;
            cards.forEach(function(card){
              var tem=false;
              card.querySelectorAll('textarea[data-k]').forEach(function(ta){
                var k=ta.getAttribute('data-k'),salvo=(typeof D!=='undefined'&&D.campos&&k?D.campos[k]:'')||'';
                var box=ta.parentNode,rico=box&&box.querySelector('.rico-area');
                if(String(salvo).trim()||ta.value.trim()||(rico&&rico.textContent.trim()))tem=true;
              });
              if(tem)com++;
            });
            seloM.textContent=com+' de '+cards.length+' metas monitoradas';
            seloM.className='selo '+(com===cards.length&&cards.length>0?'ok':'andamento');
          };
          grid.addEventListener('input',atuMonit);
        }
      }

      /* Selo ao vivo do checklist de m5.imersao */
      if(this.ex&&this.ex.id==='m5.imersao'){
        var seloIm=tl.querySelector('[data-imersao-cont]'),chksIm=tl.querySelectorAll('.np-imersao-chk-card input[type="checkbox"]');
        if(seloIm&&chksIm.length){
          var atuIm=function(){
            var nOn=0;
            chksIm.forEach(function(el){if(el.checked)nOn++});
            seloIm.textContent=nOn+' de '+chksIm.length+' itens do checklist';
            seloIm.className='selo '+(nOn===chksIm.length?'ok':'andamento');
          };
          chksIm.forEach(function(el){el.addEventListener('change',atuIm)});
        }
      }
    }else if(tl&&tl.innerHTML){
      tl.innerHTML=tl.innerHTML.replace(/<hr class="regra">/g,'');
    }
  };
  var _ir=Guia.ir;
  Guia.ir=function(n){
    if(this.m&&this.m.n===5){this.render();return}
    return _ir.call(this,n);
  };
  var _ab=Guia.abrir;
  Guia.abrir=function(nm,id){
    _ab.call(this,nm,id);
    if(!this.m||this.m.n!==5)return;
    this.modo='tudo';
  };
})();
