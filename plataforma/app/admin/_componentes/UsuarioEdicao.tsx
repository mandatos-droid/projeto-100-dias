'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { lerTudo } from '../../../lib/admin/api.ts';
import { EMAIL_INVALIDO, emailValido, mensagemDe } from '../../../lib/admin/mensagens.ts';
import type { DetalheUsuario } from '../../../lib/admin/usuarios.ts';
import {
  argumentosPerfil, camposDoPerfil, confereEmail, mandatosDisponiveis, mensagemPerfil, PAPEIS_MANDATO, type OpcaoMandato,
} from '../../../lib/admin/usuariosEdicao.ts';
import { ATUACOES, GENEROS, RACAS, TEMPOS } from '../../../lib/perfil/opcoes.ts';
import { formataTelefone, soDigitosTelefone } from '../../../lib/perfil/telefone.ts';
import { validaPerfil } from '../../../lib/perfil/validacao.ts';
import Dialogo from './Dialogo.tsx';
import { useAdmin } from './Sessao.tsx';

type Pessoa = DetalheUsuario;
interface Feito { onFechar: () => void; onFeito: () => void }

// ---------- e-mail da conta ----------
export function EditarEmail({ pessoa, onFechar, onFeito }: Feito & { pessoa: Pessoa }) {
  const { api } = useAdmin();
  const [email, setEmail] = useState(pessoa.email ?? '');
  const [erro, setErro] = useState('');

  async function salva() {
    const novo = email.trim();
    if (!emailValido(novo)) { setErro(EMAIL_INVALIDO); return; }
    setErro('');
    try {
      await api.rpc('admin_usuario_email', { p_user: pessoa.id, p_email: novo });
      onFeito();
    } catch (e) {
      setErro(mensagemDe(e)); // "já existe uma conta com este e-mail" vem pronta do banco
    }
  }

  return (
    <Dialogo titulo="Alterar e-mail da conta" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Salvar', executar: salva }}>
      <label>E-mail
        <input className="in" type="text" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <p className="hint">Troca só o e-mail cadastrado. O acesso pelo Google continua ligado à conta Google da pessoa.</p>
    </Dialogo>
  );
}

