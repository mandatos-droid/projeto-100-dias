/* =====================================================================
   MISSÃO 2 · ganchos sobre o Guia original (escrito à mão, não gerado).
   Carregado depois de novos.js. Cada gancho sobrescreve uma função do legado.
   ===================================================================== */

/* ---------- Mão na massa 1: a tabela de equipe em ordem, com o organograma gerado logo abaixo ---------- */
(function(){
  function ilha(n){return '<div class="ilha" data-ilha="'+n+'"></div>'}
  /* passo 1 do Guia: "clareza sobre as entregas e agendas" já foi feito no Mapa Político (Missão 1).
     Feito = todos os exercícios da Missão 1 têm algum conteúdo; senão só mostra o link, sem bloquear (RM2-02). */
  function mapaFeito(){
    if(typeof MISSOES==='undefined'||typeof estadoEx!=='function')return false;
    var m1=MISSOES.filter(function(x){return x.n===1})[0];
    return !!m1&&m1.exercicios.length>0&&m1.exercicios.every(function(e){return estadoEx(e)!=='nao'});
  }
  var PASSOS=[
    'Clareza sobre a quantidade de pessoas que podem ser alocadas no mandato ou que se espera alocar nos primeiros 100 dias. Informe o número e a tabela ganha uma linha para cada pessoa.',
    'Preenchimento do <strong>escopo de trabalho</strong> amplo de cada linha: o que o mandato quer que seja feito?',
    'Preenchimento das <strong>competências comportamentais</strong> gerais, necessárias e desejadas, para cumprir o escopo de trabalho.',
    'Preenchimento do <strong>nome do cargo</strong> que seria responsável por cumprir tal escopo.',
    'Finalmente, preenchimento do <strong>nome da pessoa</strong> que tem experiência para cumprir o escopo de trabalho e que tenha as competências comportamentais descritas nas colunas anteriores.',
    'Uma vez tendo a última coluna preenchida, defina em qual <strong>categoria</strong> a pessoa se encaixa melhor: Chefia; Coordenação; Especialista; Executora.',
    'Por fim, selecione a <strong>área do mandato</strong> em que a pessoa vai ser alocada.'];
  Comp.funcoes=function(){
    var feito=mapaFeito();
    var p1=feito
      ?'<li class="passo-feito"><span aria-hidden="true">✓ </span>Clareza sobre as entregas objetivadas pelo mandato e quais são as agendas prioritárias <em>(feito: o mapa político já foi construído na Missão 1)</em>. <a href="#/m/1">Rever o mapa político</a></li>'
      :'<li>Clareza sobre as entregas objetivadas pelo mandato e quais são as agendas prioritárias. Se ainda não fez, <a href="#/m/1">construa o mapa político na Missão 1</a>; você pode seguir sem isso.</li>';
    return '<ol class="passos-m2">'+p1+PASSOS.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ol>'+
      '<div class="apoio"><span class="tag">Importante</span>Preencha a tabela na ordem das colunas: cada coluna só abre quando a anterior está preenchida. Se ainda não há ninguém com as competências esperadas, escreva <strong>*</strong> no lugar do nome para abrir processo seletivo de ampla concorrência. Caso não haja pessoas que se encaixem nos requisitos, encorajamos o mandato a abrir processo seletivo e aumentar a diversidade e a representatividade dentro da equipe!</div>'+
      ilha('equipe-tabela')+
      '<div class="apoio"><span class="tag">Organograma</span>O organograma abaixo é gerado sozinho a partir da categoria e da área de cada linha da tabela.</div>'+
      ilha('organograma');
  };

  var m=MISSOES.filter(function(x){return x.n===2})[0];
  if(!m)return;
  var f=m.exercicios.filter(function(e){return e.id==='m2.funcoes'})[0];
  var g=m.exercicios.filter(function(e){return e.id==='m2.gestao'})[0];

  if(f){
    f.t='A equipe de sucesso';
    f.d='Montar, em tabela e na ordem, a equipe do mandato: escopo, competências, cargo, pessoa, categoria e área.';
    f.intro='<h4>Estruturando a gestão de pessoas do mandato</h4>'+
      '<p>Ao invés de encaixar pessoas em cargos, nossa recomendação é que seja feito o exercício contrário. Montaremos a tabela que permitirá que o mandato mantenha seus compromissos políticos, mas que o faça a partir do encaixe de perfis específicos com cargos coerentes.</p>'+
      '<p><strong>O passo a passo do exercício é o seguinte:</strong></p>';
  }

  /* ---------- Organograma e rotinas: organograma interativo, rotinas geradas e a entrega ---------- */
  if(g){
    g.d='Escopo de cada cargo no organograma, rotinas das áreas e entrega final da Missão.';
    g.intro='<p>Com o time escalado, é hora de definir o trabalho de cada cadeira e como o mandato se encontra e se comunica. Tudo o que você preencher aqui alimenta o resultado final da Missão: cadeiras, escopo de cada cargo, organograma e rotinas.</p>'+
      '<h4>1. Organograma e escopo de trabalho de cada cargo</h4>'+
      '<p><strong>Objetivo:</strong> estabelecer com clareza as responsabilidades, atribuições e limites de atuação de cada cargo, evitando sobreposições e lacunas, e estruturar visualmente todas as áreas, cargos e relações de coordenação do mandato.</p>'+
      '<p><strong>Importância:</strong> facilitar a distribuição e o cumprimento de tarefas, aumentar a autonomia da equipe, reduzir conflitos, retrabalho e dependência excessiva do parlamentar ou da chefia de gabinete, e apoiar a integração e a identificação da equipe.</p>'+
      '<div class="apoio"><span class="tag">Como fazer</span>Clique na caixa de uma cadeira para definir o escopo de trabalho, as especificidades, o perfil e o repertório. Cada caixa mostra quanto já foi preenchido.</div>'+
      '<div class="ilha" data-ilha="organograma"></div>'+
      '<div class="apoio"><span class="tag">Próximo passo</span>Compartilhe o escopo de trabalho e a estrutura do mandato com toda a equipe, desde o momento da contratação: hierarquias, possibilidades de ascensão e interações entre áreas. Com o escopo conhecido, é possível cobrar e reconhecer em cima do que foi combinado.</div>'+
      '<h4>2. Fluxos de trabalho e rotinas de comunicação entre as equipes</h4>'+
      '<p><strong>Objetivo:</strong> definir os momentos de encontro coletivo e dentro de cada área, como as demandas circulam pelo mandato, quem é acionado em cada situação e quais são as principais rotinas de alinhamento.</p>'+
      '<p><strong>Importância:</strong> criar previsibilidade e integração, reduzir ruídos de comunicação e atrasos, melhorar a coordenação entre as áreas e permitir que o mandato funcione de forma menos dependente de orientações individuais do parlamentar.</p>'+
      '<div class="apoio"><span class="tag">Como fazer</span>As rotinas nascem das cadeiras que você montou. Veja as rotinas de cada área, a cadeia de rotinas com as cadeiras envolvidas e registre as conversas entre áreas.</div>'+
      '<div class="ilha" data-ilha="rotinas"></div>'+
      '<h4>3. A entrega da Missão 2</h4>'+
      '<p>Aqui está o resultado: cadeiras, escopo de cada cargo, organograma e rotinas. Exporte o organograma ou imprima a página para compartilhar com a equipe.</p>'+
      '<div class="ilha" data-ilha="entrega"></div>'+
      '<div class="apoio atencao"><span class="tag">Atenção</span>Não é necessário chegar, imediatamente, até o que está previsto em "próximo passo". Você poderá fazê-lo até o fim dos primeiros 45 dias. O checklist abaixo traz o que deve ser estabelecido antes de partir para a próxima missão.</div>';
  }
})();

