export interface Categoria {
  id: number;
  descricao: string;
  /** Nome do ícone na fonte Material Symbols (ex.: "restaurant", "pets"). */
  icone: string;
}

export interface CategoriaForm {
  descricao: string;
  icone: string;
}
