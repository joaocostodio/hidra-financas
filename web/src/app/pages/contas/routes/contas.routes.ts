import { Routes } from '@angular/router';

export const CONTAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Contas · Hidra Finanças',
    loadComponent: () => import('../componentes/lista-contas/lista-contas').then((m) => m.ListaContas),
  },
];
