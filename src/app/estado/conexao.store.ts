import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ApiService } from '../core/api.service';
import { DEMO, POLL_MS } from '../core/config';
import { guarda } from '../core/guarda';
import { assinatura, filtra, muralRecente, recadosDe } from '../core/lista';
import type { Corpo, Lista, Participante, Resposta } from '../core/api.types';
import { DemoApi } from './demo';

/**
 * Estado único da aplicação, em signals (o app é zoneless: nada de detecção por zona).
 *
 * A regra que este store existe para cumprir: o polling de 30s NÃO pode trocar o
 * conteúdo da tela quando nada mudou. Sem o diff por assinatura, a lista inteira
 * seria recriada duas vezes por minuto, perdendo foco, posição de rolagem e o
 * teclado aberto de quem estava escrevendo.
 */
@Injectable({ providedIn: 'root' })
export class ConexaoStore {
  private readonly api = DEMO ? new DemoApi() : inject(ApiService);
  private readonly doc = inject(DOCUMENT);
  private ultimaAssinatura = '';

  readonly dados = signal<Lista | null>(null); // null = ainda não chegou nada: é o que liga o esqueleto
  readonly offline = signal(false);
  readonly busca = signal('');
  readonly unidade = signal('');
  readonly token = signal<string | null>(guarda.ler('token'));
  readonly meuId = signal<string | null>(guarda.ler('meuId'));
  readonly anuncio = signal('');

  readonly carregando = computed(() => this.dados() === null);
  readonly participantes = computed(() => this.dados()?.participantes ?? []);
  readonly total = computed(() => this.participantes().length);
  readonly filtrados = computed(() => filtra(this.participantes(), this.busca(), this.unidade()));
  readonly mural = computed(() => muralRecente(this.dados()));
  readonly temCartao = computed(() => !!this.token());
  readonly meuCartao = computed<Participante | null>(() => {
    const id = this.meuId();
    return id ? (this.participantes().find((p) => p.id === id) ?? null) : null;
  });

  recadosPara(id: string) {
    return recadosDe(this.dados(), id);
  }

  autor(id: string) {
    return this.participantes().find((p) => p.id === id);
  }

  constructor() {
    // guarda todo texto anunciado ao leitor de tela num ponto só
    effect(() => {
      const t = this.anuncio();
      if (t) setTimeout(() => this.anuncio.set(''), 1500);
    });
  }

  /** Chamado uma vez pelo App: primeira carga + polling só com a aba visível. */
  iniciar(): void {
    void this.carregar();
    setInterval(() => {
      if (this.doc.visibilityState === 'visible') void this.carregar();
    }, POLL_MS);
    this.doc.addEventListener('visibilitychange', () => {
      if (this.doc.visibilityState === 'visible') void this.carregar();
    });
  }

  async carregar(): Promise<void> {
    try {
      const nova = await this.api.carregar();
      this.offline.set(false);
      const sig = assinatura(nova);
      if (sig === this.ultimaAssinatura) return; // nada mudou: não encosta no DOM
      this.ultimaAssinatura = sig;
      this.dados.set(nova);
    } catch {
      // wi-fi de evento cai: avisa numa faixa e deixa na tela o que já estava
      this.offline.set(true);
      if (this.dados() === null) {
        this.dados.set({ ok: true, participantes: [], mural: [], recados: [] });
      }
    }
  }

  /** Envia e recarrega. Deixa o erro subir: quem chamou é que sabe onde mostrar. */
  async enviar(corpo: Corpo): Promise<Resposta> {
    const r = await this.api.enviar(corpo);
    this.ultimaAssinatura = ''; // a próxima carga tem de redesenhar
    if (r.ok) {
      if (r.token) {
        guarda.gravar('token', r.token);
        this.token.set(r.token);
      }
      if (r.id && corpo.a !== 'mural' && corpo.a !== 'recado') {
        guarda.gravar('meuId', r.id);
        this.meuId.set(r.id);
      }
    }
    await this.carregar();
    return r;
  }

  esqueceCartao(): void {
    guarda.limpar();
    this.token.set(null);
    this.meuId.set(null);
  }

  anuncia(texto: string): void {
    this.anuncio.set(texto);
  }
}
