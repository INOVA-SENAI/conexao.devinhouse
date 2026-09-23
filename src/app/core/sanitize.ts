/**
 * Cópia em TS de limpa() e handle() do apps-script/Code.gs.
 *
 * A AUTORIDADE CONTINUA SENDO O SERVIDOR. Isto aqui serve só para PRÉ-VISUALIZAR
 * ("vai salvar como: fulano") e nunca deve bloquear o envio: um validador de
 * cliente mais estrito que o servidor recusaria o que o servidor aceitaria.
 * A rede contra divergência é o eco — cadastrar/editar devolvem `campos` com o
 * que de fato foi gravado, e o formulário se corrige com a resposta.
 */

export const MAX = { nome: 60, unidade: 40, bio: 160, texto: 280 } as const;

/** Tira caracteres de controle, corta no tamanho e desarma fórmula do Sheets. */
export const limpa = (v: unknown, max: number): string => {
  const s = String(v ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max);
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
};

/** Aceita URL colada, @arroba ou o handle puro. '' quando não é handle válido. */
export const handle = (v: unknown): string => {
  const h = String(v ?? '')
    .trim()
    .split(/[?#]/)[0]
    .replace(/\/+$/, '')
    .split('/')
    .pop()!
    .replace(/^@/, '');
  return /^[A-Za-z0-9._-]{1,100}$/.test(h) ? h : '';
};

/** Diferenças entre o que a pessoa digitou e o que o servidor gravou, para avisar. */
export const diferencas = <T extends Record<string, string>>(
  enviado: T,
  gravado: Partial<T>,
): { campo: keyof T; de: string; para: string }[] =>
  (Object.keys(gravado) as (keyof T)[])
    .filter((k) => (enviado[k] ?? '') !== (gravado[k] ?? ''))
    .map((k) => ({ campo: k, de: enviado[k] ?? '', para: gravado[k] ?? '' }));
