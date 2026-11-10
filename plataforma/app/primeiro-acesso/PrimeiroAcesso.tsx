'use client';

import { useEffect, useRef, useState } from 'react';
import { ErroApi } from '../../lib/admin/api.ts';
import { carregaConfig, type Config } from '../../lib/admin/config.ts';
import { CHAVE_SESSAO, gravaSessao, lerRetornoGoogle, lerSessao, urlGoogle } from '../../lib/admin/sessao.ts';
import { DESCONHECIDO, mensagemDe } from '../../lib/convites/erros.ts';
import { lePendente } from '../../lib/convites/pendente.ts';
import { tokenDoLinkColado } from '../../lib/perfil/link.ts';
import { ehEquipeLegisla, meuPerfil, perfilSalvar, ERRO_SALVAR, type ResultadoSalvar } from '../../lib/perfil/api.ts';
import { proximoPasso, type Passo } from '../../lib/perfil/fluxo.ts';
import { formataTelefone, soDigitosTelefone } from '../../lib/perfil/telefone.ts';
import { GENEROS, RACAS, TEMPOS } from '../../lib/perfil/opcoes.ts';
import { validaPerfil, type Campo, type DadosPerfil } from '../../lib/perfil/validacao.ts';
import { criaAutenticada, type Autenticada } from '../mandato/sessaoApi.ts';
import { AvisoConsentimento, CaixaConsentimento } from '../convite/FormularioConta.tsx';

const ERRO_GOOGLE = 'Não foi possível entrar com o Google. Tente de novo.';
const CHAVE_SEM_EQUIPE = 'legisla.semEquipe';

type Volta = 'guia' | 'mandato' | 'convite' | null;

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'entrada'; aviso?: string }
  | { tipo: 'perfil'; nome: string }
  | { tipo: 'pergunta' }
  | { tipo: 'instrucoes' }
  | { tipo: 'erro'; mensagem: string };

// O que a página sabe da pessoa depois de entrar: serve ao envio do perfil e ao passo seguinte.
interface Contexto { cfg: Config; sessao: Autenticada; temMandato: boolean }

interface LinhaMembro { papel: string }

const armLocal = (): Storage | null => { try { return localStorage; } catch { return null; } };
const armSessao = (): Storage | null => { try { return sessionStorage; } catch { return null; } };

function voltaDaUrl(): Volta {
  const v = new URLSearchParams(location.search).get('volta');
  return v === 'guia' || v === 'mandato' || v === 'convite' ? v : null;
}

// Nome da conta Google (user_metadata do GoTrue); vazio se a conta não trouxe nome ou a consulta falha.
async function nomeDoGoogle(cfg: Config): Promise<string> {
  try {
    const s = lerSessao(localStorage);
    if (!s) return '';
    const r = await fetch(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.key, Authorization: `Bearer ${s.access_token}` } });
    const d = await r.json().catch(() => null);
    const m = d?.user_metadata;
    const nome = m?.full_name ?? m?.name;
    return r.ok && typeof nome === 'string' ? nome : '';
  } catch {
    return '';
  }
}

