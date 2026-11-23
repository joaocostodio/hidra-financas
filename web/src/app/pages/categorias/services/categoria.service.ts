import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../../common/config';
import { Categoria, CategoriaForm } from '../model/categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API}/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.url);
  }

  /** Sem id cria (POST), com id atualiza (PUT). */
  salvar(form: CategoriaForm, id?: number): Observable<Categoria> {
    return id
      ? this.http.put<Categoria>(`${this.url}/${id}`, form)
      : this.http.post<Categoria>(this.url, form);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
