import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ConexaoStore } from '../estado/conexao.store';

/**
 * Barra fixa do topo. Existe por um motivo só: o logo do SENAI nunca sai da
 * tela e nunca sai do branco, em qualquer posição de rolagem — é a exigência
 * do guia ("nunca coloque o logo sobre um fundo colorido"). A linha de 2px em
 * --blue-mid embaixo dela é a assinatura institucional permanente.
 */
@Component({
  selector: 'app-barra',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:contents}'],
  template: `
    <header class="barra">
      <img src="assets/Logo-SENAI_EP.png" alt="SENAI" width="320" height="85" />
      <p aria-live="polite">{{ texto() }}</p>
    </header>
  `,
})
export class Barra {
  private readonly store = inject(ConexaoStore);
  protected readonly texto = computed(() => {
    if (this.store.carregando()) return 'Carregando…';
    const n = this.store.total();
    return n === 1 ? '1 pessoa' : `${n} pessoas`;
  });
}
