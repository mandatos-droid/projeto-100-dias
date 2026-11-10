// Aba Usuários do /admin: lógica pura (consulta na URL, rótulos e paginação).
// Spec: .specs/features/admin-usuarios/spec.md (USR-01, USR-02, USR-04, Edge Cases) e design.md (Error Handling).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  argumentosLista, CONSULTA_PADRAO, FILTROS_PAPEL, lerConsulta, marcaPessoa, montaConsulta, paginas, rotuloData,
  rotuloMandato, rotulosPerfil, rotuloUltimoAcesso, temFiltro, type Consulta,
} from '../lib/admin/usuarios.ts';
import { GENEROS, RACAS, TEMPOS } from '../lib/perfil/opcoes.ts';

const MANDATO = '00000000-0000-4000-8000-0000000000b1';

// ---------- consulta na URL (USR-04.6, Error Handling) ----------

test('montaConsulta e lerConsulta fazem ida e volta com busca, papel, mandato, "sem perfil" e página (USR-04.6)', () => {
  const c: Consulta = { q: 'José & Cia?=', papel: 'assessoria', mandato: MANDATO, semPerfil: true, pagina: 3 };
  assert.deepEqual(lerConsulta(montaConsulta(c)), c);
  assert.deepEqual(lerConsulta(new URLSearchParams(montaConsulta(c))), c);
});

test('a consulta padrão é sem busca, papel "todos", sem mandato, sem "sem perfil" e página 1, e vira query vazia', () => {
  assert.deepEqual(CONSULTA_PADRAO, { q: '', papel: 'todos', mandato: '', semPerfil: false, pagina: 1 });
  assert.deepEqual(lerConsulta(''), CONSULTA_PADRAO);
  assert.equal(montaConsulta(CONSULTA_PADRAO), '');
});

test('página que não é inteiro positivo vira 1 (Error Handling)', () => {
  for (const pagina of ['0', '-2', 'abc', '1.5', '', '2e3']) {
    assert.equal(lerConsulta(`pagina=${encodeURIComponent(pagina)}`).pagina, 1, pagina);
  }
  assert.equal(lerConsulta('pagina=7').pagina, 7);
});

test('papel desconhecido vira "todos"; os cinco valores da spec são lidos como estão (Error Handling, USR-04.2)', () => {
  assert.equal(lerConsulta('papel=dono').papel, 'todos');
  assert.equal(lerConsulta('papel=ADMIN').papel, 'todos');
  for (const p of ['todos', 'coordenacao', 'assessoria', 'leitura', 'legisla']) assert.equal(lerConsulta(`papel=${p}`).papel, p);
});

test('mandato que não é um id válido fica vazio (Error Handling)', () => {
  assert.equal(lerConsulta('mandato=abc').mandato, '');
  assert.equal(lerConsulta(`mandato=${MANDATO}`).mandato, MANDATO);
});

test('"sem perfil" só vale com sem_perfil=1', () => {
  assert.equal(lerConsulta('sem_perfil=1').semPerfil, true);
  assert.equal(lerConsulta('sem_perfil=0').semPerfil, false);
  assert.equal(lerConsulta('sem_perfil=sim').semPerfil, false);
});

test('busca com mais de 100 caracteres é cortada em 100, na leitura e na montagem (Edge Cases)', () => {
  const longa = 'b'.repeat(150);
  assert.equal(lerConsulta(`q=${longa}`).q, 'b'.repeat(100));
  assert.equal(lerConsulta(montaConsulta({ ...CONSULTA_PADRAO, q: longa })).q, 'b'.repeat(100));
});

test('argumentosLista leva busca, papel, mandato e "sem perfil" juntos, com 25 por página e a posição da página (USR-04.5, USR-04.6, USR-01.9)', () => {
  assert.deepEqual(argumentosLista({ q: 'ana', papel: 'assessoria', mandato: MANDATO, semPerfil: true, pagina: 3 }), {
    p_busca: 'ana', p_papel: 'assessoria', p_mandato: MANDATO, p_sem_perfil: true, p_limite: 25, p_offset: 50,
  });
  assert.deepEqual(argumentosLista(CONSULTA_PADRAO), {
    p_busca: null, p_papel: null, p_mandato: null, p_sem_perfil: false, p_limite: 25, p_offset: 0,
  });
});

