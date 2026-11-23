import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/** Telas do sistema: só entra quem está logado; os outros vão para o login. */
export const logadoGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService)
    .verificarSessao()
    .pipe(map((logado) => (logado ? true : router.parseUrl('/entrar'))));
};

/** Telas de entrar e cadastrar: quem já está logado vai direto para o início. */
export const visitanteGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService)
    .verificarSessao()
    .pipe(map((logado) => (logado ? router.parseUrl('/') : true)));
};
