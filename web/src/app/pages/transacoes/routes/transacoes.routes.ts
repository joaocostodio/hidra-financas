import { Routes } from '@angular/router';

export const TRANSACOES_ROUTES: Routes = [
  {
    path: '',
    title: 'Transações · Hidra Finanças',
    loadComponent: () => import('../componentes/lista-transacoes/lista-transacoes').then((m) => m.ListaTransacoes),
  },
];
