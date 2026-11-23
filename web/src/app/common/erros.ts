import { HttpErrorResponse } from '@angular/common/http';

/** Texto amigável para um erro da API (ela responde {"erro": "mensagem"}). */
export function mensagemDeErro(erro: unknown, padrao = 'Não foi possível concluir. Tente de novo.'): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0 || erro.status === 502 || erro.status === 504) {
      return 'Sem conexão com a API. Ela está rodando (mvnw quarkus:dev)?';
    }
    if (typeof erro.error?.erro === 'string') {
      return erro.error.erro;
    }
    if (erro.status === 404) {
      return 'Não encontrado.';
    }
  }
  return padrao;
}