test('temFiltro é verdadeiro com busca, papel, mandato ou "sem perfil", e falso só com a página (USR-04.8)', () => {
  assert.equal(temFiltro(CONSULTA_PADRAO), false);
  assert.equal(temFiltro({ ...CONSULTA_PADRAO, pagina: 4 }), false);
  assert.equal(temFiltro({ ...CONSULTA_PADRAO, q: 'a' }), true);
  assert.equal(temFiltro({ ...CONSULTA_PADRAO, papel: 'legisla' }), true);
  assert.equal(temFiltro({ ...CONSULTA_PADRAO, mandato: MANDATO }), true);
  assert.equal(temFiltro({ ...CONSULTA_PADRAO, semPerfil: true }), true);
});

test('o filtro de papel tem Todos, Coordenação, Assessoria, Somente leitura e Equipe Legisla, nessa ordem (USR-04.2)', () => {
  assert.deepEqual(FILTROS_PAPEL.map((f) => f.rotulo), ['Todos', 'Coordenação', 'Assessoria', 'Somente leitura', 'Equipe Legisla']);
  assert.deepEqual(FILTROS_PAPEL.map((f) => f.valor), ['todos', 'coordenacao', 'assessoria', 'leitura', 'legisla']);
});

// ---------- último acesso e datas (USR-01.7) ----------

test('rotuloUltimoAcesso mostra dd/mm/aaaa hh:mm no horário de Brasília (USR-01.7)', () => {
  assert.equal(rotuloUltimoAcesso('2026-11-09T13:45:00Z'), '09/11/2026 10:45');
});

test('rotuloUltimoAcesso usa o dia de Brasília: 02h30 UTC ainda é 23h30 do dia anterior (USR-01.7)', () => {
  assert.equal(rotuloUltimoAcesso('2026-11-10T02:30:00Z'), '09/11/2026 23:30');
});

test('rotuloUltimoAcesso mostra meia-noite como 00:00 (USR-01.7)', () => {
  assert.equal(rotuloUltimoAcesso('2026-11-10T03:00:00Z'), '10/11/2026 00:00');
});

test('rotuloUltimoAcesso mostra "Nunca" sem login registrado (USR-01.7)', () => {
  assert.equal(rotuloUltimoAcesso(null), 'Nunca');
});

test('rotuloData mostra dd/mm/aaaa no dia de Brasília (USR-01.2, USR-02.2)', () => {
  assert.equal(rotuloData('2026-11-10T02:30:00Z'), '09/11/2026');
  assert.equal(rotuloData('2026-01-02T15:00:00Z'), '02/01/2026');
});

// ---------- mandato e marcas da lista (USR-01.2, 01.4, 01.5, Edge Cases) ----------

test('rotuloMandato traz o parlamentar e o papel com os rótulos do painel (USR-01.2)', () => {
  assert.equal(rotuloMandato({ nome: 'Parlamentar Um', papel: 'coordenacao', arquivado: false }), 'Parlamentar Um · Coordenação');
  assert.equal(rotuloMandato({ nome: 'Parlamentar Um', papel: 'assessoria', arquivado: false }), 'Parlamentar Um · Assessoria');
  assert.equal(rotuloMandato({ nome: 'Parlamentar Um', papel: 'leitura', arquivado: false }), 'Parlamentar Um · Somente leitura');
});

test('rotuloMandato acrescenta "(arquivado)" ao mandato arquivado (Edge Cases)', () => {
  assert.equal(rotuloMandato({ nome: 'Parlamentar Dois', papel: 'assessoria', arquivado: true }), 'Parlamentar Dois · Assessoria (arquivado)');
});

test('marcaPessoa devolve "Sem perfil" para quem não tem perfil e não é da equipe (USR-01.4)', () => {
  assert.equal(marcaPessoa({ sem_perfil: true, equipe_papel: null }), 'Sem perfil');
});

test('marcaPessoa devolve o papel na equipe Legisla, admin ou leitura (USR-01.5)', () => {
  assert.equal(marcaPessoa({ sem_perfil: false, equipe_papel: 'admin' }), 'Equipe Legisla · admin');
  assert.equal(marcaPessoa({ sem_perfil: false, equipe_papel: 'leitura' }), 'Equipe Legisla · leitura');
});

