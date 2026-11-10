/* =====================================================================
   ACESSO E EQUIPE (escrito à mão, não gerado) · feature acesso-equipe-convites
   O convite agora é um link pessoal (/convite#<token>) e a equipe é gerida em /mandato/equipe.
   Aqui o Guia perde o código de convite antigo, por override (AD-003: app.js e nucleo.js são
   extraídos e sobrescritos). Carregado depois de cadastro.js (usa Store, Telas, Cad, App, NUVEM).
   ===================================================================== */
(function(){

/* ---------- código de convite: sai de todas as telas (ACE-07.2) ---------- */
/* cadastro novo (primeiro acesso e "Novo cadastro"): sem o bloco "tenho um código de convite" */
Cad.blocoCodigo=function(){return ''};

/* a entrada pelo código não chama mais o banco: entrar_com_codigo perdeu a permissão de execução (ACE-07.1) */
Store.entrarPorCodigo=async function(){
  throw new Error('Para entrar em um mandato, abra o link de convite que você recebeu.');
};

/* tela de entrada: o aviso do modo nuvem citava o código; mesma troca do aviso de consentimento (ACE-07.4) */
var _iniciar=App.iniciar;
App.iniciar=function(){
  var r=_iniciar.apply(this,arguments); /* o aviso é escrito antes da primeira espera */
  var av=document.getElementById('avisoModo');
  if(av)av.innerHTML=av.innerHTML.replace('código de convite','link de convite');
  return r;
};

/* ---------- login só com Google (PAG-01, PAG-05) ----------
   Com a nuvem ligada não há senha nem cadastro por e-mail: Store.criarConta e Store.entrar recusam sem chamada de rede
   (nucleo.js continua com o código, que deixa de ter caminho que o alcance), a tela de entrada fica só com o botão do
   Google e o aviso de LGPD, e o erro do Google usa o texto da spec. A renovação por refresh_token (Store.sessao) segue
   como está. Modo local (sem nuvem) não tem Google nem rede: fica como era. */
var ERRO_GOOGLE='Não foi possível entrar com o Google. Tente de novo.';
if(NUVEM){
  var ENTRE_COM_GOOGLE='Entre com o Google.';
  Store.criarConta=async function(){throw new Error(ENTRE_COM_GOOGLE)};
  Store.entrar=async function(){throw new Error(ENTRE_COM_GOOGLE)};
  App.aba=function(){};
  App.comEmail=function(){};
  App.submeter=async function(){};
  /* abas, campos de e-mail, senha e nome, caixa de concordância do cadastro, botão Entrar e "Usar e-mail e senha" saem da tela */
  Array.prototype.forEach.call(document.querySelectorAll('#entrada .abas,#entrada .campo,#entrada #wrapLgpd,#entrada .bts,#entrada #btComEmail'),
    function(el){el.remove()});
  var _sessao=Store.sessao;
  Store.sessao=async function(){
    var u=await _sessao.apply(this,arguments);
    if(Store.erroOAuth)Store.erroOAuth=ERRO_GOOGLE;
    return u;
  };
}

/* ---------- primeiro acesso: perfil antes do Guia (PAG-02, PAG-04) ----------
   Quem não está na equipe Legisla e não tem perfil vai a /primeiro-acesso; sem mandato, o cadastro do mandato só abre
   depois de "Ainda não" (marca legisla.semEquipe), senão a pergunta "sua equipe já criou?" vem primeiro. Uma consulta que
   falha nunca vira "sem perfil" (não manda ao formulário quem já tem perfil): mostra uma caixa de erro com "Tentar de
   novo", que refaz a entrada. Sem ela a tela ficaria em branco: #entrada e #app nascem ocultos. */
var ERRO_PERFIL='Não foi possível carregar seus dados. Tente de novo.';
var caixaErroPerfil=null;
function mostraErroPerfil(){
  if(caixaErroPerfil)caixaErroPerfil.remove();
  var cx=document.createElement('div'),msg=document.createElement('div'),bt=document.createElement('button');
  cx.id='erroPerfil';cx.className='erro-perfil';
  msg.className='erro-cx';msg.setAttribute('role','alert');msg.textContent=ERRO_PERFIL;
  bt.className='bt pri';bt.setAttribute('type','button');bt.textContent='Tentar de novo';
  bt.onclick=function(){cx.remove();caixaErroPerfil=null;return App.entrou()};
  cx.appendChild(msg);cx.appendChild(bt);
  document.body.appendChild(cx);
  caixaErroPerfil=cx;
}
var _entrou=App.entrou;
App.entrou=async function(){
  if(!NUVEM)return _entrou.apply(this,arguments); /* modo local: não há perfil nem banco */
  var uid=encodeURIComponent(Store.usuario.id),r;
  try{
    r=await Promise.all([
      Nuvem.rest('equipe_legisla?select=user_id&user_id=eq.'+uid),
      Nuvem.rest('perfis?select=user_id&user_id=eq.'+uid)
    ]);
  }catch(e){mostraErroPerfil();return}
  var ehLegisla=(r[0]||[]).length>0,temPerfil=(r[1]||[]).length>0;
  if(ehLegisla)return _entrou.apply(this,arguments);
  if(!temPerfil){location.replace('/primeiro-acesso?volta=guia');return}
  var semEquipe=false;
  try{semEquipe=sessionStorage.getItem('legisla.semEquipe')==='1'}catch(e){}
  if(!semEquipe){
    var mandatos;
    try{mandatos=await Store.meusMandatos()}catch(e){mostraErroPerfil();return} /* mesma caixa: sem ela o #app ficaria oculto */
    if(!mandatos.length){location.replace('/primeiro-acesso');return}
  }
  return _entrou.apply(this,arguments);
};

/* ---------- Equipe e convites (seção de Configurações): atalho para a tela nova ---------- */
Telas.equipeHtml=function(){
  var h='<h2 class="cad-h3" style="margin-top:0">Equipe e convites</h2>';
  h+=NUVEM
    ?'<div class="apoio"><p class="texto" style="margin-top:0">Convide pessoas por link, acompanhe os convites pendentes e veja quem está no mandato.</p>'+
      '<div class="bts"><a class="bt pri" href="/mandato/equipe">Abrir Equipe e convites</a></div></div>'
    :'<div class="apoio atencao"><span class="tag">Modo local</span>O convite por link só funciona com o banco na nuvem configurado.</div>';
  return '<section id="cadEquipe" aria-label="Equipe e convites">'+h+'</section>';
};

/* ---------- Área do mandato: tela única em #/config, com abas (AMA-01, AMA-04) ----------
   O App.rotear do app.js já manda todo #/config/<aba> para Telas.config: aqui a tela desenha as abas e um painel por aba.
   Cada aba tem o seu endereço; trocar de aba muda o hash, então o Voltar do navegador volta à aba anterior. Aba
   desconhecida abre a Visão geral. O item "Configurações" do menu passa a se chamar "Área do mandato". */
var ROTULO_AREA='Área do mandato';
var ABAS_AREA=[
  {id:'visao',rot:'Visão geral',painel:'areaVisao',bt:'abaVisao',ilha:'area-visao'},
  {id:'dados',rot:'Dados do mandato',painel:'areaDados',bt:'abaDados'},
  {id:'equipe',rot:'Equipe e convites',painel:'areaEquipe',bt:'abaEquipe',ilha:'area-equipe'},
  {id:'conta',rot:'Minha conta',painel:'areaConta',bt:'abaConta'}
];
function abaDoHash(h){
  var p=String(h||'').replace(/^#\/?/,'').split('/'),id=p[0]==='config'?p[1]:'';
  return ABAS_AREA.filter(function(a){return a.id===id})[0]||ABAS_AREA[0];
}
var Area={
  focar:false,
  hash:function(id){return id==='visao'?'#/config':'#/config/'+id},
  rotulo:function(a){return a.id==='equipe'?a.rot+' ('+(Store.membros||[]).length+')':a.rot},
  desenhar:function(){
    var atual=abaDoHash(location.hash),t=document.getElementById('tela');
    t.className='tela largo';
    t.innerHTML='<div class="etiqueta">Mandato</div><h1 class="largo">'+ROTULO_AREA+'</h1>'+
      '<div class="abas area-abas" role="tablist" aria-label="'+ROTULO_AREA+'" onkeydown="Area.tecla(event)">'+
      ABAS_AREA.map(function(a){
        var on=a===atual;
        return '<button type="button" role="tab" id="'+a.bt+'" aria-controls="'+a.painel+'" aria-selected="'+on+'" tabindex="'+(on?'0':'-1')+'"'+
          ' onclick="Area.ir(\''+a.id+'\')">'+esc(Area.rotulo(a))+'</button>';
      }).join('')+'</div>'+
      ABAS_AREA.map(function(a){
        return '<section class="area-painel" role="tabpanel" id="'+a.painel+'" aria-labelledby="'+a.bt+'" tabindex="0"'+(a===atual?'':' hidden')+'></section>';
      }).join('');
    if(this.focar){this.focar=false;var b=document.getElementById(atual.bt);if(b&&b.focus)b.focus()}
    this.preencher(atual);
  },
  /* só o painel da aba aberta recebe conteúdo: a ilha React (ilhas/ponte.tsx) lê o mandato aberto no Guia ao montar */
  preencher:function(a){
    var p=document.getElementById(a.painel);
    if(!p||!a.ilha)return;
    p.innerHTML='<div class="ilha" data-ilha="'+a.ilha+'"></div>';
    if(window.Ilhas)Ilhas.ligar(p);
  },
  /* a aba Equipe entrega a lista de pessoas que leu do banco ou alterou: Store.membros e o rótulo "Equipe e convites (N)"
     acompanham (AMA-02.7). Lista de outro mandato (a troca de mandato chegou antes) não vale. */
  equipe:function(mandatoId,lista){
    if(!Store.mandato||Store.mandato.id!==mandatoId||!Array.isArray(lista))return;
    Store.membros=lista.map(function(p){return {mandato_id:mandatoId,user_id:p.user_id,nome:p.nome,email:p.email,papel:p.papel}});
    var a=ABAS_AREA.filter(function(x){return x.id==='equipe'})[0],b=document.getElementById(a.bt);
    if(b)b.textContent=this.rotulo(a);
  },
  /* troca de aba = troca de hash; o hashchange redesenha (App.rotear). O foco volta à aba escolhida. */
  ir:function(id){
    var h=this.hash(abaDoHash('#/config/'+id).id);
    this.focar=true;
    if(location.hash!==h)location.hash=h;
    else this.desenhar();
  },
  /* setas esquerda e direita: aba vizinha (a lista é circular); Home e End: primeira e última (AMA-04.2) */
  tecla:function(ev){
    var i=ABAS_AREA.indexOf(abaDoHash(location.hash)),n=ABAS_AREA.length,j;
    if(ev.key==='ArrowRight')j=(i+1)%n;
    else if(ev.key==='ArrowLeft')j=(i+n-1)%n;
    else if(ev.key==='Home')j=0;
    else if(ev.key==='End')j=n-1;
    else return;
    ev.preventDefault();
    this.ir(ABAS_AREA[j].id);
  }
};
window.Area=Area;
Telas.config=function(){Area.desenhar()};

/* trocar de mandato (Cadastros, na barra lateral) estando na Área do mandato redesenha a aba aberta já com o mandato novo,
   em vez de voltar ao painel (Edge Case: troca de mandato). Fora da Área, a troca segue como era. */
var _irSeletor=Seletor.ir;
Seletor.ir=async function(id,recarregar){
  if((location.hash||'').indexOf('#/config')!==0)return _irSeletor.apply(this,arguments);
  if(!recarregar&&Store.mandato&&Store.mandato.id===id)return;
  try{
    localStorage.setItem('legisla.mandatoAtual',id);
    await Store.abrir(id);
    window.onbeforeunload=null;
    App.rotear();
    aviso('Você está em: '+(Store.mandato.nome_parlamentar||Store.mandato.nome_civil||'mandato')+'.');
  }catch(e){aviso('Não foi possível abrir este cadastro: '+((e&&e.message)||'tente de novo')+'.')}
};

var _lateral=App.lateral;
App.lateral=function(){
  var r=_lateral.apply(this,arguments);
  var tx=document.querySelector('#ladoNav .it[href="#/config"] .tx');
  if(tx)tx.textContent=ROTULO_AREA;
  return r;
};

/* ---------- modo somente leitura (ACE-03.2, ACE-03.3) ----------
   O papel vem da linha da própria pessoa em Store.membros, que o Store.abrir carrega a cada mandato aberto.
   O banco já recusa a escrita de quem é leitura; aqui o Guia não tenta gravar e trava os controles. */
var AVISO_LEITURA='Você está com acesso somente leitura';
/* botões do Guia que gravam; navegação (Avançar, Próximo exercício, abas, baixar) segue livre */
var GRAVA=/^\s*(Guia\.(concluir|reabrir)|Comp\.(mp|addFrag|rmFrag|pred|addMeta|rmMeta|addItem|rmItem|acao)|BandMural\.|Cad\.(enviar|excluir|trocar)|Telas\.salvarMandato)\(/;
var avisoEl=null;

function leitura(){
  var u=Store.usuario,eu=u&&(Store.membros||[]).filter(function(x){return x.user_id===u.id})[0];
  return !!eu&&eu.papel==='leitura';
}
/* desabilita o que grava dentro do #tela; o cadastro de outro mandato (#/novo) fica livre. A aba Equipe e convites também:
   lá o banco decide (quem é leitura convida como Somente leitura e sai do mandato, como em /mandato/equipe) */
function trava(raiz){
  if(!raiz||!leitura()||(location.hash||'').indexOf('#/novo')===0)return;
  var cada=function(sel,f){Array.prototype.forEach.call(raiz.querySelectorAll(sel),f)};
  cada('input,textarea,select',function(el){if(!(el.closest&&el.closest('#areaEquipe')))el.disabled=true});
  cada('[contenteditable="true"]',function(el){el.contentEditable='false';el.setAttribute('aria-readonly','true')});
  cada('button',function(b){if(GRAVA.test(b.getAttribute('onclick')||'')||b.closest('.rico-barra'))b.disabled=true});
}
function aplicar(){
  var on=leitura(),t=document.getElementById('tela');
  document.body.classList.toggle('so-leitura',on);
  if(on&&!avisoEl&&t&&t.parentNode){
    avisoEl=document.createElement('p');
    avisoEl.id='avisoLeitura';avisoEl.className='aviso-leitura';avisoEl.setAttribute('role','status');
    avisoEl.textContent=AVISO_LEITURA;
    t.parentNode.insertBefore(avisoEl,t);
  }
  if(!on&&avisoEl){avisoEl.remove();avisoEl=null}
  trava(t);
}

var _abrir=Store.abrir;
Store.abrir=async function(){var m=await _abrir.apply(this,arguments);aplicar();return m};

/* quem é leitura não grava: os ganchos do Guia e das ilhas (ilhas/ponte.tsx) passam por estas quatro funções */
var _salvar=Store.salvar,_gravar=Store.gravar,_atualizar=Store.atualizar,_registrar=Store.registrar;
Store.salvar=function(){if(!leitura())return _salvar.apply(this,arguments)};
Store.gravar=async function(){if(!leitura())return _gravar.apply(this,arguments)};
Store.atualizar=async function(){if(!leitura())return _atualizar.apply(this,arguments)};
Store.registrar=async function(){if(!leitura())return _registrar.apply(this,arguments)};

/* cada tela nova (e cada ilha que monta depois) passa pela trava */
var tela=document.getElementById('tela');
if(tela&&window.MutationObserver)new MutationObserver(function(){trava(tela)}).observe(tela,{childList:true,subtree:true});

var css=document.createElement('style');
css.textContent='.aviso-leitura{margin:0;padding:.625rem 1.25rem;background:#FFF4D6;border-bottom:1px solid var(--linha);'+
  'color:var(--tinta);font-weight:700;font-size:.9375rem}'+
  '.so-leitura #tela :disabled,.so-leitura #tela [contenteditable="false"]{opacity:.6;cursor:not-allowed}'+
  '.erro-perfil{max-width:32rem;margin:4rem auto;padding:0 1.25rem;display:grid;gap:1rem;justify-items:start}'+
  /* abas da Área do mandato: em tela estreita a lista rola dentro dela, nunca a página (AMA-04.3) */
  '.area-abas{margin:1.5rem 0 1.875rem;max-width:100%;overscroll-behavior-x:contain}'+
  '.area-abas button{flex:0 0 auto}'+
  '.area-painel{min-width:0}';
document.head.appendChild(css);

})();
