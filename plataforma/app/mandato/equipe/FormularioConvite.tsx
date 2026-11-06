'use client';

import { useState } from 'react';
import { criaConvite } from '../../../lib/convites/api.ts';
import { mensagemDe } from '../../../lib/convites/erros.ts';
import { montaLink } from '../../../lib/convites/link.ts';
import { mensagemConvite, urlWhatsApp } from '../../../lib/convites/mensagem.ts';
import { papeisPermitidos, rotuloPapel, type Papel } from '../../../lib/convites/papeis.ts';
import { validaConvite } from '../../../lib/convites/validacao.ts';
import { useMandato } from '../contexto.ts';

// Link e mensagem só existem aqui, na memória desta tela: o banco só devolve o token na criação (ACE-01.3).
interface Pronto { link: string; mensagem: string }

const VALIDADE = 'Vale por 7 dias e só pode ser usado uma vez.';

export default function FormularioConvite({ meuNome, aoCriar }: { meuNome: string | null; aoCriar?: () => void }) {
  const { api, mandato, papel } = useMandato();
  const permitidos = papeisPermitidos(papel);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [papelEscolhido, setPapelEscolhido] = useState<Papel>(permitidos.includes('assessoria') ? 'assessoria' : permitidos[0]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState<Pronto | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function gera(ev: React.FormEvent) {
    ev.preventDefault();
    if (enviando) return;
    setErro(null);
    setCopiado(null);
    const v = validaConvite({ nome, email });
    if (!v.ok) { setErro(v.erro); setPronto(null); return; }
    setEnviando(true);
    try {
      const c = await criaConvite(api, { mandato: mandato.id, nome: v.nome, email: v.email || null, papel: papelEscolhido });
      const link = montaLink(location.origin, c.token);
      const mensagem = mensagemConvite({
        parlamentar: mandato.nome_parlamentar?.trim() || 'este mandato',
        convidadoPor: meuNome || 'Alguém da equipe',
        link,
      });
      setPronto({ link, mensagem });
      setNome('');
      setEmail('');
      aoCriar?.();
    } catch (e) {
      setPronto(null); // nunca deixa à mostra o link de uma tentativa anterior ao lado de um erro
      setErro(mensagemDe(e));
    } finally {
      setEnviando(false);
    }
  }

  async function copia(texto: string, aviso: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(aviso);
    } catch {
      setCopiado('Não foi possível copiar. Selecione o texto e copie.');
    }
  }

  return (
    <form className="md-card md-form" onSubmit={gera} noValidate aria-labelledby="md-form-t">
      <h2 id="md-form-t">Convidar uma pessoa</h2>
      <div className="md-campos">
        <label className="md-campo">
          <span>Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" />
        </label>
        <label className="md-campo">
          <span>E-mail (opcional)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </label>
        <label className="md-campo md-campo--papel">
          <span>Papel</span>
          <select value={papelEscolhido} onChange={(e) => setPapelEscolhido(e.target.value as Papel)}>
            {permitidos.map((p) => <option key={p} value={p}>{rotuloPapel(p)}</option>)}
          </select>
        </label>
      </div>
      {erro && <div className="md-aviso" role="alert">{erro}</div>}
      <div>
        <button type="submit" className="md-bt md-bt--pri" disabled={enviando}>Gerar link de convite</button>
      </div>

      {pronto && (
        <div className="md-pronto">
          <p className="md-rotulo">Link pronto para enviar</p>
          <div className="md-link-pronto" data-testid="link-convite">{pronto.link}</div>
          <div className="md-linha md-linha--botoes">
            <button type="button" className="md-bt md-bt--peq" onClick={() => copia(pronto.link, 'Link copiado.')}>Copiar link</button>
            <button type="button" className="md-bt md-bt--peq" onClick={() => copia(pronto.mensagem, 'Mensagem copiada.')}>Copiar mensagem pronta</button>
            <a className="md-bt md-bt--peq" href={urlWhatsApp(pronto.mensagem)} target="_blank" rel="noopener noreferrer">Abrir no WhatsApp</a>
          </div>
          {copiado && <p className="md-mut" role="status">{copiado}</p>}
          <p className="md-mut">{VALIDADE}</p>
        </div>
      )}
    </form>
  );
}
