import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { mensagemDeErro } from '../../../../common/erros';
import { IconeTransacaoPipe } from '../../../../common/formatos';
import { Categoria } from '../../../categorias/model/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { Conta } from '../../../contas/model/conta.model';
import { ContaService } from '../../../contas/services/conta.service';
import { TipoTransacao, Transacao } from '../../model/transacao.model';
import { TransacaoService } from '../../services/transacao.service';
import { TransacaoDialog } from '../transacao-dialog/transacao-dialog';

/**
 * Lista de transações com filtros por conta, categoria e tipo.
 * Os filtros ficam na URL (?contaId=1&categoriaId=2&tipo=S): dá para chegar aqui já filtrado
 * (o cartão da conta na tela inicial faz isso) e o F5 mantém o filtro.
 */
@Component({
  selector: 'app-lista-transacoes',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    IconeTransacaoPipe,
  ],
  templateUrl: './lista-transacoes.html',
  styleUrl: './lista-transacoes.css',
})
export class ListaTransacoes implements OnInit {
  private readonly service = inject(TransacaoService);
  private readonly contaService = inject(ContaService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  // Filtros vindos da URL (withComponentInputBinding)
  readonly contaId = input<string>();
  readonly categoriaId = input<string>();
  readonly tipo = input<string>();

  protected readonly transacoes = signal<Transacao[]>([]);
  protected readonly contas = signal<Conta[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');

  protected readonly colunas = ['data', 'descricao', 'categoria', 'conta', 'valor'];

  protected readonly filtros = new FormGroup({
    contaId: new FormControl<number | null>(null),
    categoriaId: new FormControl<number | null>(null),
    tipo: new FormControl<TipoTransacao | ''>('', { nonNullable: true }),
  });

  /** Totais do que está na tela (respeitam os filtros). */
  protected readonly totalEntradas = computed(() => somar(this.transacoes(), 'E'));
  protected readonly totalSaidas = computed(() => somar(this.transacoes(), 'S'));

  ngOnInit(): void {
    this.filtros.setValue(
      {
        contaId: numero(this.contaId()),
        categoriaId: numero(this.categoriaId()),
        tipo: this.tipo() === 'E' || this.tipo() === 'S' ? (this.tipo() as TipoTransacao) : '',
      },
      { emitEvent: false },
    );

    forkJoin([this.contaService.listar(), this.categoriaService.listar()]).subscribe({
      next: ([contas, categorias]) => {
        this.contas.set(contas);
        this.categorias.set(categorias);
      },
    });

    this.filtros.valueChanges.subscribe(() => {
      // Guarda o filtro na URL e busca de novo na API
      const f = this.filtros.getRawValue();
      this.router.navigate([], {
        queryParams: { contaId: f.contaId || null, categoriaId: f.categoriaId || null, tipo: f.tipo || null },
        replaceUrl: true,
      });
      this.carregar();
    });

    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    const f = this.filtros.getRawValue();
    this.service.listar({ contaId: f.contaId, categoriaId: f.categoriaId, tipo: f.tipo || null }).subscribe({
      next: (lista) => {
        this.transacoes.set(lista);
        this.erro.set('');
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  protected limparFiltros(): void {
    this.filtros.reset({ contaId: null, categoriaId: null, tipo: '' });
  }

  protected temFiltro(): boolean {
    const f = this.filtros.getRawValue();
    return !!(f.contaId || f.categoriaId || f.tipo);
  }

  /** Clique numa linha: detalha (editar / excluir). */
  protected abrir(transacao?: Transacao): void {
    this.dialog
      .open(TransacaoDialog, {
        data: { transacao, contaId: this.filtros.controls.contaId.value },
        width: '520px',
      })
      .afterClosed()
      .subscribe((mudou) => mudou && this.carregar());
  }
}

function somar(lista: Transacao[], tipo: TipoTransacao): number {
  return lista.filter((t) => t.tipo === tipo).reduce((soma, t) => soma + t.valor, 0);
}

function numero(texto: string | undefined): number | null {
  const n = Number(texto);
  return texto && Number.isInteger(n) && n > 0 ? n : null;
}
