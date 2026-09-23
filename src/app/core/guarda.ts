/**
 * localStorage que nunca derruba a página.
 *
 * Em aba anônima, com dados de site bloqueados, ou dentro de iframe de terceiro,
 * o acessor em si joga — não é só devolver null. Como é aqui que mora o token
 * "este cartão é meu", uma exceção não tratada tiraria a pessoa do ar no meio
 * do cadastro.
 */

export type Chave = 'token' | 'meuId';

export const guarda = {
  ler(chave: Chave): string | null {
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  },

  gravar(chave: Chave, valor: string): void {
    try {
      localStorage.setItem(chave, valor);
    } catch {
      /* segue sem lembrar: a pessoa só perde a edição do próprio cartão */
    }
  },

  limpar(): void {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('meuId');
    } catch {
      /* nada a fazer */
    }
  },
};
