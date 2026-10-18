import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guia dos 100 Dias · Legisla Brasil',
  description: 'Plataforma da Legisla Brasil para os 100 primeiros dias de um mandato parlamentar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="/legacy/legacy.css" />
        <link rel="stylesheet" href="/legacy/ilhas.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
