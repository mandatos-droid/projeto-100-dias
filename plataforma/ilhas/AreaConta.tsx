'use client';
import '@/app/mandato/mandato.css';
import { useEffect, useState } from 'react';
import ProvedorLegado from '@/app/mandato/ProvedorLegado';
import { useMandato } from '@/app/mandato/contexto';
import { CORRIGIR, consultaPerfil, linhasDaConta, type LinhaConta, type Perfil } from '@/lib/mandato/conta';
import { ERRO_CARREGAR } from '@/lib/mandato/legado';

/* Aba Minha conta da Área do mandato (#/config/conta): o e-mail da conta e o perfil da própria pessoa, em texto, sem
   campo editável (AMA-02.8). Quem não tem perfil (equipe Legisla) vê só o e-mail (AMA-02.9). A leitura pede só a linha
   da própria pessoa em `perfis`; se falhar, a aba mostra o erro com "Tentar de novo" (AMA-02.10). */

type Estado = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronto'; linhas: LinhaConta[]; temPerfil: boolean };

function Conta() {
  const { api, usuario } = useMandato();
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    setEstado({ tipo: 'carregando' });
    api.ler<Perfil[] | null>(consultaPerfil(usuario.id)).then(
      (l) => { if (vivo) { const p = l?.[0] ?? null; setEstado({ tipo: 'pronto', linhas: linhasDaConta(usuario.email, p), temPerfil: !!p }); } },
      () => { if (vivo) setEstado({ tipo: 'erro' }); },
    );
    return () => { vivo = false; };
  }, [api, usuario.id, usuario.email, tentativa]);

  if (estado.tipo === 'carregando') return <p className="md-mut" role="status">Carregando…</p>;
  if (estado.tipo === 'erro') {
    return (
      <div className="md-pilha">
        <div className="md-aviso" role="alert">{ERRO_CARREGAR}</div>
        <div><button type="button" className="md-bt" onClick={() => setTentativa((n) => n + 1)}>Tentar de novo</button></div>
      </div>
    );
  }
  const [antes, contato] = CORRIGIR.split('contato@legislabrasil.org');
  return (
    <section className="md-card md-pilha" aria-label="Seus dados">
      <dl style={{ margin: 0, display: 'grid', gap: 12 }}>
        {estado.linhas.map((l) => (
          <div key={l.rotulo}>
            <dt className="md-rotulo">{l.rotulo}</dt>
            <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{l.valor}</dd>
          </div>
        ))}
      </dl>
      {estado.temPerfil && <p className="md-mut">{antes}<a href="mailto:contato@legislabrasil.org">contato@legislabrasil.org</a>{contato}</p>}
    </section>
  );
}

export default function AreaConta() {
  // .md traz as cores e a tipografia de mandato.css; dentro do Guia não ocupa a tela inteira nem pinta o fundo
  return (
    <div className="md" style={{ minHeight: 0, background: 'transparent' }}>
      <ProvedorLegado><Conta /></ProvedorLegado>
    </div>
  );
}
