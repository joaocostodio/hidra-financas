import { Routes } from '@angular/router';
import { logadoGuard } from './common/auth/auth.guards';

/**
 * Mapa de telas do site. Cada funcionalidade tem o seu arquivo em `pages/<funcionalidade>/routes` e só é
 * baixada quando a pessoa abre a tela (lazy loading: `loadChildren` / `loadComponent`).
 *
 * | URL              | Tela                                              |
 * |------------------|---------------------------------------------------|
 * | /                | Início (saldo por conta e geral, resumo do mês)   |
 * | /transacoes      | Movimentações (filtros, fixos, planilha)          |
 * | /contas          | Contas                                            |
 * | /categorias      | Categorias                                        |
 * | /transferencia   | Passar entre contas                               |
 * | /entrar          | Entrar  · /cadastro: Criar conta · /boas-vindas    |
 */
export const routes: Routes = [
  // Sistema: só logado, dentro da moldura com o menu lateral
  {
    path: '',
    canActivate: [logadoGuard],
    loadComponent: () => import('./common/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', loadChildren: () => import('./pages/inicio/routes/inicio.routes').then((m) => m.INICIO_ROUTES) },
      {
        path: 'transacoes',
        loadChildren: () => import('./pages/transacoes/routes/transacoes.routes').then((m) => m.TRANSACOES_ROUTES),
      },
      { path: 'contas', loadChildren: () => import('./pages/contas/routes/contas.routes').then((m) => m.CONTAS_ROUTES) },
      {
        path: 'categorias',
        loadChildren: () => import('./pages/categorias/routes/categorias.routes').then((m) => m.CATEGORIAS_ROUTES),
      },
      {
        path: 'transferencia',
        loadChildren: () =>
          import('./pages/transferencia/routes/transferencia.routes').then((m) => m.TRANSFERENCIA_ROUTES),
      },
    ],
  },
  // /entrar e /cadastro (só para quem não está logado)
  {
    path: '',
    loadChildren: () => import('./pages/acesso/routes/acesso.routes').then((m) => m.ACESSO_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
