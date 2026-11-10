'use client';

import { useState } from 'react';
import { rotuloPapel } from '../../lib/convites/papeis.ts';
import { iniciais, nomeDoMandato, useMandato, type MandatoDaPessoa } from './contexto.ts';

// Mesmo endereço de fotoUrl() em cadastro.js: o TSE guarda a foto pelo sq da candidatura.
function fotoUrl(sq: string, uf: string | null, ano: unknown): string {
  const pasta = ano === 2024 ? 'ele2024/619' : 'ele2026/6259';
  return `https://resultados.tse.jus.br/oficial/${pasta}/fotos/${String(uf ?? '').toLowerCase()}/${sq}.jpeg`;
}

function fotoDoMandato(m: MandatoDaPessoa): string | null {
  const tse = (m.dados as { tse?: { sq?: unknown; ano?: unknown } } | null)?.tse;
  const sq = tse?.sq;
  return typeof sq === 'string' || typeof sq === 'number' ? fotoUrl(String(sq), m.uf, tse?.ano) : null;
}

// 'YYYY-MM-DD' -> 'DD/MM/AAAA', sem passar por Date (nada de fuso).
function dataBr(iso: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function Foto({ mandato }: { mandato: MandatoDaPessoa }) {
  const url = fotoDoMandato(mandato);
  const [falhou, setFalhou] = useState(false);
  return (
    <div className="md-foto" aria-hidden="true">
      {iniciais(mandato.nome_parlamentar)}
      {url && !falhou && (
        // eslint-disable-next-line @next/next/no-img-element -- foto externa do TSE; some se não carregar e deixa as iniciais
        <img src={url} alt="" width={56} height={56} referrerPolicy="no-referrer" onError={() => setFalhou(true)} />
      )}
    </div>
  );
}

/** Cartão do mandato ativo (aba Visão geral da Área do mandato): foto do TSE (iniciais de reserva), nome, cargo, UF, partido, posse e o papel da pessoa.
    `nivel` é o do título com o nome (2 dentro do Guia, que já tem o h1 da tela); `children` entra no fim do cartão. */
export function CartaoMandato({ nivel = 1, children }: { nivel?: 1 | 2; children?: React.ReactNode }) {
  const { mandato, papel } = useMandato();
  const info = [mandato.cargo, mandato.uf, mandato.partido, mandato.data_posse && `posse em ${dataBr(mandato.data_posse)}`].filter(Boolean).join(' · ');
  const Titulo = nivel === 2 ? 'h2' : 'h1';
  return (
    <section className="md-card md-cartao" aria-label="Dados do mandato">
      <Foto key={mandato.id} mandato={mandato} />
      <div className="md-cresce">
        <p className="md-rotulo">Mandato</p>
        <Titulo>{nomeDoMandato(mandato)}</Titulo>
        <p className="md-mut md-cartao-info">{info}</p>
        <p className="md-mut">Seu papel: <strong data-testid="papel-ativo">{rotuloPapel(papel)}</strong></p>
      </div>
      {children}
    </section>
  );
}