export default function PrimeiroAcesso() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const ctx = useRef<Contexto | null>(null);
  const iniciou = useRef(false);

  // Para onde vai quem já pode seguir: o ponto de partida (`volta`) ou o Guia.
  function segue(volta: Volta) {
    if (volta === 'mandato') { location.replace('/guia#/config'); return; }
    if (volta === 'convite') {
      const token = lePendente(armSessao());
      location.replace(token ? `/convite#${token}` : '/convite');
      return;
    }
    location.replace('/guia');
  }

  // Quem chega por convite só conta como tal com o token guardado no navegador (PAG-04.8).
  function situacao(temPerfil: boolean, ehLegisla: boolean, temMandato: boolean, volta: Volta) {
    return {
      temPerfil, ehLegisla, temMandato,
      veioPorConvite: volta === 'convite' && lePendente(armSessao()) !== null,
      semEquipe: armSessao()?.getItem(CHAVE_SEM_EQUIPE) === '1',
    };
  }

  function vai(passo: Passo, volta: Volta) {
    if (passo === 'pergunta') { setEstado({ tipo: 'pergunta' }); return; }
    // com a marca "Ainda não", o Guia abre o cadastro de mandato (override em acesso.js)
    if (passo === 'cadastroMandato') { location.replace('/guia'); return; }
    segue(volta);
  }

  // "Ainda não": a marca vale só nesta sessão do navegador e o Guia abre o cadastro do mandato (PAG-04.6).
  function aindaNao() {
    try { sessionStorage.setItem(CHAVE_SEM_EQUIPE, '1'); } catch { /* sem armazenamento: o Guia pergunta de novo */ }
    location.replace('/guia');
  }

  async function carrega() {
    setEstado({ tipo: 'carregando' });
    let perdida = false;
    try {
      const cfg = await carregaConfig();
      const volta = voltaDaUrl();
      // Volta do Google: a sessão (ou o erro) chega no fragmento; limpa o endereço e guarda a sessão em legisla.tok.
      const retorno = lerRetornoGoogle(location.hash);
      if (retorno) {
        history.replaceState(null, '', `${location.pathname}${location.search}`);
        if (retorno.tipo === 'erro') { setEstado({ tipo: 'entrada', aviso: ERRO_GOOGLE }); return; }
        try { gravaSessao(localStorage, retorno.sessao); } catch { /* sem storage: a sessão vale só nesta página */ }
      }
      const l = armLocal();
      const inicial = l ? lerSessao(l) : null;
      if (!inicial) { setEstado({ tipo: 'entrada' }); return; }
      const sessao = criaAutenticada(cfg, inicial, {
        grava: (s) => { try { gravaSessao(localStorage, s); } catch { /* sem armazenamento */ } },
        perdeu: () => { perdida = true; try { localStorage.removeItem(CHAVE_SESSAO); } catch { /* sem armazenamento */ } },
      });
      const usuario = await sessao.usuario();
      const [ehLegisla, temPerfil] = await Promise.all([ehEquipeLegisla(sessao.api, usuario.id), meuPerfil(sessao.api, usuario.id)]);
      const membros = (await sessao.api.ler<LinhaMembro[] | null>(`membros?select=papel&user_id=eq.${encodeURIComponent(usuario.id)}`)) ?? [];
      const temMandato = membros.length > 0;
      ctx.current = { cfg, sessao, temMandato };
      const passo = proximoPasso(situacao(temPerfil, ehLegisla, temMandato, volta));
      if (passo === 'perfil') { setEstado({ tipo: 'perfil', nome: await nomeDoGoogle(cfg) }); return; }
      vai(passo, volta);
    } catch (e) {
      // falha de consulta nunca vira "sem perfil": mostra o erro e deixa repetir
      if (perdida) setEstado({ tipo: 'entrada' });
      else setEstado({ tipo: 'erro', mensagem: mensagemDe(e) || DESCONHECIDO });
    }
  }

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    carrega();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function salva(dados: DadosPerfil): Promise<ResultadoSalvar> {
    const c = ctx.current!;
    const r = await perfilSalvar(c.sessao.api, dados);
    if (!r.ok) return r;
    const volta = voltaDaUrl();
    vai(proximoPasso(situacao(true, false, c.temMandato, volta)), volta);
    return r;
  }

  if (estado.tipo === 'carregando') return <p className="cv-centro cv-mut" role="status">Carregando…</p>;

  if (estado.tipo === 'erro') {
    return (
      <div className="cv-centro">
        <div className="cv-aviso" role="alert">{estado.mensagem}</div>
        <button type="button" className="pa-bt pa-bt--sec" onClick={carrega}>Tentar de novo</button>
      </div>
    );
  }

  if (estado.tipo === 'entrada') return <Entrada aviso={estado.aviso} />;

  if (estado.tipo === 'pergunta') {
    return (
      <section className="cv-centro" aria-labelledby="pa-pergunta">
        <p className="pa-etq">Primeiro acesso</p>
        <h1 id="pa-pergunta">A equipe do seu mandato já criou uma conta?</h1>
        <div className="pa-bts">
          <button type="button" className="pa-bt pa-bt--pri" onClick={() => setEstado({ tipo: 'instrucoes' })}>Sim, já criou</button>
          <button type="button" className="pa-bt pa-bt--sec" onClick={aindaNao}>Ainda não</button>
        </div>
      </section>
    );
  }

  if (estado.tipo === 'instrucoes') return <Instrucoes volta={() => setEstado({ tipo: 'pergunta' })} />;

  return <FormularioPerfil nomeInicial={estado.nome} salva={salva} sessaoPerdida={() => setEstado({ tipo: 'entrada' })} />;
}

