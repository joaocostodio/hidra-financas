import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/**
 * Lê as datas digitadas no formato brasileiro: "05/09/2026" é 5 de setembro (dia/mês/ano).
 * O adaptador padrão do Angular Material usa o Date.parse do navegador, que entende mês/dia/ano
 * (formato americano) e transformaria "05/09" em 9 de maio.
 */
@Injectable()
export class AdaptadorDataBr extends NativeDateAdapter {
  override parse(valor: unknown, formato?: object): Date | null {
    if (typeof valor === 'string') {
      const texto = valor.trim();
      if (!texto) {
        return null;
      }
      // dd/mm/aaaa, dd-mm-aaaa ou dd.mm.aaaa (ano com 2 ou 4 dígitos; sem ano = ano atual)
      const partes = texto.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/);
      if (partes) {
        const dia = Number(partes[1]);
        const mes = Number(partes[2]) - 1;
        let ano = partes[3] ? Number(partes[3]) : new Date().getFullYear();
        if (ano < 100) {
          ano += 2000;
        }
        const data = new Date(ano, mes, dia);
        // Recusa datas que não existem (31/02 viraria 03/03)
        return data.getDate() === dia && data.getMonth() === mes ? data : this.invalid();
      }
    }
    return super.parse(valor, formato);
  }
}
