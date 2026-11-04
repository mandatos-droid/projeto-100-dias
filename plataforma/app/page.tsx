import type { Metadata } from 'next';
import { Anton, Commissioner } from 'next/font/google';
import './landing.css';
import Animacoes from './_landing/Animacoes';
import ComoFunciona from './_landing/ComoFunciona';
import Depois from './_landing/Depois';
import Equipe from './_landing/Equipe';
import Ferramentas from './_landing/Ferramentas';
import QuemLidera from './_landing/QuemLidera';
import Faq from './_landing/Faq';
import Fechamento from './_landing/Fechamento';
import Hero from './_landing/Hero';
import Missoes from './_landing/Missoes';
import RedirecionaAuth from './_landing/RedirecionaAuth';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
const commissioner = Commissioner({ subsets: ['latin'], variable: '--font-commissioner', display: 'swap' });

export const metadata: Metadata = {
  title: 'Guia dos 100 Dias · Legisla Brasil',
  description: 'Planejamento Legisla Brasil de sobrevivência e estratégia política para alavancar seu mandato desde o começo da legislatura.',
  openGraph: {
    title: 'Guia dos 100 Dias, um presente da Legisla Brasil',
    description: 'Cinco missões para os 100 primeiros dias do mandato, do diagnóstico ao monitoramento.',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function Landing() {
  return (
    <div className={`ld ${anton.variable} ${commissioner.variable}`}>
      <RedirecionaAuth />
      <Animacoes />
      <Hero />
      <ComoFunciona />
      <Missoes />
      <QuemLidera />
      <Equipe />
      <Depois />
      <Ferramentas />
      <Faq />
      <Fechamento />
    </div>
  );
}
