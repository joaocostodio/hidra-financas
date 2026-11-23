import { CurrencyPipe, PercentPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { GastoCategoria } from '../../model/resumo.model';

/** Situação de uma categoria em relação ao limite do mês. */
type Situacao = 'sem-limite' | 'ok' | 'perto' | 'passou';

interface Barra extends GastoCategoria {
  /** Parte do total de saídas do mês (0..1), mostrada como %. */
  parte: number;
  /** Tamanho da barra em relação ao maior gasto (0..100), para comparar as categorias. */
  largura: number;
  situacao: Situacao;
}

/** A partir de quanto do limite já é "perto" (80%). */
const PERTO_DO_LIMITE = 0.8;

/**
 * "Para onde foi o dinheiro": uma barra horizontal por categoria, da maior para a menor.
 * Gráfico feito só com HTML e CSS. Cada linha mostra ícone, nome, valor e %, então dá para ler
 * sem depender da cor; clicar abre as movimentações daquela categoria no mês.
 * Se a categoria tem limite, mostra "de R$ 800" e avisa (com ícone e texto) quando está perto ou passou.
 */
@Component({
  selector: 'app-gastos-categoria',
  imports: [RouterLink, CurrencyPipe, PercentPipe, MatIconModule, MatTooltipModule],
  templateUrl: './gastos-categoria.html',
  styleUrl: './gastos-categoria.css',
})
export class GastosCategoria {
  readonly gastos = input.required<GastoCategoria[]>();
  /** Nome do mês ("novembro"), para os textos. */
  readonly mes = input('');
  /** Mês no formato da API ("2026-11"), para o link das movimentações. */
  readonly mesApi = input('');

  protected readonly barras = computed<Barra[]>(() => {
    const lista = this.gastos();
    const total = lista.reduce((soma, g) => soma + g.total, 0);
    const maior = Math.max(0, ...lista.map((g) => g.total));
    return lista.map((g) => ({
      ...g,
      parte: total > 0 ? g.total / total : 0,
      largura: maior > 0 ? Math.max(2, (g.total / maior) * 100) : 0,
      situacao: situacao(g),
    }));
  });
}

function situacao(g: GastoCategoria): Situacao {
  if (!g.limiteMensal) {
    return 'sem-limite';
  }
  const uso = g.total / g.limiteMensal;
  return uso > 1 ? 'passou' : uso >= PERTO_DO_LIMITE ? 'perto' : 'ok';
}
