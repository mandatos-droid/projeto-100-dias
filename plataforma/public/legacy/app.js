/* ===================== APLICAÇÃO ===================== */
var App={
  aba_:'entrar',
  async iniciar(){
    document.getElementById('avisoModo').innerHTML = NUVEM
      ? '<strong>Modo nuvem.</strong> Os registros ficam no banco do mandato e são acessíveis a quem tiver o código de convite.'
      : '<strong>Modo local.</strong> Ainda não há servidor configurado: os dados ficam salvos apenas neste navegador e a senha não é verificada.';
    document.getElementById('blocoGoogle').classList.toggle('oculto',!NUVEM);
    var u=await Store.sessao();
    if(!u){
      this.telaEntrada();
      if(Store.erroOAuth)document.getElementById('erroEntrada').innerHTML='<div class="erro-cx">'+esc(Store.erroOAuth)+'</div>';
      return;
    }
    // conta nova via Google: o aceite da LGPD foi dado antes do redirecionamento
    if(Store.viaGoogle&&await Store.consentimentoPendente()){
      if(localStorage.getItem('legisla.lgpdAceito'))await Store.consentimento();
      else{await Store.sair();this.telaEntrada();this.aba('criar');
        document.getElementById('erroEntrada').innerHTML='<div class="erro-cx">Para criar a conta é preciso concordar com o tratamento dos dados pessoais.</div>';return}
    }
    await this.entrou();
  },
  telaEntrada(){
    document.getElementById('entrada').classList.remove('oculto');
    document.getElementById('app').classList.add('oculto');
  },
  aba(q){
    this.aba_=q;
    document.getElementById('abaEntrar').setAttribute('aria-selected',q==='entrar');
    document.getElementById('abaCriar').setAttribute('aria-selected',q==='criar');
    document.getElementById('wrapNome').classList.toggle('oculto',q!=='criar');
    document.getElementById('blocoLgpd').classList.toggle('oculto',q!=='criar');
    document.getElementById('wrapLgpd').classList.toggle('oculto',q!=='criar');
    document.getElementById('btEntrada').textContent=q==='criar'?'Criar conta':'Entrar';
    document.getElementById('erroEntrada').innerHTML='';
  },
  async google(){
    // consentimento (LGPD) é pedido antes de sair para o Google; lembrado neste navegador
    if(!localStorage.getItem('legisla.lgpdAceito')){
      this.aba('criar');
      document.getElementById('wrapNome').classList.add('oculto');
      if(!document.getElementById('inLgpd').checked){
        document.getElementById('erroEntrada').innerHTML='<div class="erro-cx">Para continuar com o Google, concorde com o tratamento dos dados pessoais abaixo.</div>';return}
      localStorage.setItem('legisla.lgpdAceito','1');
    }
    Nuvem.google();
  },
  async submeter(){
    var e=document.getElementById('inEmail').value.trim(),
        s=document.getElementById('inSenha').value,
        n=document.getElementById('inNome').value.trim(),
        cx=document.getElementById('erroEntrada');
    cx.innerHTML='';
    if(!e){cx.innerHTML='<div class="erro-cx">Informe o e-mail.</div>';return}
    if(NUVEM&&(!s||s.length<8)){cx.innerHTML='<div class="erro-cx">A senha precisa ter ao menos 8 caracteres.</div>';return}
    if(this.aba_==='criar'&&!document.getElementById('inLgpd').checked){
      cx.innerHTML='<div class="erro-cx">Para criar a conta é preciso concordar com o tratamento dos dados pessoais.</div>';return}
    var b=document.getElementById('btEntrada');b.disabled=true;b.textContent='Aguarde…';
    try{
      if(this.aba_==='criar'){await Store.criarConta(e,s,n||e.split('@')[0]);await Store.consentimento()}
      else await Store.entrar(e,s);
      await this.entrou();
    }catch(err){cx.innerHTML='<div class="erro-cx"'+(err.aviso?' style="background:rgba(27,107,79,.1);border-left-color:var(--ok);color:var(--ok)" role="status"':'')+'>'+esc(err.message)+'</div>'}
    b.disabled=false;b.textContent=this.aba_==='criar'?'Criar conta':'Entrar';
  },
  async entrou(){
    document.getElementById('entrada').classList.add('oculto');
    document.getElementById('app').classList.remove('oculto');
    var lista=await Store.meusMandatos();
    var alvo=localStorage.getItem('legisla.mandatoAtual');
    var m=lista.filter(function(x){return x.id===alvo})[0]||lista[0];
    if(!m){Telas.primeiroAcesso();return}
    document.getElementById('lado').style.display='';
    await Store.abrir(m.id);
    this.lateral();
    window.addEventListener('hashchange',function(){App.rotear()});
    this.rotear();
  },
  async sair(){await Store.sair();location.hash='';location.reload()},
  menu(a){document.getElementById('lado').classList.toggle('aberta',a);
    document.getElementById('veuLado').classList.toggle('oculto',!a)},

  lateral(){
    var m=Store.mandato,d=diaAtual(),g=progGeral();
    document.getElementById('ladoMandato').innerHTML=
      '<div class="mand-nome">'+esc(m.nome_parlamentar||m.nome_civil||'Mandato')+'</div>'+
      '<div class="mand-sub">'+esc([m.cargo,m.casa,m.uf].filter(Boolean).join(' · '))+'</div>'+
      (d===null?'<div class="contador-dia"><b>—</b><span>informe a<br>data de posse</span></div>'
       :d<1?'<div class="contador-dia"><b>D'+d+'</b><span>antes<br>da posse</span></div>'
       :'<div class="contador-dia"><b>'+Math.min(d,999)+'</b><span>dia de<br>100</span></div>')+
      '<div class="barra-geral"><i style="width:'+g+'%"></i></div>';
    document.getElementById('diaMovel').textContent=(d&&d>=1?'Dia '+d+'/100':'');
    var h='<a class="it" href="#/"><span class="nn">●</span><span class="tx">Painel do mandato</span></a>';
    h+='<div class="nav-grupo">As cinco missões</div>';
    MISSOES.forEach(function(mi){
      var p=progMissao(mi);
      h+='<a class="it" href="#/m/'+mi.n+'" style="--c:'+(mi.corNav||mi.cor)+'"><span class="nn">'+mi.n+'</span>'+
         '<span class="tx">'+esc(mi.curto)+'</span>'+
         '<span class="fr'+(p.pct===100?' full':'')+'">'+p.feitos+'/'+p.total+'</span></a>';
    });
    h+='<div class="nav-grupo">Apoio</div>'+
       '<a class="it" href="#/ferramentas"><span class="nn">◆</span><span class="tx">Caixa de ferramentas</span></a>'+
       '<a class="it" href="#/biblioteca"><span class="nn">◆</span><span class="tx">Biblioteca</span></a>'+
       '<div class="nav-grupo">Mandato</div>'+
       '<a class="it" href="#/resumo"><span class="nn">◇</span><span class="tx">Resumo do preenchimento</span></a>'+
       '<a class="it" href="#/equipe"><span class="nn">◇</span><span class="tx">Equipe e convites</span></a>'+
       '<a class="it" href="#/config"><span class="nn">◇</span><span class="tx">Dados do mandato</span></a>';
    document.getElementById('ladoNav').innerHTML=h;
    document.getElementById('ladoQuem').textContent=Store.usuario.nome;
    document.getElementById('linkBiblio').href=BIBLIOTECA_URL;
    this.marcar();
  },
  marcar(){
    var h=location.hash||'#/';
    document.querySelectorAll('#ladoNav .it').forEach(function(a){
      var href=a.getAttribute('href');
      a.classList.toggle('on',href===h||(href!=='#/'&&h.indexOf(href)===0));
    });
  },
  rotear(){
    this.menu(false);
    var p=(location.hash||'#/').replace('#/','').split('/');
    var t=document.getElementById('tela');t.className='tela';
    if(p[0]==='m'&&p[2])Guia.abrir(p[1],p[2]);
    else if(p[0]==='m')Telas.missao(+p[1]);
    else if(p[0]==='ferramentas')Telas.ferramentas();
    else if(p[0]==='biblioteca')Telas.biblioteca();
    else if(p[0]==='resumo')Telas.resumo();
    else if(p[0]==='equipe')Telas.equipe();
    else if(p[0]==='config')Telas.config();
    else Telas.painel();
    if(this.ultima!==location.hash)window.scrollTo(0,0);
    this.ultima=location.hash;
    this.marcar();this.lateral();
  }
};

