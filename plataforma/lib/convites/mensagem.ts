export interface DadosMensagem {
  parlamentar: string;
  convidadoPor: string;
  link: string;
  /** Dias de validade; o banco fixa 7. */
  validade?: number;
}

export function mensagemConvite({ parlamentar, convidadoPor, link, validade = 7 }: DadosMensagem): string {
  return [
    `Olá! ${convidadoPor} convidou você para a equipe do mandato de ${parlamentar} no Projeto 100 dias.`,
    '',
    'Entre por este link:',
    link,
    '',
    `O link é pessoal e vale por ${validade} dias.`,
  ].join('\n');
}

export function urlWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
