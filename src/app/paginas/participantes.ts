import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { UNIDADES } from '../core/config';
import type { Participante } from '../core/api.types';
import { ConexaoStore } from '../estado/conexao.store';
import { Avatar } from '../ui/avatar';
import { Detalhe } from '../ui/detalhe';

const MEDIO = 0.58; // altura da detente média do sheet, em fração da tela

@Component({
  selector: 'app-participantes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, Detalhe],
  templateUrl: './participantes.html',
  styles: [':host{display:block}'],
})
export class Participantes {
  protected readonly store = inject(ConexaoStore);
  protected readonly UNIDADES = UNIDADES;
  protected readonly esqueleto = [0, 1, 2, 3, 4, 5];

  protected readonly selecionada = signal<Participante | null>(null);
  protected readonly telao = signal(false);

  private readonly dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');
  private readonly detalhe = viewChild(Detalhe);
  private origem: HTMLElement | null = null;

  /** "3 de 80" quando há filtro; só o total quando não há. */
  protected readonly contagem = computed(() => {
    const n = this.store.filtrados().length;
    const t = this.store.total();
    return n === t ? String(t) : `${n} de ${t}`;
  });

  constructor() {
    // optional call: jsdom não implementa matchMedia, e sem o guard o componente
    // inteiro fica intestável por causa de um detalhe de layout
    const mq = window.matchMedia?.('(min-width: 80rem)');
    this.telao.set(!!mq?.matches);
    mq?.addEventListener?.('change', (e) => {
      this.telao.set(e.matches);
      this.fecha(); // sheet e painel são molduras diferentes: uma some quando a outra entra
    });
  }

  protected abre(p: Participante, ev: Event): void {
    this.origem = ev.currentTarget as HTMLElement;
    this.selecionada.set(p);
    if (this.telao()) {
      queueMicrotask(() => this.detalhe()?.focaTopo());
      return;
    }
    const d = this.dlg()?.nativeElement;
    if (!d) return;
    // showModal só existe no Safari 15.4+. Sem ele o detalhe ainda aparece,
    // só não prende o foco nem escurece o fundo — melhor que um toque que não
    // faz nada e ainda joga erro no aparelho de alguém no meio do evento
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
    this.abreNaDetente(d);
    queueMicrotask(() => this.detalhe()?.focaTopo());
  }

  protected fecha(): void {
    const d = this.dlg()?.nativeElement;
    if (!d?.hasAttribute('open')) {
      this.aoFechar();
      return;
    }
    if (typeof d.close === 'function') d.close();
    else {
      d.removeAttribute('open');
      this.aoFechar();
    }
  }

  protected aoFechar(): void {
    this.selecionada.set(null);
    const d = this.dlg()?.nativeElement;
    if (d) d.style.transform = '';
    this.origem?.focus();
    this.origem = null;
  }

  protected limpaFiltros(): void {
    this.store.busca.set('');
    this.store.unidade.set('');
  }

  // ---------- arrasto do sheet ----------
  // Se algo aqui falhar, o sheet continua abrindo e fechando por Esc, pelo botão
  // FECHAR e pelo toque no fundo: o gesto é acréscimo, nunca o único caminho.

  private alt = 0;
  private pos = 0;
  private y0 = 0;
  private t0 = 0;
  private base = 0;
  private arrastando = false;

  private aplica(px: number, animar: boolean): void {
    const d = this.dlg()?.nativeElement;
    if (!d) return;
    d.style.transition = animar ? '' : 'none';
    d.style.transform = `translateY(${px}px)`;
    this.pos = px;
    // a altura do corpo rolável deriva da detente: é isso que impede o campo de
    // recado de ficar abaixo da borda da tela no estado médio
    d.style.setProperty('--detente', `${this.alt - px}px`);
  }

  private abreNaDetente(d: HTMLDialogElement): void {
    this.alt = d.getBoundingClientRect().height;
    this.aplica(this.alt, false);
    requestAnimationFrame(() => this.aplica(this.alt - this.medio(), true));
  }

  private medio(): number {
    return Math.min(Math.round(window.innerHeight * MEDIO), this.alt);
  }

  private corpo(): HTMLElement | null {
    return this.dlg()?.nativeElement.querySelector('.sheet__corpo') ?? null;
  }

  protected inicia(e: PointerEvent): void {
    const alvo = e.target as HTMLElement;
    const corpo = this.corpo();
    const noGrabber = !!alvo.closest('.grabber');
    // arrasta pelo grabber sempre; pelo corpo só quando ele já está no topo,
    // senão o gesto de voltar ao começo dos recados fecharia o sheet na cara
    if (!noGrabber && (!corpo || !corpo.contains(alvo) || corpo.scrollTop > 0)) return;
    this.arrastando = true;
    this.y0 = e.clientY;
    this.t0 = e.timeStamp;
    this.base = this.pos;
    this.alt = this.dlg()!.nativeElement.getBoundingClientRect().height;
    this.dlg()!.nativeElement.setPointerCapture(e.pointerId);
  }

  protected move(e: PointerEvent): void {
    if (!this.arrastando) return;
    let dy = e.clientY - this.y0;
    const corpo = this.corpo();
    if (dy < 0 && corpo && corpo.scrollTop > 0) return;
    if (this.base + dy < 0) dy *= 0.55; // resistência acima do topo
    this.aplica(Math.max(0, this.base + dy), false);
  }

  protected solta(e: PointerEvent): void {
    if (!this.arrastando) return;
    this.arrastando = false;
    try {
      this.dlg()!.nativeElement.releasePointerCapture(e.pointerId);
    } catch {
      /* o ponteiro já foi embora */
    }
    // pointercancel: o Safari assumiu o gesto. Trata como soltar parado.
    const v = e.type === 'pointercancel' ? 0 : (e.clientY - this.y0) / Math.max(1, e.timeStamp - this.t0);
    const visivel = this.alt - this.pos;
    if (v > 0.5 || visivel < window.innerHeight * 0.3) {
      this.fecha();
      return;
    }
    const medio = this.medio();
    if (v < -0.5 || visivel > (medio + this.alt) / 2) this.aplica(0, true);
    else this.aplica(this.alt - medio, true);
  }

  /** Teclado do iPhone: ao focar um campo na detente média, sobe para a cheia. */
  protected aoFocar(): void {
    if (!this.telao() && this.pos > 0) this.aplica(0, true);
  }
}
