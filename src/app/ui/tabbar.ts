import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Navegação fixa no rodapé, no alcance do polegar.
 *
 * São links de rota, não abas de ARIA: assim o Voltar do Android volta para a
 * seção anterior em vez de sair do site — que é como as pessoas chegam aqui,
 * por um link no grupo do WhatsApp. Por isso `aria-current="page"` e não
 * role="tab", que exigiria setas e roving tabindex sem dar nada em troca.
 *
 * O guia prescreve --blue-dark para a barra do menu; a aba ativa é marcada pelo
 * traço --orange de 3px, porque rótulo branco sobre laranja em 10px não passaria
 * no contraste.
 */
@Component({
  selector: 'app-tabbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  styles: [':host{display:contents}'],
  template: `
    <nav class="tabbar" aria-label="Seções">
      <a
        routerLink="/"
        routerLinkActive
        #r1="routerLinkActive"
        [routerLinkActiveOptions]="{ exact: true }"
        [attr.aria-current]="r1.isActive ? 'page' : null"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="9" cy="8" r="3.25" />
          <path d="M3.5 19c.8-3 3-4.5 5.5-4.5S13.7 16 14.5 19" />
          <path d="M16 8.5a2.75 2.75 0 1 1 2.6 3.4M17 14.6c2 .6 3.3 2 3.8 4.4" />
        </svg>
        <span>Participantes</span>
      </a>
      <a routerLink="/mural" routerLinkActive #r2="routerLinkActive" [attr.aria-current]="r2.isActive ? 'page' : null">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 5.5h16v10.5H9.5L5.5 19.5V16H4z" />
          <path d="M7.5 9h9M7.5 12.5h5.5" />
        </svg>
        <span>Mural</span>
      </a>
      <a routerLink="/eu" routerLinkActive #r3="routerLinkActive" [attr.aria-current]="r3.isActive ? 'page' : null">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <circle cx="9" cy="11" r="2.25" />
          <path d="M5.75 16.5c.5-1.6 1.8-2.4 3.25-2.4s2.75.8 3.25 2.4M15 10.5h3.5M15 13.5h3.5" />
        </svg>
        <span>Meu cartão</span>
      </a>
    </nav>
  `,
})
export class Tabbar {}
