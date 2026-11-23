import { Routes } from '@angular/router';

/** /contas → cadastro de contas (onde o dinheiro fica: Nubank, Carteira...). */
export const CONTAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Contas · Hidra Finanças',
    loadComponent: () => import('../componentes/lista-contas/lista-contas').then((m) => m.ListaContas),
  },
];
