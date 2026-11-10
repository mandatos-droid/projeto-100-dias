// Primeiro acesso: regra do próximo passo e link de convite colado (PAG-02, PAG-04).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proximoPasso } from '../lib/perfil/fluxo.ts';
import type { Situacao } from '../lib/perfil/fluxo.ts';
import { tokenDoLinkColado } from '../lib/perfil/link.ts';

const TOKEN = 'AbCdEfGhIjKlMnOpQrSt_-';
const BASE: Situacao = { temPerfil: true, ehLegisla: false, temMandato: false, veioPorConvite: false, semEquipe: false };
const passo = (s: Partial<Situacao>) => proximoPasso({ ...BASE, ...s });
// todas as combinações de verdadeiro e falso para as chaves pedidas
function combinacoes<K extends keyof Situacao>(chaves: K[]): Pick<Situacao, K>[] {
  return Array.from({ length: 2 ** chaves.length }, (_, n) =>
    Object.fromEntries(chaves.map((k, i) => [k, Boolean(n & (1 << i))])) as Pick<Situacao, K>);
}

// ---------- proximoPasso ----------

test('quem está na equipe Legisla segue, com ou sem perfil, mandato, convite ou marca (PAG-02.16)', () => {
  for (const c of combinacoes(['temPerfil', 'temMandato', 'veioPorConvite', 'semEquipe'])) {
    assert.equal(passo({ ...c, ehLegisla: true }), 'seguir', JSON.stringify(c));
  }
});

test('quem não tem perfil e não é da equipe Legisla vai ao perfil, mesmo com mandato, convite ou marca (PAG-02.1, PAG-02.2)', () => {
  for (const c of combinacoes(['temMandato', 'veioPorConvite', 'semEquipe'])) {
    assert.equal(passo({ ...c, temPerfil: false, ehLegisla: false }), 'perfil', JSON.stringify(c));
  }
});

test('com perfil e mandato, segue sem ver a pergunta (PAG-04.9)', () => {
  assert.equal(passo({ temMandato: true }), 'seguir');
});

test('com perfil e mandato, a marca "Ainda não" não muda nada: segue (PAG-04.9)', () => {
  assert.equal(passo({ temMandato: true, semEquipe: true }), 'seguir');
});

test('com perfil, sem mandato e sem convite, mostra a pergunta (PAG-04.1)', () => {
  assert.equal(passo({}), 'pergunta');
});

test('com perfil, sem mandato, sem convite e com a marca "Ainda não", vai ao cadastro do mandato (PAG-04.6)', () => {
  assert.equal(passo({ semEquipe: true }), 'cadastroMandato');
});

test('com perfil e convite, segue para o aceite sem ver a pergunta, com ou sem a marca (PAG-04.8)', () => {
  assert.equal(passo({ veioPorConvite: true }), 'seguir');
  assert.equal(passo({ veioPorConvite: true, semEquipe: true }), 'seguir');
});

// ---------- tokenDoLinkColado ----------

test('aceita o link inteiro do convite e devolve o token (PAG-04.4)', () => {
  assert.equal(tokenDoLinkColado(`https://plataforma.legislabrasil.org/convite#${TOKEN}`), TOKEN);
  assert.equal(tokenDoLinkColado(`http://localhost:3000/convite#${TOKEN}`), TOKEN);
});

test('aceita o link com espaços ou quebra de linha nas pontas, como sai de uma mensagem copiada (PAG-04.4)', () => {
  assert.equal(tokenDoLinkColado(`  https://plataforma.legislabrasil.org/convite#${TOKEN}\n`), TOKEN);
});

test('aceita só o token (PAG-04.4)', () => {
  assert.equal(tokenDoLinkColado(TOKEN), TOKEN);
  assert.equal(tokenDoLinkColado(` ${TOKEN} `), TOKEN);
});

test('texto qualquer, vazio ou ausente devolve null (PAG-04.5)', () => {
  for (const t of ['', '   ', 'oi, segue o link', 'convite', null, undefined]) assert.equal(tokenDoLinkColado(t), null, String(t));
});

test('link de outra página, mesmo com um token no fragmento, devolve null (PAG-04.5)', () => {
  for (const t of [`https://plataforma.legislabrasil.org/guia#${TOKEN}`, `https://outro.site/#${TOKEN}`, `https://x.org/convites#${TOKEN}`]) {
    assert.equal(tokenDoLinkColado(t), null, t);
  }
});

test('link de convite sem token válido no fragmento devolve null: vazio, curto, longo ou com caractere fora do base64url (PAG-04.5)', () => {
  for (const tk of ['', TOKEN.slice(1), `${TOKEN}x`, `${TOKEN.slice(1)}!`]) {
    assert.equal(tokenDoLinkColado(`https://plataforma.legislabrasil.org/convite#${tk}`), null, tk);
  }
});

test('token fora do fragmento (na query ou no caminho) devolve null (PAG-04.5)', () => {
  for (const t of [`https://plataforma.legislabrasil.org/convite?t=${TOKEN}`, `https://plataforma.legislabrasil.org/convite/${TOKEN}`]) {
    assert.equal(tokenDoLinkColado(t), null, t);
  }
});
