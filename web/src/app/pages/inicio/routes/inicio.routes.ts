import { Routes } from '@angular/router';

/** / → tela inicial: saldo de cada conta e geral, resumo do mês e últimas movimentações. */
export const INICIO_ROUTES: Routes = [
  {
    path: '',
    title: 'Início · Hidra Finanças',
    loadComponent: () => import('../componentes/inicio/inicio').then((m) => m.Inicio),
  },
];
