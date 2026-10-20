/* =====================================================================
   MÓDULOS NOVOS SOBRE O GUIA ORIGINAL (não gerado: este arquivo é mantido à mão)
   1. Cadastro do mandato: caixa de seleção de parlamentares eleitos (dados do TSE)
   2. Resumo do preenchimento: o que foi registrado nos módulos da Missão 1
   Carregado depois de app.js, guia.js e resumo.js.
   ===================================================================== */
(function(){

var CASA_POR_CARGO={'Deputado(a) Estadual':'estadual','Deputado(a) Federal':'federal','Senador(a)':'senado','Vereador(a)':'vereador'};
var PARTICULAS={de:1,da:1,do:1,das:1,dos:1,e:1};
function titulo(s){
  return String(s||'').toLowerCase().split(' ').map(function(p,i){
    return (i>0&&PARTICULAS[p])?p:p.charAt(0).toUpperCase()+p.slice(1)}).join(' ');
}
function fmt(n){return Number(n||0).toLocaleString('pt-BR')}
function pc(x,d){return Number(x||0).toLocaleString('pt-BR',{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d})+'%'}

/* ---------- dados do TSE (arquivos estáticos em /data) ---------- */
var Tse={
  _c:{},
  carregar:function(url){
    if(!this._c[url])this._c[url]=fetch(url).then(function(r){if(!r.ok)throw new Error('Falha ao carregar '+url);return r.json()});
    return this._c[url];
  },
  uf:function(u){return this.carregar('/data/uf/'+u.toLowerCase()+'.json')},
  mun:function(u){return this.carregar('/data/mun/'+u.toLowerCase()+'.json')},

  /* contêiner inserido no formulário, logo acima do campo de município */
  bloco:function(){
    return '<div id="wrapTse">'+
      '<div class="linha-campos c2 oculto" id="wrapTseMun"><label class="campo"><span class="rot">Município (TSE 2024)</span>'+
      '<span class="aj">Escolha o município para listar os vereadores eleitos.</span>'+
      '<select id="fmMunSel" onchange="Tse.escolherMun(this.value)"><option value="">Selecione…</option></select></label></div>'+
      '<label class="campo" style="max-width:none"><span class="rot">Parlamentar eleito</span>'+
      '<span class="aj" id="ajTse">Selecione o cargo e a UF para listar quem foi eleito.</span>'+
      '<select id="fmEleito" onchange="Tse.escolher(this.value)" disabled><option value="">Selecione cargo e UF…</option></select></label></div>';
  },

  chave:null, lista:[], cdi:'',
  async atualizar(){
    var cargo=v('fmCargo'),uf=v('fmUf'),casa=CASA_POR_CARGO[cargo],sel=document.getElementById('fmEleito');
    if(!sel)return;
    var k=cargo+'|'+uf;
    var wm=document.getElementById('wrapTseMun');
    if(wm)wm.classList.toggle('oculto',casa!=='vereador');
    if(k===this.chave)return;
    this.chave=k;window.__tse=null;this.cdi='';
    var aj=document.getElementById('ajTse');
    var existente=(window.D&&D.tse&&D.tse.sq)?D.tse:null;
    var nota=existente?'Hoje vinculado ao TSE: '+titulo(existente.nome)+' ('+existente.partido+'). Escolha outro nome para trocar.':'';
    if(!casa||!uf){
      sel.disabled=true;sel.innerHTML='<option value="">Selecione cargo e UF…</option>';
      aj.textContent=nota||'Selecione o cargo e a UF para listar quem foi eleito.';return;
    }
    if(casa==='vereador'){
      sel.disabled=true;sel.innerHTML='<option value="">Escolha antes o município…</option>';
      aj.textContent=nota||'Escolha o município para listar os vereadores eleitos em 2024.';
      try{
        var md=await this.mun(uf),ms=Object.keys(md.mun).map(function(id){return {id:id,nm:md.mun[id].nm}})
          .sort(function(a,b){return a.nm.localeCompare(b.nm,'pt')});
        document.getElementById('fmMunSel').innerHTML='<option value="">Selecione…</option>'+
          ms.map(function(m){return '<option value="'+m.id+'">'+esc(m.nm)+'</option>'}).join('');
      }catch(e){aj.textContent='Não foi possível carregar os municípios de '+uf+'. Preencha manualmente.'}
      return;
    }
    aj.textContent='Carregando eleitos de '+uf+'…';sel.disabled=true;
    try{
      var d=await this.uf(uf);
      if(this.chave!==k)return;
      var cs=d[casa],eleitos=cs.cands.filter(function(c){return c.e});
      this.lista=eleitos.map(function(c){return {sq:c.s,casa:casa,c:c,cs:cs,d:d}});
      if(!eleitos.length){
        sel.innerHTML='<option value="">Nenhum eleito disponível</option>';
        aj.textContent=(cs.aviso?('TSE: '+cs.aviso+'. '):'')+'Preencha os dados manualmente.';return;
      }
      sel.innerHTML='<option value="">Selecione o parlamentar…</option>'+
        eleitos.map(function(c){return '<option value="'+c.s+'">'+esc(titulo(c.u))+' · '+esc(c.p)+' · '+fmt(c.v)+' votos</option>'}).join('')+
        '<option value="">Outro nome (preencher manualmente)</option>';
      sel.disabled=false;
      aj.textContent=nota||(eleitos.length+' eleitos em '+d.nome+' ('+cs.cargo+', 2026). Ao escolher, nome, partido e Casa são preenchidos.');
    }catch(e){
      sel.innerHTML='<option value="">Indisponível</option>';
      aj.textContent='Não foi possível carregar os dados do TSE. Preencha manualmente.';
    }
  },

  async escolherMun(cdi){
    var sel=document.getElementById('fmEleito'),aj=document.getElementById('ajTse'),uf=v('fmUf');
    this.cdi=cdi;window.__tse=null;
    if(!cdi){sel.disabled=true;sel.innerHTML='<option value="">Escolha antes o município…</option>';return}
    var md=await this.mun(uf),m=md.mun[cdi];
    var el=document.getElementById('fmMunicipio');if(el)el.value=m.nm;
    Telas.autoCasa();
    var ver=(m.m24&&m.m24.ver)||{eleitos:[],v:0};
    this.lista=ver.eleitos.map(function(e){return {sq:e[3],casa:'vereador',e:e,m:m,cdi:cdi,v:ver.v}});
    sel.innerHTML=ver.eleitos.length
      ?'<option value="">Selecione o vereador…</option>'+ver.eleitos.map(function(e){
          return '<option value="'+e[3]+'">'+esc(titulo(e[0]))+' · '+esc(e[1])+' · '+fmt(e[2])+' votos</option>'}).join('')+
        '<option value="">Outro nome (preencher manualmente)</option>'
      :'<option value="">Sem vereadores eleitos nos dados</option>';
    sel.disabled=!ver.eleitos.length;
    aj.textContent=ver.eleitos.length+' vereadores eleitos em '+m.nm+' (2024).';
  },

  escolher:function(sq){
    window.__tse=null;
    if(!sq)return;
    var it=this.lista.filter(function(x){return x.sq===sq})[0];
    if(!it)return;
    var nomeCivil,nomeUrna,partido,snap;
    if(it.casa==='vereador'){
      nomeCivil=nomeUrna=titulo(it.e[0]);partido=it.e[1];
      snap={sq:sq,casa:'vereador',uf:v('fmUf'),cdi:it.cdi,municipio:it.m.nm,nome:it.e[0],partido:partido,cargo:'Vereador',
        votos:it.e[2],pct:it.v?it.e[2]/it.v*100:0,situacao:'Eleito',ano:2024};
    }else{
      var c=it.c,lista=it.cs.cands;
      nomeCivil=titulo(c.c);nomeUrna=titulo(c.u);partido=c.p;
      snap={sq:sq,casa:it.casa,uf:it.d.uf,nome:c.u,partido:c.p,cargo:it.cs.cargo,votos:c.v,pct:c.x,
        situacao:c.t||'Eleito',pos:lista.findIndex(function(x){return x.s===sq})+1,candidaturas:lista.length,
        vagas:it.cs.vagas,atualizado:it.cs.atualizado,ano:2026};
    }
    window.__tse=snap;
    document.getElementById('fmNomeCivil').value=nomeCivil;
    document.getElementById('fmNome').value=nomeUrna;
    document.getElementById('fmPartido').value=partido;
    Telas.autoCasa();
    aviso('Dados preenchidos a partir do TSE.');
  }
};
window.Tse=Tse;

var _fm=Telas.formMandato;
Telas.formMandato=function(m){
  Tse.chave=null;
  var h=_fm.call(this,m),ancora='<div class="linha-campos c2" id="wrapMunicipio"';
  return h.indexOf(ancora)>=0?h.replace(ancora,Tse.bloco()+ancora):h;
};
var _ac=Telas.autoCasa;
Telas.autoCasa=function(){_ac.call(this);Tse.atualizar()};

/* o vínculo com o TSE vai junto com o registro do mandato */
var _cr=Store.criarMandato;
Store.criarMandato=function(c){
  if(window.__tse){c.dados=Object.assign({},c.dados,{tse:window.__tse});window.__tse=null}
  return _cr.call(this,c);
};
var _at=Store.atualizar;
Store.atualizar=async function(c){
  var t=window.__tse;
  await _at.call(this,c);
  if(t){D.tse=t;window.__tse=null;Store.salvar()}
};

/* ---------- Resumo do preenchimento ---------- */
window.ResumoIlhas={
  foto:function(k,uf,cargo,nome,tam){
    tam=tam||36;
    var ano=/prefeit|vereador/i.test(cargo||'')?2024:2026,base=ano===2024?'ele2024/619':'ele2026/6259';
    return '<span class="foto" style="width:'+tam+'px;height:'+tam+'px;font-size:'+Math.round(tam*.42)+'px">'+
      esc(String(nome||'?').trim().charAt(0).toUpperCase())+
      '<img src="https://resultados.tse.jus.br/oficial/'+base+'/fotos/'+String(uf||'').toLowerCase()+'/'+esc(k)+'.jpeg" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></span>';
  },
  rel:function(grupo){
    var r=D.relacoes||{},out={aliado:[],concorrente:[]};
    Object.keys(r).forEach(function(k){
      var x=r[k];if(!x||!out[x.status])return;
      var local=!!x.mun;
      if(grupo==='assentos'&&local)return;
      if(grupo==='municipio'&&!local)return;
      out[x.status].push(Object.assign({k:k},x));
    });
    return out;
  },
  lista:function(arr,grupo){
    return '<ul class="marcados">'+arr.map(function(x){
      return '<li class="com-foto">'+(Resumo.vivo?ResumoIlhas.foto(x.k,x.uf,x.cargo,x.nome):'')+'<span><strong>'+esc(titulo(x.nome))+'</strong> ('+esc(x.partido)+') — '+esc(x.cargo)+
        (x.mun&&grupo==='municipio'?', '+esc(x.mun):'')+(x.votos!=null?' · '+fmt(x.votos)+' votos':'')+'</span></li>'}).join('')+'</ul>';
  },
  /* mapa interativo-somente-leitura (ilha React) montado depois que o Resumo é desenhado */
  mapa:function(ilha,rot){
    return Resumo.vivo?'<dt style="color:var(--tinta)">'+rot+'</dt><dd class="res-mapa"><div class="ilha" data-ilha="'+ilha+'-resumo"></div></dd>':'';
  },
  html:function(ilha){
    var h='',t=D.tse||{};
    if(ilha==='social')return this.mapa('social','Problemas e potencialidades por agenda e território');
    if(ilha==='eleitorado')return this.mapa('eleitorado','Promessas e grupos sociais por município');
    if(ilha==='calor')return this.mapa('calor','Cadeiras, filiados e posição do partido diante do Executivo');
    if(ilha==='persona-tse'){
      h+='<dt style="color:var(--tinta)">Desempenho eleitoral'+(t.ano?' em '+t.ano:' em 2026')+' (dados do TSE)</dt>';
      var pl=(D.pleitos||[]).slice().sort(function(a,b){return b.ano-a.ano});
      var plHtml=pl.length?'<dd><strong>Outros pleitos (lançados manualmente)</strong><ul class="marcados">'+pl.map(function(p){
        return '<li><span><strong>'+esc(String(p.ano))+'</strong> · '+esc(p.cargo)+(p.municipio?' · '+esc(p.municipio):'')+(p.uf?' · '+esc(p.uf):'')+
          (p.partido?' · '+esc(p.partido):'')+' — '+fmt(p.votos)+' votos'+(p.pct!=null?' ('+pc(p.pct)+')':'')+' · '+esc(p.situacao)+
          (p.obs?'<br><span style="color:var(--tinta-3)">'+esc(p.obs)+'</span>':'')+'</span></li>'}).join('')+'</ul></dd>':'';
      if(!t.sq)return h+(pl.length?plHtml:'<dd>'+Resumo.sem+'</dd>');
      h+='<dd>'+(Resumo.vivo?'<span class="com-foto">'+this.foto(t.sq,t.uf,t.cargo,t.nome,64)+'<span>':'')+'<strong>'+esc(titulo(t.nome))+'</strong> · '+esc(t.partido)+' · '+esc(t.cargo)+(t.municipio?' · '+esc(t.municipio):'')+' · '+esc(t.uf)+
        '<br>Votos: <strong>'+fmt(t.votos)+'</strong> · '+pc(t.pct)+(t.casa==='vereador'?' dos votos válidos do município':' dos votos válidos do cargo')+
        (t.pos?'<br>'+t.pos+'º mais votado(a) entre '+fmt(t.candidaturas)+' candidaturas ('+t.vagas+' vagas)':'')+
        '<br>Situação: '+esc(t.situacao)+(Resumo.vivo?'</span></span>':'')+'</dd>'+plHtml;
      return h;
    }
    if(ilha==='assentos'||ilha==='municipio'){
      var g=this.rel(ilha),rot=ilha==='assentos'?'na Casa Legislativa':'no município';
      h+='<dt style="color:var(--tinta)">Parceiros e concorrentes '+rot+'</dt>';
      var mapa=this.mapa(ilha,ilha==='assentos'?'Hemiciclo da Casa':'Mapa político do estado');
      if(!g.aliado.length&&!g.concorrente.length)return h+'<dd>'+Resumo.sem+'</dd>'+mapa;
      h+='<dd>'+(g.aliado.length?'<strong>Parceiros ('+g.aliado.length+')</strong>'+this.lista(g.aliado,ilha):'')+
        (g.concorrente.length?'<strong>Concorrentes ('+g.concorrente.length+')</strong>'+this.lista(g.concorrente,ilha):'')+'</dd>';
      return h+mapa;
    }
    return h;
  }
};

/* ---------- Perguntas respondidas só pelo módulo (m1.q2 pleitos, m1.q4 legislatura): sem caixa de texto ---------- */
var SEM_CAIXA=/<label class="campo"><textarea data-k="m1\.q[2478]"[^>]*><\/textarea><\/label>|<textarea data-k="m1\.q[2478]"[^>]*><\/textarea>/;
var _gb=Guia.bloco;
Guia.bloco=function(p,n){return _gb.call(this,p,n).replace(SEM_CAIXA,'')};
var _cp=Comp.perguntas;
Comp.perguntas=function(ex){return _cp.call(this,ex).replace(SEM_CAIXA,'')};

/* ---------- Resumo: mapas e links para a pergunta ---------- */
function linkPasso(m,ex,acha){
  var i=Guia.montar(ex).findIndex(acha);
  return '#/m/'+m.n+'/'+ex.id+(i>0?'/'+i:'');
}
function rotulo(href,txt){return '<a class="res-link" href="'+href+'" title="Ir para esta pergunta">'+txt+'</a>'}

var _rex=Resumo.ex;
Resumo.ex=function(ex){
  var r=achaEx(ex.id),m=r&&r.m;
  if(!Resumo.vivo||!m)return _rex.call(this,ex);
  if(ex.tipo==='perguntas'){
    return '<dl class="cmp">'+ex.itens.map(function(i,n){
      var href=linkPasso(m,ex,function(p){return p.k==='pergunta'&&p.n===n});
      return '<dt>'+rotulo(href,(n+1)+'. '+esc(i.t))+'</dt>'+(i.ilha==='persona-tse'||i.ilha==='assentos'||i.ilha==='eleitorado'||i.ilha==='social'?'':'<dd>'+Resumo.v(i.k)+'</dd>')+
        (i.ilha&&window.ResumoIlhas?ResumoIlhas.html(i.ilha):'')}).join('')+'</dl>';
  }
  if(ex.tipo==='campos'){
    var h='<dl class="cmp">'+ex.itens.map(function(i,n){
      var href=linkPasso(m,ex,function(p){return p.k==='campos'&&p.ns.indexOf(n)>=0});
      return '<dt>'+rotulo(href,esc(i.rot))+'</dt><dd>'+Resumo.v(i.k)+'</dd>'}).join('')+'</dl>';
    if(ex.listaExtra)h+=this.lista(ex.listaExtra,ex.listaExtra.titulo);
    return h;
  }
  return _rex.call(this,ex);
};
var _rmi=Resumo.missao;
Resumo.missao=function(m){
  var h=_rmi.call(this,m);
  if(!Resumo.vivo)return h;
  m.exercicios.forEach(function(ex){
    h=h.replace('<h4>'+esc(ex.t)+'<span','<h4>'+rotulo('#/m/'+m.n+'/'+ex.id,esc(ex.t))+'<span');
  });
  return h;
};
var _tr=Telas.resumo;
Telas.resumo=function(){
  Resumo.vivo=true;
  try{_tr.call(this)}finally{Resumo.vivo=false}
  var t=document.getElementById('tela');
  t.className='tela largo';
  if(window.Ilhas)Ilhas.ligar(t);
};

/* link do Resumo: #/m/N/exercicio/PASSO abre o exercício direto na pergunta */
var _ga=Guia.abrir;
Guia.abrir=function(nm,id){
  _ga.call(this,nm,id);
  var passo=parseInt((location.hash||'').replace('#/','').split('/')[3],10);
  if(!isNaN(passo)){this.modo='guiado';this.ir(passo)}
};

})();


