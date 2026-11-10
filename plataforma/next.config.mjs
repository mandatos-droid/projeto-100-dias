/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false, // o selo do Next no canto inferior esquerdo cobria o botão Sair da barra lateral
  reactStrictMode: false, // o Guia original manipula o DOM direto; o modo estrito montaria tudo duas vezes
  outputFileTracingIncludes: { '/api/votos-mun': ['./public/data/cdmun.json'] }, // a rota lê o arquivo por fs; sem isto ele não vai no bundle da função
  async rewrites() {
    return [{ source: '/painel', destination: '/painel.html' }];
  },
  // A Área do mandato é a tela #/config do Guia: os endereços antigos continuam valendo (AMA-03.1, 03.2).
  async redirects() {
    return [
      { source: '/mandato', destination: '/guia#/config', permanent: true },
      { source: '/mandato/equipe', destination: '/guia#/config/equipe', permanent: true },
    ];
  },
  // O token do convite vai no fragmento (/convite#<token>); a página também não manda o endereço como Referer nem é indexada.
  async headers() {
    return [{
      source: '/convite',
      headers: [
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Robots-Tag', value: 'noindex' },
      ],
    }];
  },
};
export default nextConfig;
