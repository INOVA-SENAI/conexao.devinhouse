import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { APAGAR_EM, UNIDADES } from '../core/config';
import { encolhe } from '../core/imagem';
import { MAX } from '../core/sanitize';
import { ConexaoStore } from '../estado/conexao.store';
import { Avatar } from '../ui/avatar';

@Component({
  selector: 'app-meu-cartao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar],
  templateUrl: './meu-cartao.html',
  styles: [':host{display:block}'],
})
export class MeuCartao {
  protected readonly store = inject(ConexaoStore);
  private readonly router = inject(Router);
  protected readonly UNIDADES = UNIDADES;
  protected readonly APAGAR_EM = APAGAR_EM;
  protected readonly MAX = MAX;

  protected readonly nome = signal('');
  protected readonly unidade = signal('');
  protected readonly bio = signal('');
  protected readonly linkedin = signal('');
  protected readonly github = signal('');
  protected readonly instagram = signal('');

  /** base64 da foto nova, sem o prefixo data: — é o formato que o Code.gs espera. */
  protected readonly foto = signal<string | null>(null);
  protected readonly removerFoto = signal(false);
  protected readonly lendoFoto = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  private readonly arquivo = viewChild<ElementRef<HTMLInputElement>>('arquivo');
  private preenchido = false;

  protected readonly editando = computed(() => !!this.store.meuCartao());
  protected readonly restaBio = computed(() => MAX.bio - this.bio().length);

  /** O que a prévia mostra: foto nova > foto salva > avatar do GitHub > iniciais. */
  protected readonly previaAvatar = computed(() => {
    const nova = this.foto();
    if (nova) return 'data:image/jpeg;base64,' + nova;
    if (this.removerFoto()) return '';
    return this.store.meuCartao()?.avatar ?? '';
  });

  constructor() {
    effect(() => {
      const eu = this.store.meuCartao();
      // preenche uma vez só: depois disso quem manda é o que a pessoa está
      // digitando, e o polling de 30s não pode sobrescrever
      if (!eu || this.preenchido) return;
      this.preenchido = true;
      this.nome.set(eu.nome);
      this.unidade.set(eu.unidade);
      this.bio.set(eu.bio);
      this.linkedin.set(eu.linkedin);
      this.github.set(eu.github);
      this.instagram.set(eu.instagram);
    });
  }

  protected escolherFoto(): void {
    this.arquivo()?.nativeElement.click();
  }

  protected async aoEscolher(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const arq = input.files?.[0];
    if (!arq) return;
    this.erro.set('');
    this.lendoFoto.set(true);
    try {
      // reduzir aqui evita subir 8 MB pelo wi-fi do evento e descarta o EXIF,
      // que carrega a localização de onde a foto foi tirada
      this.foto.set(await encolhe(arq));
      this.removerFoto.set(false);
    } catch {
      this.foto.set(null);
      this.erro.set('Não consegui ler essa imagem. Tente outra foto da galeria.');
    }
    this.lendoFoto.set(false);
    input.value = ''; // permite escolher o mesmo arquivo de novo
  }

  protected tiraFoto(): void {
    this.foto.set(null);
    this.removerFoto.set(true);
  }

  protected async salvar(ev: Event): Promise<void> {
    ev.preventDefault();
    this.erro.set('');
    this.enviando.set(true);
    const campos = {
      nome: this.nome(),
      unidade: this.unidade(),
      bio: this.bio(),
      linkedin: this.linkedin(),
      github: this.github(),
      instagram: this.instagram(),
    };
    try {
      const novo = !this.editando();
      await this.store.enviar(
        novo
          ? { a: 'cadastrar', ...campos, foto: this.foto() }
          : {
              a: 'editar',
              token: this.store.token()!,
              ...campos,
              foto: this.foto(),
              removerFoto: this.removerFoto(),
            },
      );
      this.foto.set(null);
      this.removerFoto.set(false);
      this.store.anuncia(novo ? 'Você entrou na lista' : 'Cartão salvo');
      // o próximo passo óbvio depois de entrar é ver quem mais está aqui
      if (novo) void this.router.navigate(['/']);
    } catch (e) {
      this.erro.set((e as Error).message);
    }
    this.enviando.set(false);
  }

  protected async apagar(): Promise<void> {
    if (!confirm('Apagar seu cartão, sua foto e seus recados? Isso não tem volta.')) return;
    this.erro.set('');
    try {
      await this.store.enviar({ a: 'apagar', token: this.store.token()! });
      this.store.esqueceCartao();
      this.preenchido = false;
      this.nome.set('');
      this.unidade.set('');
      this.bio.set('');
      this.linkedin.set('');
      this.github.set('');
      this.instagram.set('');
      this.foto.set(null);
      this.store.anuncia('Cartão apagado');
    } catch (e) {
      this.erro.set((e as Error).message);
    }
  }
}
