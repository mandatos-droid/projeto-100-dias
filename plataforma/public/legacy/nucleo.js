/* =====================================================================
   CONFIGURAÇÃO — preencha para ligar a nuvem (ver banco.sql)
   ===================================================================== */
var AMBIENTES={
  prod:{url:'',key:''},
  dev :{url:'',key:''}
};
var ehDev=(location.hostname==='localhost'||location.hostname.indexOf('dev')===0||location.hostname.indexOf('127.')===0);
var CONFIG=ehDev?AMBIENTES.dev:AMBIENTES.prod;
var NUVEM=!!(CONFIG.url&&CONFIG.key);
var BIBLIOTECA_URL='https://legislabrasil.org/biblioteca';

/* ===================== UTILITÁRIOS ===================== */
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
var Nuvem={
  tok:null,
  cab:function(x){var h={apikey:CONFIG.key,'Content-Type':'application/json'};
    if(this.tok)h.Authorization='Bearer '+this.tok;return Object.assign(h,x||{})},
  async auth(p,b){var r=await fetch(CONFIG.url+'/auth/v1/'+p,{method:'POST',headers:this.cab(),body:JSON.stringify(b)});
    var d=await r.json();if(!r.ok)throw new Error(d.error_description||d.msg||d.message||'Falha na autenticação');return d},
  async rest(p,o){o=o||{};
    var r=await fetch(CONFIG.url+'/rest/v1/'+p,{method:o.method||'GET',headers:this.cab(o.headers),
      body:o.body?JSON.stringify(o.body):undefined});
    if(r.status===204)return null;var d=await r.json();
    if(!r.ok)throw new Error(d.message||d.hint||'Falha ao acessar os dados');return d}
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
        this.usuario={id:ud.id,email:ud.email,nome:(ud.user_metadata||{}).nome||ud.email};
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
      this.usuario={id:d.user.id,email:d.user.email,nome:(d.user.user_metadata||{}).nome||d.user.email};
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
    return this.mandato;
  },
  _t:null,
  salvar(){clearTimeout(this._t);marcaSalvando();var s=this;this._t=setTimeout(function(){s.gravar()},700)},
  async gravar(){
    try{
      if(NUVEM)await Nuvem.rest('mandatos?id=eq.'+this.mandato.id,{method:'PATCH',body:{dados:this.dados,atualizado_em:new Date().toISOString()}});
      else{var b=Local.ler();b.mandatos[this.mandato.id].dados=this.dados;Local.gravar(b)}
      marcaSalvo();
    }catch(e){aviso('Não foi possível salvar: '+e.message)}
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
