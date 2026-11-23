import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../../common/config';
import { Resumo } from '../model/resumo.model';

@Injectable({ providedIn: 'root' })
export class ResumoService {
  private readonly http = inject(HttpClient);

  carregar(): Observable<Resumo> {
    return this.http.get<Resumo>(`${API}/resumo`);
  }
}
