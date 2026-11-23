import { Routes } from '@angular/router';

export const TRANSFERENCIA_ROUTES: Routes = [
  {
    path: '',
    title: 'Transferir · Hidra Finanças',
    loadComponent: () => import('../componentes/transferir/transferir').then((m) => m.Transferir),
  },
];
