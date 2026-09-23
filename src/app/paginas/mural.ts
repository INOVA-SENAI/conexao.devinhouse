import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MAX } from '../core/sanitize';
import { ConexaoStore } from '../estado/conexao.store';
import { PostItem } from '../ui/post';

@Component({
  selector: 'app-mural',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PostItem],
  templateUrl: './mural.html',
  styles: [':host{display:block}'],
})
export class Mural {
  protected readonly store = inject(ConexaoStore);
  protected readonly MAX = MAX;
  protected readonly esqueleto = [0, 1, 2];

  protected readonly texto = signal('');
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  protected readonly resta = computed(() => MAX.texto - this.texto().length);

  /** ids que já estavam na tela: só o que chega depois disso pisca. */
  private readonly vistos = new Set<string>();
  protected readonly novos = signal<ReadonlySet<string>>(new Set());

  constructor() {
    effect(() => {
      const ids = this.store.mural().map((p) => p.id);
      // na primeira carga nada anima: 40 posts piscando de uma vez é o oposto
      // do que a marcação quer dizer
      const primeira = this.vistos.size === 0;
      const novos = primeira ? [] : ids.filter((i) => !this.vistos.has(i));
      ids.forEach((i) => this.vistos.add(i));
      if (novos.length) this.novos.set(new Set(novos));
    });
  }

  protected async publicar(ev: Event): Promise<void> {
    ev.preventDefault();
    const texto = this.texto().trim();
    if (!texto) return;
    this.erro.set('');
    if (!this.store.temCartao()) {
      this.erro.set('Crie seu cartão antes de publicar.');
      return;
    }
    this.enviando.set(true);
    try {
      await this.store.enviar({ a: 'mural', token: this.store.token()!, texto });
      this.texto.set('');
      this.store.anuncia('Publicado no mural');
    } catch (e) {
      // o texto continua no campo: a pessoa não perde o que escreveu
      this.erro.set((e as Error).message);
    }
    this.enviando.set(false);
  }
}
