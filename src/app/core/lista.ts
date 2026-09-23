/** Funções puras sobre a Lista que vem do Apps Script. Sem DOM, sem estado. */

import type { Lista, Participante, Post, Recado } from './api.types';

/**
 * Assinatura leve do payload, para decidir se vale redesenhar.
 *
 * NÃO usar JSON.stringify: o Code.gs monta os objetos a partir das colunas da
 * planilha e a ordem das chaves não é garantida entre execuções, então a lista
 * inteira seria reconstruída a cada poll embaixo do dedo de quem está lendo.
 *
 * O `f` marca quem tem foto: trocar a foto muda o que está na tela sem mudar
 * nenhuma contagem nem nenhum id.
 */
export const assinatura = (l: Lista): string =>
  [
    l.participantes.length,
    l.participantes.map((p) => p.id + (p.avatar ? 'f' : '')).join(','),
    l.mural.length,
    l.mural.at(-1)?.em ?? '',
    l.recados.length,
    l.recados.at(-1)?.em ?? '',
  ].join('|');

/** Busca por nome e filtro por unidade, os dois no próprio navegador. */
export const filtra = (
  participantes: readonly Participante[],
  busca: string,
  unidade: string,
): Participante[] => {
  const q = busca.trim().toLocaleLowerCase('pt-BR');
  return participantes.filter(
    (p) =>
      (!q || p.nome.toLocaleLowerCase('pt-BR').includes(q)) && (!unidade || p.unidade === unidade),
  );
};

/** Recados endereçados a alguém, do mais antigo para o mais novo. */
export const recadosDe = (l: Lista | null, id: string): Recado[] =>
  l ? l.recados.filter((r) => r.para === id) : [];

/** Mural do mais novo para o mais antigo (o Code.gs devolve em ordem de escrita). */
export const muralRecente = (l: Lista | null): Post[] => (l ? [...l.mural].reverse() : []);

/** Quem escreveu. undefined quando a pessoa apagou o cartão e os recados ficaram. */
export const autorDe = (
  participantes: readonly Participante[],
  id: string,
): Participante | undefined => participantes.find((p) => p.id === id);
