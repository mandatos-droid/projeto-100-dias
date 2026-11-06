export interface Config { url: string; key: string }

// Mesma expressão de public/painel.html: a URL e a chave pública moram só em nucleo.js, para não duplicar.
export function lerConfig(texto: string): Config {
  const m = texto.match(/prod:\{url:'([^']+)',key:'([^']+)'/);
  if (!m || !m[1] || !m[2]) throw new Error('O banco ainda não está configurado em nucleo.js.');
  return { url: m[1], key: m[2] };
}

export async function carregaConfig(): Promise<Config> {
  const r = await fetch('/legacy/nucleo.js');
  return lerConfig(await r.text());
}
