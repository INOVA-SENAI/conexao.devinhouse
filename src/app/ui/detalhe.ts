import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { linkRede, NOME_REDE } from '../core/format';
import { MAX } from '../core/sanitize';
import { REDES, type Participante, type Rede } from '../core/api.types';
import { ConexaoStore } from '../estado/conexao.store';
import { Avatar } from './avatar';
import { PostItem } from './post';

/**
 * Conteúdo do detalhe de uma pessoa. O mesmo componente serve ao sheet do
 * celular e ao painel fixo do telão — quem decide a moldura é a página.
 *
 * O foco inicial vai no nome, nunca no campo de recado: com foco no textarea o
 * teclado do iPhone sobe sozinho e come metade da tela assim que o sheet abre.
 */
@Component({
  selector: 'app-detalhe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, PostItem, RouterLink],
  styles: [':host{display:contents}'],
  template: `
    <div class="sheet__corpo">
      <div class="sheet__topo">
        <app-avatar [nome]="pessoa().nome" [avatar]="pessoa().avatar" [github]="pessoa().github" />
        <h2 class="sheet__nome" tabindex="-1" #nome>{{ pessoa().nome }}</h2>
        @if (pessoa().unidade) {
          <p class="etiqueta">{{ pessoa().unidade }}</p>
        }
      </div>

      @if (pessoa().bio) {
        <p class="sheet__bio">{{ pessoa().bio }}</p>
      }

      @if (links().length) {
        <h3 class="grupo-cab">Redes</h3>
        <div class="grupo">
          @for (l of links(); track l.rede) {
            <a class="rede" [href]="l.url" target="_blank" rel="noopener noreferrer">
              <span class="rot">{{ l.nome }}</span>
              <span class="val">{{ '@' + l.handle }}</span>
            </a>
          }
        </div>
      }

      <h3 class="grupo-cab">Recados <span>{{ recados().length || '' }}</span></h3>
      <div class="grupo">
        @for (r of recados(); track r.id) {
          <app-post [post]="r" [autor]="store.autor(r.autor)" />
        } @empty {
          <div class="vazio">
            <p class="vazio__t">Nenhum recado ainda</p>
            <p class="vazio__s">Seja a primeira pessoa a escrever.</p>
          </div>
        }
      </div>

      @if (store.temCartao()) {
        <form (submit)="enviar($event)">
          <div class="ilha">
            <label class="campo campo--largo">
              <span class="rot rot-linha">
                Deixar um recado
                <span class="contador" [class.perto]="resta() <= 20" aria-hidden="true">{{ resta() }}</span>
              </span>
              <textarea
                [value]="texto()"
                (input)="texto.set($any($event.target).value)"
                [attr.maxlength]="MAX.texto"
                required
                placeholder="Oi! Vamos trocar uma ideia?"
              ></textarea>
            </label>
          </div>
          <div class="acoes">
            <button class="btn" [disabled]="enviando()">
              @if (enviando()) {
                <span class="spin" aria-hidden="true"></span>
              } @else {
                Enviar
              }
            </button>
          </div>
          <p class="erro" role="alert">{{ erro() }}</p>
        </form>
      } @else {
        <div class="ilha">
          <a class="acao-bloco" routerLink="/eu" (click)="fechar.emit()" style="display:block;text-align:center;text-decoration:none">
            Crie seu cartão para deixar recados
          </a>
        </div>
      }
    </div>
  `,
})
export class Detalhe {
  readonly pessoa = input.required<Participante>();
  readonly fechar = output<void>();

  protected readonly store = inject(ConexaoStore);
  protected readonly MAX = MAX;
  protected readonly texto = signal('');
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  private readonly nome = viewChild<ElementRef<HTMLElement>>('nome');

  protected readonly resta = computed(() => MAX.texto - this.texto().length);
  protected readonly recados = computed(() => this.store.recadosPara(this.pessoa().id));
  protected readonly links = computed(() =>
    REDES.filter((r: Rede) => this.pessoa()[r]).map((r: Rede) => ({
      rede: r,
      nome: NOME_REDE[r],
      handle: this.pessoa()[r],
      // a URL vem de modelo fixo: o handle nunca vira URL sozinho
      url: linkRede(r, encodeURIComponent(this.pessoa()[r])),
    })),
  );

  focaTopo(): void {
    this.nome()?.nativeElement.focus();
  }

  protected async enviar(ev: Event): Promise<void> {
    ev.preventDefault();
    const texto = this.texto().trim();
    if (!texto) return;
    this.erro.set('');
    this.enviando.set(true);
    try {
      await this.store.enviar({
        a: 'recado',
        token: this.store.token()!,
        para: this.pessoa().id,
        texto,
      });
      this.texto.set('');
      this.store.anuncia('Recado publicado');
    } catch (e) {
      this.erro.set((e as Error).message);
    }
    this.enviando.set(false);
  }
}
