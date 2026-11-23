/** "E" = entrada (receita), "S" = saída (despesa). Igual ao finance-api da aula. */
export type TipoTransacao = 'E' | 'S';

export interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  /** Data no formato da API: "2026-11-23". */
  datatransacao: string;
  contaId: number;
  conta: string;
  categoriaId: number | null;
  categoria: string | null;
  /** Faz parte de uma transferência (não tem categoria e não se edita). */
  transferencia: boolean;
}

export interface TransacaoForm {
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  datatransacao: string;
  contaId: number;
  categoriaId: number;
}

export interface TransferenciaForm {
  origemId: number;
  destinoId: number;
  valor: number;
  datatransacao: string;
  descricao: string;
}

/** Filtros da lista (todos opcionais). */
export interface FiltroTransacoes {
  contaId?: number | null;
  categoriaId?: number | null;
  tipo?: TipoTransacao | null;
}

/** Date do datepicker → "2026-11-23" (sem fuso horário, para não virar o dia anterior). */
export function paraDataApi(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** "2026-11-23" → Date (meia-noite local). */
export function deDataApi(texto: string): Date {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}
