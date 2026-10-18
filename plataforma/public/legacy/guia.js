/* ===================== EXERCÍCIO GUIADO ===================== */
var Guia={
  m:null, ex:null, i:0, modo:'guiado', passos:[],

  abrir(nm,id){
    var r=achaEx(id);
    if(!r)return Telas.missao(+nm);
    if(!this.ex||this.ex.id!==id){this.i=0}
    this.m=r.m;this.ex=r.ex;
    this.passos=this.montar(r.ex);
    if(this.i>=this.passos.length)this.i=this.passos.length-1;
    this.render();
  },

  /* monta a sequência: orientação, depois um passo por campo (inputs curtos agrupados) */
  montar(ex){
    var p=[];
    if(ex.intro||ex.passos)p.push({k:'intro'});
    if(ex.tipo==='perguntas')ex.itens.forEach(function(it,n){p.push({k:'pergunta',n:n})});
    else if(ex.tipo==='campos'){
      var buf=[];
      ex.itens.forEach(function(it,n){
        if(it.tipo==='ta'){ if(buf.length){p.push({k:'campos',ns:buf});buf=[]} p.push({k:'campos',ns:[n]}) }
        else buf.push(n);
      });
      if(buf.length)p.push({k:'campos',ns:buf});
      if(ex.listaExtra)p.push({k:'listaExtra'});
    }
    else p.push({k:'componente'});
    if(ex.fim)p.push({k:'fim'});
    if(!p.length)p.push({k:'componente'});
    return p;
  },

  ir(n){
    this.i=Math.max(0,Math.min(this.passos.length-1,n));
    this.render();
    var t=document.getElementById('tela');
    window.scrollTo({top:0,behavior:'smooth'});
  },

  alternarModo(){this.modo=this.modo==='guiado'?'tudo':'guiado';this.i=0;this.render()},

  render(){
    var ex=this.ex,m=this.m,est=estadoEx(ex);
    var h='<div class="guia-topo">'+
      '<button class="voltar" onclick="location.hash=\'#/m/'+m.n+'\'">‹ Missão '+m.n+'</button>';
    if(this.modo==='guiado'){
      h+='<div class="passos-barra" style="--c:'+m.cor+'">'+
        this.passos.map(function(p,n){
          return '<i class="'+(n===Guia.i?'ativo':n<Guia.i?'passado':'')+'"></i>'}).join('')+'</div>'+
        '<span class="passo-conta">'+(this.i+1)+' de '+this.passos.length+'</span>';
    }
    h+='<button class="bt fant peq" style="margin-left:auto" onclick="Guia.alternarModo()">'+
      (this.modo==='guiado'?'Ver tudo de uma vez':'Voltar ao passo a passo')+'</button></div>';

    h+='<div class="etiqueta" style="margin-top:22px">Missão '+m.n+' · '+esc(m.curto)+' · '+esc(ex.t)+'</div>';

    if(this.modo==='tudo'){
      h+='<div class="passo-corpo">'+this.passos.map(function(p,n){return Guia.bloco(p,n)}).join('<hr class="regra">')+'</div>';
    }else{
      h+='<div class="passo-corpo">'+this.bloco(this.passos[this.i],this.i)+'</div>';
    }

    h+='<div class="passo-rodape">';
    if(this.modo==='guiado'){
      if(this.i>0)h+='<button class="bt sec" onclick="Guia.ir('+(this.i-1)+')">Anterior</button>';
      if(this.i<this.passos.length-1)h+='<button class="bt pri" onclick="Guia.ir('+(this.i+1)+')">Avançar</button>';
    }
    if(this.modo==='tudo'||this.i===this.passos.length-1){
      h+= est==='ok'
        ? '<button class="bt sec" onclick="Guia.reabrir()">Reabrir exercício</button>'
        : '<button class="bt pri" onclick="Guia.concluir()">Marcar como concluído</button>';
      h+='<button class="bt fant" onclick="Guia.proximo()">Próximo exercício ›</button>';
    }
    h+='<span class="salvo-aviso" data-salvo>'+(est==='ok'?'Concluído':'Salvo automaticamente')+'</span></div>';

    var tl=document.getElementById('tela');
    tl.innerHTML=h;
    tl.className='tela'+(tl.querySelector('[data-ilha]')?' largo':'');
    Campos.ligar(tl);
    if(window.Ilhas)Ilhas.ligar(tl);
  },

  bloco(p,n){
    var ex=this.ex,m=this.m,h='';
    if(p.k==='intro'){
      h+='<h1 class="largo" style="font-size:clamp(28px,4.2vw,42px)">'+esc(ex.t)+'</h1>';
      h+='<div class="texto">'+(ex.intro||'')+'</div>';
      if(ex.passos){
        h+='<h4>Como conduzir</h4><div class="orienta" style="--c:'+m.cor+'">'+
          ex.passos.map(function(t,i){
            return '<p><strong>'+['Primeiro','Segundo','Terceiro','Quarto','Quinto'][i]+' passo:</strong> '+t+'</p>'}).join('')+'</div>';
      }
      return h;
    }
    if(p.k==='pergunta'){
      var it=ex.itens[p.n];
      h+='<div class="passo-kicker" style="--c:'+m.cor+'">Pergunta '+(p.n+1)+' de '+ex.itens.length+'</div>'+
        '<h1 class="passo-titulo">'+esc(it.t)+'</h1>'+
        '<div class="orienta" style="--c:'+m.cor+'"><p>'+it.d+'</p></div>'+
        '<label class="campo"><textarea data-k="'+it.k+'" placeholder="Escreva aqui a resposta da equipe"></textarea></label>'+
        (it.ilha?'<div class="ilha" data-ilha="'+it.ilha+'"></div>':'');
      return h;
    }
    if(p.k==='campos'){
      var uni=p.ns.length===1;
      if(uni){
        var i0=ex.itens[p.ns[0]];
        h+='<div class="passo-kicker" style="--c:'+m.cor+'">Registre</div>'+
          '<h1 class="passo-titulo">'+esc(i0.rot)+'</h1>'+
          (i0.ph?'<div class="orienta" style="--c:'+m.cor+'"><p>'+esc(i0.ph)+'</p></div>':'')+
          '<label class="campo"><textarea data-k="'+i0.k+'"></textarea></label>';
      }else{
        h+='<div class="passo-kicker" style="--c:'+m.cor+'">Registre</div>'+
          '<h1 class="passo-titulo">'+esc(ex.t)+'</h1>';
        h+='<div class="linha-campos'+(p.ns.length>2?' c3':' c2')+'">'+
          p.ns.map(function(n){var it=ex.itens[n];
            return '<label class="campo"><span class="rot">'+esc(it.rot)+'</span>'+
              '<input type="text" data-k="'+it.k+'" placeholder="'+esc(it.ph||'')+'"></label>'}).join('')+'</div>';
      }
      return h;
    }
    if(p.k==='listaExtra'){
      h+='<div class="passo-kicker" style="--c:'+m.cor+'">Registre</div>'+
        '<h1 class="passo-titulo">'+esc(ex.listaExtra.titulo)+'</h1>'+
        Comp.lista(ex.listaExtra,ex.id);
      return h;
    }
    if(p.k==='fim')return '<h1 class="passo-titulo">Para fechar</h1><div class="texto">'+ex.fim+'</div>';
    /* componente */
    h+='<h1 class="largo" style="font-size:clamp(28px,4.2vw,42px)">'+esc(ex.t)+'</h1>';
    h+='<div class="texto">'+(this.passos.length===1?(ex.intro||''):'')+'</div>';
    h+=Comp[ex.tipo]?Comp[ex.tipo](ex):'';
    return h;
  },

  concluir(){
    D.feitos[this.ex.id]=true;Store.salvar();
    Store.registrar(this.m.n,this.ex.id,this.ex.t);
    aviso('Exercício concluído.');
    this.render();App.lateral();
  },
  reabrir(){D.feitos[this.ex.id]=false;Store.salvar();this.render();App.lateral()},
  proximo(){
    var lista=[];MISSOES.forEach(function(m){m.exercicios.forEach(function(e){lista.push({m:m,e:e})})});
    var at=lista.findIndex(function(x){return x.e.id===Guia.ex.id});
    if(at>=0&&at<lista.length-1){var p=lista[at+1];this.i=0;location.hash='#/m/'+p.m.n+'/'+p.e.id}
    else location.hash='#/';
  }
};

