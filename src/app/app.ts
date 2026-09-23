import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { APAGAR_EM, DEMO } from './core/config';
import { ConexaoStore } from './estado/conexao.store';
import { Barra } from './ui/barra';
import { Tabbar } from './ui/tabbar';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Barra, Tabbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(ConexaoStore);
  protected readonly DEMO = DEMO;
  protected readonly APAGAR_EM = APAGAR_EM;

  constructor() {
    // blur em barra fixa é o único efeito caro da folha. @supports responde
    // "suporta", não "aguenta": num aparelho fraco a barra vira branco sólido.
    const nav = navigator as Navigator & { deviceMemory?: number };
    if ((nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 2) {
      document.documentElement.dataset['perf'] = 'baixo';
    }
    this.store.iniciar();
  }
}
