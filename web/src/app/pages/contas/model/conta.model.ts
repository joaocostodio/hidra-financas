export interface Conta {
  id: number;
  descricao: string;
  saldoInicial: number;
  /** Saldo atual = saldo inicial + entradas − saídas (calculado pela API). */
  saldo: number;
}

export interface ContaForm {
  descricao: string;
  saldoInicial: number;
}