/* ===================== LIGAÇÃO DE CAMPOS ===================== */
var Campos={
  ligar(raiz){
    raiz.querySelectorAll('[data-k]').forEach(function(el){
      var k=el.dataset.k;
      if(el.type==='checkbox'){
        el.checked=!!D.campos[k];
        el.onchange=function(){D.campos[k]=el.checked;Store.salvar()};
      }else{
        if(D.campos[k]!==undefined)el.value=D.campos[k];
        el.oninput=function(){D.campos[k]=el.value;Store.salvar()};
        Campos.rico(el);
      }
    });
    raiz.querySelectorAll('[data-obj]').forEach(function(el){
      var p=el.dataset.obj.split('|'),arr=D[p[0]],it=arr&&arr[+p[1]];
      if(!it)return;
      if(it[p[2]]!==undefined)el.value=it[p[2]];
      el.oninput=function(){it[p[2]]=el.value;Store.salvar()};
      Campos.rico(el);
    });
  },
  BOTOES:[['bold','<b>N</b>','Negrito (Ctrl+B)'],['italic','<i>I</i>','Itálico (Ctrl+I)'],
    ['underline','<u>S</u>','Sublinhado (Ctrl+U)'],['insertUnorderedList','• Lista','Lista com marcadores'],
    ['insertOrderedList','1. Lista','Lista numerada'],['link','Link','Inserir link'],['removeFormat','Limpar','Remover formatação']],
  /* troca o <textarea> por um editor com barra de formatação; o textarea segue guardando o HTML */
  rico(ta){
    if(ta.nodeName!=='TEXTAREA'||ta.dataset.rico)return;
    ta.dataset.rico='1';
    var caixa=document.createElement('div');caixa.className='rico';
    var barra=document.createElement('div');barra.className='rico-barra';barra.setAttribute('role','toolbar');
    barra.setAttribute('aria-label','Formatação de texto');
    barra.innerHTML=Campos.BOTOES.map(function(b){
      return '<button type="button" data-cmd="'+b[0]+'" title="'+b[2]+'" aria-label="'+b[2]+'">'+b[1]+'</button>'}).join('');
    var ed=document.createElement('div');ed.className='rico-area';ed.contentEditable='true';
    ed.setAttribute('role','textbox');ed.setAttribute('aria-multiline','true');
    if(ta.placeholder)ed.dataset.ph=ta.placeholder;
    if(ta.style.minHeight)ed.style.minHeight=ta.style.minHeight;
    ed.innerHTML=rich(ta.value);
    function sync(){
      var h=richVazio(ed.innerHTML)?'':rich(ed.innerHTML);
      ta.value=h;if(ta.oninput)ta.oninput();
    }
    ed.addEventListener('input',sync);
    ed.addEventListener('paste',function(e){
      e.preventDefault();
      var t=(e.clipboardData||window.clipboardData).getData('text/plain');
      document.execCommand('insertText',false,t);
    });
    barra.addEventListener('mousedown',function(e){e.preventDefault()});
    barra.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      ed.focus();
      var c=b.dataset.cmd;
      if(c==='link'){
        var u=prompt('Endereço do link (https://…)','https://');
        if(u&&/^(https?:|mailto:)/i.test(u))document.execCommand('createLink',false,u);
      }else document.execCommand(c,false,null);
      sync();
    });
    ta.style.display='none';ta.setAttribute('aria-hidden','true');ta.tabIndex=-1;
    caixa.appendChild(barra);caixa.appendChild(ed);
    ta.parentNode.insertBefore(caixa,ta);
  }
};

