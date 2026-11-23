import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Lê um valor digitado do jeito brasileiro: "25,90", "1.234,56", "R$ 10", "7.5".
 * Devolve null se não for um número.
 */
export function lerValor(texto: string | number | null | undefined): number | null {
  if (texto === null || texto === undefined) {
    return null;
  }
  if (typeof texto === 'number') {
    return Number.isFinite(texto) ? texto : null;
  }
  let t = texto.replace(/R\$|\s/g, '');
  if (t.includes(',')) {
    // Vírgula é o separador dos centavos; os pontos são de milhar
    t = t.replace(/\./g, '').replace(',', '.');
  }
  if (!/^\d+(\.\d+)?$/.test(t)) {
    return null;
  }
  return Number(t);
}

/** 25.9 → "25,90" (para mostrar no campo ao editar). */
export function escreverValor(valor: number | null | undefined): string {
  return valor === null || valor === undefined
    ? ''
    : valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Validador: valor em reais maior que zero e com no máximo 2 casas (centavos). */
export const valorValido: ValidatorFn = (controle: AbstractControl): ValidationErrors | null => {
  const valor = lerValor(controle.value);
  if (valor === null || valor <= 0) {
    return { valor: true };
  }
  if (Math.round(valor * 100) !== valor * 100) {
    return { centavos: true };
  }
  return null;
};
