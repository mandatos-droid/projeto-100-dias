/* =====================================================================
   CONFIGURAÇÃO — preencha para ligar a nuvem (ver banco.sql)
   ===================================================================== */
var AMBIENTES={
  prod:{url:'https://fldmekrexvzchynnmeuq.supabase.co',key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZG1la3JleHZ6Y2h5bm5tZXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxODAwNDMsImV4cCI6MjEwNzc1NjA0M30.voyLYw8vq_pM-_XwSdxZmGjrqKilfB0pl1hYhvFUuL4'},
  dev :{url:'https://fldmekrexvzchynnmeuq.supabase.co',key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZG1la3JleHZ6Y2h5bm5tZXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxODAwNDMsImV4cCI6MjEwNzc1NjA0M30.voyLYw8vq_pM-_XwSdxZmGjrqKilfB0pl1hYhvFUuL4'}
};
var ehDev=(location.hostname==='localhost'||location.hostname.indexOf('dev')===0||location.hostname.indexOf('127.')===0);
var CONFIG=ehDev?AMBIENTES.dev:AMBIENTES.prod;
var NUVEM=!!(CONFIG.url&&CONFIG.key);
var BIBLIOTECA_URL='https://legislabrasil.org/biblioteca';

/* ===================== UTILITÁRIOS ===================== */
function nomeDe(u){var m=u.user_metadata||{};return m.nome||m.full_name||m.name||u.email}
function uid(){return Math.random().toString(36).slice(2,10)}
function esc(s){var d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML}

/* Texto formatado: aceita HTML simples (negrito, itálico, sublinhado, listas, links) ou texto puro legado. */
var RICH_OK={B:1,STRONG:1,I:1,EM:1,U:1,UL:1,OL:1,LI:1,BR:1,P:1,DIV:1,A:1};
function richEhHtml(s){return /<\/?(b|strong|i|em|u|ul|ol|li|br|p|div|a)\b/i.test(s)}
function rich(s){
  s=s==null?'':String(s);if(!s.trim())return '';
  if(!richEhHtml(s))return esc(s).replace(/\n/g,'<br>');
  var t=document.createElement('template');t.innerHTML=s;
  (function limpa(no){
    Array.prototype.slice.call(no.childNodes).forEach(function(c){
      if(c.nodeType===3)return;
      if(c.nodeType!==1||/^(SCRIPT|STYLE)$/.test(c.nodeName)){no.removeChild(c);return}
      limpa(c);
      if(!RICH_OK[c.nodeName]){while(c.firstChild)no.insertBefore(c.firstChild,c);no.removeChild(c);return}
      var href=c.nodeName==='A'?c.getAttribute('href')||'':'';
      Array.prototype.slice.call(c.attributes).forEach(function(a){c.removeAttribute(a.name)});
      if(c.nodeName==='A'){
        if(/^(https?:|mailto:)/i.test(href)){c.setAttribute('href',href);c.setAttribute('target','_blank');c.setAttribute('rel','noopener')}
        else{while(c.firstChild)no.insertBefore(c.firstChild,c);no.removeChild(c)}
      }
    });
  })(t.content);
  var d=document.createElement('div');d.appendChild(t.content);return d.innerHTML;
}
function richVazio(h){return !(h||'').replace(/<br\s*\/?>/gi,'').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim()}
function hoje(){return new Date()}
function dBR(d){if(!d)return'';d=new Date(d);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')}
function dBRc(d){if(!d)return'';d=new Date(d);return dBR(d)+'/'+d.getFullYear()}
function somaDias(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function diffDias(a,b){return Math.floor((new Date(b)-new Date(a))/86400000)}
function codigo(){var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',s='';for(var i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];return s}
var tToast;
function aviso(t){var e=document.getElementById('toast');e.textContent=t;e.classList.add('on');
  clearTimeout(tToast);tToast=setTimeout(function(){e.classList.remove('on')},2900)}

/* ===================== DADOS ===================== */
/* JWT do Supabase: lê o "exp" sem atob/Buffer (base64url na mão), para renovar antes de vencer */
function jwtExp(t){
  try{
    var A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
      p=String(t).split('.')[1],bits=0,n=0,out='';
    for(var i=0;i<p.length;i++){
      var v=A.indexOf(p.charAt(i));if(v<0)continue;
      bits=(bits<<6)|v;n+=6;
      if(n>=8){n-=8;out+=String.fromCharCode((bits>>n)&255);bits&=(1<<n)-1}
    }
    var e=JSON.parse(out).exp;return typeof e==='number'?e:null;
  }catch(e){return null}
}
var Nuvem={
  tok:null,sessaoPerdida:false,_renov:null,_aviso:null,
  cab:function(x){var h={apikey:CONFIG.key,'Content-Type':'application/json'};
    if(this.tok)h.Authorization='Bearer '+this.tok;return Object.assign(h,x||{})},
  async auth(p,b){var r=await fetch(CONFIG.url+'/auth/v1/'+p,{method:'POST',headers:this.cab(),body:JSON.stringify(b)});
    var d=await r.json();if(!r.ok)throw new Error(d.error_description||d.msg||d.message||'Falha na autenticação');return d},
  google:function(){location.href=CONFIG.url+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(location.origin+location.pathname)},
  /* a sessão guardada pode ter sido renovada por outra camada (ilhas/sessaoApi.ts) ou por outra aba */
  _guardada:function(){try{return JSON.parse(localStorage.getItem('legisla.tok')||'null')}catch(e){return null}},
  vencendo:function(){var e=this.tok?jwtExp(this.tok):null;return !!e&&e*1000-Date.now()<60000},
  /* devolve 'ok' (token novo em Nuvem.tok), 'perdida' (o servidor recusou o refresh_token) ou 'rede' (falha passageira).
     Uma renovação por vez: o refresh_token é de uso único. */
  renovar:function(usado){
    if(this.sessaoPerdida)return Promise.resolve('perdida');
    if(usado&&this.tok&&this.tok!==usado)return Promise.resolve('ok'); // outro pedido já renovou
    if(this._renov)return this._renov;
    var s=this,sa=this._guardada();
    if(sa&&sa.access_token&&sa.access_token!==s.tok){s.tok=sa.access_token;return Promise.resolve('ok')}
    if(!sa||!sa.refresh_token)return Promise.resolve('perdida');
    return this._renov=this._refresh(sa).then(function(r){s._renov=null;return r},function(){s._renov=null;return 'rede'});
  },
  async _refresh(sa){
    var r;
    try{r=await fetch(CONFIG.url+'/auth/v1/token?grant_type=refresh_token',
      {method:'POST',headers:{apikey:CONFIG.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:sa.refresh_token})})}
    catch(e){return 'rede'}
    if(r.ok){
      var d=null;try{d=await r.json()}catch(e){}
      if(d&&d.access_token){this.tok=d.access_token;try{localStorage.setItem('legisla.tok',JSON.stringify(d))}catch(e){}return 'ok'}
      return 'rede';
    }
    if(r.status>=500||r.status===429||r.status===408)return 'rede';
    var o=this._guardada(); // a outra camada pode ter renovado enquanto este pedido era recusado
    if(o&&o.access_token&&o.access_token!==sa.access_token){this.tok=o.access_token;return 'ok'}
    return 'perdida';
  },
  /* cobre a tela com um aviso que não some: gravar sem sessão só finge que salvou */
  perdeuSessao:function(){
    this.sessaoPerdida=true;
    if(this._aviso)return;
    var e=document.createElement('div');
    e.setAttribute('role','alertdialog');e.setAttribute('aria-modal','true');e.setAttribute('aria-labelledby','sessao-t');
    e.setAttribute('style','position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.86)');
    e.innerHTML='<div style="max-width:440px;background:#fff;color:#0f172a;border-radius:14px;padding:26px 24px;box-shadow:0 20px 60px rgba(0,0,0,.45);font:16px/1.5 system-ui,sans-serif">'
      +'<h2 id="sessao-t" style="margin:0 0 10px;font-size:20px">Sua sessão expirou</h2>'
      +'<p style="margin:0 0 18px">As últimas alterações não foram salvas e a tela foi bloqueada para você não perder mais nada. Entre de novo para continuar: o que já estava salvo continua no seu mandato.</p>'
      +'<button type="button" onclick="Nuvem.reentrar()" style="font:inherit;font-weight:700;padding:11px 20px;border:0;border-radius:10px;background:#0f172a;color:#fff;cursor:pointer">Entrar de novo</button></div>';
    document.body.appendChild(e);this._aviso=e;
  },
  reentrar:function(){try{localStorage.removeItem('legisla.tok')}catch(e){}this.tok=null;location.reload()},
  async _pede(p,o){
    var op={method:o.method||'GET',headers:this.cab(o.headers),body:o.body?JSON.stringify(o.body):undefined};
    if(o.keepalive)op.keepalive=true; // pedido que sobrevive ao fechamento da página (pagehide)
    var r=await fetch(CONFIG.url+'/rest/v1/'+p,op);
    var tx=await r.text(),d=null; // POST sem "return=representation" volta 201 com corpo vazio
    if(tx){try{d=JSON.parse(tx)}catch(e){d=null}}
    return{ok:r.ok,status:r.status,d:d};
  },
  async rest(p,o){o=o||{};
    var usado=this.tok,r=await this._pede(p,o);
    if(r.status===401&&usado){ // token vencido: renova sozinho e repete uma vez
      var rn=await this.renovar(usado);
      if(rn==='ok')r=await this._pede(p,o);
      else if(rn==='perdida'){this.perdeuSessao();var e=new Error('Sua sessão expirou. Entre de novo.');e.sessao=true;throw e}
      else throw new Error('Não foi possível renovar a sessão (sem conexão).');
    }
    if(!r.ok)throw new Error((r.d&&(r.d.message||r.d.hint))||'Falha ao acessar os dados');return r.d}
};
var Local={
  ch:'legisla.regimento.v3',
  ler:function(){try{return JSON.parse(localStorage.getItem(this.ch)||'{}')}catch(e){return{}}},
  gravar:function(o){try{localStorage.setItem(this.ch,JSON.stringify(o))}catch(e){}}
};

var D={};
var Store={
  usuario:null,mandato:null,dados:{},membros:[],eventos:[],

  async sessao(){
    if(NUVEM){
      var h=new URLSearchParams(location.hash.slice(1));
      if(h.get('access_token')){
        localStorage.setItem('legisla.tok',JSON.stringify({access_token:h.get('access_token'),refresh_token:h.get('refresh_token')}));
        history.replaceState(null,'',location.pathname+location.search);this.viaGoogle=true;
      }else if(h.get('error_description')){
        this.erroOAuth=h.get('error_description').replace(/\+/g,' ');history.replaceState(null,'',location.pathname+location.search);
      }
      var t=localStorage.getItem('legisla.tok');if(!t)return null;
      try{
        var s=JSON.parse(t);Nuvem.tok=s.access_token;
        var u=await fetch(CONFIG.url+'/auth/v1/user',{headers:Nuvem.cab()});
        if(!u.ok){
          var nv=await Nuvem.auth('token?grant_type=refresh_token',{refresh_token:s.refresh_token});
          Nuvem.tok=nv.access_token;localStorage.setItem('legisla.tok',JSON.stringify(nv));
          u=await fetch(CONFIG.url+'/auth/v1/user',{headers:Nuvem.cab()});if(!u.ok)return null;
        }
        var ud=await u.json();
        this.usuario={id:ud.id,email:ud.email,nome:nomeDe(ud)};
        return this.usuario;
      }catch(e){return null}
    }
    var b=Local.ler();if(b.sessao){this.usuario=b.sessao;return this.usuario}return null;
  },
  async criarConta(email,senha,nome){
    if(NUVEM){
      var d=await Nuvem.auth('signup',{email:email,password:senha,data:{nome:nome}});
      if(!d.access_token){var e=new Error('Conta criada. Confirme o e-mail enviado e faça login.');e.aviso=true;throw e}
      localStorage.setItem('legisla.tok',JSON.stringify(d));Nuvem.tok=d.access_token;
      this.usuario={id:d.user.id,email:d.user.email,nome:nome||d.user.email};return this.usuario;
    }
    var b=Local.ler();b.usuarios=b.usuarios||{};
    b.usuarios[email]={id:'u_'+uid(),email:email,nome:nome||email};
    b.sessao=b.usuarios[email];Local.gravar(b);this.usuario=b.sessao;return this.usuario;
  },
  async entrar(email,senha){
    if(NUVEM){
      var d=await Nuvem.auth('token?grant_type=password',{email:email,password:senha});
      localStorage.setItem('legisla.tok',JSON.stringify(d));Nuvem.tok=d.access_token;
      this.usuario={id:d.user.id,email:d.user.email,nome:nomeDe(d.user)};
      return this.usuario;
    }
    var b=Local.ler();b.usuarios=b.usuarios||{};
    if(!b.usuarios[email])b.usuarios[email]={id:'u_'+uid(),email:email,nome:email.split('@')[0]};
    b.sessao=b.usuarios[email];Local.gravar(b);this.usuario=b.sessao;return this.usuario;
  },
  async sair(){
    if(NUVEM){localStorage.removeItem('legisla.tok');Nuvem.tok=null}
    else{var b=Local.ler();delete b.sessao;Local.gravar(b)}
    this.usuario=null;this.mandato=null;localStorage.removeItem('legisla.mandatoAtual');
  },
  async consentimento(){
    var reg={user_id:this.usuario.id,versao:'2026-10',aceito_em:new Date().toISOString()};
    this.usuario.lgpd_em=reg.aceito_em;
    try{
      if(NUVEM)await Nuvem.rest('consentimentos',{method:'POST',body:reg});
      else{var b=Local.ler();if(b.sessao)b.sessao.lgpd_em=reg.aceito_em;
        if(b.usuarios&&b.usuarios[this.usuario.email])b.usuarios[this.usuario.email].lgpd_em=reg.aceito_em;Local.gravar(b)}
    }catch(e){}
  },
  async consentimentoPendente(){
    if(!NUVEM)return false;
    try{var r=await Nuvem.rest('consentimentos?select=id&user_id=eq.'+this.usuario.id+'&limit=1');return !r.length}catch(e){return false}
  },
  async meusMandatos(){
    if(NUVEM){
      var v=await Nuvem.rest('membros?select=papel,mandatos(*)&user_id=eq.'+this.usuario.id);
      return (v||[]).filter(function(x){return x.mandatos}).map(function(x){var m=x.mandatos;m.papel=x.papel;return m});
    }
    var b=Local.ler();b.mandatos=b.mandatos||{};var eu=this.usuario.id,l=[];
    Object.keys(b.mandatos).forEach(function(k){var m=b.mandatos[k];
      if((m.membros||[]).some(function(x){return x.user_id===eu}))l.push(m)});
    return l;
  },
  async criarMandato(c){
    var reg=Object.assign({codigo:codigo(),dados:{}},c);
    if(NUVEM){
      reg.criado_por=this.usuario.id;
      var m=(await Nuvem.rest('mandatos',{method:'POST',body:reg,headers:{Prefer:'return=representation'}}))[0];
      await Nuvem.rest('membros',{method:'POST',body:{mandato_id:m.id,user_id:this.usuario.id,papel:'coordenacao',nome:this.usuario.nome}});
      return m;
    }
    var b=Local.ler();b.mandatos=b.mandatos||{};reg.id='m_'+uid();
    reg.membros=[{user_id:this.usuario.id,nome:this.usuario.nome,email:this.usuario.email,papel:'coordenacao'}];
    reg.eventos=[];b.mandatos[reg.id]=reg;Local.gravar(b);return reg;
  },
  async entrarPorCodigo(cod){
    cod=(cod||'').trim().toUpperCase();
    if(NUVEM){
      var r=await Nuvem.rest('rpc/entrar_com_codigo',{method:'POST',body:{p_codigo:cod,p_nome:this.usuario.nome}});
      if(!r)throw new Error('Código não encontrado.');return true;
    }
    var b=Local.ler();b.mandatos=b.mandatos||{};var achou=null,eu=this.usuario;
    Object.keys(b.mandatos).forEach(function(k){if(b.mandatos[k].codigo===cod)achou=b.mandatos[k]});
    if(!achou)throw new Error('Código não encontrado.');
    if(!(achou.membros||[]).some(function(x){return x.user_id===eu.id}))
      achou.membros.push({user_id:eu.id,nome:eu.nome,email:eu.email,papel:'assessoria'});
    Local.gravar(b);return true;
  },
  async abrir(id){
    if(NUVEM){
      var m=(await Nuvem.rest('mandatos?id=eq.'+id+'&select=*'))[0];
      if(!m)throw new Error('Mandato não encontrado.');
      this.mandato=m;this.dados=m.dados||{};
      this.membros=await Nuvem.rest('membros?mandato_id=eq.'+id+'&select=*')||[];
      this.eventos=await Nuvem.rest('eventos?mandato_id=eq.'+id+'&select=*&order=criado_em.desc&limit=300')||[];
    }else{
      var b=Local.ler(),mm=(b.mandatos||{})[id];
      if(!mm)throw new Error('Mandato não encontrado.');
      this.mandato=mm;this.dados=mm.dados||{};this.membros=mm.membros||[];this.eventos=mm.eventos||[];
    }
    localStorage.setItem('legisla.mandatoAtual',id);
    var d=this.dados;
    d.campos=d.campos||{};d.feitos=d.feitos||{};d.relacoes=d.relacoes||{};d.tse=d.tse||{};
    d.frags=d.frags||FRAGILIDADES.map(function(t){return{t:t,mp:null}});
    ['metas','comissoes','feedbacks','preditores','acoes','comissoesDesejadas'].forEach(function(k){d[k]=d[k]||[]});
    D=this.dados;
    this._versao=NUVEM?(this.mandato.atualizado_em||null):null; // base do salvamento sem sobrescrever a outra pessoa
    this._base=NUVEM?JSON.stringify(this.dados):null;this._sujo=false;
    return this.mandato;
  },
  _t:null,_sujo:false,_voo:null,_enviando:0,_versao:null,_base:null,_ultRenova:0,
  salvar(){
    clearTimeout(this._t);this._sujo=true;marcaSalvando();var s=this;
    this._t=setTimeout(function(){s._t=null;s.gravar()},700);
    /* token a menos de 1 min de vencer: renova agora, em segundo plano, para a gravação (ou o pagehide) não depender disso */
    if(NUVEM&&Nuvem.vencendo()&&Date.now()-this._ultRenova>15000){
      this._ultRenova=Date.now();Nuvem.renovar(Nuvem.tok).then(function(){},function(){});
    }
  },
  /* grava e diz se deu certo: true/false (undefined = nada a gravar, como no modo leitura) */
  gravar(o){
    var s=this;o=o||{};
    if(o.descarga)return s._grava(true); // saindo da página: sem fila, o pedido precisa partir agora
    clearTimeout(s._t);s._t=null;
    var p=s._voo?s._voo.then(function(){return s._grava(false)}):s._grava(false); // uma gravação por vez, na ordem
    var q=s._voo=p.then(function(){},function(){});
    q.then(function(){if(s._voo===q)s._voo=null});
    return p;
  },
  async salvarAgora(){return (await this.gravar())!==false},
  descarregar(){
    if(!this.mandato)return;
    if(this._t==null&&!this._sujo&&!this._enviando)return;
    clearTimeout(this._t);this._t=null;
    try{var r=this.gravar({descarga:true});if(r&&r.catch)r.catch(function(){})}catch(e){}
  },
  async _grava(descarga){
    var s=this;s._sujo=false;s._enviando++;
    try{
      if(NUVEM){
        if(Nuvem.sessaoPerdida)throw Object.assign(new Error('Sessão expirada.'),{sessao:true});
        await s._gravaNuvem(descarga);
      }else{var b=Local.ler();b.mandatos[s.mandato.id].dados=s.dados;Local.gravar(b)}
      marcaSalvo();return true;
    }catch(e){
      s._sujo=true;marcaFalhou();
      if(!e.sessao)aviso('Não foi possível salvar: '+e.message);
      return false;
    }finally{s._enviando--}
  },
  /* PATCH condicional à versão lida (atualizado_em): se outra pessoa gravou antes, lê o que ela gravou, mescla e repete */
  async _gravaNuvem(descarga){
    var s=this,id=s.mandato.id,mesclou=false;
    for(var t=0;t<4;t++){
      var txt=JSON.stringify(s.dados),v=s._versao;
      var r=await Nuvem.rest('mandatos?id=eq.'+id+(v?'&atualizado_em=eq.'+encodeURIComponent(v)+'&select=atualizado_em':''),
        {method:'PATCH',body:{dados:s.dados},headers:{Prefer:v?'return=representation':'return=minimal'},keepalive:!!descarga&&txt.length<60000});
      if(!v){s._base=txt;break}
      if(Array.isArray(r)&&r.length){s._versao=r[0].atualizado_em||v;s._base=txt;break}
      if(t===3)throw new Error('outra pessoa está editando ao mesmo tempo. Tente de novo em instantes.');
      var g=await Nuvem.rest('mandatos?id=eq.'+id+'&select=dados,atualizado_em');
      if(!g||!g[0])throw new Error('Mandato não encontrado.');
      var deles=g[0].dados||{};
      mesclaDados(s._base?JSON.parse(s._base):{},s.dados,deles);
      s._base=JSON.stringify(deles);s._versao=g[0].atualizado_em;mesclou=true;
    }
    if(mesclou)aviso('Suas alterações foram combinadas com as de outra pessoa.');
  },
  async atualizar(c){
    Object.assign(this.mandato,c);
    if(NUVEM)await Nuvem.rest('mandatos?id=eq.'+this.mandato.id,{method:'PATCH',body:c});
    else{var b=Local.ler();Object.assign(b.mandatos[this.mandato.id],c);Local.gravar(b)}
  },
  async registrar(missao,ex,texto){
    var ev={mandato_id:this.mandato.id,user_id:this.usuario.id,autor:this.usuario.nome,
      missao:missao,exercicio:ex,texto:texto,criado_em:new Date().toISOString()};
    this.eventos.unshift(ev);
    try{
      if(NUVEM)await Nuvem.rest('eventos',{method:'POST',body:ev});
      else{var b=Local.ler(),m=b.mandatos[this.mandato.id];m.eventos=m.eventos||[];m.eventos.unshift(ev);Local.gravar(b)}
    }catch(e){}
  }
};
function marcaSalvando(){document.querySelectorAll('[data-salvo]').forEach(function(e){e.textContent='Salvando…'})}
function marcaSalvo(){document.querySelectorAll('[data-salvo]').forEach(function(e){e.textContent='Salvo automaticamente'})}
function marcaFalhou(){document.querySelectorAll('[data-salvo]').forEach(function(e){e.textContent='Não salvo. Tentaremos de novo na próxima edição.'})}

/* Mescla de três vias: base (o que li ao abrir/gravar), mine (a tela) e theirs (o servidor agora). Muta e devolve "mine".
   Só um lado mudou → vale esse lado; os dois mudaram → objetos e listas com id se combinam por chave; no mesmo valor vale o meu. */
function mesclaDados(base,mine,theirs){
  function igual(a,b){return JSON.stringify(a)===JSON.stringify(b)}
  function obj(x){return !!x&&typeof x==='object'&&!Array.isArray(x)}
  function comId(l){return Array.isArray(l)&&l.every(function(i){return obj(i)&&i.id!=null})}
  function mapa(l){var m={};(l||[]).forEach(function(i){m[i.id]=i});return m}
  function mescla(b,m,t){
    if(igual(m,t))return m;
    if(igual(m,b))return t;
    if(igual(t,b))return m;
    if(obj(m)&&obj(t))return campos(obj(b)?b:{},m,t,false);
    if(comId(m)&&comId(t)&&(b===undefined||comId(b)))return lista(b||[],m,t);
    return m;
  }
  function campos(b,m,t,topo){
    var ks={};Object.keys(m).concat(Object.keys(t)).forEach(function(k){ks[k]=1});
    Object.keys(ks).forEach(function(k){
      if(topo&&k==='feedbacks')return; // vive em feedbacks_mandato, não em mandatos.dados
      var r=mescla(b[k],m[k],t[k]);
      if(r===undefined)delete m[k];else m[k]=r;
    });
    return m;
  }
  function lista(b,m,t){
    var bm=mapa(b),mm=mapa(m),tm=mapa(t),res=[];
    m.forEach(function(i){
      if(tm[i.id])res.push(mescla(bm[i.id],i,tm[i.id]));
      else if(!bm[i.id]||!igual(i,bm[i.id]))res.push(i); // meu item novo, ou que mexi e a outra pessoa apagou
    });
    t.forEach(function(i){
      if(mm[i.id])return;
      if(!bm[i.id]||!igual(i,bm[i.id]))res.push(i); // item novo dela, ou que ela mexeu e eu apaguei
    });
    m.length=0;res.forEach(function(i){m.push(i)});return m;
  }
  if(obj(mine)&&obj(theirs))campos(obj(base)?base:{},mine,theirs,true);
  return mine;
}

/* saída rápida: o atraso de 700 ms do salvar() não pode perder o que acabou de ser digitado */
try{
  window.addEventListener('pagehide',function(){Store.descarregar()});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')Store.descarregar()});
}catch(e){}

/* ===================== PRAZOS E PROGRESSO ===================== */
function posse(){return Store.mandato&&Store.mandato.data_posse?new Date(Store.mandato.data_posse+'T12:00:00'):null}
function diaAtual(){var p=posse();return p?diffDias(p,hoje())+1:null}
function dataPrazo(m){var p=posse();return p?somaDias(p,m.prazo-1):null}
function venceu(m){if(m.continua)return false;var d=dataPrazo(m);return d&&hoje()>d}

function temConteudo(ex){
  var c=D.campos||{};
  function alg(ks){return ks.some(function(k){return (c[k]||'').toString().trim()})}
  switch(ex.tipo){
    case 'perguntas': return alg(ex.itens.map(function(i){return i.k}));
    case 'campos': return alg(ex.itens.map(function(i){return i.k}))||(ex.listaExtra&&(D[ex.listaExtra.chave]||[]).length>0);
    case 'checklist': return (ex.itens||[]).some(function(i){return c[i.k]})||alg((ex.campos||[]).map(function(i){return i.k}));
    case 'frag': return (D.frags||[]).some(function(f){return f.mp});
    case 'funcoes': return CARGOS_EQUIPE.some(function(f,i){return (c['m2.f'+(i+1)]||'').trim()});
    case 'preditores': return (D.preditores||[]).length>0;
    case 'metas': return (D.metas||[]).length>0;
    case 'lista': return (D[ex.chave]||[]).length>0;
    case 'bingo': return (D.acoes||[]).length>0;
    case 'monit': return Object.keys(c).some(function(k){return k.indexOf('mon.')===0&&(c[k]||'').trim()});
  }
  return false;
}
function estadoEx(ex){if(D.feitos&&D.feitos[ex.id])return 'ok';return temConteudo(ex)?'andamento':'nao'}
function progMissao(m){var f=0;m.exercicios.forEach(function(e){if(estadoEx(e)==='ok')f++});
  return {feitos:f,total:m.exercicios.length,pct:Math.round(f/m.exercicios.length*100)}}
function progGeral(){var t=0,f=0;MISSOES.forEach(function(m){var p=progMissao(m);t+=p.total;f+=p.feitos});
  return t?Math.round(f/t*100):0}
function achaEx(id){
  for(var i=0;i<MISSOES.length;i++)for(var j=0;j<MISSOES[i].exercicios.length;j++)
    if(MISSOES[i].exercicios[j].id===id)return {m:MISSOES[i],ex:MISSOES[i].exercicios[j],i:j};
  return null;
}
function proximoExercicio(){
  for(var i=0;i<MISSOES.length;i++)for(var j=0;j<MISSOES[i].exercicios.length;j++){
    var e=MISSOES[i].exercicios[j];
    if(estadoEx(e)!=='ok')return {m:MISSOES[i],ex:e,i:j};
  }
  return null;
}
function medidor(pct,cor){
  var L=125.6,v=Math.max(0,Math.min(1,pct/100))*L;
  return '<svg class="medidor" viewBox="0 0 100 56" style="--c:'+cor+'" aria-hidden="true">'+
    '<path class="t" d="M8 48 A40 40 0 0 1 92 48"/>'+
    '<path class="v" d="M8 48 A40 40 0 0 1 92 48" stroke-dasharray="'+v.toFixed(1)+' '+L+'"/></svg>'+
    '<span class="medidor-num">'+pct+'%</span>';
}
