import type { Metadata } from 'next';
import { Anton, Commissioner } from 'next/font/google';
import './mandato.css';
import Casca from './Casca.tsx';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
const commissioner = Commissioner({ subsets: ['latin'], variable: '--font-commissioner', display: 'swap' });

export const metadata: Metadata = {
  title: 'Mandato · Guia dos 100 Dias',
};

// Layout da Área do mandato e da Equipe: a sessão e o mandato ativo moram na casca (cliente), que não é refeita ao trocar de tela.
export default function LayoutMandato({ children }: { children: React.ReactNode }) {
  return (
    <div className={`md ${anton.variable} ${commissioner.variable}`}>
      <Casca>{children}</Casca>
    </div>
  );
}