/* ===================== TELAS ===================== */
var Telas={

painel(){
  var d=diaAtual(),g=progGeral(),prox=proximoExercicio();
  var h='<div class="etiqueta">Regimento Externo · Legisla Brasil</div>'+
    '<h1 class="largo">Guia dos 100 dias</h1>'+
    '<p class="chamada">'+esc(SUBTITULO)+'</p>';

  if(prox){
    h+='<div class="agora"><div class="arco"></div>'+
      '<div class="et">Continue por aqui</div>'+
      '<h2>'+esc(prox.ex.t)+'</h2>'+
      '<p>'+esc(prox.ex.d)+'</p>'+
      '<a class="bt pri" href="#/m/'+prox.m.n+'/'+prox.ex.id+'">Abrir exercício</a>'+
      '<div class="onde">Missão '+prox.m.n+' · '+esc(prox.m.curto)+' · '+esc(prox.m.prazoTxt)+
      (dataPrazo(prox.m)&&!prox.m.continua?' (até '+dBRc(dataPrazo(prox.m))+')':'')+'</div></div>';
  }else{
    h+='<div class="agora"><div class="arco"></div><div class="et">Parabéns</div>'+
      '<h2>Vocês chegaram ao fim dos 100 primeiros dias</h2>'+
      '<p>Todos os exercícios foram concluídos. Use o resumo para preparar a imersão de planejamento do quadrimestre.</p>'+
      '<a class="bt pri" href="#/resumo">Ver o resumo do mandato</a></div>';
  }

  h+='<div class="linha100"><div class="cab">';
  if(d===null)h+='<b>Sem data</b><span>Informe a data de posse em <a href="#/config">Dados do mandato</a> para acompanhar os prazos.</span>';
  else if(d<1)h+='<b>Faltam '+Math.abs(d-1)+' dias</b><span>para a posse, em '+dBRc(posse())+'.</span>';
  else if(d>100)h+='<b>Dia '+d+'</b><span>os 100 primeiros dias terminaram em '+dBRc(somaDias(posse(),99))+'.</span>';
  else h+='<b>Dia '+d+' de 100</b><span>faltam '+(100-d)+' dias · '+g+'% dos exercícios concluídos</span>';
  h+='</div>'+this.trilho(d)+'</div>';

  h+='<h2>As cinco missões</h2>';
  MISSOES.forEach(function(m){
    var p=progMissao(m),v=venceu(m);
    h+='<a class="missao-linha" href="#/m/'+m.n+'" style="--c:'+m.cor+'">'+
      '<span class="ml-num">'+medidor(p.pct,m.cor)+'</span>'+
      '<span class="ml-c"><span class="ml-tit">'+m.n+'. '+esc(m.curto)+'</span>'+
      '<p class="ml-d">'+esc(m.abre)+'</p>'+
      '<span class="ml-meta"><span>'+p.feitos+' de '+p.total+' exercícios</span>'+
      '<span'+(v?' class="venceu"':'')+'>'+esc(m.prazoTxt)+
      (dataPrazo(m)&&!m.continua?' · '+dBR(dataPrazo(m)):'')+'</span></span></span></a>';
  });

  var ev=Store.eventos||[];
  if(ev.length){
    h+='<h2>Últimos registros</h2><ul class="link-lista" style="list-style:none">';
    ev.slice(0,8).forEach(function(x){
      h+='<li><div style="display:flex;justify-content:space-between;gap:16px;padding:13px 0;font-size:15px">'+
        '<span>'+esc(x.texto)+' <span style="color:var(--tinta-3)">· '+esc(x.autor||'')+'</span></span>'+
        '<span style="color:var(--tinta-3);white-space:nowrap">'+dBR(x.criado_em)+'</span></div></li>';
    });
    h+='</ul>';
  }
  h+='<div class="bts" style="margin-top:34px"><a class="bt sec" href="#/resumo">Ver tudo o que foi preenchido</a></div>';
  document.getElementById('tela').innerHTML=h;
},

trilho(d){
  var h='<div class="trilho"><span class="base"></span>';
  var pos=d&&d>0?Math.min(100,d):0;
  h+='<span class="feito" style="width:'+pos+'%"></span>';
  if(d&&d>0&&d<=100)h+='<span class="hoje" style="left:'+pos+'%"><b>hoje</b></span>';
  MISSOES.forEach(function(m){
    var x=Math.min(96,m.pos||m.prazo),p=progMissao(m);
    h+='<a class="marco'+(p.pct===100?' cheio':'')+'" href="#/m/'+m.n+'" style="left:'+x+'%;--c:'+m.cor+'">'+
      '<span class="pt"></span><span class="nm">'+m.n+'. '+esc(m.curto)+'</span>'+
      '<span class="dt">'+(m.continua?'contínua':(dataPrazo(m)?dBR(dataPrazo(m)):'dia '+m.prazo))+'</span></a>';
  });
  return h+'</div>';
},

missao(n){
  var m=MISSOES.filter(function(x){return x.n===n})[0];
  if(!m)return this.painel();
  var p=progMissao(m);
  var h='<div class="etiqueta">Missão '+m.n+' · '+esc(m.prazoTxt)+
    (dataPrazo(m)&&!m.continua?' · até '+dBRc(dataPrazo(m)):'')+'</div>'+
    '<div class="capa-missao" style="--c:'+m.cor+'">'+
    '<h1 class="largo">'+esc(m.titulo)+'</h1>'+
    '<p class="chamada" style="margin-bottom:0">'+esc(m.abre)+'</p></div>'+
    '<ul class="agenda" style="--c:'+m.cor+'">'+m.agenda.map(function(a){return '<li>'+esc(a)+'</li>'}).join('')+'</ul>'+
    '<div class="texto">'+m.resumo+'</div>'+
    '<div class="quadro">'+
    '<div><h4>Ao terminar você terá</h4><ul>'+m.entrega.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></div>'+
    '<div><h4>Momento ideal</h4><ul>'+m.momento.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></div>'+
    '<div><h4>Quem conduz</h4><ul>'+m.lidera.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></div></div>'+
    '<p style="font-size:13.5px;color:var(--tinta-3);max-width:62ch">'+esc(NOTA_PRAZO)+'</p>';

  h+='<h2>Mão na massa <span style="font-family:Commissioner;font-size:15px;font-weight:700;color:var(--tinta-3)">'+p.feitos+' de '+p.total+'</span></h2>';
  h+='<div class="ex-lista">';
  m.exercicios.forEach(function(ex){
    var e=estadoEx(ex);
    h+='<button class="ex-item '+e+'" onclick="location.hash=\'#/m/'+m.n+'/'+ex.id+'\'">'+
      '<span class="sinal"></span><span class="ex-c"><span class="ex-t">'+esc(ex.t)+'</span>'+
      '<p class="ex-d">'+esc(ex.d)+'</p>'+
      '<span class="ex-st">'+Telas.estadoTxt(ex,e)+'</span></span><span class="seta">›</span></button>';
  });
  h+='</div>';
  if(m.fecho)h+='<div class="apoio exemplo" style="margin-top:30px"><span class="tag">Pronto</span>'+m.fecho+'</div>';
  document.getElementById('tela').innerHTML=h;
},

estadoTxt(ex,e){
  var c=D.campos||{},s=[];
  s.push(e==='ok'?'Concluído':e==='andamento'?'Em andamento':'Não iniciado');
  if(ex.tipo==='perguntas'||ex.tipo==='campos')
    s.push(ex.itens.filter(function(i){return (c[i.k]||'').trim()}).length+' de '+ex.itens.length+' respostas');
  if(ex.tipo==='checklist'&&ex.itens)
    s.push(ex.itens.filter(function(i){return c[i.k]}).length+' de '+ex.itens.length+' itens');
  if(ex.tipo==='funcoes')
    s.push(CARGOS_EQUIPE.filter(function(x,i){return (c['m2.f'+(i+1)]||'').trim()}).length+' de '+CARGOS_EQUIPE.length+' cargos');
  if(ex.tipo==='frag')s.push((D.frags||[]).filter(function(f){return f.mp}).length+' classificadas');
  if(ex.tipo==='preditores')s.push((D.preditores||[]).length+' de 3 preditores');
  if(ex.tipo==='metas')s.push((D.metas||[]).length+' metas');
  if(ex.tipo==='lista')s.push((D[ex.chave]||[]).length+' registros');
  if(ex.tipo==='bingo'){var fr={};(D.acoes||[]).forEach(function(a){fr[a.bingo]=1});
    s.push((D.acoes||[]).length+' ações em '+Object.keys(fr).length+' frentes')}
  return s.join(' · ');
},

/* ---------- apoio ---------- */
ferramentas(){
  var h='<div class="etiqueta">Apoio</div><h1>Caixa de ferramentas</h1>'+
    '<p class="chamada">'+esc(FERRAMENTAS.intro)+'</p>'+
    '<h2 style="margin-top:20px">Modelos editáveis</h2><ul class="link-lista">';
  FERRAMENTAS.modelos.forEach(function(m){
    h+= m.u ? '<li><a href="'+m.u+'" target="_blank" rel="noopener">'+esc(m.t)+'</a></li>'
            : '<li><div class="sem-link"><span>'+esc(m.t)+'</span><span class="pendente">link a inserir</span></div></li>';
  });
  h+='</ul>';
  FERRAMENTAS.blocos.forEach(function(b){
    h+='<h2>'+esc(b.t)+'</h2><div class="texto">'+b.html+'</div>';
    var ls=b.links||(b.link?[b.link]:[]);
    if(ls.length){h+='<ul class="link-lista">'+ls.map(function(l){
      return '<li><a href="'+l.u+'" target="_blank" rel="noopener">'+esc(l.t)+'</a></li>'}).join('')+'</ul>'}
  });
  document.getElementById('tela').innerHTML=h;
  var g=document.getElementById('tabGIP');
  if(g)g.innerHTML='<div class="rolar"><table class="tb"><thead><tr><th style="width:4%">#</th><th style="width:22%">Preditor</th><th style="width:36%">Capacidade desenvolvida</th><th>Pergunta-teste</th></tr></thead><tbody>'+
    PREDITORES.map(function(p,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(p.n)+'</td><td>'+esc(p.d)+'</td><td>'+esc(p.q)+'</td></tr>'}).join('')+'</tbody></table></div>';
  var c=document.getElementById('modeloCanal');
  if(c){
    var x='<div class="apoio exemplo"><span class="tag">Modelo de formulário</span>'+
      '<p><strong>'+esc(CANAL_ACOLHIMENTO.abertura)+'</strong></p>'+
      CANAL_ACOLHIMENTO.texto.map(function(t){return '<p>'+esc(t)+'</p>'}).join('')+'</div><ol class="texto">';
    CANAL_ACOLHIMENTO.perguntas.forEach(function(q){
      x+='<li><strong>'+esc(q[0])+'</strong>'+
        (q[1]?'<ul>'+q[1].map(function(o){return '<li>'+esc(o)+'</li>'}).join('')+'</ul>':'')+'</li>';
    });
    x+='</ol><p class="texto"><strong>Possibilidades de atuação voluntária</strong></p><ul class="texto">'+
      CANAL_ACOLHIMENTO.voluntariado.map(function(v){return '<li><strong>'+esc(v[0])+':</strong> '+esc(v[1])+'</li>'}).join('')+'</ul>';
    c.innerHTML=x;
  }
},

biblioteca(){
  var h='<div class="etiqueta">Apoio</div><h1>Biblioteca</h1>'+
    '<p class="chamada">Materiais de aprofundamento sobre os temas que aparecem nas fragilidades do Mapa Político.</p>';
  BIBLIOTECA.forEach(function(b){
    h+='<h2 id="b-'+b.id+'">'+esc(b.t)+'</h2><div class="texto">'+b.html+'</div>';
    var ls=b.links||(b.link?[b.link]:[]);
    if(ls.length)h+='<ul class="link-lista">'+ls.map(function(l){
      return '<li><a href="'+l.u+'" target="_blank" rel="noopener">'+esc(l.t)+'</a></li>'}).join('')+'</ul>';
  });
  document.getElementById('tela').innerHTML=h;
  var lr=document.getElementById('listaRegimentos');
  if(lr){
    var uf=Store.mandato&&Store.mandato.uf;
    var x='<h4>Federal e Congresso Nacional</h4><ul class="link-lista">'+
      REGIMENTOS_FEDERAL.map(function(r){return '<li><a href="'+r[1]+'" target="_blank" rel="noopener">'+esc(r[0])+'</a></li>'}).join('')+'</ul>';
    if(uf&&REGIMENTOS_UF[uf])
      x+='<div class="apoio"><span class="tag">A Casa do seu mandato</span>'+
        '<a href="'+REGIMENTOS_UF[uf]+'" target="_blank" rel="noopener">Regimento Interno — '+esc(UFS[uf][0])+'</a></div>';
    x+='<h4>Assembleias Legislativas estaduais e Câmara Legislativa do DF</h4><ul class="link-lista">';
    Object.keys(REGIMENTOS_UF).forEach(function(u){
      x+='<li><a href="'+REGIMENTOS_UF[u]+'" target="_blank" rel="noopener"><span><span class="uf">'+u+'</span>'+
        esc(UFS[u][0])+(OBS_REGIMENTO[u]?' <span class="obs">('+esc(OBS_REGIMENTO[u])+')</span>':'')+'</span></a></li>';
    });
    lr.innerHTML=x+'</ul>';
  }
},

/* ---------- resumo ---------- */
resumo(){
  var h='<div class="etiqueta">Mandato</div><h1>Resumo do preenchimento</h1>'+
    '<p class="chamada">Tudo o que a equipe registrou, exercício por exercício. Use nas reuniões de alinhamento e na imersão de planejamento.</p>'+
    '<div class="bts" style="margin-bottom:38px">'+
    '<button class="bt pri" onclick="Baixar.tudo()">Baixar resumo completo</button>'+
    '<button class="bt sec" onclick="window.print()">Gerar PDF</button>'+
    '<button class="bt fant" onclick="Baixar.json()">Baixar dados (JSON)</button></div>';
  MISSOES.forEach(function(m){h+=Resumo.missao(m)});
  document.getElementById('tela').innerHTML=h;
},

equipe(){
  var m=Store.mandato;
  var h='<div class="etiqueta">Mandato</div><h1>Equipe e convites</h1>'+
    '<p class="chamada">Quem tiver o código entra no mesmo mandato e preenche junto.</p>'+
    '<h3>Código de convite</h3>'+
    '<p style="font-family:Anton;font-size:40px;letter-spacing:.14em;margin:4px 0 8px">'+esc(m.codigo||'—')+'</p>'+
    '<p class="texto">Envie este código para a equipe. Cada pessoa cria a própria conta e usa o código no primeiro acesso.</p>'+
    '<h3>Pessoas neste mandato</h3><ul class="link-lista">';
  (Store.membros||[]).forEach(function(x){
    h+='<li><div style="display:flex;justify-content:space-between;padding:13px 0"><span>'+esc(x.nome||x.email||'')+'</span>'+
      '<span style="color:var(--tinta-3)">'+esc(x.papel||'')+'</span></div></li>';
  });
  h+='</ul>';
  if(!NUVEM)h+='<div class="apoio atencao"><span class="tag">Modo local</span>O convite por código só funciona entre pessoas diferentes com o banco na nuvem configurado.</div>';
  document.getElementById('tela').innerHTML=h;
},

/* ---------- cadastro do mandato ---------- */
formMandato(m){
  m=m||{};
  var opC='<option value="">Selecione…</option>'+CARGOS_POL.map(function(c){
    return '<option value="'+c+'"'+(m.cargo===c?' selected':'')+'>'+c+'</option>'}).join('');
  var opU='<option value="">UF…</option>'+Object.keys(UFS).map(function(u){
    return '<option value="'+u+'"'+(m.uf===u?' selected':'')+'>'+u+' — '+UFS[u][0]+'</option>'}).join('');
  return '<div class="linha-campos c2">'+
   '<label class="campo"><span class="rot">Nome</span><span class="aj">Nome civil completo da liderança parlamentar.</span>'+
   '<input type="text" id="fmNomeCivil" value="'+esc(m.nome_civil||'')+'" placeholder="Ex.: Marta Silva de Souza"></label>'+
   '<label class="campo"><span class="rot">Nome parlamentar</span><span class="aj">Como aparece na urna e nos registros da Casa.</span>'+
   '<input type="text" id="fmNome" value="'+esc(m.nome_parlamentar||'')+'" placeholder="Ex.: Marta Silva"></label></div>'+
   '<div class="linha-campos c3">'+
   '<label class="campo"><span class="rot">Cargo</span><select id="fmCargo" onchange="Telas.autoCasa()">'+opC+'</select></label>'+
   '<label class="campo"><span class="rot">UF</span><select id="fmUf" onchange="Telas.autoCasa()">'+opU+'</select></label>'+
   '<label class="campo"><span class="rot">Partido</span><input type="text" id="fmPartido" value="'+esc(m.partido||'')+'" placeholder="Sigla"></label></div>'+
   '<div class="linha-campos c2" id="wrapMunicipio"'+(m.cargo==='Vereador(a)'?'':' style="display:none"')+'>'+
   '<label class="campo"><span class="rot">Município</span>'+
   '<input type="text" id="fmMunicipio" value="'+esc(m.municipio||'')+'" placeholder="Ex.: Jiripoca" oninput="Telas.autoCasa()"></label></div>'+
   '<label class="campo"><span class="rot">Casa Legislativa</span>'+
   '<span class="aj" id="ajCasa">Preenchida automaticamente a partir do cargo e da UF. Você pode editar.</span>'+
   '<input type="text" id="fmCasa" value="'+esc(m.casa||'')+'" data-auto="'+(m.casa?'0':'1')+'" oninput="this.dataset.auto=\'0\'"></label>'+
   '<label class="campo"><span class="rot">Data da posse</span>'+
   '<span class="aj">É a partir dela que a plataforma calcula em que dia dos 100 o mandato está e a data de cada prazo.</span>'+
   '<input type="date" id="fmPosse" value="'+esc(m.data_posse||'')+'"></label>'+
   '<h3>Responsável pelo preenchimento</h3>'+
   '<p class="texto" style="font-size:15px;color:var(--tinta-2)">Quem a Legisla procura em caso de dúvida sobre os registros deste mandato.</p>'+
   '<div class="linha-campos c3">'+
   '<label class="campo"><span class="rot">Nome</span><input type="text" id="fmRespNome" value="'+esc(m.resp_nome||'')+'"></label>'+
   '<label class="campo"><span class="rot">Cargo no mandato</span><input type="text" id="fmRespCargo" value="'+esc(m.resp_cargo||'')+'" placeholder="Ex.: Chefia de gabinete"></label>'+
   '<label class="campo"><span class="rot">Telefone <span style="font-weight:400;color:var(--tinta-3)">(opcional)</span></span>'+
   '<input type="text" id="fmRespTelefone" value="'+esc(m.resp_telefone||'')+'" placeholder="(00) 00000-0000"></label></div>';
},
autoCasa(){
  var cargo=v('fmCargo'),uf=v('fmUf'),mun=v('fmMunicipio');
  var wm=document.getElementById('wrapMunicipio');
  if(wm)wm.style.display=(cargo==='Vereador(a)')?'':'none';
  var casa='',nota='Preenchida automaticamente a partir do cargo e da UF. Você pode editar.';
  if(cargo==='Deputado(a) Federal')casa='Câmara dos Deputados';
  else if(cargo==='Senador(a)')casa='Senado Federal';
  else if(cargo==='Deputado(a) Estadual'){
    if(uf){casa=UFS[uf][1];if(uf==='DF')nota='No Distrito Federal o cargo equivalente é Deputado(a) Distrital e a Casa é a Câmara Legislativa do Distrito Federal.'}
    else nota='Selecione a UF para preencher a Assembleia Legislativa correspondente.';
  }
  else if(cargo==='Vereador(a)'){
    if(mun)casa='Câmara Municipal de '+mun;
    else nota='Informe o município para preencher a Câmara Municipal correspondente.';
  }
  var el=document.getElementById('fmCasa');
  if(el&&casa&&el.dataset.auto!=='0')el.value=casa;
  var aj=document.getElementById('ajCasa');if(aj)aj.textContent=nota;
},
colher(){
  return {nome_civil:v('fmNomeCivil'),nome_parlamentar:v('fmNome'),cargo:v('fmCargo'),
    uf:v('fmUf'),municipio:v('fmMunicipio'),casa:v('fmCasa'),partido:v('fmPartido').toUpperCase(),
    data_posse:v('fmPosse')||null,resp_nome:v('fmRespNome'),resp_cargo:v('fmRespCargo'),resp_telefone:v('fmRespTelefone')};
},
config(){
  document.getElementById('tela').innerHTML=
    '<div class="etiqueta">Mandato</div><h1>Dados do mandato</h1>'+
    this.formMandato(Store.mandato)+
    '<div class="bts" style="margin-top:20px"><button class="bt pri" onclick="Telas.salvarMandato()">Salvar</button></div>'+
    '<hr class="regra"><h3>Seus dados</h3><p class="texto">Conta: '+esc(Store.usuario.email||'')+'. '+
    'Para solicitar acesso, correção, portabilidade ou eliminação dos seus dados, escreva para '+
    '<a href="mailto:contato@legislabrasil.org">contato@legislabrasil.org</a>.</p>';
  this.autoCasa();
},
async salvarMandato(){await Store.atualizar(this.colher());App.lateral();aviso('Dados do mandato salvos.')},
primeiroAcesso(){
  document.getElementById('lado').style.display='none';
  document.getElementById('tela').innerHTML=
    '<div class="etiqueta">Primeiro acesso</div><h1>Vamos cadastrar o mandato</h1>'+
    '<p class="chamada">Este é o registro que organiza os 100 dias. Se sua equipe já cadastrou o mandato, use o código de convite.</p>'+
    this.formMandato({})+
    '<div class="bts" style="margin-top:20px"><button class="bt pri" onclick="Telas.novoMandato()">Criar mandato</button></div>'+
    '<hr class="regra"><h3>Já existe um mandato cadastrado</h3>'+
    '<p class="texto">Peça o código de seis letras a quem cadastrou.</p>'+
    '<div class="linha-campos c2"><label class="campo"><span class="rot">Código de convite</span>'+
    '<input type="text" id="inCodigo" maxlength="6" placeholder="Ex.: KJ4TP9" style="text-transform:uppercase"></label></div>'+
    '<div class="bts"><button class="bt sec" onclick="Telas.usarCodigo()">Entrar no mandato</button>'+
    '<button class="bt fant" onclick="App.sair()">Sair da conta</button></div>';
  this.autoCasa();
},
async novoMandato(){
  var c=this.colher();
  if(!c.nome_parlamentar&&!c.nome_civil){aviso('Informe ao menos o nome da liderança parlamentar.');return}
  var m=await Store.criarMandato(c);
  localStorage.setItem('legisla.mandatoAtual',m.id);
  await App.entrou();location.hash='#/';
},
async usarCodigo(){
  try{await Store.entrarPorCodigo(v('inCodigo'));await App.entrou();location.hash='#/'}
  catch(e){aviso(e.message)}
}
};
function v(id){var e=document.getElementById(id);return e?e.value.trim():''}

