import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../../common/config';
import { Resumo } from '../model/resumo.model';

@Injectable({ providedIn: 'root' })
export class ResumoService {
  private readonly http = inject(HttpClient);

  /** GET /resumo?mes=2026-11 (sem mês: o atual). */
  carregar(mes?: string): Observable<Resumo> {
    const params = mes ? new HttpParams().set('mes', mes) : undefined;
    return this.http.get<Resumo>(`${API}/resumo`, { params });
  }
}
