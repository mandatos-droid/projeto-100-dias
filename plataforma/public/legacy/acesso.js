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

/* ---------- Equipe e convites (seção de Configurações): atalho para a tela nova ---------- */
Telas.equipeHtml=function(){
  var h='<h2 class="cad-h3" style="margin-top:0">Equipe e convites</h2>';
  h+=NUVEM
    ?'<div class="apoio"><p class="texto" style="margin-top:0">Convide pessoas por link, acompanhe os convites pendentes e veja quem está no mandato.</p>'+
      '<div class="bts"><a class="bt pri" href="/mandato/equipe">Abrir Equipe e convites</a></div></div>'
    :'<div class="apoio atencao"><span class="tag">Modo local</span>O convite por link só funciona com o banco na nuvem configurado.</div>';
  return '<section id="cadEquipe" aria-label="Equipe e convites">'+h+'</section>';
};

})();
