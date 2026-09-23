import { afterEach, describe, expect, it, vi } from 'vitest';
import { guarda } from './guarda';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

/** Em aba anônima o acessor joga — não é só devolver null. */
const quebraLocalStorage = () => {
  const boom = () => {
    throw new DOMException('bloqueado', 'SecurityError');
  };
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom);
};

describe('guarda', () => {
  it('grava e lê', () => {
    guarda.gravar('token', 'abc');
    expect(guarda.ler('token')).toBe('abc');
  });

  it('devolve null para chave que não existe', () => {
    expect(guarda.ler('meuId')).toBeNull();
  });

  it('limpar apaga as duas chaves', () => {
    guarda.gravar('token', 'abc');
    guarda.gravar('meuId', 'c123');
    guarda.limpar();
    expect(guarda.ler('token')).toBeNull();
    expect(guarda.ler('meuId')).toBeNull();
  });

  it('não joga quando o localStorage está bloqueado', () => {
    quebraLocalStorage();
    expect(guarda.ler('token')).toBeNull();
    expect(() => guarda.gravar('token', 'abc')).not.toThrow();
    expect(() => guarda.limpar()).not.toThrow();
  });
});
