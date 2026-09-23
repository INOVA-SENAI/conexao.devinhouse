import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { iniciais, urlFoto } from '../core/format';

/**
 * As iniciais ficam ATRÁS da foto. Enquanto a imagem não decodifica não existe
 * buraco cinza, e quando ela falha — handle de GitHub digitado errado é comum —
 * nada pisca: a foto só não aparece.
 *
 * display:contents no host para o `.av` ser o item de grade da linha, e não o
 * <app-avatar> em volta dele.
 */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host{display:contents}'],
  template: `
    @if (src()) {
      <span class="avbox">
        <span class="av" aria-hidden="true">{{ ini() }}</span>
        <img
          class="av"
          [class.ok]="carregou()"
          [src]="src()"
          alt=""
          loading="lazy"
          decoding="async"
          (load)="carregou.set(true)"
          (error)="falhou.set(true)"
        />
      </span>
    } @else {
      <span class="av" aria-hidden="true">{{ ini() }}</span>
    }
  `,
})
export class Avatar {
  readonly nome = input('');
  readonly avatar = input('');
  readonly github = input('');

  protected readonly falhou = signal(false);
  protected readonly carregou = signal(false);
  protected readonly ini = computed(() => iniciais(this.nome()));
  protected readonly src = computed(() =>
    this.falhou() ? '' : urlFoto({ avatar: this.avatar(), github: this.github() }),
  );
}
