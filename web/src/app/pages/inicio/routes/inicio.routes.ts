import { Routes } from '@angular/router';

export const INICIO_ROUTES: Routes = [
  {
    path: '',
    title: 'Início · Hidra Finanças',
    loadComponent: () => import('../componentes/inicio/inicio').then((m) => m.Inicio),
  },
];