/* ===================== COMPONENTES POR TIPO ===================== */
var Comp={
  perguntas(ex){
    return ex.itens.map(function(i,n){
      return '<label class="campo"><span class="rot">'+(n+1)+'. '+esc(i.t)+'</span>'+
        '<span class="aj">'+i.d+'</span><textarea data-k="'+i.k+'"></textarea></label>'+
        (i.ilha?'<div class="ilha" data-ilha="'+i.ilha+'"></div>':'')}).join('');
  },
  campos(ex){
    return ex.itens.map(function(i){
      var c=i.tipo==='ta'?'<textarea data-k="'+i.k+'" placeholder="'+esc(i.ph||'')+'"></textarea>'
                         :'<input type="text" data-k="'+i.k+'" placeholder="'+esc(i.ph||'')+'">';
      return '<label class="campo"><span class="rot">'+esc(i.rot)+'</span>'+c+'</label>'}).join('')+
      (ex.listaExtra?('<h4>'+esc(ex.listaExtra.titulo)+'</h4>'+Comp.lista(ex.listaExtra,ex.id)):'');
  },
  checklist(ex){
    var h='';
    if(ex.campos)h+='<div class="linha-campos c2">'+ex.campos.map(function(i){
      return '<label class="campo"><span class="rot">'+esc(i.rot)+'</span>'+
        '<input type="text" data-k="'+i.k+'" placeholder="'+esc(i.ph||'')+'"></label>'}).join('')+'</div>';
    if(ex.subtitulo)h+='<h4>'+esc(ex.subtitulo)+'</h4>';
    h+=(ex.itens||[]).map(function(i){
      return '<label class="chk"><input type="checkbox" data-k="'+i.k+'"><span>'+esc(i.t)+'</span></label>'}).join('');
    return h;
  },
  frag(ex){
    var h='<div class="frag-l">';
    (D.frags||[]).forEach(function(f,i){
      h+='<div class="frag-i"><span class="tx">'+esc(f.t)+'</span><span class="mp">'+
        '<button type="button" aria-pressed="'+(f.mp==='M')+'" title="Fragilidade da equipe do mandato" onclick="Comp.mp('+i+',\'M\')">M</button>'+
        '<button type="button" class="p" aria-pressed="'+(f.mp==='P')+'" title="Fragilidade do parlamentar" onclick="Comp.mp('+i+',\'P\')">P</button></span>'+
        (f.custom?'<button class="rm" style="position:static" onclick="Comp.rmFrag('+i+')">×</button>':'')+'</div>';
    });
    h+='</div><div class="linha-campos c2"><label class="campo"><span class="rot">Acrescentar outra fragilidade</span>'+
      '<input type="text" id="fragNova" placeholder="Descreva a fragilidade"></label></div>'+
      '<div class="bts"><button class="bt sec peq" onclick="Comp.addFrag()">Acrescentar</button></div>';
    return h;
  },
  mp(i,v){var f=D.frags[i];f.mp=f.mp===v?null:v;Store.salvar();Guia.render()},
  rmFrag(i){D.frags.splice(i,1);Store.salvar();Guia.render()},
  addFrag(){var e=document.getElementById('fragNova');if(!e||!e.value.trim())return;
    D.frags.push({t:e.value.trim(),mp:null,custom:true});Store.salvar();Guia.render()},

  funcoes(){
    var h='<div class="resumo-equipe apoio exemplo"><span class="tag">Resumo da estrutura</span>';
    GRUPOS_EQUIPE.forEach(function(g){
      h+='<p><strong>'+esc(g.g)+':</strong> '+g.itens.map(function(i){return esc(i[0])+' ('+esc(i[1])+')'}).join('; ')+'.</p>';
    });
    h+='</div>';
    CARGOS_EQUIPE.forEach(function(c,i){
      var k='m2.f'+(i+1),val=D.campos[k]||'';
      var cls=val?(val.indexOf('*')>=0?'aberto':'preenchido'):'';
      h+='<div class="cargo-i '+cls+'"><p class="cn">'+(i+1)+'. '+esc(c[0])+'</p>'+
        (c[1]?'<p class="cf">'+esc(c[1])+'</p>':'')+
        '<p class="ce">'+esc(c[2])+'</p>'+
        '<label class="campo" style="margin-bottom:0"><input type="text" data-k="'+k+'" '+
        'placeholder="Nome(s) mapeado(s) — use * para abrir processo seletivo"></label>'+
        '<div class="ilha" data-ilha="ficha-'+i+'"></div></div>';
    });
    return h;
  },

  preditores(ex){
    var h='<div class="opcoes c2">';
    PREDITORES.forEach(function(p){
      var on=D.preditores.indexOf(p.id)>=0;
      h+='<button type="button" class="opc" aria-pressed="'+on+'" onclick="Comp.pred(\''+p.id+'\')">'+
        '<span class="on">'+esc(p.n)+'</span><span class="od">'+esc(p.d)+'</span>'+
        (on&&D.campos['m3.obj.'+p.id]?'<span class="oe">'+esc(D.campos['m3.obj.'+p.id])+'</span>':'')+'</button>';
    });
    var n=D.preditores.length;
    h+='</div><p class="contador '+(n===3?'ok':'falta')+'">'+n+' de 3 preditores escolhidos</p>';
    if(n){
      h+='<h4>Objetivo específico de cada preditor</h4>'+
        '<div class="rolar"><table class="tb"><thead><tr><th style="width:38%">Preditor</th><th>Objetivo específico (exemplo)</th></tr></thead><tbody>'+
        OBJ_ESPECIFICOS.map(function(o){return '<tr><td>'+esc(o[0])+'</td><td>'+esc(o[1])+'</td></tr>'}).join('')+'</tbody></table></div>';
      D.preditores.forEach(function(id){
        var p=PREDITORES.filter(function(x){return x.id===id})[0];
        h+='<label class="campo"><span class="rot">'+esc(p.n)+'</span>'+
          '<input type="text" data-k="m3.obj.'+id+'" placeholder="Uma frase que traduza este preditor para a equipe"></label>';
      });
    }
    return h;
  },
  pred(id){
    var i=D.preditores.indexOf(id);
    if(i>=0)D.preditores.splice(i,1);
    else if(D.preditores.length<3)D.preditores.push(id);
    else return aviso('Escolha até três preditores. Desmarque um para trocar.');
    Store.salvar();Guia.render();
  },

  metas(){
    var h='';
    if(!D.metas.length)h+='<p class="vazio">Nenhuma meta escrita ainda. O planejamento costuma chegar a 10 ou 16 metas.</p>';
    D.metas.forEach(function(m,i){
      var base=D.preditores.length?D.preditores:PREDITORES.map(function(p){return p.id});
      var op='<option value="">Selecione o preditor</option>'+base.map(function(id){
        var p=PREDITORES.filter(function(x){return x.id===id})[0];
        return '<option value="'+id+'"'+(m.pred===id?' selected':'')+'>'+esc(p.n)+'</option>'}).join('');
      h+='<div class="din"><span class="idx">Meta '+String(i+1).padStart(2,'0')+'</span>'+
        '<button class="rm" onclick="Comp.rmMeta('+i+')">×</button>'+
        '<label class="campo" style="margin:12px 0 18px"><span class="rot">Preditor ou objetivo específico</span>'+
        '<select data-obj="metas|'+i+'|pred">'+op+'</select></label>'+
        '<label class="campo"><span class="rot">A meta, no formato SMART</span>'+
        '<textarea data-obj="metas|'+i+'|texto" placeholder="'+esc(FORMULA_META.linha)+'"></textarea></label>'+
        '<div class="linha-campos c2">'+
        '<label class="campo"><span class="rot">Responsável direto</span><input type="text" data-obj="metas|'+i+'|resp"></label>'+
        '<label class="campo"><span class="rot">Quem dá suporte</span><input type="text" data-obj="metas|'+i+'|apoio"></label></div></div>';
    });
    h+='<div class="bts" style="margin-top:18px"><button class="bt sec peq" onclick="Comp.addMeta()">Acrescentar meta</button>'+
      '<span class="contador">'+D.metas.length+' metas</span></div>';
    return h;
  },
  addMeta(){D.metas.push({id:uid()});Store.salvar();Guia.render()},
  rmMeta(i){D.metas.splice(i,1);Store.salvar();Guia.render()},

  lista(ex,dono){
    var ch=ex.chave;if(!D[ch])D[ch]=[];
    var h='';
    if(!D[ch].length)h+='<p class="vazio">Nada registrado ainda.</p>';
    D[ch].forEach(function(it,i){
      h+='<div class="din"><span class="idx">'+esc(ex.rotulo)+' '+String(i+1).padStart(2,'0')+'</span>'+
        '<button class="rm" onclick="Comp.rmItem(\''+ch+'\','+i+')">×</button><div style="margin-top:14px">'+
        ex.campos.map(function(c){
          var el=c.tipo==='ta'?'<textarea data-obj="'+ch+'|'+i+'|'+c.k+'"></textarea>'
                              :'<input type="text" data-obj="'+ch+'|'+i+'|'+c.k+'" placeholder="'+esc(c.ph||'')+'">';
          return '<label class="campo"><span class="rot">'+esc(c.rot)+'</span>'+el+'</label>'}).join('')+'</div></div>';
    });
    h+='<div class="bts"><button class="bt sec peq" onclick="Comp.addItem(\''+ch+'\')">Acrescentar '+esc(ex.rotulo.toLowerCase())+'</button></div>';
    return h;
  },
  addItem(ch){if(!D[ch])D[ch]=[];D[ch].push({id:uid()});Store.salvar();Guia.render()},
  rmItem(ch,i){D[ch].splice(i,1);Store.salvar();Guia.render()},

  frente:'articulacao',
  bingo(){
    var h='<div class="abas">';
    Object.keys(BINGOS).forEach(function(k){
      var n=(D.acoes||[]).filter(function(a){return a.bingo===k}).length;
      h+='<button aria-selected="'+(Comp.frente===k)+'" onclick="Comp.setFrente(\''+k+'\')">'+
        esc(BINGOS[k].n)+(n?' ('+n+')':'')+'</button>';
    });
    h+='</div>';
    var fr={};(D.acoes||[]).forEach(function(a){fr[a.bingo]=1});
    var nf=Object.keys(fr).length,tot=(D.acoes||[]).length;
    h+='<p class="contador '+(nf>=2?'ok':'falta')+'">'+
      (tot===0?'Nenhuma ação escolhida. O mínimo são duas, em frentes diferentes.'
       :nf<2?tot+' ação(ões) escolhida(s), todas na mesma frente. Escolha ao menos mais uma em outra frente.'
       :tot+' ações em '+nf+' frentes diferentes.')+'</p>';
    var b=BINGOS[this.frente];
    h+='<p class="texto">'+esc(b.txt)+'</p>';
    if(b.destaque)h+='<div class="apoio"><span class="tag">Destaque</span>'+esc(b.destaque)+'</div>';
    if(b.dica)h+='<div class="apoio"><span class="tag">Dica</span>'+esc(b.dica)+'</div>';
    h+='<div class="opcoes">';
    b.itens.forEach(function(txt,i){
      var idx=-1;(D.acoes||[]).forEach(function(a,n){if(a.bingo===Comp.frente&&a.i===i)idx=n});
      var on=idx>=0;
      h+='<button type="button" class="opc" aria-pressed="'+on+'" onclick="Comp.acao(\''+Comp.frente+'\','+i+')">'+
        '<span class="on" style="font-weight:600">'+esc(txt)+'</span>'+
        (on&&D.acoes[idx].resp?'<span class="oe">'+esc(D.acoes[idx].resp)+(D.acoes[idx].prazo?' · '+esc(D.acoes[idx].prazo):'')+'</span>':'')+'</button>';
      if(on){
        h+='<div class="din" style="margin:0 0 6px"><span class="idx">Registre esta ação</span><div style="margin-top:14px">'+
          '<label class="campo"><span class="rot">O que o mandato pretende alcançar?</span><textarea data-obj="acoes|'+idx+'|alcancar"></textarea></label>'+
          '<div class="linha-campos c2">'+
          '<label class="campo"><span class="rot">Responsável</span><input type="text" data-obj="acoes|'+idx+'|resp"></label>'+
          '<label class="campo"><span class="rot">Prazo</span><input type="text" data-obj="acoes|'+idx+'|prazo" placeholder="Ex.: até 20/03"></label></div>'+
          '<label class="campo"><span class="rot">Como saberemos que a ação foi alcançada?</span><textarea data-obj="acoes|'+idx+'|saber"></textarea></label>'+
          '<label class="campo"><span class="rot">Próximo passo</span><textarea data-obj="acoes|'+idx+'|prox"></textarea></label></div></div>';
      }
    });
    h+='</div>';
    if(b.atencao)h+='<div class="apoio atencao"><span class="tag">Atenção</span>'+esc(b.atencao)+'</div>';
    return h;
  },
  setFrente(k){this.frente=k;Guia.render()},
  acao(b,i){
    var idx=-1;D.acoes.forEach(function(a,n){if(a.bingo===b&&a.i===i)idx=n});
    if(idx>=0)D.acoes.splice(idx,1);
    else D.acoes.push({id:uid(),bingo:b,i:i,titulo:BINGOS[b].itens[i]});
    Store.salvar();Guia.render();
  },

  monit(){
    var h='<div class="rolar"><table class="tb"><thead><tr><th style="width:32%">Campo</th><th>O que registrar</th></tr></thead><tbody>'+
      CAMPOS_MONIT.map(function(c){return '<tr><td><strong>'+esc(c[1])+'</strong></td><td>'+esc(c[2])+'</td></tr>'}).join('')+
      '</tbody></table></div>';
    if(!D.metas.length)return h+'<p class="vazio">As metas da Missão 3 aparecem aqui assim que forem escritas.</p>';
    D.metas.forEach(function(m,i){
      var p=m.pred?PREDITORES.filter(function(x){return x.id===m.pred})[0]:null;
      var obj=m.pred?(D.campos['m3.obj.'+m.pred]||(p?p.n:'')):'';
      h+='<div class="din"><span class="idx">Meta '+String(i+1).padStart(2,'0')+(obj?' · '+esc(obj):'')+'</span>'+
        '<p style="font-weight:700;margin:10px 0 2px">'+(rich(m.texto)||'(meta ainda sem texto)')+'</p>'+
        '<p style="font-size:13.5px;color:var(--tinta-3);margin:0 0 10px">Responsável: '+esc(m.resp||'a definir')+'</p>';
      [1,2,3].forEach(function(mes){
        var pre='mon.'+m.id+'.'+mes+'.';
        var algo=CAMPOS_MONIT.some(function(c){return (D.campos[pre+c[0]]||'').trim()});
        h+='<details'+(algo?' open':'')+' style="border-top:1px solid var(--linha-2);padding:12px 0">'+
          '<summary style="cursor:pointer;font-weight:700;font-size:15px">'+mes+'º monitoramento mensal'+(algo?' ✓':'')+'</summary>'+
          '<div class="linha-campos c2" style="margin-top:16px">'+
          CAMPOS_MONIT.map(function(c){
            return '<label class="campo"><span class="rot">'+esc(c[1])+'</span>'+
              '<textarea data-k="'+pre+c[0]+'" style="min-height:80px"></textarea></label>'}).join('')+
          '</div></details>';
      });
      h+='</div>';
    });
    return h;
  }
};
