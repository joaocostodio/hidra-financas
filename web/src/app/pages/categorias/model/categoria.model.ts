export interface Categoria {
  id: number;
  descricao: string;
  /** Nome do ícone na fonte Material Symbols (ex.: "restaurant", "pets"). */
  icone: string;
  /** Quanto quer gastar no máximo por mês (null = sem limite). */
  limiteMensal: number | null;
}

export interface CategoriaForm {
  descricao: string;
  icone: string;
  limiteMensal: number | null;
}
