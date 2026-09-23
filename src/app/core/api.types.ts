/** Contrato do Apps Script (apps-script/Code.gs). Mudou lá, muda aqui. */

export const REDES = ['linkedin', 'github', 'instagram'] as const;
export type Rede = (typeof REDES)[number];

export interface Participante {
  id: string;
  nome: string;
  unidade: string;
  bio: string;
  linkedin: string;
  github: string;
  instagram: string;
  /** id do arquivo no Drive, ou URL pronta nos dados de exemplo, ou '' */
  avatar: string;
}

export interface Post {
  id: string;
  em: string;
  autor: string;
  texto: string;
}

export interface Recado extends Post {
  para: string;
}

export interface Lista {
  ok: true;
  participantes: Participante[];
  mural: Post[];
  recados: Recado[];
}

/** Os 6 campos de texto do cartão, do jeito que o servidor normalizou. */
export type CamposCartao = Pick<
  Participante,
  'nome' | 'unidade' | 'bio' | 'linkedin' | 'github' | 'instagram'
>;

export type Corpo =
  | ({ a: 'cadastrar'; token?: string | null; foto?: string | null } & CamposCartao)
  | ({ a: 'editar'; token: string; foto?: string | null; removerFoto?: boolean } & CamposCartao)
  | { a: 'apagar'; token: string }
  | { a: 'mural'; token: string; texto: string }
  | { a: 'recado'; token: string; para: string; texto: string };

export interface RespostaOk {
  ok: true;
  id?: string;
  token?: string;
  /** eco do servidor: o que limpa()/handle() de fato gravaram. */
  campos?: CamposCartao;
}

export interface RespostaErro {
  ok: false;
  erro: string;
}

export type Resposta = RespostaOk | RespostaErro;
