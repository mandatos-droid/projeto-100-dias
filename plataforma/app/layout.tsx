import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guia dos 100 Dias · Legisla Brasil',
  description: 'Plataforma da Legisla Brasil para os 100 primeiros dias de um mandato parlamentar.',
};

// O CSS do Guia legado fica no layout de /guia; a landing tem o próprio estilo.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
