import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guia dos 100 Dias · Legisla Brasil',
  description: 'Plataforma da Legisla Brasil para os 100 primeiros dias de um mandato parlamentar.',
};

// O Guia legado depende destes dois CSS globais; só esta rota os carrega.
export default function GuiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/legacy/legacy.css" />
      <link rel="stylesheet" href="/legacy/ilhas.css" />
      {children}
    </>
  );
}
