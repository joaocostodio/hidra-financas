/** Um ícone que a pessoa pode escolher para a categoria (nome na fonte Material Symbols + rótulo). */
export interface OpcaoIcone {
  icone: string;
  nome: string;
}

/** Ícones oferecidos ao criar/editar uma categoria. */
export const ICONES_CATEGORIA: OpcaoIcone[] = [
  { icone: 'restaurant', nome: 'Comida' },
  { icone: 'shopping_cart', nome: 'Mercado' },
  { icone: 'local_cafe', nome: 'Café' },
  { icone: 'home', nome: 'Casa' },
  { icone: 'bolt', nome: 'Luz' },
  { icone: 'water_drop', nome: 'Água' },
  { icone: 'wifi', nome: 'Internet' },
  { icone: 'smartphone', nome: 'Celular' },
  { icone: 'directions_car', nome: 'Carro' },
  { icone: 'local_gas_station', nome: 'Combustível' },
  { icone: 'directions_bus', nome: 'Ônibus' },
  { icone: 'medical_services', nome: 'Saúde' },
  { icone: 'fitness_center', nome: 'Academia' },
  { icone: 'school', nome: 'Estudos' },
  { icone: 'celebration', nome: 'Lazer' },
  { icone: 'movie', nome: 'Cinema' },
  { icone: 'flight', nome: 'Viagem' },
  { icone: 'checkroom', nome: 'Roupas' },
  { icone: 'shopping_bag', nome: 'Compras' },
  { icone: 'pets', nome: 'Pets' },
  { icone: 'child_care', nome: 'Filhos' },
  { icone: 'card_giftcard', nome: 'Presentes' },
  { icone: 'subscriptions', nome: 'Assinaturas' },
  { icone: 'receipt_long', nome: 'Contas' },
  { icone: 'work', nome: 'Salário' },
  { icone: 'payments', nome: 'Dinheiro' },
  { icone: 'savings', nome: 'Poupança' },
  { icone: 'trending_up', nome: 'Investimentos' },
  { icone: 'sell', nome: 'Etiqueta' },
  { icone: 'more_horiz', nome: 'Outros' },
];
