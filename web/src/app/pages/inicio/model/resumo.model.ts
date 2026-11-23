import { Conta } from '../../contas/model/conta.model';
import { Transacao } from '../../transacoes/model/transacao.model';

/** Tudo o que a tela inicial mostra (GET /resumo). */
export interface Resumo {
  contas: Conta[];
  saldoGeral: number;
  /** Receitas e despesas do mês (sem contar transferências). */
  entradasMes: number;
  saidasMes: number;
  ultimas: Transacao[];
}
