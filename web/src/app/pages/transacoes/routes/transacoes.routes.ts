import { Routes } from '@angular/router';

/** /transacoes → lista de movimentações (no código: transações). Filtros chegam pela URL (?mes=&contaId=...). */
export const TRANSACOES_ROUTES: Routes = [
  {
    path: '',
    title: 'Movimentações · Hidra Finanças',
    loadComponent: () => import('../componentes/lista-transacoes/lista-transacoes').then((m) => m.ListaTransacoes),
  },
];
