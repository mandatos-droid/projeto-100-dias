'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { carregaEleitos, carregaPleitos } from '@/lib/dados';
import { busca, historico, normaliza, resumo } from '@/lib/demo';
import type { Eleito } from '@/lib/types';
import BuscaEleito from './BuscaEleito';
import CartaoEleito, { type EstadoPleitos } from './CartaoEleito';

/** Demonstração: busca um eleito de 2026 nos dados do TSE e mostra votos, posição, partido e histórico. */
export default function Demo() {
  const [base, setBase] = useState<{ estado: 'carregando' | 'ok' | 'erro'; lista: Eleito[] }>({ estado: 'carregando', lista: [] });
  const [valor, setValor] = useState('');
  const [escolhido, setEscolhido] = useState<Eleito | null>(null);
  const [pleitos, setPleitos] = useState<EstadoPleitos>({ estado: 'carregando', linhas: [] });
  const ultimo = useRef('');

  useEffect(() => {
    carregaEleitos().then(
      (lista) => setBase({ estado: 'ok', lista }),
      () => setBase({ estado: 'erro', lista: [] }),
    );
  }, []);

  const mostraCartao = !!escolhido && valor === escolhido.u;
  const sugestoes = useMemo(() => (mostraCartao ? [] : busca(base.lista, valor)), [base.lista, valor, mostraCartao]);
  const semResultado = base.estado === 'ok' && !mostraCartao && normaliza(valor).length >= 2 && sugestoes.length === 0;

  function escolhe(e: Eleito) {
    setValor(e.u);
    setEscolhido(e);
    setPleitos({ estado: 'carregando', linhas: [] });
    ultimo.current = e.s;
    carregaPleitos(e.uf).then(
      (m) => { if (ultimo.current === e.s) setPleitos({ estado: 'ok', linhas: historico(m[e.s]) }); },
      () => { if (ultimo.current === e.s) setPleitos({ estado: 'erro', linhas: [] }); },
    );
  }

  return (
    <div className="ld-demo-box">
      <BuscaEleito valor={valor} sugestoes={sugestoes} onValor={setValor} onEscolhe={escolhe} />

      {base.estado === 'erro' && <p className="ld-msg ld-msg--erro">Não foi possível carregar a base do TSE agora</p>}
      {semResultado && (
        <p className="ld-msg">
          Não encontramos esse nome entre os eleitos de 2026. Confira a grafia ou cadastre-se para trabalhar com qualquer candidatura.
        </p>
      )}
      {mostraCartao && escolhido && (
        <CartaoEleito eleito={escolhido} resumo={resumo(escolhido, base.lista)} pleitos={pleitos} />
      )}
    </div>
  );
}
