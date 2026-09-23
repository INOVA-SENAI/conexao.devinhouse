import { describe, expect, it } from 'vitest';
import { recorteQuadrado } from './imagem';

// encolhe() em si depende de createImageBitmap + canvas, que jsdom não tem.
// Fica para o e2e em browser real; aqui vai a única parte com lógica.
describe('recorteQuadrado', () => {
  it('paisagem corta as laterais', () => {
    expect(recorteQuadrado(400, 200)).toEqual({ sx: 100, sy: 0, lado: 200 });
  });

  it('retrato corta topo e base', () => {
    expect(recorteQuadrado(200, 400)).toEqual({ sx: 0, sy: 100, lado: 200 });
  });

  it('quadrado não corta nada', () => {
    expect(recorteQuadrado(300, 300)).toEqual({ sx: 0, sy: 0, lado: 300 });
  });

  it('lado ímpar dá offset fracionário, que o canvas aceita', () => {
    expect(recorteQuadrado(101, 100)).toEqual({ sx: 0.5, sy: 0, lado: 100 });
  });
});
