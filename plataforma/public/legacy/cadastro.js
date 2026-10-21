/* =====================================================================
   CADASTRO DO MANDATO EM DUAS ETAPAS (escrito à mão, não gerado)
   Etapa 1: escolher o parlamentar (cartões com foto, dados do TSE)
   Etapa 2: quem está fazendo o cadastro (responsável pelo preenchimento)
   Usado no primeiro acesso (#/ sem mandato) e em #/config (edição).
   Também refaz a tela "Equipe e convites".
   Carregado depois de novos.js (usa Tse, Store, Telas, App, UFS, aviso, esc, v).
   ===================================================================== */
(function(){

var PARTICULAS={de:1,da:1,do:1,das:1,dos:1,e:1};
function titulo(s){
  return String(s||'').toLowerCase().split(' ').map(function(p,i){
    return (i>0&&PARTICULAS[p])?p:p.charAt(0).toUpperCase()+p.slice(1)}).join(' ');
}
function fmt(n){return Number(n||0).toLocaleString('pt-BR')}
function pct(x){return Number(x||0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'}
function attr(s){return esc(s).replace(/"/g,'&quot;')}
function norm(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function ini(nome){return String(nome||'?').trim().charAt(0).toUpperCase()||'?'}

var COR={PT:'#e5383b',PL:'#1d4ed8','UNIÃO':'#0891b2',PSD:'#eab308',PP:'#14b8a6',REPUBLICANOS:'#6366f1',MDB:'#15803d',
  PODE:'#84cc16',PSB:'#f97316',PSOL:'#a21caf',PSDB:'#60a5fa',PDT:'#7c3aed',NOVO:'#fb923c',PCDOB:'#9f1239',PV:'#4ade80',
  AVANTE:'#a78bfa',SOLIDARIEDADE:'#f472b6',PRD:'#78716c','MISSÃO':'#64748b',REDE:'#65a30d',CIDADANIA:'#fcd34d',DC:'#92400e',
  AGIR:'#b45309',PMB:'#0d9488',PRTB:'#475569',PCO:'#7f1d1d',PSTU:'#991b1b',PCB:'#b91c1c',UP:'#dc2626',DEMOCRATA:'#38bdf8',
  MOBILIZA:'#c084fc',PMN:'#e879f9'};
function cor(p){
  if(COR[p])return COR[p];
  var h=0;for(var i=0;i<String(p).length;i++)h=(h*31+String(p).charCodeAt(i))%360;
  return 'hsl('+h+',55%,42%)';
}

var CARGOS=[
  {v:'Deputado(a) Federal',casa:'federal',sub:'Câmara dos Deputados'},
  {v:'Senador(a)',casa:'senado',sub:'Senado Federal'},
  {v:'Deputado(a) Estadual',casa:'estadual',sub:'Assembleia Legislativa'},
  {v:'Vereador(a)',casa:'vereador',sub:'Câmara Municipal'}
];
function cargoObj(v){return CARGOS.filter(function(c){return c.v===v})[0]}
function rotCargo(cargo,uf){return (cargo==='Deputado(a) Estadual'&&uf==='DF')?'Deputado(a) Distrital':cargo}
function casaDe(cargo,uf,mun){
  if(cargo==='Deputado(a) Federal')return 'Câmara dos Deputados';
  if(cargo==='Senador(a)')return 'Senado Federal';
  if(cargo==='Deputado(a) Estadual')return uf&&UFS[uf]?UFS[uf][1]:'';
  if(cargo==='Vereador(a)')return mun?'Câmara Municipal de '+mun:'';
  return '';
}
function fotoUrl(sq,uf,ano){
  return 'https://resultados.tse.jus.br/oficial/'+(ano===2024?'ele2024/619':'ele2026/6259')+'/fotos/'+String(uf||'').toLowerCase()+'/'+sq+'.jpeg';
}
/* a inicial fica por baixo e some quando a foto carrega; sem foto, só a inicial */
function foto(it){
  return '<span class="ini" aria-hidden="true">'+esc(ini(it.nome))+'</span>'+
    (it.sq?'<img src="'+attr(fotoUrl(it.sq,it.uf,it.ano))+'" width="240" height="320" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">':'');
}
function chipPartido(p){
  return p?'<span class="pc-partido"><i style="background:'+cor(p)+'"></i>'+esc(p)+'</span>':'';
}
function posTxt(it){
  return it.pos?it.pos+'º mais votado(a) entre '+fmt(it.candidaturas)+' candidaturas ('+it.vagas+' vagas)':'';
}

var Cad={
  modo:'novo',passo:1,sujo:false,
  cargo:'',uf:'',cdi:'',munNome:'',
  busca:'',partido:'',lista:null,muns:null,estado:'',chave:'',
  f:{},sel:null,manual:false,confirmado:false,

  /* ---------- início ---------- */
  abrir:function(modo,dentro){
    var m=modo==='editar'?(Store.mandato||{}):{};
    var t=(modo==='editar'&&window.D&&D.tse&&D.tse.sq)?D.tse:null;
    this.modo=modo;this.dentro=!!dentro;this.passo=1;this.sujo=false;window.onbeforeunload=null;
    this.cargo=m.cargo||'';this.uf=m.uf||'';this.cdi=(t&&t.cdi)||'';this.munNome=m.municipio||'';
    this.busca='';this.partido='';this.lista=null;this.muns=null;this.estado='';this.chave='';
    this.f={civil:m.nome_civil||'',nome:m.nome_parlamentar||'',partido:m.partido||'',casa:m.casa||'',posse:m.data_posse||'',
      rNome:modo==='editar'?(m.resp_nome||''):((NUVEM&&Store.usuario&&Store.usuario.nome)||''),
      rCargo:m.resp_cargo||'',rTel:m.resp_telefone||'',proprio:false};
    this.manual=false;this.sel=null;
    if(modo==='editar'&&(m.nome_parlamentar||m.nome_civil)){
      this.sel={sq:t?t.sq:'',nome:titulo(t?t.nome:m.nome_parlamentar),civil:m.nome_civil||'',partido:m.partido||'',
        votos:t?t.votos:null,pct:t?t.pct:null,situ:t?t.situacao:'',pos:t?t.pos:0,vagas:t?t.vagas:0,candidaturas:t?t.candidaturas:0,
        uf:m.uf,ano:t&&t.ano?t.ano:2026,cargo:m.cargo,munNome:m.municipio||'',casa:m.casa||'',atual:true};
      this.manual=!t;
    }
    this.confirmado=!!this.sel||(modo==='editar'&&!!(m.nome_parlamentar||m.nome_civil));
    this.desenhar();
  },
  temMandatos:function(){return !NUVEM&&Object.keys(Local.ler().mandatos||{}).length>0},
  marcarSujo:function(){
    if(this.modo!=='editar'||this.sujo)return;
    this.sujo=true;window.onbeforeunload=function(e){e.preventDefault();e.returnValue='';return ''};
  },
  set:function(k,val){this.f[k]=val;this.marcarSujo()},

  /* ---------- estrutura ---------- */
  desenhar:function(){
    var novo=this.modo==='novo',pri=novo&&!this.dentro&&!this.temMandatos(),t=document.getElementById('tela');
    t.className='tela largo';
    t.innerHTML=
      '<div class="etiqueta">'+(pri?'Primeiro acesso':novo?'Novo cadastro':'Mandato')+'</div>'+
      '<h1 class="largo">'+(pri?'Vamos cadastrar o mandato':novo?'Cadastrar outro mandato':'Dados do mandato')+'</h1>'+
      '<p class="chamada">'+(pri
        ?'Este é o registro que organiza os 100 dias. São duas etapas rápidas: quem é o parlamentar e quem está fazendo o cadastro.'
        :novo?'Cadastre mais um parlamentar. Os mandatos que você já tem continuam na barra lateral, em Cadastros.'
        :'Mantenha atualizado quem é o parlamentar e quem responde pelo preenchimento.')+'</p>'+
      (novo?this.blocoCodigo():'')+
      '<nav aria-label="Etapas do cadastro" id="cadSteps"></nav>'+
      '<div id="cadPasso"></div>'+
      (novo
        ?'<hr class="regra"><div class="bts">'+(this.dentro
          ?'<a class="bt fant" href="#/" style="margin-left:-10px">Cancelar e voltar ao painel</a>'
          :(NUVEM?'<button type="button" class="bt fant" onclick="App.sair()">Sair da conta</button>'
            :(this.temMandatos()?'<button type="button" class="bt fant" onclick="App.sair()" style="margin-left:-10px">← Voltar à seleção de mandatos</button>':'')))+'</div>'
        :'<hr class="regra"><h3>Seus dados</h3><p class="texto">'+(NUVEM?'Conta: '+esc((Store.usuario&&Store.usuario.email)||'')+'. ':'Os dados deste mandato ficam salvos apenas neste navegador. ')+
          'Para solicitar acesso, correção, portabilidade ou eliminação dos seus dados, escreva para '+
          '<a href="mailto:contato@legislabrasil.org">contato@legislabrasil.org</a>.</p>'+
          '<hr class="regra"><h3>Excluir cadastro</h3><p class="texto">Apaga este mandato e tudo o que foi preenchido nele, para toda a equipe. Não dá para desfazer.</p>'+
          '<div class="bts"><button type="button" class="bt sec" id="cadExcluir" style="color:var(--erro);border-color:var(--erro)" onclick="Cad.excluir(this)">Excluir cadastro</button></div>');
    this.tela(false);
  },
  blocoCodigo:function(){
    if(!NUVEM)return '';
    return '<details class="cad-codigo"><summary>Minha equipe já cadastrou o mandato: tenho um código de convite</summary>'+
      '<div class="cad-codigo-corpo"><label class="campo"><span class="rot">Código de convite</span>'+
      '<span class="aj">São seis letras ou números, enviados por quem cadastrou o mandato.</span>'+
      '<input type="text" id="inCodigo" maxlength="6" placeholder="Ex.: KJ4TP9…" autocomplete="off" spellcheck="false" '+
      'autocapitalize="characters" style="text-transform:uppercase;letter-spacing:.14em;max-width:240px" oninput="Cad.limpaErro(\'inCodigo\')">'+
      '<span class="cad-erro" id="e_inCodigo" role="alert"></span></label>'+
      '<div class="bts"><button type="button" class="bt sec" onclick="Cad.codigo()">Entrar no mandato</button></div></div></details>';
  },
  tela:function(focar){
    document.getElementById('cadSteps').innerHTML=this.etapas();
    document.getElementById('cadPasso').innerHTML=this.passo===1?this.p1():this.p2();
    if(this.passo===1&&!this.confirmado)this.sincronizar();
    if(focar){var h=document.getElementById('cadTit');if(h){h.focus({preventScroll:true});h.scrollIntoView({block:'start'})}}
  },
  etapas:function(){
    var p=this.passo,ok1=this.passo===2;
    function item(n,rot,feito){
      return '<li'+(feito?' class="feito"':'')+'><button type="button"'+(p===n?' aria-current="step"':'')+' onclick="Cad.ir('+n+')">'+
        '<span class="n" aria-hidden="true">'+(feito?'✓':n)+'</span><span>'+rot+'</span></button></li>';
    }
    return '<ol class="cad-steps">'+item(1,'Parlamentar',ok1)+item(2,'Quem está cadastrando',false)+'</ol>';
  },
  ir:function(n){
    if(n===this.passo)return;
    if(n===2){var e=this.validar1();if(e.length){this.erros(e);return}}
    this.passo=n;this.tela(true);
  },

  /* ---------- etapa 1: escolher o parlamentar ---------- */
  p1:function(){
    return this.confirmado?this.p1b():this.p1a();
  },
  p1a:function(){
    var pills=CARGOS.map(function(c){
      return '<label class="cad-pill"><input type="radio" name="cadCargo" value="'+attr(c.v)+'"'+(Cad.cargo===c.v?' checked':'')+
        ' onchange="Cad.cargoMuda(this.value)"><span><b>'+esc(rotCargo(c.v,Cad.uf))+'</b><small>'+esc(c.sub)+'</small></span></label>';
    }).join('');
    var ufs='<option value="">Selecione…</option>'+Object.keys(UFS).map(function(u){
      return '<option value="'+u+'"'+(Cad.uf===u?' selected':'')+'>'+u+' — '+esc(UFS[u][0])+'</option>'}).join('');
    return '<h2 id="cadTit" tabindex="-1" class="cad-h2">Quem é o parlamentar?</h2>'+
      '<p class="cad-sub">Escolha o cargo e o estado para ver quem foi eleito(a). Ao clicar no cartão, preenchemos nome, partido e Casa Legislativa com dados do TSE.</p>'+
      (this.sel?'<div class="bts" style="margin:0 0 18px"><button type="button" class="bt fant peq" onclick="Cad.cancelarTroca()">← Manter '+esc(this.sel.nome)+'</button></div>':'')+
      '<fieldset class="cad-fs"><legend>Cargo</legend><div class="cad-pills" id="cadCargos">'+pills+'</div>'+
      '<p class="cad-erro" id="e_cadCargos" role="alert"></p></fieldset>'+
      '<div class="linha-campos c2" style="max-width:62ch">'+
      '<label class="campo" style="margin-bottom:8px"><span class="rot">Estado (UF)</span>'+
      '<select id="cadUf" name="uf" autocomplete="off" onchange="Cad.ufMuda(this.value)">'+ufs+'</select>'+
      '<span class="cad-erro" id="e_cadUf" role="alert"></span></label>'+
      '<label class="campo oculto" id="cadMunWrap" style="margin-bottom:8px"><span class="rot">Município</span>'+
      '<select id="cadMun" name="municipio" autocomplete="off" onchange="Cad.munMuda(this.value)"><option value="">Selecione…</option></select>'+
      '<span class="cad-erro" id="e_cadMun" role="alert"></span></label></div>'+
      '<div class="cad-busca oculto" id="cadBuscaWrap">'+
      '<label class="campo"><span class="rot">Buscar por nome ou partido</span>'+
      '<input type="text" id="cadBusca" name="busca" autocomplete="off" spellcheck="false" placeholder="Ex.: Marta, PT…" oninput="Cad.busque(this.value)"></label>'+
      '<label class="campo"><span class="rot">Partido</span>'+
      '<select id="cadPartido" name="partido" autocomplete="off" onchange="Cad.partidoMuda(this.value)"><option value="">Todos os partidos</option></select></label></div>'+
      '<p class="cad-status" id="cadStatus" role="status" aria-live="polite"></p>'+
      '<p class="cad-erro" id="e_cadGrade" role="alert"></p>'+
      '<div id="cadGrade"></div>'+
      '<div class="cad-manual"><button type="button" class="bt fant" onclick="Cad.manualOn()">Não encontrei na lista: preencher manualmente</button>'+
      '<p class="cad-erro" id="e_cadManual" role="alert"></p></div>';
  },
  /* aplica o estado aos controles e dispara a carga */
  sincronizar:function(){
    var c=cargoObj(this.cargo);
    var w=document.getElementById('cadMunWrap');
    if(w)w.classList.toggle('oculto',!(c&&c.casa==='vereador'));
    this.carregar();
  },
  cargoMuda:function(val){
    this.cargo=val;this.cdi='';this.munNome='';this.partido='';this.busca='';this.lista=null;
    var c=cargoObj(val),w=document.getElementById('cadMunWrap');
    if(w)w.classList.toggle('oculto',!(c&&c.casa==='vereador'));
    this.limpaErro('cadCargos');
    this.carregar();
  },
  ufMuda:function(val){
    this.uf=val;this.cdi='';this.munNome='';this.partido='';this.busca='';this.lista=null;this.muns=null;
    this.limpaErro('cadUf');
    var m=document.getElementById('cadMun');if(m)m.innerHTML='<option value="">Selecione…</option>';
    var r=document.querySelectorAll('input[name=cadCargo]+span b');
    for(var i=0;i<r.length;i++)r[i].textContent=rotCargo(CARGOS[i].v,val);
    this.carregar();
  },
  munMuda:function(val){
    this.cdi=val;this.partido='';this.busca='';this.lista=null;
    var m=this.muns&&this.muns.filter(function(x){return x.id===val})[0];
    this.munNome=m?m.nm:'';
    this.limpaErro('cadMun');
    this.carregar();
  },
  busque:function(val){this.busca=val;this.grade()},
  partidoMuda:function(val){this.partido=val;this.grade()},

  async carregar(){
    var c=cargoObj(this.cargo);
    if(!c||!this.uf){this.estado='';this.lista=null;this.grade();return}
    var chave=this.cargo+'|'+this.uf+'|'+this.cdi;this.chave=chave;
    try{
      if(c.casa==='vereador'){
        if(!this.muns){
          this.estado='carregando';this.lista=null;this.grade();
          var md=await Tse.mun(this.uf);
          if(this.chave!==chave)return;
          this.muns=Object.keys(md.mun).map(function(id){return {id:id,nm:md.mun[id].nm}})
            .sort(function(a,b){return a.nm.localeCompare(b.nm,'pt')});
          var s=document.getElementById('cadMun');
          if(s)s.innerHTML='<option value="">Selecione…</option>'+this.muns.map(function(m){
            return '<option value="'+m.id+'"'+(m.id===Cad.cdi?' selected':'')+'>'+esc(m.nm)+'</option>'}).join('');
        }
        if(!this.cdi){this.estado='mun';this.lista=null;this.grade();return}
        this.estado='carregando';this.lista=null;this.grade();
        var md2=await Tse.mun(this.uf),m=md2.mun[this.cdi];
        if(this.chave!==chave)return;
        var ver=(m.m24&&m.m24.ver)||{eleitos:[],v:0};
        this.munNome=m.nm;
        this.lista=ver.eleitos.map(function(e){
          return {sq:e[3],nome:titulo(e[0]),civil:titulo(e[0]),partido:e[1],votos:e[2],pct:ver.v?e[2]/ver.v*100:0,
            situ:'Eleito',uf:Cad.uf,ano:2024,cargo:'Vereador(a)',munNome:m.nm,casa:casaDe('Vereador(a)',Cad.uf,m.nm),
            snap:{sq:e[3],casa:'vereador',uf:Cad.uf,cdi:Cad.cdi,municipio:m.nm,nome:e[0],partido:e[1],cargo:'Vereador',
              votos:e[2],pct:ver.v?e[2]/ver.v*100:0,situacao:'Eleito',ano:2024}};
        }).sort(function(a,b){return b.votos-a.votos});
      }else{
        this.estado='carregando';this.lista=null;this.grade();
        var d=await Tse.uf(this.uf);
        if(this.chave!==chave)return;
        var cs=d[c.casa],cargo=this.cargo,uf=this.uf,todos=cs.cands;
        this.avisoTse=cs.aviso||'';
        this.lista=todos.filter(function(x){return x.e}).map(function(x){
          var pos=todos.findIndex(function(y){return y.s===x.s})+1;
          return {sq:x.s,nome:titulo(x.u),civil:titulo(x.c),partido:x.p,votos:x.v,pct:x.x,situ:x.t||'Eleito',
            pos:pos,candidaturas:todos.length,vagas:cs.vagas,uf:d.uf,ano:2026,cargo:cargo,munNome:'',casa:casaDe(cargo,uf,''),
            snap:{sq:x.s,casa:c.casa,uf:d.uf,nome:x.u,partido:x.p,cargo:cs.cargo,votos:x.v,pct:x.x,situacao:x.t||'Eleito',
              pos:pos,candidaturas:todos.length,vagas:cs.vagas,atualizado:cs.atualizado,ano:2026}};
        }).sort(function(a,b){return b.votos-a.votos});
      }
      this.estado=this.lista.length?'ok':'vazio';
      var ps=this.lista.map(function(i){return i.partido}).filter(function(p,i,a){return a.indexOf(p)===i}).sort();
      var sp=document.getElementById('cadPartido');
      if(sp)sp.innerHTML='<option value="">Todos os partidos</option>'+ps.map(function(p){
        return '<option value="'+attr(p)+'">'+esc(p)+'</option>'}).join('');
      this.grade();
    }catch(e){
      if(this.chave!==chave)return;
      this.estado='erro';this.lista=null;this.grade();
    }
  },

  grade:function(){
    var st=document.getElementById('cadStatus'),g=document.getElementById('cadGrade'),bw=document.getElementById('cadBuscaWrap');
    if(!st||!g)return;
    this.limpaErro('cadGrade');
    var c=cargoObj(this.cargo),nUf=this.uf&&UFS[this.uf]?UFS[this.uf][0]:'';
    var msg='',h='';
    if(this.estado==='carregando'){msg='Carregando eleitos…';h='<div class="pgrade" aria-hidden="true">'+
      '<span class="pc esq"></span><span class="pc esq"></span><span class="pc esq"></span><span class="pc esq"></span></div>'}
    else if(this.estado==='mun'){msg='Escolha o município para listar os vereadores eleitos em 2024.'}
    else if(this.estado==='erro'){msg='Não foi possível carregar os dados do TSE. Tente de novo ou preencha manualmente.'}
    else if(this.estado==='vazio'){msg=(this.avisoTse?'TSE: '+this.avisoTse+'. ':'')+'Nenhum eleito disponível para esta seleção. Preencha manualmente.'}
    else if(this.estado==='ok'){
      var q=norm(this.busca),p=this.partido;
      var lista=this.lista.filter(function(it){
        return (!p||it.partido===p)&&(!q||norm(it.nome+' '+it.civil+' '+it.partido).indexOf(q)>=0)});
      var onde=c.casa==='vereador'?this.munNome+' (2024)':nUf+' (2026)';
      msg=lista.length===this.lista.length
        ?this.lista.length+' eleitos em '+onde+', do mais votado ao menos votado.'
        :lista.length+' de '+this.lista.length+' eleitos em '+onde+'.';
      if(!lista.length)msg='Nenhum nome encontrado para esse filtro. Limpe a busca ou o partido.';
      h='<div class="pgrade">'+lista.map(function(it){return Cad.cartao(it)}).join('')+'</div>';
    }else{msg='Escolha o cargo e o estado para listar quem foi eleito(a).'}
    st.textContent=msg;g.innerHTML=h;
    if(bw)bw.classList.toggle('oculto',this.estado!=='ok');
  },
  cartao:function(it){
    var atual=this.sel&&this.sel.sq===it.sq;
    var sub=rotCargo(it.cargo,it.uf)+' · '+it.uf+(it.munNome?' · '+it.munNome:'');
    return '<button type="button" class="pc'+(atual?' on':'')+'" onclick="Cad.escolher(\''+attr(it.sq)+'\')" '+
      'aria-label="'+attr('Selecionar '+it.nome+', '+it.partido+', '+sub)+'">'+
      '<span class="pc-foto">'+foto(it)+'</span>'+
      '<span class="pc-info"><span class="pc-nome">'+esc(it.nome)+'</span>'+chipPartido(it.partido)+
      '<span class="pc-linha">'+esc(sub)+'</span>'+
      '<span class="pc-casa">'+esc(it.casa)+'</span>'+
      '<span class="pc-votos">'+fmt(it.votos)+' votos'+(it.pct?' · '+pct(it.pct):'')+'</span></span></button>';
  },
  escolher:function(sq){
    var it=this.lista&&this.lista.filter(function(x){return x.sq===sq})[0];
    if(!it)return;
    this.sel=it;this.manual=false;this.confirmado=true;
    this.f.civil=it.civil;this.f.nome=it.nome;this.f.partido=it.partido;this.f.casa=it.casa;
    this.marcarSujo();this.tela(true);
  },
  trocar:function(){this.confirmado=false;this.manual=false;this.tela(true)},
  cancelarTroca:function(){this.confirmado=true;this.tela(true)},
  manualOn:function(){
    var e=[],c=cargoObj(this.cargo);
    if(!c)e.push({id:'cadCargos',msg:'Escolha o cargo antes de preencher manualmente.'});
    if(!this.uf)e.push({id:'cadUf',msg:'Escolha o estado antes de preencher manualmente.'});
    if(c&&c.casa==='vereador'&&this.uf&&!this.munNome)e.push({id:'cadMun',msg:'Escolha o município antes de preencher manualmente.'});
    if(e.length){this.erros(e);return}
    this.sel={sq:'',nome:'',civil:'',partido:'',uf:this.uf,ano:2026,cargo:this.cargo,munNome:this.munNome,casa:casaDe(this.cargo,this.uf,this.munNome)};
    this.manual=true;this.confirmado=true;
    this.f.civil='';this.f.nome='';this.f.partido='';this.f.casa=this.sel.casa;
    this.marcarSujo();this.tela(true);
  },

  /* confirmação: foto em destaque + dados do mandato */
  p1b:function(){
    var s=this.sel||{},f=this.f;
    var topo;
    if(this.manual){
      topo='<div class="pc-hero sem-foto"><span class="pc-foto"><span class="ini" aria-hidden="true">'+esc(ini(f.nome||f.civil))+'</span></span>'+
        '<div><p class="pc-et">Preenchimento manual</p><p class="pc-linha-g">'+esc(rotCargo(s.cargo,s.uf))+' · '+esc(s.uf)+(s.munNome?' · '+esc(s.munNome):'')+'</p>'+
        '<p class="cad-sub" style="margin:8px 0 14px">Não encontramos este nome na lista do TSE ou ele ainda não consta. Preencha os dados abaixo.</p>'+
        '<button type="button" class="bt sec peq" onclick="Cad.trocar()">Voltar para a lista</button></div></div>';
    }else{
      var kp='';
      if(s.votos!=null){
        kp='<dl class="pc-kpis"><div><dt>Votos</dt><dd>'+fmt(s.votos)+'</dd></div>'+
          (s.pct?'<div><dt>Dos votos válidos</dt><dd>'+pct(s.pct)+'</dd></div>':'')+
          (s.pos?'<div><dt>Posição</dt><dd>'+s.pos+'º</dd></div>':'')+'</dl>'+
          (s.pos?'<p class="pc-peq">'+esc(posTxt(s))+' · '+esc(s.situ||'Eleito')+'</p>':'');
      }
      topo='<div class="pc-hero"><span class="pc-foto">'+foto(s)+'</span><div>'+
        '<p class="pc-et">'+(s.atual?'Parlamentar vinculado':'Parlamentar selecionado')+'</p>'+
        '<h3 class="pc-nome-g">'+esc(s.nome)+'</h3>'+
        (s.civil&&norm(s.civil)!==norm(s.nome)?'<p class="pc-civil">'+esc(s.civil)+'</p>':'')+
        '<div class="pc-chips">'+chipPartido(s.partido)+'</div>'+
        '<p class="pc-linha-g">'+esc(rotCargo(s.cargo,s.uf))+' · '+esc(s.uf)+(s.munNome?' · '+esc(s.munNome):'')+'</p>'+
        '<p class="pc-casa-g">'+esc(f.casa||s.casa||'')+'</p>'+kp+
        '<button type="button" class="bt sec peq" onclick="Cad.trocar()">Trocar parlamentar</button></div></div>';
    }
    var rod='<div class="bts cad-rod"><button type="button" class="bt pri" onclick="Cad.ir(2)">Continuar</button>'+
      (this.modo==='editar'?'<button type="button" class="bt sec" id="cadSalvar1" onclick="Cad.enviar(this)">Salvar alterações</button>':'')+'</div>';
    return '<h2 id="cadTit" tabindex="-1" class="cad-h2">'+(this.manual?'Preencha os dados do parlamentar':'Confirme o parlamentar')+'</h2>'+
      topo+
      '<h3>Dados do mandato</h3>'+
      '<div class="linha-campos c2">'+
      this.campo('cadCivil','civil','Nome civil','Nome completo, como consta no registro.','text','name','Ex.: Marta Silva de Souza…')+
      this.campo('cadNome','nome','Nome parlamentar','Como aparece na urna e nos registros da Casa.','text','off','Ex.: Marta Silva…')+
      '</div><div class="linha-campos c2">'+
      this.campo('cadPartidoF','partido','Partido','Sigla do partido atual.','text','off','Ex.: PT…')+
      this.campo('cadCasa','casa','Casa Legislativa','Preenchida a partir do cargo e da UF. Você pode editar.','text','off','')+
      '</div>'+
      this.campo('cadPosse','posse','Data da posse','É a partir dela que a plataforma calcula em que dia dos 100 o mandato está e a data de cada prazo.','date','off','')+
      rod;
  },
  campo:function(id,k,rot,aj,tipo,ac,ph){
    return '<label class="campo"><span class="rot">'+rot+'</span><span class="aj">'+aj+'</span>'+
      '<input type="'+tipo+'" id="'+id+'" name="'+k+'" value="'+attr(this.f[k])+'" autocomplete="'+ac+'"'+
      (ph?' placeholder="'+attr(ph)+'"':'')+(k==='partido'?' style="text-transform:uppercase" spellcheck="false"':'')+
      ' oninput="Cad.set(\''+k+'\',this.value);Cad.limpaErro(\''+id+'\')"><span class="cad-erro" id="e_'+id+'" role="alert"></span></label>';
  },
  validar1:function(){
    var e=[],c=cargoObj(this.cargo);
    if(!c)e.push({id:'cadCargos',msg:'Escolha o cargo do parlamentar.'});
    if(!this.uf)e.push({id:'cadUf',msg:'Escolha o estado (UF).'});
    if(!this.confirmado||!this.sel){
      e.push({id:'cadGrade',msg:'Escolha o parlamentar na lista ou preencha manualmente.'});
      return e;
    }
    if(!(this.f.nome||'').trim()&&!(this.f.civil||'').trim())e.push({id:'cadNome',msg:'Informe o nome parlamentar ou o nome civil.'});
    if(!(this.f.casa||'').trim())e.push({id:'cadCasa',msg:'Informe a Casa Legislativa.'});
    return e;
  },

  /* ---------- etapa 2: quem está cadastrando ---------- */
  p2:function(){
    var s=this.sel||{},f=this.f,u=Store.usuario||{};
    var resumo='<div class="cad-resumo">'+
      '<span class="pc-foto pq">'+foto(s)+'</span>'+
      '<span><strong>'+esc(f.nome||f.civil||'Parlamentar')+'</strong>'+(f.partido?' · '+esc(f.partido.toUpperCase()):'')+'<br>'+
      '<span class="pc-peq">'+esc(rotCargo(s.cargo,s.uf))+' · '+esc(s.uf||'')+(s.munNome?' · '+esc(s.munNome):'')+' · '+esc(f.casa||'')+'</span></span>'+
      '<button type="button" class="bt fant peq" onclick="Cad.ir(1)">Alterar</button></div>';
    var cargos=['Chefia de gabinete','Assessoria parlamentar','Assessoria de comunicação','Coordenação de campanha','Parlamentar'];
    return '<h2 id="cadTit" tabindex="-1" class="cad-h2">Quem está fazendo o cadastro?</h2>'+
      '<p class="cad-sub">É a pessoa que a Legisla procura em caso de dúvida sobre os registros deste mandato.</p>'+resumo+
      '<label class="chk" style="border:0;padding-top:4px"><input type="checkbox" id="cadProprio"'+(f.proprio?' checked':'')+' onchange="Cad.proprio(this.checked)">'+
      '<span>Eu sou o(a) próprio(a) parlamentar</span></label>'+
      '<div class="linha-campos c2" style="max-width:none">'+
      this.campo('cadRNome','rNome','Seu nome','Como você quer ser chamado(a) pela equipe da Legisla.','text','name','Ex.: João Pereira…')+
      '<label class="campo"><span class="rot">Seu cargo no mandato</span><span class="aj">Escolha uma sugestão ou escreva o seu.</span>'+
      '<input type="text" id="cadRCargo" name="rCargo" list="cadRCargos" value="'+attr(f.rCargo)+'" autocomplete="organization-title" placeholder="Ex.: Chefia de gabinete…" '+
      'oninput="Cad.set(\'rCargo\',this.value)"><datalist id="cadRCargos">'+cargos.map(function(c){return '<option value="'+attr(c)+'">'}).join('')+'</datalist></label></div>'+
      '<div class="linha-campos c2" style="max-width:none">'+
      '<label class="campo"><span class="rot">Telefone <span style="font-weight:400;color:var(--tinta-3)">(opcional)</span></span>'+
      '<span class="aj">Com DDD. Usamos só para contato sobre este mandato.</span>'+
      '<input type="tel" id="cadRTel" name="rTel" inputmode="tel" value="'+attr(f.rTel)+'" autocomplete="tel" placeholder="(61) 99999-0000…" '+
      'oninput="Cad.set(\'rTel\',this.value);Cad.limpaErro(\'cadRTel\')"><span class="cad-erro" id="e_cadRTel" role="alert"></span></label>'+
      (NUVEM?'<label class="campo"><span class="rot">E-mail da conta</span><span class="aj">É o e-mail com que você entrou. Para trocá-lo, fale com a Legisla.</span>'+
      '<input type="email" id="cadREmail" name="email" value="'+attr(u.email||'')+'" autocomplete="email" readonly></label>':'')+'</div>'+
      '<div class="bts cad-rod"><button type="button" class="bt fant" onclick="Cad.ir(1)">← Voltar</button>'+
      '<button type="button" class="bt pri" id="cadSalvar2" onclick="Cad.enviar(this)">'+(this.modo==='novo'?'Criar mandato':'Salvar alterações')+'</button></div>';
  },
  proprio:function(on){
    this.f.proprio=on;this.marcarSujo();
    if(on){
      var s=this.sel||{};
      this.f.rNome=this.f.nome||this.f.civil||this.f.rNome;this.f.rCargo=rotCargo(s.cargo,s.uf)||'Parlamentar';
    }
    document.getElementById('cadPasso').innerHTML=this.p2();
    var c=document.getElementById('cadProprio');if(c)c.focus();
  },
  validar2:function(){
    var e=[],f=this.f;
    if(!(f.rNome||'').trim())e.push({id:'cadRNome',msg:'Informe o seu nome para que a equipe saiba quem preencheu.'});
    var d=String(f.rTel||'').replace(/\D/g,'');
    if(d&&(d.length<10||d.length>11))e.push({id:'cadRTel',msg:'Use o telefone com DDD, por exemplo (61) 99999-0000.'});
    return e;
  },

  /* ---------- erros inline ---------- */
  erros:function(lista){
    var primeiro=null;
    lista.forEach(function(x){
      var m=document.getElementById('e_'+x.id),el=document.getElementById(x.id);
      if(m)m.textContent=x.msg;
      if(el&&el.setAttribute)el.setAttribute('aria-invalid','true');
      if(!primeiro)primeiro=el;
    });
    if(primeiro){
      if(primeiro.id==='cadGrade'||primeiro.id==='cadCargos'){primeiro.setAttribute('tabindex','-1');primeiro.scrollIntoView({block:'center'})}
      primeiro.focus();
    }
  },
  limpaErro:function(id){
    var m=document.getElementById('e_'+id),el=document.getElementById(id);
    if(m)m.textContent='';
    if(el&&el.removeAttribute)el.removeAttribute('aria-invalid');
  },

  /* ---------- gravar ---------- */
  colher:function(){
    var s=this.sel||{},f=this.f;
    return {nome_civil:(f.civil||'').trim(),nome_parlamentar:(f.nome||'').trim(),cargo:s.cargo||this.cargo,uf:s.uf||this.uf,
      municipio:s.cargo==='Vereador(a)'?(s.munNome||''):'',casa:(f.casa||'').trim(),partido:(f.partido||'').trim().toUpperCase(),
      data_posse:f.posse||null,resp_nome:(f.rNome||'').trim(),resp_cargo:(f.rCargo||'').trim(),resp_telefone:(f.rTel||'').trim()};
  },
  async enviar(bt){
    var e1=this.validar1();
    if(e1.length){this.passo=1;this.tela(false);this.erros(e1);return}
    var e2=this.validar2();
    if(e2.length){if(this.passo!==2){this.passo=2;this.tela(false)}this.erros(e2);return}
    var rot=this.modo==='novo'?'Criar mandato':'Salvar alterações';
    bt=document.getElementById('cadSalvar2')||document.getElementById('cadSalvar1')||bt;
    if(bt){bt.disabled=true;bt.textContent=this.modo==='novo'?'Criando…':'Salvando…'}
    try{
      var c=this.colher(),s=this.sel;
      if(this.modo==='novo'){
        window.__tse=(s&&!this.manual&&s.snap)?s.snap:null;
        var m=await Store.criarMandato(c);
        localStorage.setItem('legisla.mandatoAtual',m.id);
        window.onbeforeunload=null;
        if(this.dentro)await Seletor.ir(m.id,true);
        else{await App.entrou();location.hash='#/'}
      }else{
        if(s&&!s.atual&&!this.manual&&s.snap)window.__tse=s.snap;
        else if(this.manual&&window.D&&D.tse&&D.tse.sq){Object.keys(D.tse).forEach(function(k){delete D.tse[k]});Store.salvar()}
        await Store.atualizar(c);
        App.lateral();
        this.sujo=false;window.onbeforeunload=null;
        aviso('Dados do mandato salvos.');
        this.abrir('editar');
      }
    }catch(err){
      aviso('Não foi possível salvar: '+(err&&err.message?err.message:'tente de novo')+'.');
      if(bt){bt.disabled=false;bt.textContent=rot}
    }
  }
};
/* Excluir o cadastro aberto: nuvem pela função excluir_mandato (só a coordenação), local direto no navegador */
Store.excluirMandato=async function(id){
  if(NUVEM)await Nuvem.rest('rpc/excluir_mandato',{method:'POST',body:{p_id:id}});
  else{var b=Local.ler();if(b.mandatos)delete b.mandatos[id];Local.gravar(b)}
};
Cad.excluir=async function(bt){
  var m=Store.mandato;if(!m)return;
  var nome=m.nome_parlamentar||m.nome_civil||'este mandato';
  if(!confirm('Excluir o cadastro de '+nome+'?\n\nTudo o que foi preenchido nele será apagado, para toda a equipe. Não dá para desfazer.'))return;
  if(bt){bt.disabled=true;bt.textContent='Excluindo…'}
  try{
    clearTimeout(Store._t); /* evita regravar o mandato depois de apagado */
    await Store.excluirMandato(m.id);
    this.sujo=false;window.onbeforeunload=null;
    localStorage.removeItem('legisla.mandatoAtual');
    location.hash='';location.reload();
  }catch(err){
    aviso('Não foi possível excluir: '+(err&&err.message?err.message:'tente de novo')+'.');
    if(bt){bt.disabled=false;bt.textContent='Excluir cadastro'}
  }
};
Cad.codigo=async function(){
  var el=document.getElementById('inCodigo'),cod=((el&&el.value)||'').trim().toUpperCase();
  var det=document.querySelector('.cad-codigo');
  if(!cod){if(det)det.open=true;this.erros([{id:'inCodigo',msg:'Digite o código de seis letras ou números que você recebeu.'}]);return}
  try{
    await Store.entrarPorCodigo(cod);
    var lista=await Store.meusMandatos();
    var m=lista.filter(function(x){return String(x.codigo||'').toUpperCase()===cod})[0];
    if(this.dentro){Seletor.lista=lista;await Seletor.ir(m?m.id:Store.mandato.id)}
    else{if(m)localStorage.setItem('legisla.mandatoAtual',m.id);await App.entrou();location.hash='#/'}
  }catch(e){
    if(det)det.open=true;
    this.erros([{id:'inCodigo',msg:(e&&e.message)||'Não foi possível entrar com este código.'}]);
  }
};
window.Cad=Cad;

/* ---------- Cadastros na barra lateral: alternar entre mandatos e criar outro ---------- */
var Seletor={
  lista:null,carregando:false,
  async carregar(){
    if(this.carregando)return;
    this.carregando=true;
    try{this.lista=await Store.meusMandatos()}catch(e){this.lista=[]}
    this.carregando=false;this.desenhar();
  },
  desenhar:function(){
    var nav=document.getElementById('ladoNav');
    if(!nav)return;
    var velho=nav.querySelector('.sel-mand');if(velho)velho.remove();
    if(!this.lista){this.carregar();return}
    var atual=Store.mandato&&Store.mandato.id;
    var itens=this.lista.map(function(m){
      var t=(m.dados&&m.dados.tse)||{};
      var nome=m.nome_parlamentar||m.nome_civil||'Mandato sem nome';
      var sub=[m.partido,rotCargo(m.cargo,m.uf),m.uf].filter(Boolean).join(' · ');
      var on=m.id===atual;
      return '<li><button type="button" class="sel-it'+(on?' on':'')+'"'+(on?' aria-current="true"':'')+' onclick="Seletor.ir(\''+attr(m.id)+'\')">'+
        '<span class="pc-foto pq sm">'+foto({sq:t.sq||'',nome:nome,uf:m.uf,ano:t.ano||2026})+'</span>'+
        '<span class="sel-tx"><b>'+esc(nome)+'</b><small>'+esc(sub)+'</small></span></button></li>';
    }).join('');
    nav.insertAdjacentHTML('afterbegin',
      '<div class="sel-mand"><div class="nav-grupo" style="padding-top:12px">Cadastros ('+this.lista.length+')</div>'+
      '<ul class="sel-lista">'+itens+'</ul>'+
      '<a class="sel-novo'+((location.hash||'')==='#/novo'?' on':'')+'" href="#/novo"><span aria-hidden="true">+</span> Novo cadastro</a></div>');
  },
  async ir(id,recarregar){
    if(recarregar)this.lista=null;
    if(!recarregar&&Store.mandato&&Store.mandato.id===id&&(location.hash||'#/')!=='#/novo')return;
    try{
      localStorage.setItem('legisla.mandatoAtual',id);
      await Store.abrir(id);
      window.onbeforeunload=null;
      var h=location.hash||'#/';
      if(h==='#/'||h==='')App.rotear();else location.hash='#/';
      var nome=Store.mandato.nome_parlamentar||Store.mandato.nome_civil||'mandato';
      aviso(recarregar?'Cadastro criado: '+nome+'.':'Você está em: '+nome+'.');
    }catch(e){aviso('Não foi possível abrir este cadastro: '+((e&&e.message)||'tente de novo')+'.')}
  }
};
window.Seletor=Seletor;

/* ---------- Tela de entrada: cards dos mandatos já criados (só modo local) ---------- */
var Entrada={
  mandatos:function(){
    var box=document.getElementById('entrada');
    if(!box)return;
    var velho=box.querySelector('.entrada-mandatos');if(velho)velho.remove();
    if(NUVEM)return; /* na nuvem isso exporia cadastros a quem não entrou */
    var b=Local.ler(),lista=Object.keys(b.mandatos||{}).map(function(k){return b.mandatos[k]});
    if(!lista.length)return;
    var cards=lista.map(function(m){
      var t=(m.dados&&m.dados.tse)||{};
      var nome=m.nome_parlamentar||m.nome_civil||'Mandato sem nome';
      var sub=rotCargo(m.cargo,m.uf)+(m.uf?' · '+m.uf:'')+(m.municipio?' · '+m.municipio:'');
      var n=(m.membros||[]).length;
      return '<li class="pc-li"><button type="button" class="pc" onclick="Entrada.abrir(\''+attr(m.id)+'\')" '+
        'aria-label="'+attr('Abrir o mandato de '+nome)+'"><span class="pc-foto">'+foto({sq:t.sq||'',nome:nome,uf:m.uf,ano:t.ano||2026})+'</span>'+
        '<span class="pc-info"><span class="pc-nome">'+esc(nome)+'</span>'+chipPartido(m.partido)+
        '<span class="pc-linha">'+esc(sub)+'</span><span class="pc-casa">'+esc(m.casa||'')+'</span>'+
        '<span class="pc-votos">'+n+(n===1?' pessoa':' pessoas')+' na equipe</span></span></button></li>';
    }).join('');
    box.insertAdjacentHTML('beforeend','<section class="entrada-mandatos" aria-labelledby="entMandTit">'+
      '<h2 id="entMandTit">Mandatos cadastrados neste navegador ('+lista.length+')</h2>'+
      '<p>Clique em um mandato para abrir.</p><ul class="pgrade">'+cards+'</ul></section>');
  }
};
/* ---------- Modo local: sem contas ----------
   O app roda no próprio computador, então não há login nem vínculo com e-mail: os mandatos ficam
   no navegador e todos aparecem na seleção e na barra lateral. Login e senha valem só na nuvem. */
var USUARIO_LOCAL={id:'u_local',email:'',nome:'Equipe local'};
if(!NUVEM){
  Store.sessao=async function(){
    var ms=Local.ler().mandatos||{},atual=localStorage.getItem('legisla.mandatoAtual');
    this.usuario=Object.assign({},USUARIO_LOCAL);
    if(Object.keys(ms).length&&!(atual&&ms[atual]))return null; /* mostra a seleção de mandatos */
    return this.usuario;
  };
  Store.meusMandatos=async function(){
    var ms=Local.ler().mandatos||{};
    return Object.keys(ms).map(function(k){return ms[k]});
  };
  var _ab=Store.abrir;
  Store.abrir=async function(id){
    var m=await _ab.call(this,id);
    if(this.usuario)this.usuario.nome=m.resp_nome||USUARIO_LOCAL.nome;
    return m;
  };
  var _cr2=Store.criarMandato;
  Store.criarMandato=async function(c){
    var m=await _cr2.call(this,c),b=Local.ler(),r=(b.mandatos||{})[m.id];
    if(r&&r.membros&&r.membros[0]){r.membros[0].nome=c.resp_nome||r.membros[0].nome;r.membros[0].email='';Local.gravar(b);m=r}
    return m;
  };
  var _at2=Store.atualizar;
  Store.atualizar=async function(c){
    await _at2.call(this,c);
    var b=Local.ler(),r=(b.mandatos||{})[this.mandato.id];
    if(r&&r.membros&&r.membros[0]&&c.resp_nome){r.membros[0].nome=c.resp_nome;Local.gravar(b);this.membros=r.membros}
    if(this.usuario)this.usuario.nome=this.mandato.resp_nome||USUARIO_LOCAL.nome;
  };
}
Entrada.abrir=async function(id){
  try{
    Store.usuario=Object.assign({},USUARIO_LOCAL);
    localStorage.setItem('legisla.mandatoAtual',id);
    await App.entrou();
    location.hash='#/';
  }catch(e){aviso('Não foi possível abrir este mandato: '+((e&&e.message)||'tente de novo')+'.')}
};
Entrada.novo=function(){
  document.getElementById('entrada').classList.add('oculto');
  document.getElementById('app').classList.remove('oculto');
  document.getElementById('lado').style.display='none';
  Cad.abrir('novo');
};
window.Entrada=Entrada;
var _te=App.telaEntrada;
App.telaEntrada=function(){
  _te.call(this);
  if(!NUVEM){
    var cx=document.querySelector('#entrada .entrada-cx');
    if(cx){
      /* sem login: some o formulário e fica o convite para cadastrar */
      Array.prototype.forEach.call(cx.children,function(el){
        if(!/^(IMG|H1)$/.test(el.tagName)&&!el.classList.contains('sb')&&!el.classList.contains('aviso-modo'))el.classList.add('oculto');
      });
      var av=document.getElementById('avisoModo');
      if(av){
        av.innerHTML='<strong>Modo local.</strong> Os dados ficam salvos apenas neste navegador.';
        if(!document.getElementById('entNovo'))
          av.insertAdjacentHTML('beforebegin','<div class="bts" id="entNovo" style="margin-top:6px"><button type="button" class="bt pri" onclick="Entrada.novo()">Cadastrar novo mandato</button></div>');
      }
    }
  }
  Entrada.mandatos();
};
var _lat=App.lateral;
App.lateral=function(){
  if(!Store.mandato)return;
  _lat.call(this);Seletor.desenhar();
  if(!NUVEM){
    var bt=document.querySelector('.lado-pe button');if(bt)bt.textContent='Voltar à seleção de mandatos';
    var q=document.getElementById('ladoQuem');if(q)q.textContent=Store.mandato.resp_nome?'Responsável: '+Store.mandato.resp_nome:'';
  }
};
var _rot=App.rotear;
App.rotear=function(){
  if(!Store.mandato&&!Cad.dentro)return; /* saindo da conta: o botão Sair zera o mandato antes de recarregar */
  if((location.hash||'').indexOf('#/novo')===0){
    this.menu(false);
    Cad.abrir('novo',true);
    window.scrollTo(0,0);
    this.ultima=location.hash;
    this.lateral();this.marcar();
    return;
  }
  _rot.call(this);
};

/* ---------- telas que passam a usar o cadastro em duas etapas ---------- */
Telas.config=function(){Cad.abrir('editar')};
Telas.primeiroAcesso=function(){
  document.getElementById('lado').style.display='none';
  Cad.abrir('novo');
};

/* ---------- Equipe e convites ---------- */
var PAPEIS={coordenacao:'Coordenação',assessoria:'Assessoria'};
Telas.equipe=function(){
  var m=Store.mandato||{},t=(window.D&&D.tse)||{};
  var cod=m.codigo||'';
  var par={sq:t.sq||'',nome:titulo(t.nome||m.nome_parlamentar||m.nome_civil||'Mandato'),uf:m.uf,ano:t.ano||2026};
  var membros=Store.membros||[];
  var h='<div class="etiqueta">Mandato</div><h1>Equipe e convites</h1>'+
    '<p class="chamada">Quem tiver o código entra no mesmo mandato e preenche junto.</p>'+
    '<div class="eq-mandato"><span class="pc-foto pq">'+foto(par)+'</span><span><strong>'+esc(par.nome)+'</strong>'+
    (m.partido?' · '+esc(m.partido):'')+'<br><span class="pc-peq">'+esc([rotCargo(m.cargo,m.uf),m.uf,m.casa].filter(Boolean).join(' · '))+'</span></span></div>'+
    '<section class="eq-codigo" aria-labelledby="eqCodTit"><h2 id="eqCodTit" class="cad-h3">Código de convite</h2>'+
    '<p class="eq-cod" aria-label="Código '+attr(cod.split('').join(' '))+'">'+esc(cod||'—')+'</p>'+
    '<p class="texto">Envie este código para a equipe. Cada pessoa cria a própria conta e usa o código no primeiro acesso.</p>'+
    (cod?'<div class="bts"><button type="button" class="bt pri" onclick="Equipe.copiar(0)">Copiar código</button>'+
      '<button type="button" class="bt sec" onclick="Equipe.copiar(1)">Copiar mensagem de convite</button></div>':'')+
    '</section>'+
    '<h2 class="cad-h3" style="margin-top:44px">Pessoas neste mandato <span class="eq-n">'+membros.length+'</span></h2>';
  if(!membros.length)h+='<p class="vazio">Ainda não há pessoas neste mandato além de você.</p>';
  else{
    h+='<ul class="eq-lista">'+membros.map(function(x){
      var nome=x.nome||x.email||'Sem nome',eu=NUVEM&&Store.usuario&&(x.user_id===Store.usuario.id||(x.email&&x.email===Store.usuario.email));
      return '<li><span class="eq-av" aria-hidden="true">'+esc(ini(nome))+'</span>'+
        '<span class="eq-q"><span class="eq-nome"><strong>'+esc(nome)+'</strong>'+(eu?'<span class="eq-eu">você</span>':'')+'</span>'+
        (x.email&&x.email!==nome?'<span class="pc-peq">'+esc(x.email)+'</span>':'')+'</span>'+
        '<span class="eq-papel">'+esc(PAPEIS[x.papel]||x.papel||'')+'</span></li>';
    }).join('')+'</ul>';
  }
  if(!NUVEM)h+='<div class="apoio atencao"><span class="tag">Modo local</span>O convite por código só funciona entre pessoas diferentes com o banco na nuvem configurado.</div>';
  document.getElementById('tela').className='tela';
  document.getElementById('tela').innerHTML=h;
};
window.Equipe={
  copiar:function(msg){
    var m=Store.mandato||{},cod=m.codigo||'';
    var txt=msg?('Olá! Estamos preenchendo juntos o Guia dos 100 Dias do mandato de '+
      (m.nome_parlamentar||m.nome_civil||'nosso mandato')+'. Crie a sua conta em '+location.origin+
      ' e use o código '+cod+' no primeiro acesso.'):cod;
    var ok=function(){aviso(msg?'Mensagem de convite copiada.':'Código copiado.')};
    var falha=function(){aviso('Não foi possível copiar. Selecione o texto e copie manualmente.')};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,falha);else falha();
  }
};

})();
