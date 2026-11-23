import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API } from '../config';
import { Cadastro, Usuario } from './usuario.model';

/**
 * Quem está logado.
 *
 * A sessão de verdade é o cookie httpOnly que a API grava no login: o JavaScript do site não lê esse cookie
 * (nem precisa), o navegador manda ele sozinho em toda chamada. Para saber se ainda está logado, o site
 * pergunta à API (GET /auth/eu). Nada de token no localStorage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly usuario = signal<Usuario | null>(null);
  readonly primeiroNome = computed(() => this.usuario()?.nome.split(' ')[0] ?? '');

  /** Já perguntou à API se há sessão? (só pergunta uma vez ao abrir o site) */
  private verificado = false;

  /** Confere com a API se o cookie de sessão ainda vale. */
  verificarSessao(): Observable<boolean> {
    if (this.usuario()) {
      return of(true);
    }
    if (this.verificado) {
      return of(false);
    }
    return this.http.get<Usuario>(`${API}/auth/eu`).pipe(
      tap((u) => this.usuario.set(u)),
      map(() => true),
      catchError(() => of(false)),
      tap(() => (this.verificado = true)),
    );
  }

  entrar(email: string, senha: string): Observable<Usuario> {
    return this.http
      .post<Usuario>(`${API}/auth/login`, { email, senha })
      .pipe(tap((u) => this.usuario.set(u)));
  }

  /** Cria o cadastro e já entra. */
  cadastrar(dados: Cadastro): Observable<Usuario> {
    return this.http
      .post<Usuario>(`${API}/auth/cadastro`, dados)
      .pipe(tap((u) => this.usuario.set(u)));
  }

  /** A API apaga o cookie; o site esquece o usuário e volta para o login. */
  sair(motivo?: 'expirou'): void {
    this.usuario.set(null);
    this.http.post(`${API}/auth/sair`, null).subscribe({ error: () => undefined });
    this.router.navigate(['/entrar'], { queryParams: motivo ? { motivo } : {} });
  }
}
