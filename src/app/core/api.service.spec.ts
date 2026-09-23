import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from './api.service';

/**
 * Este arquivo existe por um motivo só: o Apps Script não responde OPTIONS.
 * Se o POST deixar de ser uma "simple request" do Fetch Spec, o browser manda
 * um preflight, o Apps Script devolve erro e TODO o salvamento do site morre —
 * com o GET ainda funcionando, então a página parece saudável.
 *
 * O teste afirma a PROPRIEDADE (a requisição é simple), não a forma do código.
 * Assim ele sobrevive a refactor e pega tanto fetch cru com header errado
 * quanto uma troca por HttpClient.
 */

// https://fetch.spec.whatwg.org/#cors-safelisted-request-header
const CT_SAFELIST = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
const HEADERS_SAFELIST = ['accept', 'accept-language', 'content-language', 'content-type', 'range'];

/** Motivo pelo qual a requisição dispararia OPTIONS, ou null se não dispara. */
function motivoDoPreflight(req: Request): string | null {
  const extras = [...req.headers.keys()].filter((h) => !HEADERS_SAFELIST.includes(h.toLowerCase()));
  if (extras.length) return `header não-safelisted: ${extras.join(', ')}`;
  const ct = (req.headers.get('content-type') ?? 'text/plain').split(';')[0].trim().toLowerCase();
  return CT_SAFELIST.includes(ct) ? null : `Content-Type ${ct}`;
}

function espiaFetch(resposta: unknown = { ok: true }) {
  const chamadas: Request[] = [];
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    // base fictícia: API ainda é o placeholder, que não é URL absoluta. O que
    // interessa aqui são os headers e o corpo, não o destino.
    const url = new URL(String(input), 'http://apps-script.test/exec');
    chamadas.push(new Request(url, init));
    return Promise.resolve(new Response(JSON.stringify(resposta)));
  });
  return chamadas;
}

afterEach(() => vi.unstubAllGlobals());

describe('ApiService — invariante de CORS', () => {
  it('o POST não pode disparar preflight: o Apps Script não responde OPTIONS', async () => {
    const chamadas = espiaFetch();

    await new ApiService().enviar({ a: 'mural', token: 't', texto: 'oi' });

    const req = chamadas[0];
    expect(req, 'fetch nunca foi chamado — trocaram por HttpClient/XHR?').toBeDefined();
    expect(motivoDoPreflight(req)).toBeNull();
    expect(req.method).toBe('POST');
  });

  it('o corpo vai como string; objeto viraria application/json e preflight', async () => {
    const chamadas = espiaFetch();
    await new ApiService().enviar({ a: 'apagar', token: 't' });
    expect(await chamadas[0].text()).toBeTypeOf('string');
  });

  it('o GET também é simple', async () => {
    const chamadas = espiaFetch({ ok: true, participantes: [], mural: [], recados: [] });
    await new ApiService().carregar();
    expect(motivoDoPreflight(chamadas[0])).toBeNull();
  });
});

describe('ApiService — contrato', () => {
  it('é singleton fornecido na raiz', () => {
    expect(TestBed.inject(ApiService)).toBe(TestBed.inject(ApiService));
  });

  it('manda o honeypot vazio em todo POST', async () => {
    const chamadas = espiaFetch();
    await new ApiService().enviar({ a: 'mural', token: 't', texto: 'oi' });
    expect(JSON.parse(await chamadas[0].text()).website).toBe('');
  });

  it('o corpo não pode sobrescrever o honeypot com lixo', async () => {
    const chamadas = espiaFetch();
    await new ApiService().enviar({ a: 'mural', token: 't', texto: 'oi' });
    const corpo = JSON.parse(await chamadas[0].text());
    expect(corpo).toMatchObject({ a: 'mural', token: 't', texto: 'oi', website: '' });
  });

  it('erro do servidor vira Error com a mensagem amigável', async () => {
    espiaFetch({ ok: false, erro: 'Calma aí, espere uns segundos.' });
    await expect(new ApiService().enviar({ a: 'apagar', token: 't' })).rejects.toThrow(
      'Calma aí, espere uns segundos.',
    );
  });

  it('erro sem mensagem tem texto padrão', async () => {
    espiaFetch({ ok: false });
    await expect(new ApiService().enviar({ a: 'apagar', token: 't' })).rejects.toThrow(
      'Deu erro aqui.',
    );
  });

  it('carregar rejeita resposta sem ok', async () => {
    espiaFetch({ ok: false });
    await expect(new ApiService().carregar()).rejects.toThrow('resposta inválida');
  });

  it('carregar devolve a lista', async () => {
    const lista = { ok: true, participantes: [{ id: 'c1' }], mural: [], recados: [] };
    espiaFetch(lista);
    expect(await new ApiService().carregar()).toEqual(lista);
  });
});
