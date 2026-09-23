/** Funções puras de apresentação. Sem DOM, sem injeção — é o que a suíte cobre 100%. */

import type { Participante, Rede } from './api.types';

const MODELO: Record<Rede, string> = {
  linkedin: 'https://www.linkedin.com/in/',
  github: 'https://github.com/',
  instagram: 'https://instagram.com/',
};

export const NOME_REDE: Record<Rede, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  instagram: 'Instagram',
};

/**
 * Monta a URL a partir de modelo fixo — o handle NUNCA vira URL sozinho.
 * Não codifica de propósito: quem chama é que aplica encodeURIComponent, senão
 * o '%' de um handle já codificado viraria '%25'.
 */
export const linkRede = (rede: Rede, handle: string): string => MODELO[rede] + handle;

/** Até 2 iniciais em caixa alta. `[...p]` e não `p[0]`: emoji é surrogate pair. */
export const iniciais = (nome: string | null | undefined): string => {
  const partes = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!partes.length) return '?';
  return partes.map((p) => [...p][0]).join('').toUpperCase();
};

/** Foto do Drive > avatar do GitHub > '' (aí quem desenha cai nas iniciais). */
export const urlFoto = (p: Pick<Participante, 'avatar' | 'github'>): string => {
  if (!p.avatar) {
    return p.github ? `https://github.com/${encodeURIComponent(p.github)}.png?size=200` : '';
  }
  // /i porque 'HTTPS://...' também é URL pronta.
  // data: é a foto que a pessoa acabou de escolher, ainda não enviada — é o que
  // faz a prévia do cartão mostrar o rosto antes de existir arquivo no Drive.
  if (/^(https?|data):/i.test(p.avatar)) return p.avatar;
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(p.avatar)}&sz=w200`;
};

/** "agora" / "há N min" / "há N h" / data. '' quando não dá para ler a data. */
export const quando = (iso: string | null | undefined, agora = Date.now()): string => {
  if (!iso) return ''; // sem o guard, new Date(null) vira epoch e imprime 01/01/1970
  const data = new Date(iso);
  const min = Math.round((agora - data.getTime()) / 60000);
  if (!isFinite(min)) return '';
  if (min < 1) return 'agora'; // relógio do celular adiantado dá min negativo; 'agora' é melhor que 'há -5 min'
  if (min < 60) return `há ${min} min`;
  // floor e não round: às 23h40 o round diria "há 24 h", que soa como ontem
  if (min < 1440) return `há ${Math.floor(min / 60)} h`;
  return data.toLocaleDateString('pt-BR');
};
