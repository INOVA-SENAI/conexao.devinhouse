import { describe, expect, it } from 'vitest';
import { assinatura, autorDe, filtra, muralRecente, recadosDe } from './lista';
import type { Lista, Participante, Post, Recado } from './api.types';

const pessoa = (id: string, extra: Partial<Participante> = {}): Participante => ({
  id,
  nome: 'Fulano',
  unidade: 'Lages',
  bio: '',
  linkedin: '',
  github: '',
  instagram: '',
  avatar: '',
  ...extra,
});

const post = (id: string, em: string, autor = 'p1'): Post => ({ id, em, autor, texto: 'oi' });
const recado = (id: string, em: string, para: string): Recado => ({ ...post(id, em), para });

const lista = (over: Partial<Lista> = {}): Lista => ({
  ok: true,
  participantes: [],
  mural: [],
  recados: [],
  ...over,
});

describe('assinatura', () => {
  it('não muda quando o payload é o mesmo', () => {
    const a = lista({ participantes: [pessoa('p1')], mural: [post('m1', '2026-09-23T12:00:00Z')] });
    const b = lista({ participantes: [pessoa('p1')], mural: [post('m1', '2026-09-23T12:00:00Z')] });
    expect(assinatura(a)).toBe(assinatura(b));
  });

  it('muda quando entra gente', () => {
    const antes = lista({ participantes: [pessoa('p1')] });
    const depois = lista({ participantes: [pessoa('p1'), pessoa('p2')] });
    expect(assinatura(antes)).not.toBe(assinatura(depois));
  });

  it('muda quando alguém põe foto, mesmo com os mesmos ids e contagens', () => {
    const antes = lista({ participantes: [pessoa('p1')] });
    const depois = lista({ participantes: [pessoa('p1', { avatar: '1abc' })] });
    expect(assinatura(antes)).not.toBe(assinatura(depois));
  });

  it('muda quando chega post novo no mural e quando chega recado novo', () => {
    const vazio = lista();
    expect(assinatura(lista({ mural: [post('m1', '2026-09-23T12:00:00Z')] }))).not.toBe(
      assinatura(vazio),
    );
    expect(assinatura(lista({ recados: [recado('r1', '2026-09-23T12:00:00Z', 'p1')] }))).not.toBe(
      assinatura(vazio),
    );
  });

  it('usa o timestamp do último item, então editar o texto do último post conta', () => {
    const a = lista({ mural: [post('m1', '2026-09-23T12:00:00Z')] });
    const b = lista({ mural: [post('m1', '2026-09-23T12:05:00Z')] });
    expect(assinatura(a)).not.toBe(assinatura(b));
  });
});

describe('filtra', () => {
  const ps = [
    pessoa('p1', { nome: 'Ana Beatriz', unidade: 'Lages' }),
    pessoa('p2', { nome: 'Carlos Menezes', unidade: 'Joinville' }),
    pessoa('p3', { nome: 'Ângela Souza', unidade: 'Lages' }),
  ];

  it('devolve tudo sem busca e sem unidade', () => {
    expect(filtra(ps, '', '')).toHaveLength(3);
  });

  it('ignora caixa e espaços em volta', () => {
    expect(filtra(ps, '  ANA  ', '').map((p) => p.id)).toEqual(['p1']);
  });

  it('acha por pedaço do meio do nome', () => {
    expect(filtra(ps, 'menezes', '').map((p) => p.id)).toEqual(['p2']);
  });

  it('filtra por unidade', () => {
    expect(filtra(ps, '', 'Lages').map((p) => p.id)).toEqual(['p1', 'p3']);
  });

  it('combina busca e unidade', () => {
    expect(filtra(ps, 'a', 'Joinville').map((p) => p.id)).toEqual(['p2']);
  });

  it('devolve vazio quando nada casa', () => {
    expect(filtra(ps, 'zzz', '')).toEqual([]);
  });
});

describe('recadosDe', () => {
  const l = lista({
    recados: [
      recado('r1', '2026-09-23T12:00:00Z', 'p1'),
      recado('r2', '2026-09-23T12:01:00Z', 'p2'),
      recado('r3', '2026-09-23T12:02:00Z', 'p1'),
    ],
  });

  it('pega só os de quem foi pedido, na ordem da planilha', () => {
    expect(recadosDe(l, 'p1').map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('devolve vazio para quem não tem recado e para lista nula', () => {
    expect(recadosDe(l, 'p9')).toEqual([]);
    expect(recadosDe(null, 'p1')).toEqual([]);
  });
});

describe('muralRecente', () => {
  it('inverte a ordem sem mexer no original', () => {
    const l = lista({ mural: [post('m1', 'a'), post('m2', 'b')] });
    expect(muralRecente(l).map((p) => p.id)).toEqual(['m2', 'm1']);
    expect(l.mural.map((p) => p.id)).toEqual(['m1', 'm2']);
  });

  it('aguenta lista nula', () => {
    expect(muralRecente(null)).toEqual([]);
  });
});

describe('autorDe', () => {
  it('acha quem escreveu', () => {
    expect(autorDe([pessoa('p1', { nome: 'Ana' })], 'p1')?.nome).toBe('Ana');
  });

  it('devolve undefined quando a pessoa apagou o cartão', () => {
    expect(autorDe([pessoa('p1')], 'sumiu')).toBeUndefined();
  });
});
