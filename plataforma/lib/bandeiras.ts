/* Taxonomia única das bandeiras do mandato (Missão 3 · "Selecionando as bandeiras") com id estável.
   Os rótulos são idênticos aos do mural da Missão 3 (public/legacy/novos.js), para que a mesma escolha
   valha nas duas missões. `agenda` aponta para a agenda do IDSC-BR em lib/agendas.ts, quando existe. */

export type Bandeira = { id: string; rot: string; agenda?: string };

export const BANDEIRAS: Bandeira[] = [
  { id: 'seguranca', rot: 'Segurança pública', agenda: 'seguranca' },
  { id: 'educacao', rot: 'Educação', agenda: 'educacao' },
  { id: 'agricultura', rot: 'Agricultura', agenda: 'campo' },
  { id: 'saude', rot: 'Saúde', agenda: 'saude' },
  { id: 'direitos-humanos', rot: 'Direitos humanos' },
  { id: 'desenvolvimento-economico', rot: 'Desenvolvimento econômico', agenda: 'trabalho' },
  { id: 'cultura', rot: 'Cultura', agenda: 'cultura' },
  { id: 'clima', rot: 'Clima e meio ambiente', agenda: 'meio-ambiente' },
  { id: 'mulheres', rot: 'Mulheres', agenda: 'mulheres' },
  { id: 'equidade-racial', rot: 'Equidade racial', agenda: 'raca' },
  { id: 'trabalho', rot: 'Trabalho e emprego', agenda: 'trabalho' },
  { id: 'modernizacao', rot: 'Modernização do Estado' },
  { id: 'industria', rot: 'Indústria, comércio e empreendedorismo', agenda: 'trabalho' },
  { id: 'esportes', rot: 'Esportes', agenda: 'cultura' },
  { id: 'ciencia', rot: 'Ciência, tecnologia e inovação' },
  { id: 'lazer', rot: 'Lazer', agenda: 'cultura' },
  { id: 'mineracao', rot: 'Mineração' },
  { id: 'assistencia', rot: 'Assistência social', agenda: 'assistencia' },
  { id: 'lgbtqiap', rot: 'População LGBTQIAP+' },
];

/** A Missão 3 recomenda até 3 agendas para o mandato se especializar. */
export const MAX_BANDEIRAS = 3;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const porId = new Map(BANDEIRAS.map((b) => [b.id, b]));
const porRot = new Map(BANDEIRAS.map((b) => [norm(b.rot), b]));

export const bandeiraDe = (id: string) => porId.get(id);
/** Texto livre da Missão 3 (m3.b1..b3, m3.mural) → bandeira da taxonomia; undefined se não reconhecer. */
export const bandeiraDoRotulo = (rot: string) => porRot.get(norm(rot));
