import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../../common/config';
import { Conta, ContaForm } from '../model/conta.model';

@Injectable({ providedIn: 'root' })
export class ContaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API}/contas`;

  listar(): Observable<Conta[]> {
    return this.http.get<Conta[]>(this.url);
  }

  /** Sem id cria (POST), com id atualiza (PUT). */
  salvar(form: ContaForm, id?: number): Observable<Conta> {
    return id ? this.http.put<Conta>(`${this.url}/${id}`, form) : this.http.post<Conta>(this.url, form);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