/* ---------- contadores e Resumo: contam as cadeiras ativas (m2.on), não as 20 fixas do modelo ----------
   Mesma regra de lib/cadeiras.ts (ativas): sem m2.on, vale o formato antigo (a Chefia e toda cadeira com nome ou ficha). */
(function(){
  var FICHA=['nome_cargo','coord','lider','escopo','espec','hab_dest','hab_dev','rep_dest','rep_dev','ritmo','rel','entrega','fb_falei','fb_ouvi','fb_dev'];
  var N_BASE=20;
  function campos(){return (typeof D!=='undefined'&&D&&D.campos)||{}}
  function nome(i){return String(campos()['m2.f'+(i+1)]||'').trim()}
  function temFicha(i){var c=campos();return FICHA.some(function(k){return String(c['m2.p'+(i+1)+'.'+k]||'').trim()!==''})}
  function ativas(){
    var c=campos(),raw=c['m2.on'],base=[];
    if(raw!==undefined&&raw!==null){
      String(raw).split('|').forEach(function(x){var n=Number(x);if(x!==''&&Number.isInteger(n)&&n>=0)base.push(n)});
    }else{
      for(var i=0;i<N_BASE;i++)if(nome(i)!==''||temFicha(i))base.push(i);
    }
    base.push(0);
    return base.filter(function(n,k){return base.indexOf(n)===k}).sort(function(a,b){return a-b});
  }
  /* ---- a tabela de equipe (lib/tabelaEquipe.ts, em JS simples): uma linha por cadeira ativa ----
     Mandato do modelo antigo (sem m2.n, com nome ou ficha): categoria e área sempre se derivam, e o escopo, as competências e o cargo
     vêm do formato antigo (escopo+espec, hab_dest, cargo do modelo). Mandato novo: as seis colunas são as chaves m2.*. */
  function v(i,k){return String(campos()['m2.p'+(i+1)+'.'+k]||'').trim()}
  function lista(x){return String(x||'').split('|').filter(function(t){return t.trim()!==''})}
  function antiga(){return campos()['m2.n']===undefined&&ativas().some(function(i){return nome(i)!==''||temFicha(i)})}
  function cargoModelo(i){return i<N_BASE&&typeof CARGOS_EQUIPE!=='undefined'&&CARGOS_EQUIPE[i]?CARGOS_EQUIPE[i][0]:''}
  function linha(i,ant){
    var esc=v(i,'esc'),comp=v(i,'comp'),cargoV=v(i,'nome_cargo'),cat=v(i,'cat'),area=v(i,'coord');
    if(ant){
      if(!esc)esc=lista(campos()['m2.p'+(i+1)+'.escopo']).concat([v(i,'espec')]).filter(function(t){return t.trim()!==''}).join('; ');
      if(!comp)comp=lista(campos()['m2.p'+(i+1)+'.hab_dest']).join(', ');
      if(!cargoV)cargoV=cargoModelo(i);
      if(!cat)cat='derivada';
      if(!area)area='derivada';
    }
    var pessoa=nome(i);
    return {i:i,esc:esc,comp:comp,cargo:cargoV,pessoa:pessoa,cat:cat,area:area,
      completa:[esc,comp,cargoV,pessoa,cat,area].every(function(t){return t!==''})};
  }
  function situacao(){
    var c=campos(),ant=antiga(),a=ativas(),ls=a.map(function(i){return linha(i,ant)});
    var comecou=c['m2.n']!==undefined||ant;
    return {linhas:ls,completas:ls.filter(function(l){return l.completa}),total:comecou?a.length:0};
  }

  if(typeof temConteudo!=='undefined'){
    var _tc=temConteudo;
    temConteudo=function(ex){
      if(ex.tipo==='funcoes')return campos()['m2.n']!==undefined||ativas().some(function(i){
        return nome(i)!==''||['esc','comp','nome_cargo','cat','coord'].some(function(k){return v(i,k)!==''})})||String(campos()['m2.coords']||'').trim()!=='';
      return _tc(ex);
    };
  }
  if(typeof Telas!=='undefined'&&Telas.estadoTxt){
    var _et=Telas.estadoTxt;
    Telas.estadoTxt=function(ex,e){
      var r=_et.call(this,ex,e);
      if(ex.tipo!=='funcoes')return r;
      var s=situacao();
      return r.replace(/[0-9]+ de [0-9]+ cargos/,s.completas.length+' de '+s.total+' linhas completas');
    };
  }
  if(typeof Resumo!=='undefined'&&Resumo.ex){
    var _rx=Resumo.ex;
    Resumo.ex=function(ex){
      if(ex.tipo!=='funcoes')return _rx.call(this,ex);
      var s=situacao();
      return '<dl class="cmp"><dt>Linhas completas ('+s.completas.length+' de '+s.total+')</dt><dd>'+
        (s.completas.length?'<ul class="marcados">'+s.completas.map(function(l){
          var extra=(l.cat!=='derivada'?' · '+esc(l.cat):'')+(l.area!=='derivada'?' · '+esc(l.area==='Chefia de área'?'Chefia de gabinete':l.area):'');
          return '<li>'+esc(l.cargo)+': <strong>'+esc(l.pessoa)+'</strong>'+(l.pessoa.indexOf('*')>=0?' <em>(processo seletivo a abrir)</em>':'')+extra+'</li>';
        }).join('')+'</ul>':this.sem)+'</dd></dl>';
    };
  }
})();
