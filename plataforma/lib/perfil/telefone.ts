// Primeiro acesso: máscara do campo de telefone (PAG-02.17). Um único telefone brasileiro, DDD + 8 ou 9 dígitos.

const MAXIMO = 11;

// Descarta tudo que não é dígito e guarda só os 11 primeiros (colar vários números mantém o primeiro).
export function soDigitosTelefone(texto: string): string {
  return (texto ?? '').replace(/\D/g, '').slice(0, MAXIMO);
}

// Mostra os dígitos como (11) 99999-9999 (11 dígitos) ou (11) 9999-9999 (10 dígitos); parcial enquanto digita.
export function formataTelefone(texto: string): string {
  const d = soDigitosTelefone(texto);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = d.length === MAXIMO ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
