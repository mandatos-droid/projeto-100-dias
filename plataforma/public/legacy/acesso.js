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

/* ---------- primeiro acesso: perfil antes do Guia (PAG-02, PAG-04) ----------
   Quem não está na equipe Legisla e não tem perfil vai a /primeiro-acesso; sem mandato, o cadastro do mandato só abre
   depois de "Ainda não" (marca legisla.semEquipe), senão a pergunta "sua equipe já criou?" vem primeiro. Uma consulta que
   falha propaga o erro: nunca vira "sem perfil", para não mandar ao formulário quem já tem perfil. */
var _entrou=App.entrou;
App.entrou=async function(){
  if(!NUVEM)return _entrou.apply(this,arguments); /* modo local: não há perfil nem banco */
  var uid=encodeURIComponent(Store.usuario.id);
  var r=await Promise.all([
    Nuvem.rest('equipe_legisla?select=user_id&user_id=eq.'+uid),
    Nuvem.rest('perfis?select=user_id&user_id=eq.'+uid)
  ]);
  var ehLegisla=(r[0]||[]).length>0,temPerfil=(r[1]||[]).length>0;
  if(ehLegisla)return _entrou.apply(this,arguments);
  if(!temPerfil){location.replace('/primeiro-acesso?volta=guia');return}
  var semEquipe=false;
  try{semEquipe=sessionStorage.getItem('legisla.semEquipe')==='1'}catch(e){}
  if(!semEquipe&&!(await Store.meusMandatos()).length){location.replace('/primeiro-acesso');return}
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
/* desabilita o que grava dentro do #tela; o cadastro de outro mandato (#/novo) fica livre */
function trava(raiz){
  if(!raiz||!leitura()||(location.hash||'').indexOf('#/novo')===0)return;
  var cada=function(sel,f){Array.prototype.forEach.call(raiz.querySelectorAll(sel),f)};
  cada('input,textarea,select',function(el){el.disabled=true});
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
  '.so-leitura #tela :disabled,.so-leitura #tela [contenteditable="false"]{opacity:.6;cursor:not-allowed}';
document.head.appendChild(css);

})();
