import { Pipe, PipeTransform } from '@angular/core';

/** "Ana Maria Souza" → "AS" (para o avatar). */
@Pipe({ name: 'iniciais' })
export class IniciaisPipe implements PipeTransform {
  transform(nome: string | null | undefined): string {
    const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) {
      return '?';
    }
    const primeira = partes[0][0];
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  }
}

/** Ícone (Material Symbols) de cada categoria; as criadas pelo usuário usam uma etiqueta. */
export function iconeDaCategoria(categoria: string | null | undefined): string {
  switch (categoria) {
    case 'Alimentação':
      return 'restaurant';
    case 'Moradia':
      return 'home';
    case 'Transporte':
      return 'directions_car';
    case 'Saúde':
      return 'medical_services';
    case 'Lazer':
      return 'celebration';
    case 'Salário':
      return 'work';
    case 'Educação':
      return 'school';
    case 'Compras':
      return 'shopping_bag';
    case 'Outros':
      return 'more_horiz';
    case null:
    case undefined:
      return 'swap_horiz'; // transferência (não tem categoria)
    default:
      return 'sell';
  }
}

@Pipe({ name: 'iconeCategoria' })
export class IconeCategoriaPipe implements PipeTransform {
  transform(categoria: string | null | undefined): string {
    return iconeDaCategoria(categoria);
  }
}
