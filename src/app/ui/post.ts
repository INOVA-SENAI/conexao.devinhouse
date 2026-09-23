import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { quando } from '../core/format';
import type { Participante, Post } from '../core/api.types';
import { Avatar } from './avatar';

/**
 * Uma mensagem do mural ou um recado — a anatomia é a mesma.
 *
 * O corpo não é botão: o texto continua selecionável, porque no evento as
 * pessoas colam link de repositório e de sala e precisam copiar.
 */
@Component({
  selector: 'app-post',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar],
  styles: [':host{display:contents}'],
  template: `
    <article class="post" [class.post--novo]="novo()">
      <app-avatar [nome]="autor()?.nome ?? ''" [avatar]="autor()?.avatar ?? ''" [github]="autor()?.github ?? ''" />
      <div>
        <p class="post__cab">
          <span class="post__autor" [class.sumiu]="!autor()">{{
            autor()?.nome ?? 'Participante removido'
          }}</span>
          <time [attr.datetime]="post().em">{{ idade() }}</time>
        </p>
        <p class="post__corpo">{{ post().texto }}</p>
      </div>
    </article>
  `,
})
export class PostItem {
  readonly post = input.required<Post>();
  readonly autor = input<Participante | undefined>(undefined);
  readonly novo = input(false);

  protected readonly idade = computed(() => quando(this.post().em));
}
