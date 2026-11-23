import { Routes } from '@angular/router';
import { logadoGuard, visitanteGuard } from '../../../common/auth/auth.guards';

const acesso = () => import('../componentes/acesso/acesso').then((m) => m.Acesso);

/** Telas de quem ainda não entrou (/entrar, /cadastro) e o primeiro acesso (/boas-vindas). */
export const ACESSO_ROUTES: Routes = [
  // Entrar e Criar conta são a mesma tela, cada uma numa aba
  { path: 'entrar', title: 'Entrar · Hidra Finanças', canActivate: [visitanteGuard], data: { aba: 'entrar' }, loadComponent: acesso },
  {
    path: 'cadastro',
    title: 'Criar conta · Hidra Finanças',
    canActivate: [visitanteGuard],
    data: { aba: 'cadastro' },
    loadComponent: acesso,
  },
  // Primeiro acesso: logo depois de criar a conta
  {
    path: 'boas-vindas',
    title: 'Boas-vindas · Hidra Finanças',
    canActivate: [logadoGuard],
    loadComponent: () => import('../componentes/boas-vindas/boas-vindas').then((m) => m.BoasVindas),
  },
];
