/* =====================================================================
   SUGESTÕES E CORREÇÕES (não gerado: este arquivo é mantido à mão)
   1. Botão flutuante "Sugestões para Pedrinho" + formulário com print colado
   2. Aba "Sugestões e correções" no menu lateral, aberta a todos os logados (resolver/apagar: só equipe Legisla)
   Tabela public.sugestoes (migration 20261020120000). Carregado depois de app.js.
   ===================================================================== */
(function(){

var MAX_LADO=1600;      // o print é reduzido a no máximo 1600 px de largura/altura
var Sug={
  equipe:null,          // pode ver a aba (qualquer pessoa logada); null = ainda não checou
  ehEquipe:false,       // é da equipe Legisla: só ela marca como resolvida e apaga
  abertas:0,
  imagem:null,          // data URL do print em preparação
  filtro:'abertas',
  lista:[],
  previa:false,         // true = banco indisponível ou fora da equipe em ambiente de teste: mostra exemplos fictícios

  /* ---------- botão flutuante e formulário ---------- */
  montar:function(){
    if(!NUVEM||document.getElementById('sugBotao'))return;
    var b=document.createElement('div');b.id='sugBotao';b.className='sug-flutua';
    b.innerHTML='<span class="sug-rotulo">Sugestões para Pedrinho</span>'+
      '<button type="button" class="sug-bt" aria-label="Enviar sugestão ou correção" onclick="Sug.abrir()">'+
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>';
    document.body.appendChild(b);
    var m=document.createElement('div');m.id='sugModal';m.className='sug-veu oculto';
    m.innerHTML='<div class="sug-cx" role="dialog" aria-modal="true" aria-labelledby="sugTit">'+
      '<button type="button" class="sug-fecha" aria-label="Fechar" onclick="Sug.fechar()">×</button>'+
      '<h3 id="sugTit">Sugestões para Pedrinho</h3>'+
      '<p class="sug-intro">Viu algo errado, confuso ou que poderia ser melhor? Conte aqui. Um print ajuda muito.</p>'+
      '<ol class="sug-passos">'+
        '<li><b>Tire um print</b> da tela com a ferramenta de captura: <kbd>Windows</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> '+
        '(no Mac: <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>4</kbd>) e selecione a área.</li>'+
        '<li><b>Volte aqui</b>, clique na caixa abaixo e cole com <kbd>Ctrl</kbd> + <kbd>V</kbd> (Mac: <kbd>Cmd</kbd> + <kbd>V</kbd>).</li>'+
        '<li><b>Escreva</b> o que você percebeu e envie.</li>'+
      '</ol>'+
      '<div id="sugCola" class="sug-cola" tabindex="0" role="button" aria-label="Colar o print aqui">'+
        '<span id="sugColaTx">Clique aqui e cole o print (Ctrl + V)</span>'+
        '<img id="sugPrev" class="oculto" alt="Print colado"></div>'+
      '<div class="sug-linha"><label class="bt fant peq sug-arq">Escolher arquivo de imagem'+
        '<input type="file" id="sugArq" accept="image/*" class="sr"></label>'+
        '<button type="button" id="sugTira" class="bt fant peq oculto" onclick="Sug.limparImagem()">Remover print</button></div>'+
      '<label class="campo"><span class="rot">O que aconteceu ou o que você sugere?</span>'+
        '<textarea id="sugTexto" rows="4" maxlength="5000" placeholder="Ex.: Nesta tela o botão não salva…"></textarea></label>'+
      '<div id="sugErro"></div>'+
      '<div class="bts"><button type="button" class="bt pri" id="sugEnvia" onclick="Sug.enviar()">Enviar</button>'+
      '<button type="button" class="bt fant" onclick="Sug.fechar()">Cancelar</button></div>'+
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('mousedown',function(e){if(e.target===m)Sug.fechar()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.classList.contains('oculto'))Sug.fechar()});
    document.addEventListener('paste',function(e){
      if(m.classList.contains('oculto'))return;
      var its=(e.clipboardData&&e.clipboardData.items)||[];
      for(var i=0;i<its.length;i++){
        if(its[i].type.indexOf('image/')===0){e.preventDefault();Sug.receber(its[i].getAsFile());return}
      }
    });
    var c=document.getElementById('sugCola');
    c.addEventListener('click',function(){c.focus()});
    document.getElementById('sugArq').addEventListener('change',function(){
      if(this.files&&this.files[0])Sug.receber(this.files[0]);this.value='';
    });
  },
  abrir:function(){
    this.montar();
    this.limparImagem();
    document.getElementById('sugTexto').value='';
    document.getElementById('sugErro').innerHTML='';
    document.getElementById('sugModal').classList.remove('oculto');
    document.getElementById('sugCola').focus();
  },
  fechar:function(){document.getElementById('sugModal').classList.add('oculto')},

  /* reduz o print: lado máximo 1600 px, JPEG 80% (um print comum fica em ~150–300 KB) */
  receber:function(arq){
    if(!arq)return;
    var url=URL.createObjectURL(arq),img=new Image();
    img.onload=function(){
      var k=Math.min(1,MAX_LADO/Math.max(img.width,img.height));
      var cv=document.createElement('canvas');cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);
      var cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);
      cx.drawImage(img,0,0,cv.width,cv.height);
      URL.revokeObjectURL(url);
      Sug.imagem=cv.toDataURL('image/jpeg',.8);
      var p=document.getElementById('sugPrev');p.src=Sug.imagem;p.classList.remove('oculto');
      document.getElementById('sugColaTx').classList.add('oculto');
      document.getElementById('sugTira').classList.remove('oculto');
      document.getElementById('sugCola').classList.add('com-img');
    };
    img.onerror=function(){URL.revokeObjectURL(url);aviso('Não consegui ler essa imagem.')};
    img.src=url;
  },
  limparImagem:function(){
    this.imagem=null;
    var p=document.getElementById('sugPrev');if(!p)return;
    p.removeAttribute('src');p.classList.add('oculto');
    document.getElementById('sugColaTx').classList.remove('oculto');
    document.getElementById('sugTira').classList.add('oculto');
    document.getElementById('sugCola').classList.remove('com-img');
  },
  async enviar(){
    var tx=document.getElementById('sugTexto').value.trim(),er=document.getElementById('sugErro');
    er.innerHTML='';
    if(!tx){er.innerHTML='<div class="erro-cx">Escreva uma frase sobre o que você viu ou sugere.</div>';return}
    var b=document.getElementById('sugEnvia');b.disabled=true;b.textContent='Enviando…';
    try{
      await Nuvem.rest('sugestoes',{method:'POST',body:{
        user_id:Store.usuario.id,autor:Store.usuario.nome,email:Store.usuario.email,
        mandato_id:Store.mandato?Store.mandato.id:null,pagina:location.hash||'#/',
        texto:tx,imagem:this.imagem}});
      this.fechar();aviso('Obrigado! Sua sugestão foi enviada.');
    }catch(e){er.innerHTML='<div class="erro-cx">Não foi possível enviar agora. Tente de novo em instantes.</div>'}
    b.disabled=false;b.textContent='Enviar';
  },

  /* ---------- aba da equipe Legisla ---------- */
  async checarEquipe(){
    try{
      var r=await Nuvem.rest('equipe_legisla?select=papel&user_id=eq.'+Store.usuario.id);
      this.ehEquipe=!!(r&&r.length);
    }catch(e){this.ehEquipe=false}
    this.equipe=!!(Store.usuario&&Store.usuario.id);
    if(this.equipe)await this.contar();
    if(this.equipe)App.lateral();
  },
  /* exemplos fictícios, só para ver o layout da tela */
  exemplos:function(){
    var h=Date.now(),d=function(n){return new Date(h-n*3600000).toISOString()};
    return [
      {id:-1,autor:'Maria Souza',email:'maria@gabinete.exemplo',pagina:'#/m/1',texto:'Na pergunta da conjuntura o mapa demora a carregar e o botão de salvar não responde.\nAcontece no celular.',tem_imagem:true,resolvida:false,criado_em:d(2)},
      {id:-2,autor:'João Lima',email:'joao@gabinete.exemplo',pagina:'#/resumo',texto:'Sugestão: poder baixar o resumo só de uma missão.',tem_imagem:false,resolvida:false,criado_em:d(26)},
      {id:-3,autor:'Ana Costa',email:'ana@gabinete.exemplo',pagina:'#/equipe',texto:'O código de convite está cortado na tela pequena.',tem_imagem:true,resolvida:true,criado_em:d(80)}
    ];
  },
  async contar(){
    try{this.abertas=((await Nuvem.rest('sugestoes?select=id&resolvida=eq.false'))||[]).length}catch(e){}
  },
  item:function(){
    return '<a class="it" href="#/sugestoes"><span class="nn">◇</span><span class="tx">Sugestões e correções</span>'+
      (this.abertas?'<span class="fr">'+this.abertas+'</span>':'')+'</a>';
  },
  async tela(){
    var t=document.getElementById('tela');
    if(this.equipe===null){this.equipe=false;await this.checarEquipe()} // abriu o link direto, antes da checagem do menu
    if(!this.equipe){
      t.innerHTML='<div class="etiqueta">Mandato</div><h1>Sugestões e correções</h1>'+
        '<p class="chamada">Entre na sua conta para ver as sugestões.</p>';return;
    }
    t.innerHTML='<div class="etiqueta">Mandato</div><h1>Sugestões e correções</h1><p class="chamada">Carregando…</p>';
    if(!this.previa){
      try{
        this.lista=(await Nuvem.rest('sugestoes?select=id,autor,email,pagina,texto,tem_imagem,resolvida,criado_em&order=criado_em.desc&limit=300'))||[];
      }catch(e){this.previa=true} // tabela ainda não criada ou banco fora do ar
    }
    if(this.previa)this.lista=this.exemplos();
    this.abertas=this.lista.filter(function(x){return !x.resolvida}).length;
    this.desenhar();App.lateral();
  },
  desenhar:function(){
    var eq=this.ehEquipe||this.previa,f=this.filtro,ab=this.lista.filter(function(x){return !x.resolvida}).length,rs=this.lista.length-ab;
    var vis=this.lista.filter(function(x){return f==='todas'||(f==='abertas')===!x.resolvida});
    var h='<div class="etiqueta">Mandato</div><h1>Sugestões e correções</h1>'+
      '<p class="chamada">O que as pessoas enviaram pelo botão “Sugestões para Pedrinho”.</p>'+
      (this.previa?'<div class="apoio atencao"><span class="tag">Prévia</span>Estes são exemplos fictícios, só para mostrar a tela. As sugestões reais aparecem aqui quando o banco estiver ativo e você estiver logado.</div>':'')+
      '<div class="abas sug-abas" role="tablist">'+
      [['abertas','Abertas ('+ab+')'],['resolvidas','Resolvidas ('+rs+')'],['todas','Todas ('+this.lista.length+')']].map(function(a){
        return '<button role="tab" aria-selected="'+(f===a[0])+'" onclick="Sug.filtrar(\''+a[0]+'\')">'+a[1]+'</button>'}).join('')+'</div>';
    if(!vis.length)h+='<p class="texto" style="margin-top:24px">Nada por aqui.</p>';
    vis.forEach(function(x){
      var d=new Date(x.criado_em);
      h+='<article class="sug-card'+(x.resolvida?' feita':'')+'" id="sug-'+x.id+'">'+
        '<div class="sug-meta"><b>'+esc(x.autor||'Sem nome')+'</b>'+(x.email?' · '+esc(x.email):'')+
        ' · '+d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+
        (x.pagina?' · tela <a href="'+esc(x.pagina)+'">'+esc(x.pagina)+'</a>':'')+'</div>'+
        '<p class="sug-texto">'+esc(x.texto).replace(/\n/g,'<br>')+'</p>'+
        (x.tem_imagem?'<div class="sug-img" id="sugImg-'+x.id+'"><button class="bt fant peq" onclick="Sug.verImagem('+x.id+')">Ver print</button></div>':'')+
        (eq?'<div class="bts">'+
        '<button class="bt sec peq" onclick="Sug.resolver('+x.id+','+(!x.resolvida)+')">'+(x.resolvida?'Reabrir':'Marcar como resolvida')+'</button>'+
        '<button class="bt fant peq" onclick="Sug.apagar('+x.id+')">Apagar</button></div>':'')+'</article>';
    });
    document.getElementById('tela').innerHTML=h;
  },
  filtrar:function(f){this.filtro=f;this.desenhar()},
  async verImagem(id){
    var c=document.getElementById('sugImg-'+id);c.textContent='Carregando print…';
    if(this.previa){
      c.innerHTML='<img src="data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#EFE7DA"/><text x="320" y="185" font-family="sans-serif" font-size="22" fill="#938780" text-anchor="middle">print de exemplo</text></svg>')+'" alt="Print de exemplo">';return;
    }
    try{
      var r=await Nuvem.rest('sugestoes?select=imagem&id=eq.'+id);
      c.innerHTML='<img src="'+r[0].imagem+'" alt="Print enviado" onclick="this.classList.toggle(\'cheia\')">';
    }catch(e){c.textContent='Não foi possível carregar o print.'}
  },
  async resolver(id,sim){
    try{
      if(this.previa){this.lista.forEach(function(x){if(x.id===id)x.resolvida=sim});this.desenhar();return}
      var r=await Nuvem.rest('sugestoes?id=eq.'+id,{method:'PATCH',body:{resolvida:sim},headers:{Prefer:'return=representation'}});
      if(!r||!r.length)throw new Error();
      this.lista.forEach(function(x){if(x.id===id)x.resolvida=sim});
      this.abertas=this.lista.filter(function(x){return !x.resolvida}).length;
      this.desenhar();App.lateral();
    }catch(e){aviso('Não foi possível atualizar.')}
  },
  async apagar(id){
    if(!confirm('Apagar esta sugestão de vez?'))return;
    try{
      if(this.previa){this.lista=this.lista.filter(function(x){return x.id!==id});this.desenhar();return}
      var r=await Nuvem.rest('sugestoes?id=eq.'+id,{method:'DELETE',headers:{Prefer:'return=representation'}});
      if(!r||!r.length)throw new Error();
      this.lista=this.lista.filter(function(x){return x.id!==id});
      this.abertas=this.lista.filter(function(x){return !x.resolvida}).length;
      this.desenhar();App.lateral();
    }catch(e){aviso('Só quem é administrador da equipe Legisla pode apagar.')}
  }
};
window.Sug=Sug;

/* ---------- encaixe no menu e no roteador do Guia (app.js é gerado: não mexemos nele) ---------- */
var lateralOrig=App.lateral,roteadorOrig=App.rotear;
App.lateral=function(){
  lateralOrig.call(this);
  Sug.montar();
  if(Sug.equipe===null){Sug.equipe=false;Sug.checarEquipe()}
  else if(Sug.equipe){
    document.getElementById('ladoNav').insertAdjacentHTML('beforeend',Sug.item());
    this.marcar();
  }
};
App.rotear=function(){
  if((location.hash||'').indexOf('#/sugestoes')!==0)return roteadorOrig.call(this);
  this.menu(false);
  document.getElementById('tela').className='tela';
  Sug.tela();
  if(this.ultima!==location.hash)window.scrollTo(0,0);
  this.ultima=location.hash;
  this.marcar();this.lateral();
};

})();
