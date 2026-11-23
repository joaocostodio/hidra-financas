import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../../common/config';
import { Fixa, FiltroTransacoes, Transacao, TransacaoForm, TransferenciaForm } from '../model/transacao.model';

@Injectable({ providedIn: 'root' })
export class TransacaoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API}/transacoes`;

  /** GET /transacoes?contaId=&categoriaId=&tipo=&mes=&busca= (só manda os filtros preenchidos). */
  listar(filtro: FiltroTransacoes = {}): Observable<Transacao[]> {
    return this.http.get<Transacao[]>(this.url, { params: parametros(filtro) });
  }

  /** Os mesmos filtros, como planilha (CSV que o Excel abre). Vem como arquivo para baixar. */
  baixarPlanilha(filtro: FiltroTransacoes = {}): Observable<Blob> {
    return this.http.get(`${this.url}/planilha`, { params: parametros(filtro), responseType: 'blob' });
  }

  /** Sem id lança (POST), com id atualiza (PUT). */
  salvar(form: TransacaoForm, id?: number): Observable<Transacao> {
    return id
      ? this.http.put<Transacao>(`${this.url}/${id}`, form)
      : this.http.post<Transacao>(this.url, form);
  }

  /** Se for transferência, a API exclui as duas pontas. */
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Cria a saída na origem e a entrada no destino. */
  transferir(form: TransferenciaForm): Observable<Transacao[]> {
    return this.http.post<Transacao[]>(`${this.url}/transferencia`, form);
  }

  /** Gastos e entradas fixos (repetem todo mês). */
  listarFixas(): Observable<Fixa[]> {
    return this.http.get<Fixa[]>(`${API}/fixas`);
  }

  /** Para de repetir (o que já foi lançado continua). */
  pararDeRepetir(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/fixas/${id}`);
  }
}

function parametros(filtro: FiltroTransacoes): HttpParams {
  let params = new HttpParams();
  if (filtro.contaId) {
    params = params.set('contaId', filtro.contaId);
  }
  if (filtro.categoriaId) {
    params = params.set('categoriaId', filtro.categoriaId);
  }
  if (filtro.tipo) {
    params = params.set('tipo', filtro.tipo);
  }
  if (filtro.mes) {
    params = params.set('mes', filtro.mes);
  }
  if (filtro.busca?.trim()) {
    params = params.set('busca', filtro.busca.trim());
  }
  return params;
}