/* ---------- Barra lateral recolhível (computador); a escolha fica guardada no navegador ---------- */
(function(){
  var K='guia.ladoFechado',b=document.createElement('button');
  b.type='button';b.className='lado-alterna';
  b.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
  function aplica(f){
    document.body.classList.toggle('lado-fechado',f);
    b.setAttribute('aria-expanded',String(!f));
    b.setAttribute('aria-label',f?'Abrir menu lateral':'Recolher menu lateral');
    b.title=b.getAttribute('aria-label');
  }
  var f=false;try{f=localStorage.getItem(K)==='1'}catch(e){}
  aplica(f);
  b.onclick=function(){f=!document.body.classList.contains('lado-fechado');aplica(f);try{localStorage.setItem(K,f?'1':'0')}catch(e){}};
  (document.getElementById('app')||document.body).appendChild(b);
})();


/* ---------- Missão 3 · mural de bandeiras: seletor no lugar da caixa de texto + resumo da Missão 1 ---------- */
(function(){
  var K='m3.mural';
  var AGENDAS=[
    ['Segurança pública','seguran'],['Educação','educa'],['Agricultura','agri|rural'],['Saúde','saude'],
    ['Direitos humanos','direitos humanos'],['Desenvolvimento econômico','desenvolvimento econ|economi'],['Cultura','cultur'],
    ['Clima e meio ambiente','clima|ambient'],['Mulheres','mulher'],['Equidade racial','racial|racismo|negr'],
    ['Trabalho e emprego','trabalh|emprego'],['Modernização do Estado','moderniza'],
    ['Indústria, comércio e empreendedorismo','industri|comerc|empreend'],['Esportes','esport'],
    ['Ciência, tecnologia e inovação','cienc|tecnolog|inova'],['Lazer','lazer'],['Mineração','minera'],
    ['Assistência social','assistencia social'],['População LGBTQIAP+','lgbt']];
  var RECAP=[['m1.q1','Quem é a liderança'],['m1.q3','Desejo para o futuro'],
    ['m1.q7','Expectativas do eleitorado'],['m1.q8','Conjuntura social do território']];

  function limpa(s){return (s||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim()}
  function norm(s){return limpa(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function sel(){
    var v=D.campos[K]||'';
    return v.split(/;|\n|<br\s*\/?>|<\/(?:p|div|li)>/i).map(limpa).filter(Boolean);
  }
  function grava(l){D.campos[K]=l.join('; ');Store.salvar()}
  function citadas(){
    var t=norm(RECAP.map(function(r){return D.campos[r[0]]}).join(' ')+' '+
      (D.frags||[]).filter(function(f){return f.mp}).map(function(f){return f.t}).join(' '));
    return AGENDAS.map(function(a){return new RegExp(a[1]).test(t)});
  }
  function recap(){
    var h='',fs=(D.frags||[]).filter(function(f){return f.mp});
    RECAP.forEach(function(r){
      var v=(D.campos[r[0]]||'').toString();
      if(richVazio(v))return;
      h+='<div class="bm-r"><b>'+esc(r[1])+'</b><div>'+rich(v)+'</div></div>';
    });
    if(fs.length)h+='<div class="bm-r"><b>Fragilidades apontadas</b><ul>'+fs.map(function(f){
      return '<li><strong>'+f.mp+'</strong> — '+esc(f.t)+'</li>'}).join('')+'</ul></div>';
    return '<details class="bm-recap"'+(h?' open':'')+'><summary>Relembre o que a Missão 1 apurou</summary>'+
      (h||'<p class="bm-vazio">Ainda não há respostas da Missão 1 neste mandato. Preencha-a para ver aqui o resumo.</p>')+'</details>';
  }
  function chips(){
    var s=sel(),cit=citadas(),nomes=AGENDAS.map(function(a){return a[0].toLowerCase()});
    var h=AGENDAS.map(function(a,i){
      var on=s.some(function(x){return x.toLowerCase()===a[0].toLowerCase()});
      return '<button type="button" class="bm-chip'+(on?' on':'')+(cit[i]?' cit':'')+'" aria-pressed="'+on+'" onclick="BandMural.tg('+i+')"'+
        (cit[i]?' title="Citada nas respostas da Missão 1"':'')+'>'+esc(a[0])+'</button>'}).join('');
    s.forEach(function(x,j){
      if(nomes.indexOf(x.toLowerCase())<0)
        h+='<button type="button" class="bm-chip on" aria-pressed="true" title="Clique para remover" onclick="BandMural.rm('+j+')">'+esc(x)+' ×</button>'});
    return '<div class="bm-chips">'+h+'</div>'+
      '<div class="bm-leg"><span class="bm-ponto"></span> citada nas respostas da Missão 1 · <strong>'+s.length+'</strong> '+
      (s.length===1?'selecionada':'selecionadas')+'</div>';
  }
  function widget(){
    return '<div class="bm" id="bmMural">'+recap()+'<h4>Marque as agendas e bandeiras levantadas</h4><div id="bmChips">'+chips()+'</div>'+
      '<div class="bm-add"><input type="text" id="bmNova" placeholder="Outra agenda ou bandeira" '+
      'onkeydown="if(event.key===\'Enter\'){event.preventDefault();BandMural.add()}">'+
      '<button type="button" class="bt sec peq" onclick="BandMural.add()">Acrescentar</button></div></div>';
  }
  function pinta(){var el=document.getElementById('bmChips');if(el)el.innerHTML=chips()}
  window.BandMural={
    tg:function(i){
      var n=AGENDAS[i][0],s=sel(),at=s.findIndex(function(x){return x.toLowerCase()===n.toLowerCase()});
      if(at>=0)s.splice(at,1);else s.push(n);
      grava(s);pinta();
    },
    rm:function(j){var s=sel();s.splice(j,1);grava(s);pinta()},
    add:function(){
      var e=document.getElementById('bmNova'),v=e&&e.value.trim();if(!v)return;
      var s=sel();
      if(!s.some(function(x){return x.toLowerCase()===v.toLowerCase()}))s.push(v);
      e.value='';grava(s);pinta();
    }
  };

  var CX=new RegExp('<label class="campo"><textarea data-k="m3\.mural"[^>]*></textarea></label>|'+
    '<label class="campo"><span class="rot">[^<]*</span><textarea data-k="m3\.mural"[^>]*></textarea></label>');
  var _gb=Guia.bloco;
  Guia.bloco=function(p,n){return _gb.call(this,p,n).replace(CX,widget)};
  var _cp=Comp.campos;
  Comp.campos=function(ex){return _cp.call(this,ex).replace(CX,widget)};
})();

/* ---------- menu lateral: exercícios de cada missão como sub-itens ---------- */
(function(){
  var abertas={};   // missões abertas à mão (a missão da tela atual abre sozinha)
  var _lat=App.lateral;
  App.lateral=function(){
    _lat.call(this);
    var nav=document.getElementById('ladoNav');if(!nav)return;
    var p=(location.hash||'#/').replace('#/','').split('/');
    var atual=p[0]==='m'?+p[1]:0, exAtual=p[2]||'';
    MISSOES.forEach(function(mi){
      var a=nav.querySelector('a.it[href="#/m/'+mi.n+'"]');if(!a)return;
      var aberta=abertas[mi.n]!=null?abertas[mi.n]:mi.n===atual;
      var seta=document.createElement('button');
      seta.type='button';seta.className='sub-seta'+(aberta?' aberta':'');
      seta.setAttribute('aria-expanded',aberta);
      seta.setAttribute('aria-label',(aberta?'Recolher':'Mostrar')+' exercícios da missão '+mi.n);
      seta.textContent='▸';
      seta.onclick=function(e){e.preventDefault();e.stopPropagation();abertas[mi.n]=!aberta;App.lateral()};
      a.insertBefore(seta,a.firstChild);
      if(!aberta)return;
      var ul=document.createElement('div');ul.className='sub-lista';
      mi.exercicios.forEach(function(ex){
        var s=estadoEx(ex);
        var l=document.createElement('a');
        l.className='sub'+(ex.id===exAtual?' on':'')+(s==='ok'?' ok':s==='andamento'?' and':'');
        l.href='#/m/'+mi.n+'/'+ex.id;l.style.setProperty('--c',mi.corNav||mi.cor);
        l.innerHTML='<span class="pt"></span><span class="tx">'+esc(ex.t)+'</span>';
        ul.appendChild(l);
      });
      a.parentNode.insertBefore(ul,a.nextSibling);
    });
  };
})();
