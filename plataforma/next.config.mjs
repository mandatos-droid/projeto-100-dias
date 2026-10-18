/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false, // o selo do Next no canto inferior esquerdo cobria o botão Sair da barra lateral
  reactStrictMode: false, // o Guia original manipula o DOM direto; o modo estrito montaria tudo duas vezes
  async rewrites() {
    return [{ source: '/painel', destination: '/painel.html' }];
  },
};
export default nextConfig;