test('marcaPessoa não devolve nada para quem tem perfil e não é da equipe (USR-01.4, 01.5)', () => {
  assert.equal(marcaPessoa({ sem_perfil: false, equipe_papel: null }), null);
});

// ---------- perfil do detalhe (USR-02.3) ----------

const PERFIL = { nome: 'Joana Perfil Souza', nascimento: '1987-03-21', genero: 'mulher_trans', raca: 'preta', telefone: '21912345678', atua: true, tempo: '6_10' };

test('rotulosPerfil mostra gênero, raça e tempo de atuação com os rótulos do primeiro acesso, e "Sim" para quem atua (USR-02.3)', () => {
  assert.deepEqual(rotulosPerfil(PERFIL), {
    nome: 'Joana Perfil Souza', nascimento: '21/03/1987', genero: 'Mulher transgênero', raca: 'Preta',
    telefone: '(21) 91234-5678', atua: 'Sim', tempo: '6 a 10 anos',
  });
});

test('rotulosPerfil mostra "Não" e tempo "—" para quem não atua na política (USR-02.3)', () => {
  const r = rotulosPerfil({ ...PERFIL, atua: false, tempo: null });
  assert.equal(r.atua, 'Não');
  assert.equal(r.tempo, '—');
});

test('rotulosPerfil cobre todas as opções de gênero, raça e tempo do primeiro acesso (USR-02.3)', () => {
  for (const o of GENEROS) assert.equal(rotulosPerfil({ ...PERFIL, genero: o.chave }).genero, o.rotulo, o.chave);
  for (const o of RACAS) assert.equal(rotulosPerfil({ ...PERFIL, raca: o.chave }).raca, o.rotulo, o.chave);
  for (const o of TEMPOS) assert.equal(rotulosPerfil({ ...PERFIL, tempo: o.chave }).tempo, o.rotulo, o.chave);
});

test('rotulosPerfil mostra o nascimento em dd/mm/aaaa sem mudar o dia por fuso (USR-02.3)', () => {
  assert.equal(rotulosPerfil({ ...PERFIL, nascimento: '2000-01-01' }).nascimento, '01/01/2000');
  assert.equal(rotulosPerfil({ ...PERFIL, nascimento: '1999-12-31' }).nascimento, '31/12/1999');
});

test('rotulosPerfil formata o telefone com 11 dígitos como (DD) NNNNN-NNNN e com 10 como (DD) NNNN-NNNN (USR-02.3)', () => {
  assert.equal(rotulosPerfil({ ...PERFIL, telefone: '21912345678' }).telefone, '(21) 91234-5678');
  assert.equal(rotulosPerfil({ ...PERFIL, telefone: '1133334444' }).telefone, '(11) 3333-4444');
});

// ---------- paginação (USR-01.9) ----------

test('paginas sem ninguém: intervalo 0–0 e 1 página (USR-01.9)', () => {
  assert.deepEqual(paginas(0, 1), { primeiro: 0, ultimo: 0, paginas: 1, pagina: 1 });
});

test('paginas: 25 pessoas cabem em 1 página; 26 pedem 2, e a segunda mostra só a 26ª (USR-01.9)', () => {
  assert.deepEqual(paginas(25, 1), { primeiro: 1, ultimo: 25, paginas: 1, pagina: 1 });
  assert.deepEqual(paginas(26, 1), { primeiro: 1, ultimo: 25, paginas: 2, pagina: 1 });
  assert.deepEqual(paginas(26, 2), { primeiro: 26, ultimo: 26, paginas: 2, pagina: 2 });
});

test('paginas: 60 pessoas dão 3 páginas, 26–50 na segunda e 51–60 na terceira (USR-01.9)', () => {
  assert.deepEqual(paginas(60, 2), { primeiro: 26, ultimo: 50, paginas: 3, pagina: 2 });
  assert.deepEqual(paginas(60, 3), { primeiro: 51, ultimo: 60, paginas: 3, pagina: 3 });
});

test('paginas: página além da última vai à última; abaixo de 1 vai à primeira (Error Handling)', () => {
  assert.deepEqual(paginas(60, 9), { primeiro: 51, ultimo: 60, paginas: 3, pagina: 3 });
  assert.deepEqual(paginas(60, 0), { primeiro: 1, ultimo: 25, paginas: 3, pagina: 1 });
});
