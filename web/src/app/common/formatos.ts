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

/**
 * Ícone de uma transação: o ícone escolhido na categoria (vem da API em "categoriaIcone").
 * Transferência não tem categoria e usa as setas.
 */
@Pipe({ name: 'iconeTransacao' })
export class IconeTransacaoPipe implements PipeTransform {
  transform(categoriaIcone: string | null | undefined): string {
    return categoriaIcone ?? 'swap_horiz';
  }
}