import { describe, expect, it } from 'vitest';
import { diferencas, handle, limpa } from './sanitize';

// Os 11 primeiros casos são os asserts de teste() em apps-script/Code.gs, copiados
// verbatim. Se divergirem, é o TS que está errado — o servidor é a autoridade.
describe('handle', () => {
  it.each([
    ['https://www.linkedin.com/in/fulano/?utm=x', 'fulano'],
    ['instagram.com/beltrano/', 'beltrano'],
    ['@joao', 'joao'],
    ['  sicrano ', 'sicrano'],
    ['javascript:alert(1)', ''],
    ['', ''],
    ['fulano?utm=x', 'fulano'],
    ['a'.repeat(100), 'a'.repeat(100)],
    ['a'.repeat(101), ''],
    ['João', ''], // acento reprova: é ESTE caso que zerava o campo em silêncio
    ['@@joao', ''], // replace(/^@/) tira só um arroba
    ['https://github.com/fulano/repo', 'repo'], // colar URL de repositório grava 'repo'
  ])('handle(%j) === %j', (entrada, esperado) => {
    expect(handle(entrada)).toBe(esperado);
  });

  it.each([null, undefined])('handle(%j) === ""', (entrada) => {
    expect(handle(entrada)).toBe('');
  });
});

describe('limpa', () => {
  it.each([
    ['=1+1', 20, "'=1+1"],
    ['@todos', 20, "'@todos"],
    ['  oi  ', 20, 'oi'],
    ['abcdefghij', 3, 'abc'],
    ['a\u0000b', 20, 'a b'],
    ['  =SUM(A1)  ', 20, "'=SUM(A1)"], // trim roda antes do teste de fórmula
    ['-5', 20, "'-5"],
    ['+1', 20, "'+1"],
    ['=abcdefghij', 3, "'=ab"], // corta antes de prefixar: sai 1 char além do max
  ])('limpa(%j, %i) === %j', (v, max, esperado) => {
    expect(limpa(v, max)).toBe(esperado);
  });

  it.each([null, undefined])('limpa(%j) === ""', (v) => {
    expect(limpa(v, 10)).toBe('');
  });
});

describe('diferencas', () => {
  it('acha o campo que o servidor alterou', () => {
    expect(diferencas({ nome: 'Ana', linkedin: 'João' }, { nome: 'Ana', linkedin: '' })).toEqual([
      { campo: 'linkedin', de: 'João', para: '' },
    ]);
  });

  it('nada mudou, nada a avisar', () => {
    expect(diferencas({ nome: 'Ana' }, { nome: 'Ana' })).toEqual([]);
  });

  it('ignora campo que o servidor não devolveu', () => {
    expect(diferencas({ nome: 'Ana', bio: 'oi' }, { nome: 'Ana' })).toEqual([]);
  });

  it('campo ausente no envio conta como vazio, não como undefined', () => {
    expect(diferencas({} as Record<string, string>, { bio: 'veio do servidor' })).toEqual([
      { campo: 'bio', de: '', para: 'veio do servidor' },
    ]);
  });

  // JSON.parse devolve null, nunca undefined: é assim que um campo zerado chega do servidor
  it('null vindo do servidor conta como vazio', () => {
    const gravado = { bio: null } as unknown as Partial<Record<string, string>>;
    expect(diferencas({ bio: 'tinha texto' }, gravado)).toEqual([
      { campo: 'bio', de: 'tinha texto', para: '' },
    ]);
  });
});
