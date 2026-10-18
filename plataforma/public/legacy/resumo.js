/* ===================== RESUMO ===================== */
var Resumo={
  sem:'<span class="sem">não preenchido</span>',
  v(k){var s=(D.campos[k]||'').toString().trim();return s?rich(s):this.sem},

  ex(ex){
    var c=D.campos,h='';
    switch(ex.tipo){
      case 'perguntas':
        h+='<dl class="cmp">'+ex.itens.map(function(i,n){
          return '<dt>'+(n+1)+'. '+esc(i.t)+'</dt><dd>'+Resumo.v(i.k)+'</dd>'+
            (i.ilha&&window.ResumoIlhas?ResumoIlhas.html(i.ilha):'')}).join('')+'</dl>';break;
      case 'campos':
        h+='<dl class="cmp">'+ex.itens.map(function(i){
          return '<dt>'+esc(i.rot)+'</dt><dd>'+Resumo.v(i.k)+'</dd>'}).join('')+'</dl>';
        if(ex.listaExtra)h+=this.lista(ex.listaExtra,ex.listaExtra.titulo);break;
      case 'checklist':
        if(ex.campos)h+='<dl class="cmp">'+ex.campos.map(function(i){
          return '<dt>'+esc(i.rot)+'</dt><dd>'+Resumo.v(i.k)+'</dd>'}).join('')+'</dl>';
        var mk=(ex.itens||[]).filter(function(i){return c[i.k]});
        h+='<dl class="cmp"><dt>Itens marcados ('+mk.length+' de '+(ex.itens||[]).length+')</dt><dd>'+
          (mk.length?'<ul class="marcados">'+mk.map(function(i){return '<li>'+esc(i.t)+'</li>'}).join('')+'</ul>':this.sem)+'</dd></dl>';break;
      case 'frag':
        var fs=(D.frags||[]).filter(function(f){return f.mp});
        h+='<dl class="cmp"><dt>Fragilidades classificadas</dt><dd>'+
          (fs.length?'<ul class="marcados">'+fs.map(function(f){
            return '<li><strong>'+f.mp+'</strong> — '+esc(f.t)+'</li>'}).join('')+'</ul>':this.sem)+'</dd></dl>';break;
      case 'funcoes':
        var pr=CARGOS_EQUIPE.map(function(f,i){return {n:f[0],f:f[1],v:(c['m2.f'+(i+1)]||'').trim()}})
          .filter(function(x){return x.v});
        h+='<dl class="cmp"><dt>Cargos preenchidos ('+pr.length+' de '+CARGOS_EQUIPE.length+')</dt><dd>'+
          (pr.length?'<ul class="marcados">'+pr.map(function(x){
            return '<li>'+esc(x.n)+': <strong>'+esc(x.v)+'</strong>'+
              (x.v.indexOf('*')>=0?' <em>(processo seletivo a abrir)</em>':'')+'</li>'}).join('')+'</ul>':this.sem)+'</dd></dl>';break;
      case 'preditores':
        h+='<dl class="cmp">';
        if(!(D.preditores||[]).length)h+='<dt>Preditores escolhidos</dt><dd>'+this.sem+'</dd>';
        (D.preditores||[]).forEach(function(id){
          var p=PREDITORES.filter(function(x){return x.id===id})[0];
          h+='<dt>'+esc(p.n)+'</dt><dd>'+Resumo.v('m3.obj.'+id)+'</dd>'});
        h+='</dl>';break;
      case 'metas':
        if(!(D.metas||[]).length){h+='<dl class="cmp"><dt>Metas</dt><dd>'+this.sem+'</dd></dl>';break}
        h+='<dl class="cmp">';
        D.metas.forEach(function(m,i){
          var p=m.pred?PREDITORES.filter(function(x){return x.id===m.pred})[0]:null;
          h+='<dt>Meta '+String(i+1).padStart(2,'0')+(p?' · '+esc(p.n):'')+'</dt><dd>'+
            (m.texto?rich(m.texto):Resumo.sem)+'<br><small>Responsável: '+(m.resp?esc(m.resp):'a definir')+
            ' · Apoio: '+(m.apoio?esc(m.apoio):'a definir')+'</small></dd>'});
        h+='</dl>';break;
      case 'lista': h+=this.lista(ex,null);break;
      case 'bingo':
        if(!(D.acoes||[]).length){h+='<dl class="cmp"><dt>Ações escolhidas</dt><dd>'+this.sem+'</dd></dl>';break}
        h+='<dl class="cmp">';
        D.acoes.forEach(function(a){
          h+='<dt>'+esc(BINGOS[a.bingo].n)+'</dt><dd><strong>'+esc(a.titulo)+'</strong>'+
            (a.alcancar?'<br>Objetivo: '+rich(a.alcancar):'')+
            (a.resp?'<br>Responsável: '+esc(a.resp):'')+(a.prazo?' · Prazo: '+esc(a.prazo):'')+
            (a.saber?'<br>Verificação: '+rich(a.saber):'')+
            (a.prox?'<br>Próximo passo: '+rich(a.prox):'')+'</dd>'});
        h+='</dl>';break;
      case 'monit':
        if(!(D.metas||[]).length){h+='<dl class="cmp"><dt>Monitoramento</dt><dd>'+this.sem+'</dd></dl>';break}
        D.metas.forEach(function(m,i){
          var L='';
          [1,2,3].forEach(function(mes){
            var pre='mon.'+m.id+'.'+mes+'.';
            var it=CAMPOS_MONIT.filter(function(cm){return (c[pre+cm[0]]||'').trim()});
            if(it.length)L+='<dt>'+mes+'º monitoramento</dt><dd>'+it.map(function(cm){
              return '<strong>'+esc(cm[1])+':</strong> '+rich(c[pre+cm[0]])}).join('<br>')+'</dd>';
          });
          h+='<dl class="cmp"><dt style="color:var(--tinta)">Meta '+String(i+1).padStart(2,'0')+' — '+
            (m.texto?rich(m.texto):'(sem texto)')+'</dt>'+(L||'<dd>'+Resumo.sem+'</dd>')+'</dl>';
        });break;
    }
    return h;
  },
  lista(cfg,titulo){
    var arr=D[cfg.chave]||[],h='<dl class="cmp">';
    if(titulo)h+='<dt style="color:var(--tinta)">'+esc(titulo)+'</dt>';
    if(!arr.length)h+='<dd>'+this.sem+'</dd>';
    arr.forEach(function(it,i){
      h+='<dt>'+esc(cfg.rotulo)+' '+String(i+1).padStart(2,'0')+'</dt><dd>'+
        cfg.campos.map(function(c){return '<strong>'+esc(c.rot)+':</strong> '+(it[c.k]?rich(it[c.k]):'—')}).join('<br>')+'</dd>'});
    return h+'</dl>';
  },
  missao(m){
    var h='<div class="res-missao" style="--c:'+m.cor+'"><h3>Missão '+m.n+' — '+esc(m.titulo)+'</h3>';
    m.exercicios.forEach(function(ex){
      var e=estadoEx(ex);
      h+='<div class="res-ex"><h4>'+esc(ex.t)+'<span class="selo '+e+'">'+
        (e==='ok'?'concluído':e==='andamento'?'em andamento':'não iniciado')+'</span></h4>'+Resumo.ex(ex)+'</div>';
    });
    return h+'</div>';
  },
  tudo(){return MISSOES.map(function(m){return Resumo.missao(m)}).join('')}
};

