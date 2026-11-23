import { Routes } from '@angular/router';
import { visitanteGuard } from '../../../common/auth/auth.guards';

export const ACESSO_ROUTES: Routes = [
  {
    path: 'entrar',
    title: 'Entrar · Hidra Finanças',
    canActivate: [visitanteGuard],
    loadComponent: () => import('../componentes/entrar/entrar').then((m) => m.Entrar),
  },
  {
    path: 'cadastro',
    title: 'Criar cadastro · Hidra Finanças',
    canActivate: [visitanteGuard],
    loadComponent: () => import('../componentes/cadastro/cadastro').then((m) => m.Cadastro),
  },
];
