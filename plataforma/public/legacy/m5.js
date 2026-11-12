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
    var h='<div class="din" data-meta="'+e(m.id)+'"'+(foco?' data-foco':'')+'>'+
      '<span class="idx">Meta '+String(i+1).padStart(2,'0')+'</span>'+
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
    var foco=w&&w.MonitFoco;
    if(w)w.MonitFoco=undefined;
    if(foco&&!metas.some(function(m){return m.id===foco}))foco=null;

    var h='<div class="texto">'+INTRO.map(function(t){return '<p>'+t+'</p>'}).join('')+'</div>'+
      '<h4>Como conduzir</h4><div class="orienta" style="--c:#035252">'+
      '<p><strong>Primeiro passo:</strong> abra o Planejamento Estratégico e registre, em cada meta, o quanto já foi cumprido do todo.</p>'+
      '<p><strong>Segundo passo:</strong> volte aqui e, em cada meta, resuma o caminho percorrido neste mês.</p></div>'+
      '<p class="bts"><a class="bt pri" href="#/plano">Abrir Planejamento Estratégico</a></p>';
    if(!metas.length)return h+'<p class="vazio">'+SEM_METAS+'</p>';
    metas.forEach(function(m,i){h+=cartao(m,i,foco&&m.id===foco)});
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