// Sem sessão: só o botão do Google (PAG-01.1, 01.2); o erro do Google aparece aqui e o botão continua (PAG-01.4).
function Entrada({ aviso }: { aviso?: string }) {
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  async function clica() {
    setEnviando(true); setFalha(null);
    try {
      const cfg = await carregaConfig();
      location.href = urlGoogle(cfg, `${location.origin}/primeiro-acesso${location.search}`);
    } catch {
      setFalha(ERRO_GOOGLE); setEnviando(false);
    }
  }
  const msg = falha ?? aviso;
  return (
    <section className="cv-centro" aria-labelledby="pa-entrada">
      <p className="pa-etq">Primeiro acesso</p>
      <h1 id="pa-entrada">Entre para continuar</h1>
      {msg && <div className="cv-aviso" role="alert">{msg}</div>}
      <div className="pa-bts"><button type="button" className="pa-bt pa-bt--pri" onClick={clica} disabled={enviando}>Entrar com Google</button></div>
    </section>
  );
}

// Digitar ou colar: só dígitos, até 11, com máscara. Apagar um parêntese, espaço ou hífen não muda os dígitos:
// nesse caso remove o último dígito, para o Backspace nunca travar na máscara.
function mudaTelefone(antes: string, novo: string): string {
  const digitos = soDigitosTelefone(novo);
  if (novo.length < antes.length && digitos === soDigitosTelefone(antes)) return formataTelefone(digitos.slice(0, -1));
  return formataTelefone(digitos);
}

interface Falha { erro: string; campo?: Campo }

