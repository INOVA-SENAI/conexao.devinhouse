import { Routes } from '@angular/router';
import { MeuCartao } from './paginas/meu-cartao';
import { Mural } from './paginas/mural';
import { Participantes } from './paginas/participantes';

/**
 * As três seções são rotas, e não abas de estado interno, para o Voltar do
 * Android voltar de seção em seção em vez de sair do site — e as pessoas chegam
 * aqui por um link colado no grupo do WhatsApp.
 *
 * Sem lazy loading de propósito: são três telas pequenas e o wi-fi do evento é
 * o pior lugar do mundo para descobrir que falta baixar mais um pedaço.
 */
export const routes: Routes = [
  { path: '', component: Participantes, title: 'Participantes · Conexão DevInHouse' },
  { path: 'mural', component: Mural, title: 'Mural · Conexão DevInHouse' },
  { path: 'eu', component: MeuCartao, title: 'Meu cartão · Conexão DevInHouse' },
  { path: '**', redirectTo: '' },
];
