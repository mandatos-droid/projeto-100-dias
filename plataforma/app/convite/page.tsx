import type { Metadata } from 'next';
import { Anton, Commissioner } from 'next/font/google';
import './convite.css';
import Convite from './Convite.tsx';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
const commissioner = Commissioner({ subsets: ['latin'], variable: '--font-commissioner', display: 'swap' });

export const metadata: Metadata = {
  title: 'Convite · Guia dos 100 Dias',
};

// O token chega no fragmento (/convite#<token>), que só o navegador lê: a página inteira roda no cliente.
export default function PaginaConvite() {
  return (
    <div className={`cv ${anton.variable} ${commissioner.variable}`}>
      <header className="cv-barra"><b>100 Dias</b><span>Convite</span></header>
      <main className="cv-corpo">
        <Convite />
      </main>
    </div>
  );
}