function FormularioPerfil({ nomeInicial, salva, sessaoPerdida }: {
  nomeInicial: string;
  salva: (d: DadosPerfil) => Promise<ResultadoSalvar>;
  sessaoPerdida: () => void;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [nascimento, setNascimento] = useState('');
  const [genero, setGenero] = useState('');
  const [raca, setRaca] = useState('');
  const [telefone, setTelefone] = useState('');
  const [atua, setAtua] = useState('');
  const [tempo, setTempo] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [sensiveis, setSensiveis] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<Falha | null>(null);
  const emEnvio = useRef(false);

  function aponta(f: Falha) {
    setFalha(f);
    if (f.campo) setTimeout(() => document.getElementById(`pa-${f.campo}`)?.focus(), 0);
  }

  async function envia(ev: React.FormEvent) {
    ev.preventDefault();
    if (emEnvio.current) return; // duplo clique: um único envio (PAG-02.14)
    const v = validaPerfil({ nome, nascimento, genero, raca, telefone, atua, tempo, consentimento, sensiveis });
    if (!v.ok) { aponta({ erro: v.erro, campo: v.campo }); return; }
    emEnvio.current = true; setEnviando(true); setFalha(null);
    try {
      const r = await salva(v.dados);
      if (r.ok) return; // a página já está saindo para o passo seguinte
      aponta({ erro: r.erro, campo: r.campo });
    } catch (e) {
      // 401 que não renovou: volta à entrada; as demais recusas (4xx) viram a mensagem de salvar (PAG-02.13)
      if (e instanceof ErroApi && e.status === 401) { sessaoPerdida(); return; }
      aponta({ erro: ERRO_SALVAR });
    }
    emEnvio.current = false; setEnviando(false);
  }

  const inv = (c: Campo) => (falha?.campo === c ? true : undefined);

  return (
    <form className="cv-centro" onSubmit={envia} noValidate aria-labelledby="pa-titulo">
      <p className="pa-etq">Primeiro acesso</p>
      <h1 id="pa-titulo">Conte um pouco sobre você</h1>
      <p className="cv-mut">Todos os campos são obrigatórios.</p>
      {falha && <div className="cv-aviso" role="alert">{falha.erro}</div>}

      <label className="cv-campo"><span>Nome completo</span>
        <input id="pa-nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} aria-invalid={inv('nome')} /></label>
      <label className="cv-campo"><span>Data de nascimento</span>
        <input id="pa-nascimento" type="date" autoComplete="bday" value={nascimento} onChange={(e) => setNascimento(e.target.value)} aria-invalid={inv('nascimento')} /></label>
      <div className="cv-campo"><label htmlFor="pa-genero"><span>Gênero</span></label>
        <select id="pa-genero" value={genero} onChange={(e) => setGenero(e.target.value)} aria-invalid={inv('genero')}>
          <option value="">Selecione</option>
          {GENEROS.map((o) => <option key={o.chave} value={o.chave}>{o.rotulo}</option>)}
        </select></div>
      <div className="cv-campo"><label htmlFor="pa-raca"><span>Raça</span></label>
        <select id="pa-raca" value={raca} onChange={(e) => setRaca(e.target.value)} aria-invalid={inv('raca')}>
          <option value="">Selecione</option>
          {RACAS.map((o) => <option key={o.chave} value={o.chave}>{o.rotulo}</option>)}
        </select></div>
      <div className="cv-campo">
        <label className="cv-campo"><span>Telefone com DDD</span>
          <input id="pa-telefone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={15} value={telefone}
            onChange={(e) => setTelefone(mudaTelefone(telefone, e.target.value))} aria-invalid={inv('telefone')} aria-describedby="pa-telefone-aj" /></label>
        <p id="pa-telefone-aj" className="pa-ajuda">Telefone com DDD, ex.: (11) 99999-9999</p>
      </div>

      <fieldset className="pa-grupo" data-invalido={inv('atua')}>
        <legend>Atua na política?</legend>
        <div className="pa-opcoes">
          <label className="pa-opcao"><input id="pa-atua" type="radio" name="atua" value="sim" checked={atua === 'sim'} onChange={() => setAtua('sim')} />Sim</label>
          <label className="pa-opcao"><input type="radio" name="atua" value="nao" checked={atua === 'nao'} onChange={() => { setAtua('nao'); setTempo(''); }} />Não</label>
        </div>
      </fieldset>
      {atua === 'sim' && (
        <div className="cv-campo"><label htmlFor="pa-tempo"><span>Há quanto tempo?</span></label>
          <select id="pa-tempo" value={tempo} onChange={(e) => setTempo(e.target.value)} aria-invalid={inv('tempo')}>
            <option value="">Selecione</option>
            {TEMPOS.map((o) => <option key={o.chave} value={o.chave}>{o.rotulo}</option>)}
          </select></div>
      )}

      <AvisoConsentimento />
      <div className="pa-chk" data-invalido={inv('consentimento')}>
        <CaixaConsentimento marcado={consentimento} muda={setConsentimento} />
      </div>
      <p className="pa-sensiveis">{TEXTO_SENSIVEIS}</p>
      <div className="pa-chk" data-invalido={inv('sensiveis')}>
        <label className="cv-chk">
          <input id="pa-sensiveis" type="checkbox" checked={sensiveis} onChange={(e) => setSensiveis(e.target.checked)} />
          <span>{CONCORDO_SENSIVEIS}</span>
        </label>
      </div>

      <div className="pa-bts"><button type="submit" className="pa-bt pa-bt--pri" disabled={enviando}>Salvar e continuar</button></div>
    </form>
  );
}

// TEXTO PROVISÓRIO: revisão jurídica pendente
// Consentimento específico para dados pessoais sensíveis (LGPD, art. 11): gênero, raça e data de nascimento.
const TEXTO_SENSIVEIS =
  'Gênero e raça são dados pessoais sensíveis. Usamos esses dados, junto com a data de nascimento, para conhecer o perfil de quem usa a plataforma e orientar o programa. Só a equipe da Legisla Brasil vê esses dados, e nenhum mandato tem acesso a eles.';
// TEXTO PROVISÓRIO: revisão jurídica pendente
const CONCORDO_SENSIVEIS = 'Concordo, de forma específica, com o tratamento dos meus dados de gênero, raça e data de nascimento para essa finalidade.';

const NAO_E_LINK = 'Este não parece um link de convite. Peça a quem convidou para enviar de novo.';

// Quem a equipe já cadastrou: como a equipe gera o link e onde colá-lo (PAG-04.2, 04.3, 04.4, 04.5, 04.10).
function Instrucoes({ volta }: { volta: () => void }) {
  const [colado, setColado] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  function abre(ev: React.FormEvent) {
    ev.preventDefault();
    const token = tokenDoLinkColado(colado);
    if (!token) { setAviso(NAO_E_LINK); return; }
    location.assign(`/convite#${token}`);
  }

  return (
    <form className="cv-centro" onSubmit={abre} noValidate aria-labelledby="pa-instrucoes">
      <p className="pa-etq">Primeiro acesso</p>
      <h1 id="pa-instrucoes">Peça o link de convite à sua equipe</h1>
      <p className="cv-mut">Quem já criou a conta do mandato gera o link em 3 passos:</p>
      <ol className="pa-passos">
        <li>Abrir a Área do mandato.</li>
        <li>Entrar em Equipe e convites.</li>
        <li>Clicar em Gerar link de convite e enviar o link para você.</li>
      </ol>
      {aviso && <div className="cv-aviso" role="alert">{aviso}</div>}
      <label className="cv-campo"><span>Cole o link do convite</span>
        <input value={colado} onChange={(e) => setColado(e.target.value)} autoComplete="off" spellCheck={false} aria-invalid={aviso ? true : undefined} /></label>
      <div className="pa-bts">
        <button type="submit" className="pa-bt pa-bt--pri">Abrir convite</button>
        <button type="button" className="pa-bt pa-bt--fant" onClick={volta}>Voltar à pergunta</button>
      </div>
    </form>
  );
}
