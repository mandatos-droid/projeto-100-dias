import type { Metadata } from 'next';
import { Anton, Commissioner } from 'next/font/google';
import '../convite/convite.css';
import './primeiro-acesso.css';
import PrimeiroAcesso from './PrimeiroAcesso.tsx';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
const commissioner = Commissioner({ subsets: ['latin'], variable: '--font-commissioner', display: 'swap' });

export const metadata: Metadata = {
  title: 'Primeiro acesso · Guia dos 100 Dias',
};

// A sessão do Google chega no fragmento e o parâmetro `volta` na query: a página inteira roda no cliente.
export default function PaginaPrimeiroAcesso() {
  return (
    <div className={`cv pa ${anton.variable} ${commissioner.variable}`}>
      <header className="cv-barra"><b>100 Dias</b><span>Primeiro acesso</span></header>
      <main className="cv-corpo">
        <PrimeiroAcesso />
      </main>
    </div>
  );
}
