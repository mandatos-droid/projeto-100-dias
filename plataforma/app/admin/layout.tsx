import type { Metadata } from 'next';
import { Commissioner } from 'next/font/google';
import './admin.css';

const commissioner = Commissioner({ subsets: ['latin'], variable: '--font-commissioner', display: 'swap' });

export const metadata: Metadata = {
  title: 'Admin · Legisla Brasil',
  robots: { index: false, follow: false }, // painel interno da equipe
};

// O app/layout.tsx raiz não carrega CSS: o estilo do painel vive só aqui, escopado sob .adm.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`adm ${commissioner.variable}`}>{children}</div>;
}