/* ===================== DOWNLOADS ===================== */
var Baixar={
  arq(nome,txt,tipo){
    var b=new Blob([txt],{type:tipo}),a=document.createElement('a');
    a.href=URL.createObjectURL(b);a.download=nome;a.click();URL.revokeObjectURL(a.href);
  },
  base(){return (Store.mandato.nome_parlamentar||Store.mandato.nome_civil||'mandato').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')},
  pagina(tit,miolo){
    var m=Store.mandato,d=diaAtual();
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>'+esc(tit)+'</title>'+
     '<style>body{font-family:Georgia,serif;max-width:760px;margin:36px auto;padding:0 20px;color:#17110F;line-height:1.6}'+
     'h1{font-size:26px;border-bottom:3px solid #571730;padding-bottom:8px}h3{font-size:18px;margin:30px 0 4px;border-bottom:1px solid #571730;padding-bottom:5px}'+
     'h4{font-size:15px;margin:18px 0 4px}dt{font-weight:700;font-size:13px;color:#5E524C;margin-top:10px}'+
     'dd{margin:0;padding:2px 0 2px 12px;border-left:2px solid #E6DCCE}dd ul,dd ol{margin:4px 0;padding-left:22px}'+
     '.selo{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#5E524C;margin-left:6px}'+
     '.sem{color:#938780;font-style:italic}.cab{font-size:13px;color:#5E524C;margin-bottom:24px}'+
     'ul.marcados{margin:4px 0;padding-left:18px}</style></head><body><h1>'+esc(tit)+'</h1><div class="cab">'+
     esc([m.nome_parlamentar,m.cargo,m.casa,m.uf,m.partido].filter(Boolean).join(' · '))+
     (m.data_posse?' · posse em '+dBRc(m.data_posse):'')+(d&&d>0?' · dia '+d+' de 100':'')+
     '<br>Exportado em '+dBRc(new Date())+' por '+esc(Store.usuario.nome||'')+'</div>'+miolo+'</body></html>';
  },
  missao(n){
    var m=MISSOES.filter(function(x){return x.n===n})[0];
    this.arq('regimento-'+this.base()+'-missao-'+n+'.html',
      this.pagina('Missão '+n+' — '+m.titulo,Resumo.missao(m)),'text/html');
    aviso('Respostas da Missão '+n+' baixadas.');
  },
  tudo(){
    this.arq('regimento-'+this.base()+'-completo.html',
      this.pagina('Guia dos 100 dias — resumo do mandato',Resumo.tudo()),'text/html');
    aviso('Resumo completo baixado.');
  },
  json(){
    this.arq('regimento-'+this.base()+'.json',
      JSON.stringify({mandato:Store.mandato,dados:D,eventos:Store.eventos,exportado_em:new Date().toISOString()},null,2),
      'application/json');
  }
};