// ---------- perfil ----------
export function EditarPerfil({ pessoa, onFechar, onFeito }: Feito & { pessoa: Pessoa & { perfil: NonNullable<Pessoa['perfil']> } }) {
  const { api } = useAdmin();
  const inicial = camposDoPerfil(pessoa.perfil);
  const [c, setC] = useState({
    nome: inicial.nome ?? '', nascimento: inicial.nascimento ?? '', genero: inicial.genero ?? '', raca: inicial.raca ?? '',
    telefone: formataTelefone(inicial.telefone ?? ''), atua: inicial.atua ?? '', tempo: inicial.tempo ?? '',
  });
  const [erro, setErro] = useState('');
  const muda = (campo: keyof typeof c, valor: string) => setC((x) => ({ ...x, [campo]: valor }));

  async function salva() {
    const r = validaPerfil({ ...c, consentimento: true, sensiveis: true });
    if (!r.ok) { setErro(r.erro); return; }
    setErro('');
    try {
      const res = await api.rpc<{ ok: boolean; erro?: string } | null>('admin_usuario_perfil_salvar', argumentosPerfil(pessoa.id, r.dados));
      if (res?.ok) { onFeito(); return; }
      setErro(mensagemPerfil(res?.erro));
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  return (
    <Dialogo titulo="Editar perfil" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Salvar', executar: salva }}>
      <label>Nome completo
        <input className="in" type="text" autoComplete="off" value={c.nome} onChange={(e) => muda('nome', e.target.value)} />
      </label>
      <label>Nascimento
        <input className="in" type="date" min="1900-01-01" value={c.nascimento} onChange={(e) => muda('nascimento', e.target.value)} />
      </label>
      <label>Gênero
        <select className="in" value={c.genero} onChange={(e) => muda('genero', e.target.value)}>
          {GENEROS.map((o) => <option key={o.chave} value={o.chave}>{o.rotulo}</option>)}
        </select>
      </label>
      <label>Raça
        <select className="in" value={c.raca} onChange={(e) => muda('raca', e.target.value)}>
          {RACAS.map((o) => <option key={o.chave} value={o.chave}>{o.rotulo}</option>)}
        </select>
      </label>
      <label>Telefone
        <input className="in" type="text" inputMode="tel" autoComplete="off" value={c.telefone}
          onChange={(e) => muda('telefone', formataTelefone(soDigitosTelefone(e.target.value)))} />
      </label>
      <label>Atua na política
        <select className="in" value={c.atua} onChange={(e) => muda('atua', e.target.value)}>
          <option value="sim">Sim</option>
          <option value="nao">Não</option>
        </select>
      </label>
      {c.atua === 'sim' && (
        <label>Tempo de atuação
          <select className="in" value={c.tempo} onChange={(e) => muda('tempo', e.target.value)}>
            {!TEMPOS.some((t) => t.chave === c.tempo) && <option value="">Escolha</option>}
            {TEMPOS.map((o) => <option key={o.chave} value={o.chave}>{o.rotulo}</option>)}
          </select>
        </label>
      )}
      <p className="hint">Dados pessoais e sensíveis. A alteração fica registrada na auditoria, sem os valores.</p>
    </Dialogo>
  );
}

// ---------- mandatos ----------
export function AdicionarAoMandato({ pessoa, onFechar, onFeito }: Feito & { pessoa: Pessoa }) {
  const { api } = useAdmin();
  const [opcoes, setOpcoes] = useState<OpcaoMandato[] | null>(null);
  const [mandato, setMandato] = useState('');
  const [papel, setPapel] = useState<string>('assessoria');
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    lerTudo<OpcaoMandato>(api, 'v_admin_mandatos?select=id,nome_parlamentar,arquivado_em&order=nome_parlamentar,id')
      .then((todos) => { if (vivo) setOpcoes(mandatosDisponiveis(todos, pessoa.mandatos)); })
      .catch((e) => { if (vivo) { setErro(mensagemDe(e)); setOpcoes([]); } });
    return () => { vivo = false; };
  }, [api, pessoa.mandatos]);

  async function adiciona() {
    if (!mandato) { setErro('Escolha o mandato.'); return; }
    setErro('');
    try {
      await api.rpc('admin_membro_adicionar', { p_mandato: mandato, p_user: pessoa.id, p_papel: papel });
      onFeito();
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  return (
    <Dialogo titulo="Adicionar a um mandato" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Adicionar', executar: adiciona, desabilitado: opcoes === null }}>
      <label>Mandato
        <select className="in" value={mandato} onChange={(e) => setMandato(e.target.value)} disabled={opcoes === null}>
          <option value="">{opcoes === null ? 'Carregando…' : 'Escolha'}</option>
          {(opcoes ?? []).map((m) => (
            <option key={m.id} value={m.id}>{m.nome_parlamentar ?? 'Sem nome'}{m.arquivado_em ? ' (arquivado)' : ''}</option>
          ))}
        </select>
      </label>
      <label>Papel no mandato
        <select className="in" value={papel} onChange={(e) => setPapel(e.target.value)}>
          {PAPEIS_MANDATO.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
    </Dialogo>
  );
}

export function RemoverDoMandato({ pessoa, mandato, onFechar, onFeito }: Feito & { pessoa: Pessoa; mandato: Pessoa['mandatos'][number] }) {
  const { api } = useAdmin();
  const [erro, setErro] = useState('');

  async function remove() {
    setErro('');
    try {
      await api.rpc('admin_membro_remover', { p_mandato: mandato.id, p_user: pessoa.id });
      onFeito();
    } catch (e) {
      setErro(mensagemDe(e)); // inclui "O mandato precisa de ao menos uma pessoa na coordenação."
    }
  }

  return (
    <Dialogo titulo="Remover do mandato" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Remover', executar: remove, perigo: true }}>
      <p className="hint"><b>{pessoa.nome ?? pessoa.email}</b> deixa de acessar o mandato <b>{mandato.nome ?? 'sem nome'}</b>. A conta e o que a pessoa escreveu continuam.</p>
    </Dialogo>
  );
}

// ---------- equipe Legisla ----------
export function IncluirNaEquipe({ pessoa, onFechar, onFeito }: Feito & { pessoa: Pessoa }) {
  const { api } = useAdmin();
  const [papel, setPapel] = useState('leitura');
  const [erro, setErro] = useState('');

  async function inclui() {
    setErro('');
    try {
      await api.rpc('admin_equipe_incluir', { p_user: pessoa.id, p_papel: papel });
      onFeito();
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  return (
    <Dialogo titulo="Incluir na equipe Legisla" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Incluir', executar: inclui }}>
      <p className="hint"><b>{pessoa.nome ?? pessoa.email}</b> passa a acessar o painel e a ver todos os mandatos.</p>
      <label>Papel
        <select className="in" value={papel} onChange={(e) => setPapel(e.target.value)}>
          <option value="leitura">leitura</option>
          <option value="admin">admin</option>
        </select>
      </label>
    </Dialogo>
  );
}

export function RemoverDaEquipe({ pessoa, onFechar, onFeito }: Feito & { pessoa: Pessoa }) {
  const { api } = useAdmin();
  const [erro, setErro] = useState('');

  async function remove() {
    setErro('');
    try {
      await api.rpc('admin_equipe_remover', { p_user: pessoa.id });
      onFeito();
    } catch (e) {
      setErro(mensagemDe(e)); // "A equipe precisa ter ao menos um admin."
    }
  }

  return (
    <Dialogo titulo="Remover da equipe Legisla" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Remover', executar: remove, perigo: true }}>
      <p className="hint"><b>{pessoa.nome ?? pessoa.email}</b> perde o acesso ao painel. A conta na plataforma continua.</p>
    </Dialogo>
  );
}

// ---------- excluir a conta ----------
export function ExcluirConta({ pessoa, onFechar }: { pessoa: Pessoa; onFechar: () => void }) {
  const { api } = useAdmin();
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  async function exclui() {
    setErro('');
    try {
      await api.rpc('admin_usuario_excluir', { p_user: pessoa.id, p_email: texto });
      router.push('/admin/usuarios'); // a conta não existe mais: volta à lista
    } catch (e) {
      setErro(mensagemDe(e)); // inclui "única coordenação de …", "própria conta" e "ao menos um admin"
    }
  }

  return (
    <Dialogo titulo="Excluir conta definitivamente" onFechar={onFechar} erro={erro}
      confirmar={{ rotulo: 'Excluir definitivamente', executar: exclui, perigo: true, desabilitado: !confereEmail(texto, pessoa.email) }}>
      <p className="hint">
        Apaga a conta, o perfil, o consentimento, as sugestões e o acesso a todos os mandatos. Os eventos que a pessoa escreveu ficam,
        como &quot;usuário removido&quot;. Não tem volta.
      </p>
      <label>Digite o e-mail <span className="mono">{pessoa.email ?? ''}</span> para confirmar
        <input className="in mono" type="text" autoComplete="off" autoCapitalize="off" spellCheck={false} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>
    </Dialogo>
  );
}
