/** Cole aqui a URL /exec da implantação do Apps Script. */
export const API = 'COLE_AQUI_A_URL_EXEC_DO_APPS_SCRIPT';

/** Enquanto a API não estiver colada, o site roda de mentirinha. */
export const DEMO = !API.startsWith('http');

export const UNIDADES = [
  'Lages',
  'São Joaquim',
  'Curitibanos',
  'Florianópolis',
  'São José',
  'Joinville',
  'Blumenau',
  'Criciúma',
  'Outra',
] as const;

export const APAGAR_EM = '31/12/2026';

/** De quanto em quanto tempo a lista se atualiza sozinha, com a aba visível. */
export const POLL_MS = 30_000;
