import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API } from '../config';
import { AuthService } from './auth.service';

/**
 * Toda chamada à API:
 * - leva o cookie de sessão (o navegador manda sozinho, porque é o mesmo endereço do site);
 * - leva o cabeçalho X-Requested-With, que a API exige em toda mudança (proteção contra CSRF).
 * Se a API responder 401 com alguém logado (a sessão de 1 hora venceu), volta para o login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API)) {
    return next(req);
  }
  const auth = inject(AuthService);
  const pedido = req.clone({ setHeaders: { 'X-Requested-With': 'XMLHttpRequest' } });

  return next(pedido).pipe(
    catchError((erro: unknown) => {
      const ehAuth = req.url.startsWith(`${API}/auth/`);
      if (!ehAuth && erro instanceof HttpErrorResponse && erro.status === 401 && auth.usuario()) {
        auth.sair('expirou');
      }
      return throwError(() => erro);
    }),
  );
};
