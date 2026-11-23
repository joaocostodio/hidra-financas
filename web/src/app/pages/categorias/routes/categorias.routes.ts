import { Routes } from '@angular/router';

/** /categorias → cadastro de categorias (com ícone e limite por mês). */
export const CATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Categorias · Hidra Finanças',
    loadComponent: () => import('../componentes/lista-categorias/lista-categorias').then((m) => m.ListaCategorias),
  },
];
