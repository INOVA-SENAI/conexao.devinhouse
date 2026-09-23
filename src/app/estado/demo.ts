/**
 * Site de mentirinha, enquanto a URL do Apps Script não estiver colada em config.ts.
 *
 * Serve para três coisas: revisar o layout sem backend, mostrar a prévia para o
 * grupo, e ensaiar o fluxo de cadastro. Nada aqui vai para produção — quando
 * config.API começa com http, DEMO é false e este arquivo não roda.
 */

import type { Corpo, Lista, Participante, Resposta } from '../core/api.types';

const min = (m: number) => new Date(Date.now() - m * 60000).toISOString();

const PESSOAS: Participante[] = [
  {
    id: 'd1',
    nome: 'Ana Beatriz Rocha',
    unidade: 'Lages',
    bio: 'Front-end e acessibilidade. Procuro dupla para o projeto integrador.',
    linkedin: 'exemplo',
    github: 'exemplo',
    instagram: 'exemplo',
    avatar: 'https://i.pravatar.cc/200?img=47',
  },
  {
    id: 'd2',
    nome: 'Carlos Menezes',
    unidade: 'Lages',
    bio: 'Back-end em Node. Curioso com automação de planilhas.',
    linkedin: 'exemplo',
    github: 'exemplo',
    instagram: '',
    avatar: 'https://i.pravatar.cc/200?img=12',
  },
  {
    id: 'd3',
    nome: 'Juliana Prado',
    unidade: 'São Joaquim',
    bio: 'Estágio em dados. Quero trocar ideia sobre SQL.',
    linkedin: '',
    github: '',
    instagram: 'exemplo',
    avatar: '',
  },
  {
    id: 'd4',
    nome: 'Rafael Nunes',
    unidade: 'Florianópolis',
    bio: 'Mobile com Flutter. Topo mentoria para quem está começando.',
    linkedin: 'exemplo',
    github: 'exemplo',
    instagram: '',
    avatar: 'https://i.pravatar.cc/200?img=33',
  },
  {
    id: 'd5',
    nome: 'Marina Schmitt',
    unidade: 'Curitibanos',
    bio: 'Design de interface. Gosto de design system e tipografia.',
    linkedin: 'exemplo',
    github: '',
    instagram: 'exemplo',
    avatar: 'https://i.pravatar.cc/200?img=26',
  },
  {
    id: 'd6',
    nome: 'Pedro Henrique Alves',
    unidade: 'Joinville',
    bio: 'QA e testes automatizados.',
    linkedin: '',
    github: 'exemplo',
    instagram: '',
    avatar: '',
  },
  {
    id: 'd7',
    nome: 'Letícia Amorim',
    unidade: 'Lages',
    bio: 'Primeiro evento de tecnologia. Vim conhecer gente.',
    linkedin: 'exemplo',
    github: '',
    instagram: 'exemplo',
    avatar: 'https://i.pravatar.cc/200?img=5',
  },
];

/** Mesma superfície do ApiService, para o store não precisar saber a diferença. */
export class DemoApi {
  private participantes = [...PESSOAS];
  private mural = [
    { id: 'm1', em: min(90), autor: 'd2', texto: 'Quem for para a oficina das 14h, a gente se encontra na porta do laboratório 3.' },
    { id: 'm2', em: min(45), autor: 'd5', texto: 'Alguém tem carregador de iPhone para emprestar? Estou na mesa do fundo.' },
    { id: 'm3', em: min(10), autor: 'd1', texto: 'Formamos um grupo para o desafio de acessibilidade. Ainda cabe mais gente!' },
  ];
  private recados = [
    { id: 'r1', em: min(50), para: 'd1', autor: 'd4', texto: 'Curti demais sua apresentação. Vamos conversar sobre o projeto?' },
    { id: 'r2', em: min(15), para: 'd1', autor: 'd3', texto: 'Te segui no GitHub!' },
  ];
  private eu = '';

  /** Objeto novo a cada chamada: signal com o mesmo objeto não notifica ninguém. */
  async carregar(): Promise<Lista> {
    return {
      ok: true,
      participantes: [...this.participantes],
      mural: [...this.mural],
      recados: [...this.recados],
    };
  }

  async enviar(c: Corpo): Promise<Resposta> {
    const id = 'demo' + (this.participantes.length + this.mural.length + this.recados.length);
    const agora = new Date().toISOString();

    if (c.a === 'cadastrar') {
      this.eu = id;
      this.participantes.push({
        id,
        nome: c.nome,
        unidade: c.unidade,
        bio: c.bio,
        linkedin: c.linkedin,
        github: c.github,
        instagram: c.instagram,
        avatar: c.foto ? 'data:image/jpeg;base64,' + c.foto : '',
      });
      return { ok: true, id, token: 'demo' };
    }

    const meu = this.participantes.find((p) => p.id === this.eu);
    if (!meu) return { ok: false, erro: 'Não achei seu cartão neste celular.' };

    if (c.a === 'editar') {
      Object.assign(meu, {
        nome: c.nome,
        unidade: c.unidade,
        bio: c.bio,
        linkedin: c.linkedin,
        github: c.github,
        instagram: c.instagram,
        avatar: c.foto ? 'data:image/jpeg;base64,' + c.foto : c.removerFoto ? '' : meu.avatar,
      });
      return { ok: true, id: meu.id };
    }
    if (c.a === 'apagar') {
      this.participantes = this.participantes.filter((p) => p.id !== meu.id);
      this.mural = this.mural.filter((m) => m.autor !== meu.id);
      this.recados = this.recados.filter((r) => r.autor !== meu.id && r.para !== meu.id);
      this.eu = '';
      return { ok: true };
    }
    if (c.a === 'mural') {
      this.mural.push({ id, em: agora, autor: meu.id, texto: c.texto });
      return { ok: true, id };
    }
    this.recados.push({ id, em: agora, para: c.para, autor: meu.id, texto: c.texto });
    return { ok: true, id };
  }
}