var CARGOS_POL=['Vereador(a)','Deputado(a) Estadual','Deputado(a) Federal','Senador(a)'];
var UFS={
 AC:['Acre','Assembleia Legislativa do Estado do Acre'],AL:['Alagoas','Assembleia Legislativa do Estado de Alagoas'],
 AP:['Amapá','Assembleia Legislativa do Estado do Amapá'],AM:['Amazonas','Assembleia Legislativa do Estado do Amazonas'],
 BA:['Bahia','Assembleia Legislativa do Estado da Bahia'],CE:['Ceará','Assembleia Legislativa do Estado do Ceará'],
 DF:['Distrito Federal','Câmara Legislativa do Distrito Federal'],ES:['Espírito Santo','Assembleia Legislativa do Estado do Espírito Santo'],
 GO:['Goiás','Assembleia Legislativa do Estado de Goiás'],MA:['Maranhão','Assembleia Legislativa do Estado do Maranhão'],
 MT:['Mato Grosso','Assembleia Legislativa do Estado de Mato Grosso'],MS:['Mato Grosso do Sul','Assembleia Legislativa do Estado de Mato Grosso do Sul'],
 MG:['Minas Gerais','Assembleia Legislativa do Estado de Minas Gerais'],PA:['Pará','Assembleia Legislativa do Estado do Pará'],
 PB:['Paraíba','Assembleia Legislativa do Estado da Paraíba'],PR:['Paraná','Assembleia Legislativa do Estado do Paraná'],
 PE:['Pernambuco','Assembleia Legislativa do Estado de Pernambuco'],PI:['Piauí','Assembleia Legislativa do Estado do Piauí'],
 RJ:['Rio de Janeiro','Assembleia Legislativa do Estado do Rio de Janeiro'],RN:['Rio Grande do Norte','Assembleia Legislativa do Estado do Rio Grande do Norte'],
 RS:['Rio Grande do Sul','Assembleia Legislativa do Estado do Rio Grande do Sul'],RO:['Rondônia','Assembleia Legislativa do Estado de Rondônia'],
 RR:['Roraima','Assembleia Legislativa do Estado de Roraima'],SC:['Santa Catarina','Assembleia Legislativa do Estado de Santa Catarina'],
 SP:['São Paulo','Assembleia Legislativa do Estado de São Paulo'],SE:['Sergipe','Assembleia Legislativa do Estado de Sergipe'],
 TO:['Tocantins','Assembleia Legislativa do Estado do Tocantins']
};
