import type { Metadata } from 'next';
import { Anton, Commissioner } from 'next/font/google';
import './landing.css';
import Animacoes from './_landing/Animacoes';
import Confianca from './_landing/Confianca';
import Demo from './_landing/Demo';
import Faq from './_landing/Faq';
import Fechamento from './_landing/Fechamento';
import Funcionalidades from './_landing/Funcionalidades';
import Hero from './_landing/Hero';
import Missoes from './_landing/Missoes';
import RedirecionaAuth from './_landing/RedirecionaAuth';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
const commissioner = Commissioner({ subsets: ['latin'], variable: '--font-commissioner', display: 'swap' });

export const metadata: Metadata = {
  title: 'Guia dos 100 Dias: o mapa do seu mandato · Legisla Brasil',
  description: 'Chegue ao mandato com mapa, equipe e plano. Veja seu desempenho eleitoral com dados do TSE e comece a Missão 1, de graça.',
  openGraph: {
    title: 'Os primeiros 100 dias moldam o resto do mandato',
    description: 'O Guia dos 100 Dias da Legisla Brasil já vem com os dados do TSE preenchidos. Comece seu Mapa Político.',
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

      <section className="ld-sec ld-sec--branco" id="demonstracao" aria-labelledby="ld-demo-t">
        <div className="ld-wrap">
          <p className="ld-eyebrow">Veja funcionando</p>
          <h2 className="ld-h2" id="ld-demo-t">Comece pelo seu desempenho nas urnas</h2>
          <p className="ld-lead">Busque um parlamentar eleito em 2026 e veja votos, posição na Casa, cadeiras do partido e as eleições anteriores. É o primeiro passo do Mapa Político.</p>
          <Demo />
          <p className="ld-pos-demo">
            <a className="ld-bt" href="/guia">Começar meu Mapa Político</a>
          </p>
        </div>
      </section>

      <Missoes />
      <Funcionalidades />
      <Confianca />
      <Faq />
      <Fechamento />
    </div>
  );
}
