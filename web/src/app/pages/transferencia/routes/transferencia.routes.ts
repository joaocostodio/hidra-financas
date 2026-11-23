import { Routes } from '@angular/router';

/** /transferencia → "Passar entre contas" (no código: transferência). */
export const TRANSFERENCIA_ROUTES: Routes = [
  {
    path: '',
    title: 'Passar entre contas · Hidra Finanças',
    loadComponent: () => import('../componentes/transferir/transferir').then((m) => m.Transferir),
  },
];
