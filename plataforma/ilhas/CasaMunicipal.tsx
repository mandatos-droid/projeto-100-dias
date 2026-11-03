'use client';
/* Cartão do município na Conjuntura: quem é o prefeito (2024) e como está a Câmara Municipal (hemiciclo dos vereadores). */
import { useMemo, useState } from 'react';
import { nf, pct } from '@/lib/format';
import type { Mun, RegExec } from '@/lib/types';
import { BarrasPartido, Chip, Foto, Hemiciclo, type Membro } from './pecas';

const soma = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

export function CasaMunicipal({ id, uf, mun, exec, partido }: { id: string; uf: string; mun: Mun; exec?: RegExec; partido: string }) {
  const [sel, setSel] = useState<string | null>(null);
  const [destaca, setDestaca] = useState(true);
  const ver = mun.m24?.ver;
  const eleito = mun.m24?.pref.cands.find((q) => q[4]);
  const membros = useMemo<Membro[]>(
    () => (ver?.eleitos ?? []).map((e, i) => ({ key: `${id}.${i}`, nome: e[0], partido: e[1], votos: e[2] })),
    [ver, id]);
  const vis = useMemo(() => new Set(membros.filter((m) => m.partido === partido).map((m) => m.key)), [membros, partido]);
  const escolhido = membros.find((m) => m.key === sel);
  const sqDe = (m: Membro) => ver?.eleitos[Number(m.key.split('.')[1])]?.[3] ?? '';

  const pref = exec ?? (eleito ? { n: eleito[0], p: eleito[1], c: [] as string[] } : undefined);
  const el = ver?.el ?? {};
  const total = soma(el), maioria = Math.floor(total / 2) + 1;
  const meus = el[partido] ?? 0;
  const base = pref ? Object.entries(el).filter(([p]) => p === pref.p || pref.c.includes(p)).reduce((s, [, n]) => s + n, 0) : 0;
  const votosPref = eleito && mun.m24?.pref.v ? (eleito[2] / mun.m24.pref.v) * 100 : null;

  return (
    <div className="casa-mun">
      <section aria-label="Prefeito">
        <h5>Prefeitura · eleição de 2024</h5>
        {pref ? (
          <div className="casa-pref">
            {eleito ? <Foto sq={eleito[3]} uf={uf} ano={2024} nome={pref.n} tam={44} /> : null}
            <div>
              <strong>{pref.n}</strong>
              <div><Chip p={pref.p} />
                {pref.p === partido ? <span className="casa-sel"> é do {partido}</span>
                  : pref.c.includes(partido) ? <span className="casa-sel"> {partido} estava na coligação</span> : null}</div>
              <p className="peq-t">
                {votosPref !== null ? `${pct(votosPref, 1)} dos votos válidos` : ''}
                {pref.c.length > 0 ? `${votosPref !== null ? ' · ' : ''}coligação: ${pref.c.join(', ')}` : ''}
              </p>
            </div>
          </div>
        ) : <p className="sem">Sem prefeito registrado no arquivo do TSE.</p>}
      </section>

      <section aria-label="Câmara Municipal">
        <h5>Câmara Municipal · vereadores eleitos em 2024</h5>
        {total > 0 ? (
          <>
            <Hemiciclo membros={membros} partidos={new Set()} filtroStatus="todos" visivel={destaca && meus > 0 ? vis : undefined}
              selecionado={sel} onSelecionar={(k) => setSel(k === sel ? null : k)} />
            {escolhido ? (
              <div className="casa-ver">
                <Foto sq={sqDe(escolhido)} uf={uf} ano={2024} nome={escolhido.nome} tam={32} />
                <span><strong>{escolhido.nome}</strong> <Chip p={escolhido.partido} /> · {nf.format(escolhido.votos)} votos</span>
              </div>
            ) : <p className="peq-t">Clique numa cadeira para ver o vereador.</p>}
            <p className="casa-resumo">
              <strong>{partido}: {meus} de {total} cadeiras</strong>{' '}
              {meus >= maioria ? '(maioria)' : `(faltam ${maioria - meus} para a maioria de ${maioria})`}
              {pref && pref.c.length > 0 && pref.p !== partido ? <><br />Base do prefeito pela coligação: {base} de {total}.</> : null}
              {pref && pref.p === partido ? <><br />Coligação do prefeito: {base} de {total}.</> : null}
            </p>
            {meus > 0 && (
              <button type="button" className="chip" aria-pressed={destaca} onClick={() => setDestaca(!destaca)}>
                {destaca ? `Mostrando só o ${partido}` : `Destacar o ${partido}`}
              </button>
            )}
            <BarrasPartido destaque={partido} dados={Object.entries(el).slice(0, 8)} />
          </>
        ) : <p className="sem">Sem vereadores registrados.</p>}
      </section>
    </div>
  );
}
