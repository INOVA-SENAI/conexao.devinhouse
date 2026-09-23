import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConexaoStore } from '../estado/conexao.store';
import { Participantes } from './participantes';

/**
 * Fumaça da tela principal. Não substitui olhar no celular, mas trava as coisas
 * que quebraram no arquivo único: linha que não monta, esqueleto que fica preso,
 * filtro que não filtra e estado vazio que aparece antes dos dados chegarem.
 */
describe('Participantes', () => {
  const monta = async () => {
    await TestBed.configureTestingModule({
      imports: [Participantes],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Participantes);
    const store = TestBed.inject(ConexaoStore);
    await store.carregar(); // em DEMO isto devolve os dados de exemplo
    await fixture.whenStable();
    return { fixture, store, el: fixture.nativeElement as HTMLElement };
  };

  it('mostra esqueleto antes dos dados e nunca o texto de lista vazia', async () => {
    await TestBed.configureTestingModule({
      imports: [Participantes],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Participantes);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.skel').length).toBe(6);
    expect(el.textContent).not.toContain('Ainda não tem ninguém');
  });

  it('desenha uma linha por participante, com avatar e nome', async () => {
    const { el, store } = await monta();
    const linhas = el.querySelectorAll('button.linha');
    expect(linhas.length).toBe(store.total());
    expect(linhas[0].querySelector('.nome')?.textContent).toContain('Ana Beatriz');
    expect(linhas[0].querySelector('.av, .avbox')).toBeTruthy();
    expect(el.querySelectorAll('.skel').length).toBe(0);
  });

  it('o aria-label carrega nome e unidade inteiros, porque o nome visível corta', async () => {
    const { el } = await monta();
    const label = el.querySelector('button.linha')?.getAttribute('aria-label');
    expect(label).toBe('Ana Beatriz Rocha, Lages. Ver perfil');
  });

  it('filtra por nome e por unidade', async () => {
    const { fixture, store, el } = await monta();
    store.busca.set('menezes');
    await fixture.whenStable();
    expect(el.querySelectorAll('button.linha').length).toBe(1);

    store.busca.set('');
    store.unidade.set('Lages');
    await fixture.whenStable();
    const nomes = [...el.querySelectorAll('button.linha .nome')].map((n) => n.textContent?.trim());
    expect(nomes).toEqual(['Ana Beatriz Rocha', 'Carlos Menezes', 'Letícia Amorim']);
  });

  it('busca sem resultado mostra o termo e oferece limpar os filtros', async () => {
    const { fixture, store, el } = await monta();
    store.busca.set('zzz');
    await fixture.whenStable();
    expect(el.querySelector('.vazio__t')?.textContent).toContain('zzz');

    (el.querySelector('.vazio .btn-texto') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(store.busca()).toBe('');
    expect(el.querySelectorAll('button.linha').length).toBe(store.total());
  });

  it('tocar numa linha abre o detalhe daquela pessoa', async () => {
    const { fixture, el } = await monta();
    (el.querySelectorAll('button.linha')[1] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(el.querySelector('.sheet__nome')?.textContent).toContain('Carlos Menezes');
  });
});
