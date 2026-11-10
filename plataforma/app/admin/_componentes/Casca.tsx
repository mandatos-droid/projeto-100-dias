'use client';

import Link from 'next/link';
import { useAdmin } from './Sessao.tsx';

export type Tela = 'equipe' | 'mandatos' | 'usuarios' | 'analytics' | 'logs';

const MENU: { tela: Tela; href: string; rotulo: string }[] = [
  { tela: 'equipe', href: '/admin/equipe', rotulo: 'Equipe' },
  { tela: 'mandatos', href: '/admin', rotulo: 'Mandatos' },
  { tela: 'usuarios', href: '/admin/usuarios', rotulo: 'Usuários' },
  { tela: 'analytics', href: '/admin/analytics', rotulo: 'Analytics' },
  { tela: 'logs', href: '/admin/logs', rotulo: 'Logs' },
];

// Casca das telas: menu, nome e papel de quem está logado, Sair. Precisa estar dentro de <Sessao>.
export default function Casca({ tela, titulo, children }: { tela: Tela; titulo: React.ReactNode; children: React.ReactNode }) {
  const { nome, papel, sair } = useAdmin();
  return (
    <div className="app">
      <nav className="side" aria-label="Menu do painel">
        <div className="logo">Legisla Brasil<small>Painel do administrador</small></div>
        {MENU.map((m) => (
          <Link key={m.tela} href={m.href} className={`nav${m.tela === tela ? ' on' : ''}`} aria-current={m.tela === tela ? 'page' : undefined}>
            {m.rotulo}
          </Link>
        ))}
        {/* /painel é um rewrite para HTML estático: link comum, sem o roteador do Next */}
        <a href="/painel" className="nav">Painel de métricas</a>
        {/* /guia também é servido como HTML estático: link comum */}
        <a href="/guia" className="nav sep">← Voltar para a plataforma</a>
      </nav>
      <div className="main">
        <div className="top">
          <h2>{titulo}</h2>
          <div className="who">
            <span>{nome} · <b>{papel}</b></span>
            <button type="button" className="btn sm" onClick={sair}>Sair</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
