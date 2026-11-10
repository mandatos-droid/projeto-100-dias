// Para onde vai quem acabou de entrar (PAG-02, PAG-04): a mesma regra para /primeiro-acesso, /mandato e /convite.
export interface Situacao {
  temPerfil: boolean;
  ehLegisla: boolean;
  temMandato: boolean;
  veioPorConvite: boolean;
  semEquipe: boolean; // marca legisla.semEquipe: respondeu "Ainda não" nesta sessão
}

export type Passo = 'seguir' | 'perfil' | 'pergunta' | 'cadastroMandato';

export function proximoPasso(s: Situacao): Passo {
  if (s.ehLegisla) return 'seguir'; // equipe Legisla é dispensada (PAG-02.16)
  if (!s.temPerfil) return 'perfil'; // PAG-02.1, 02.2
  if (s.temMandato || s.veioPorConvite) return 'seguir'; // sem a pergunta (PAG-04.8, 04.9)
  return s.semEquipe ? 'cadastroMandato' : 'pergunta'; // PAG-04.1, 04.6
}
