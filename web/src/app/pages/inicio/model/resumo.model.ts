import { Conta } from '../../contas/model/conta.model';
import { Transacao } from '../../transacoes/model/transacao.model';

/** Tudo o que a tela inicial mostra (GET /resumo?mes=2026-11). */
export interface Resumo {
  /** Mês do resumo, "2026-11". */
  mes: string;
  /** Saldos de hoje (não dependem do mês). */
  contas: Conta[];
  saldoGeral: number;
  /** O que entrou e saiu no mês (sem contar o dinheiro passado entre contas). */
  entradasMes: number;
  saidasMes: number;
  /** Para onde foi o dinheiro no mês: saídas por categoria, da maior para a menor. */
  gastosPorCategoria: GastoCategoria[];
  ultimas: Transacao[];
}

export interface GastoCategoria {
  categoriaId: number;
  categoria: string;
  icone: string;
  total: number;
  /** Limite por mês da categoria (null = sem limite). */
  limiteMensal: number | null;
}

/** Date → "2026-11". */
export function paraMesApi(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/** "2026-11" + 1 → "2026-12" (ou −1 → "2026-10"). */
export function somarMes(mes: string, quantos: number): string {
  const [ano, m] = mes.split('-').map(Number);
  return paraMesApi(new Date(ano, m - 1 + quantos, 1));
}

/** "2026-11" → "novembro de 2026" (ou só "novembro", sem o ano). */
export function nomeDoMes(mes: string, comAno = true): string {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(ano, m - 1, 1).toLocaleDateString('pt-BR', comAno ? { month: 'long', year: 'numeric' } : { month: 'long' });
}
