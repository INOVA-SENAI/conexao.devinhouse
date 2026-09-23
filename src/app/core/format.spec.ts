import { describe, expect, it } from 'vitest';
import { iniciais, linkRede, quando, urlFoto } from './format';

describe('iniciais', () => {
  it.each([
    ['', '?'],
    ['   ', '?'], // BUG do legado: dava '' porque split(/\s+/) de '' devolve ['']
    ['Ana', 'A'],
    ['Ana Beatriz Rocha', 'AB'],
    ['ana beatriz', 'AB'],
    ['Ana  Beatriz', 'AB'],
    ['  Ana Beatriz  ', 'AB'],
    ['Ângela Ítalo', 'ÂÍ'],
    ['🙂 Ana', '🙂A'], // BUG do legado: p[0] partia o surrogate pair e renderizava �
  ])('iniciais(%j) === %j', (entrada, esperado) => {
    expect(iniciais(entrada)).toBe(esperado);
  });

  it.each([null, undefined])('iniciais(%j) === "?"', (entrada) => {
    expect(iniciais(entrada)).toBe('?');
  });
});

describe('urlFoto', () => {
  const p = (avatar = '', github = '') => ({ avatar, github });

  it('sem avatar e sem github devolve vazio', () => {
    expect(urlFoto(p())).toBe('');
  });

  it('sem avatar cai no avatar do GitHub', () => {
    expect(urlFoto(p('', 'fulano'))).toBe('https://github.com/fulano.png?size=200');
  });

  it('codifica o handle do GitHub', () => {
    expect(urlFoto(p('', 'a/b'))).toBe('https://github.com/a%2Fb.png?size=200');
  });

  it.each([
    'https://i.pravatar.cc/200?img=47',
    'http://exemplo.org/foto.jpg',
    'HTTPS://exemplo.org/foto.jpg', // BUG do legado: regex sem /i mandava isto para o Drive
    // foto recém-escolhida, ainda não enviada: é o que a prévia do cartão mostra
    'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
  ])('URL pronta passa direto: %s', (url) => {
    expect(urlFoto(p(url))).toBe(url);
  });

  it('id do Drive vira thumbnail', () => {
    expect(urlFoto(p('1a2B_id'))).toBe('https://drive.google.com/thumbnail?id=1a2B_id&sz=w200');
  });

  it('avatar tem precedência sobre github', () => {
    expect(urlFoto(p('1a2B_id', 'fulano'))).toContain('drive.google.com');
  });

  it('payload perigoso é codificado, nunca vira src executável', () => {
    expect(urlFoto(p('javascript:alert(1)'))).toBe(
      'https://drive.google.com/thumbnail?id=javascript%3Aalert(1)&sz=w200',
    );
  });
});

describe('quando', () => {
  const AGORA = Date.parse('2026-09-23T12:00:00-03:00');
  const atras = (min: number) => new Date(AGORA - min * 60000).toISOString();

  it.each([
    ['lixo', ''],
    [null, ''], // BUG do legado: new Date(null) é epoch, imprimia 01/01/1970
    [undefined, ''],
    ['', ''],
  ])('entrada inválida %j devolve vazio', (iso, esperado) => {
    expect(quando(iso, AGORA)).toBe(esperado);
  });

  it.each([
    [0, 'agora'],
    [0.49, 'agora'], // 29s: Math.round(0.483) === 0
    [0.5, 'há 1 min'], // 30s: Math.round(0.5) === 1 em JS
    [59, 'há 59 min'],
    [60, 'há 1 h'],
    [90, 'há 1 h'], // floor: 1h30 é "há 1 h". O round do legado inflava para "há 2 h"
    [119, 'há 1 h'],
    [120, 'há 2 h'],
    [1439, 'há 23 h'], // BUG do legado: round dizia "há 24 h" a partir de 23h30
  ])('%s min atrás => %j', (min, esperado) => {
    expect(quando(atras(min), AGORA)).toBe(esperado);
  });

  it('data no futuro não imprime minuto negativo', () => {
    expect(quando(atras(-5), AGORA)).toBe('agora');
  });

  it('mais de um dia vira data', () => {
    expect(quando(atras(2 * 1440), AGORA)).toBe('21/09/2026');
  });
});

describe('linkRede', () => {
  it.each([
    ['linkedin', 'fulano', 'https://www.linkedin.com/in/fulano'],
    ['github', 'fulano', 'https://github.com/fulano'],
    ['instagram', 'fulano', 'https://instagram.com/fulano'],
  ] as const)('%s', (rede, h, esperado) => {
    expect(linkRede(rede, h)).toBe(esperado);
  });

  it('NÃO codifica: quem codifica é quem chama, senão % vira %25', () => {
    expect(linkRede('github', 'a/b')).toBe('https://github.com/a/b');
  });
});
