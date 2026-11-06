'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { mensagemDe } from '../../../lib/admin/mensagens.ts';
import Dialogo from './Dialogo.tsx';
import { useAdmin } from './Sessao.tsx';

interface Props {
  mandato: { id: string; codigo: string; arquivado_em: string | null };
  onArquivoMudou: () => void; // a tela recarrega o cadastro depois de arquivar ou desarquivar
}

function ExcluirMandato({ mandato, onFechar }: { mandato: Props['mandato']; onFechar: () => void }) {
  const { api } = useAdmin();
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  async function excluir() {
    setErro('');
    try {
      await api.rpc('admin_mandato_excluir', { p_id: mandato.id, p_codigo: texto });
      router.push('/admin'); // o mandato não existe mais: volta à lista
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }

  return (
    <Dialogo
      titulo="Excluir mandato definitivamente"
      onFechar={onFechar}
      erro={erro}
      confirmar={{ rotulo: 'Excluir definitivamente', executar: excluir, perigo: true, desabilitado: texto !== mandato.codigo }} // comparação exata, com maiúsculas
    >
      <p className="hint">Apaga o mandato, os membros e os eventos. Não tem volta. As sugestões enviadas ficam, sem o mandato.</p>
      <label>Digite o código <span className="mono">{mandato.codigo}</span> para confirmar
        <input className="in mono" type="text" autoComplete="off" autoCapitalize="off" spellCheck={false} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>
    </Dialogo>
  );
}

// Arquivar (reversível) e excluir (irreversível). Só o admin vê; leitura não recebe nem os botões.
export default function ZonaRisco({ mandato, onArquivoMudou }: Props) {
  const { api, papel } = useAdmin();
  const [excluindo, setExcluindo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  const emCurso = useRef(false); // trava síncrona contra duplo clique
  const arquivado = mandato.arquivado_em !== null;

  if (papel !== 'admin') return null;

  async function arquiva() {
    if (emCurso.current) return;
    emCurso.current = true;
    setEnviando(true);
    setAviso('');
    try {
      await api.rpc('admin_mandato_arquivar', { p_id: mandato.id, p_arquivar: !arquivado });
      onArquivoMudou();
    } catch (e) {
      setAviso(mensagemDe(e));
    } finally {
      emCurso.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="card danger">
      <h3>Zona de risco</h3>
      {aviso && <div className="aviso" role="alert">{aviso}</div>}
      <div className="bar">
        <button type="button" className="btn sm" disabled={enviando} onClick={arquiva}>{arquivado ? 'Desarquivar mandato' : 'Arquivar mandato'}</button>
        <button type="button" className="btn sm bad" onClick={() => setExcluindo(true)}>Excluir definitivamente…</button>
      </div>
      <p className="hint">
        {arquivado
          ? 'Arquivado: fora da lista padrão e do Analytics. Os membros continuam acessando o mandato.'
          : 'Arquivar é reversível: esconde da lista padrão e do Analytics, e os membros continuam acessando.'}
        {' '}Excluir apaga membros e eventos e não tem volta.
      </p>
      {excluindo && <ExcluirMandato mandato={mandato} onFechar={() => setExcluindo(false)} />}
    </div>
  );
}
