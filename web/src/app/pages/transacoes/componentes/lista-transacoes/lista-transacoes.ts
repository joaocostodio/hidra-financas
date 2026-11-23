import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Injector, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, forkJoin } from 'rxjs';
import { mensagemDeErro } from '../../../../common/erros';
import { IconeTransacaoPipe } from '../../../../common/formatos';
import { Categoria } from '../../../categorias/model/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { Conta } from '../../../contas/model/conta.model';
import { ContaService } from '../../../contas/services/conta.service';
import { nomeDoMes, paraMesApi, somarMes } from '../../../inicio/model/resumo.model';
import { FiltroTransacoes, TipoTransacao, Transacao } from '../../model/transacao.model';
import { AnotarService } from '../../services/anotar.service';
import { TransacaoService } from '../../services/transacao.service';
import { FixasDialog } from '../fixas-dialog/fixas-dialog';

/** Valor de "mes" na URL que quer dizer "todos os meses". */
const TODOS = 'todos';

/**
 * Movimentações (transações) com filtros por mês, conta, categoria, tipo (entrou/saiu) e texto.
 * Os filtros ficam na URL (?mes=2026-11&contaId=1&categoriaId=2&tipo=S&busca=uber): dá para chegar
 * aqui já filtrado (o início faz isso) e o F5 mantém o filtro. Também baixa a planilha (CSV) e
 * mostra os gastos fixos.
 */
@Component({
  selector: 'app-lista-transacoes',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    IconeTransacaoPipe,
  ],
  templateUrl: './lista-transacoes.html',
  styleUrl: './lista-transacoes.css',
})
export class ListaTransacoes implements OnInit {
  private readonly service = inject(TransacaoService);
  private readonly contaService = inject(ContaService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly anotar = inject(AnotarService);
  private readonly dialog = inject(MatDialog);
  private readonly aviso = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  // Filtros vindos da URL (withComponentInputBinding)
  readonly mes = input<string>();
  readonly contaId = input<string>();
  readonly categoriaId = input<string>();
  readonly tipo = input<string>();
  readonly busca = input<string>();

  protected readonly transacoes = signal<Transacao[]>([]);
  protected readonly contas = signal<Conta[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly carregando = signal(true);
  protected readonly baixando = signal(false);
  protected readonly erro = signal('');

  protected readonly mesAtual = paraMesApi(new Date());
  protected readonly colunas = ['data', 'descricao', 'categoria', 'conta', 'valor'];

  protected readonly filtros = new FormGroup({
    /** "2026-11" ou "" (todos os meses). */
    mes: new FormControl(this.mesAtual, { nonNullable: true }),
    busca: new FormControl('', { nonNullable: true }),
    contaId: new FormControl<number | null>(null),
    categoriaId: new FormControl<number | null>(null),
    tipo: new FormControl<TipoTransacao | ''>('', { nonNullable: true }),
  });

  private readonly valores = toSignal(this.filtros.valueChanges, { initialValue: this.filtros.getRawValue() });
  protected readonly mesEscolhido = computed(() => this.valores().mes ?? '');
  protected readonly nomeMes = computed(() => (this.mesEscolhido() ? nomeDoMes(this.mesEscolhido()) : 'Todos os meses'));
  protected readonly ehMesAtual = computed(() => this.mesEscolhido() === this.mesAtual);
  protected readonly temFiltro = computed(() => {
    const f = this.valores();
    return !!(f.contaId || f.categoriaId || f.tipo || f.busca?.trim());
  });

  /** Totais do que está na tela (respeitam os filtros). */
  protected readonly totalEntradas = computed(() => somar(this.transacoes(), 'E'));
  protected readonly totalSaidas = computed(() => somar(this.transacoes(), 'S'));

  ngOnInit(): void {
    const mes = this.mes();
    this.filtros.setValue(
      {
        mes: mes === TODOS ? '' : /^\d{4}-\d{2}$/.test(mes ?? '') ? mes! : this.mesAtual,
        busca: this.busca() ?? '',
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

    // Mudou um filtro: guarda na URL e busca de novo (espera a pessoa parar de digitar na busca)
    this.filtros.valueChanges.pipe(debounceTime(250)).subscribe(() => {
      const f = this.filtros.getRawValue();
      this.router.navigate([], {
        queryParams: {
          mes: f.mes === this.mesAtual ? null : f.mes || TODOS,
          busca: f.busca.trim() || null,
          contaId: f.contaId || null,
          categoriaId: f.categoriaId || null,
          tipo: f.tipo || null,
        },
        replaceUrl: true,
      });
      this.carregar();
    });

    // Primeira carga e de novo sempre que algo for anotado/excluído (de qualquer tela)
    effect(
      () => {
        this.anotar.versao();
        untracked(() => this.carregar());
      },
      { injector: this.injector },
    );
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.service.listar(this.filtroAtual()).subscribe({
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

  /** ‹ mês anterior / próximo mês ›. Em "todos os meses", volta para o atual. */
  protected trocarMes(quantos: number): void {
    const atual = this.filtros.controls.mes.value || this.mesAtual;
    const novo = somarMes(atual, quantos);
    if (novo <= this.mesAtual) {
      this.filtros.controls.mes.setValue(novo);
    }
  }

  protected todosOsMeses(): void {
    this.filtros.controls.mes.setValue(this.filtros.controls.mes.value ? '' : this.mesAtual);
  }

  protected limparFiltros(): void {
    this.filtros.patchValue({ busca: '', contaId: null, categoriaId: null, tipo: '' });
  }

  /** Baixa o que está na tela como planilha (CSV), para abrir no Excel. */
  protected baixarPlanilha(): void {
    this.baixando.set(true);
    const filtro = this.filtroAtual();
    this.service.baixarPlanilha(filtro).subscribe({
      next: (arquivo) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(arquivo);
        link.download = `movimentacoes${filtro.mes ? '-' + filtro.mes : ''}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        this.baixando.set(false);
      },
      error: (e) => {
        this.aviso.open(mensagemDeErro(e), 'OK', { duration: 4000 });
        this.baixando.set(false);
      },
    });
  }

  /** Lista dos gastos/entradas fixos (que se repetem todo mês). */
  protected verFixas(): void {
    this.dialog
      .open(FixasDialog, { width: '560px', maxWidth: '96vw' })
      .afterClosed()
      .subscribe((mudou) => mudou && this.carregar());
  }

  /** Clique numa linha: detalha (editar / excluir). */
  protected abrir(transacao?: Transacao): void {
    this.anotar.abrir({ transacao, contaId: this.filtros.controls.contaId.value });
  }

  private filtroAtual(): FiltroTransacoes {
    const f = this.filtros.getRawValue();
    return {
      mes: f.mes || null,
      busca: f.busca,
      contaId: f.contaId,
      categoriaId: f.categoriaId,
      tipo: f.tipo || null,
    };
  }
}

function somar(lista: Transacao[], tipo: TipoTransacao): number {
  return lista.filter((t) => t.tipo === tipo).reduce((soma, t) => soma + t.valor, 0);
}

function numero(texto: string | undefined): number | null {
  const n = Number(texto);
  return texto && Number.isInteger(n) && n > 0 ? n : null;
}
