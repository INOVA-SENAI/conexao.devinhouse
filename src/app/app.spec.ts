import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  const monta = async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture;
  };

  it('monta', async () => {
    const fixture = await monta();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('mostra o nome do evento e o rodapé institucional', async () => {
    const fixture = await monta();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Conexão DevInHouse');
    expect(el.querySelector('footer')?.textContent).toContain('SENAI Lages');
  });

  it('o logo do cabeçalho tem width e height, senão a barra salta quando ele carrega', async () => {
    const fixture = await monta();
    const logo = (fixture.nativeElement as HTMLElement).querySelector('.barra img');
    expect(logo?.getAttribute('width')).toBe('320');
    expect(logo?.getAttribute('height')).toBe('85');
  });
});
