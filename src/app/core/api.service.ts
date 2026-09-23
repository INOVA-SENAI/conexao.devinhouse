import { Injectable } from '@angular/core';
import { API } from './config';
import type { Corpo, Lista, Resposta } from './api.types';

/**
 * ⚠️ NÃO TROQUE POR HttpClient SEM LER e2e/preflight.spec.ts.
 *
 * O Apps Script NÃO responde ao preflight OPTIONS — não existe doOptions.
 * Body string + nenhum header => o browser aplica `text/plain;charset=UTF-8`,
 * que é CORS-safelisted => a requisição é "simple" => nenhum OPTIONS sai.
 *
 * O HttpClient põe `application/json` quando recebe um objeto, o que dispara
 * preflight e mata TODOS os POSTs em produção — enquanto o GET continua
 * funcionando, então o site parece saudável. HttpTestingController não pega
 * isso: o Content-Type é decidido no FetchBackend, depois do ponto que o mock
 * inspeciona. Por isso aqui é fetch cru, e a trava é o e2e.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  async carregar(): Promise<Lista> {
    const r = await fetch(API);
    const j = (await r.json()) as Lista | { ok: false };
    if (!j.ok) throw new Error('resposta inválida');
    return j as Lista;
  }

  async enviar(corpo: Corpo): Promise<Resposta> {
    // website é o honeypot: vai vazio em todo POST e o servidor descarta o que vier preenchido
    const r = await fetch(API, { method: 'POST', body: JSON.stringify({ website: '', ...corpo }) });
    const j = (await r.json()) as Resposta;
    if (!j.ok) throw new Error(j.erro || 'Deu erro aqui.');
    return j;
  }
}
