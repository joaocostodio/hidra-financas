import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { mensagemDeErro } from '../../../../common/erros';
import { Conta } from '../../model/conta.model';
import { ContaService } from '../../services/conta.service';
import { ContaDialog } from '../conta-dialog/conta-dialog';

/**
 * Cadastro de contas (spec em docs/specs/contas.md): lista ordenável, nova conta,
 * clicar na linha para detalhar, salvar ou excluir.
 */
@Component({
  selector: 'app-lista-contas',
  imports: [RouterLink, CurrencyPipe, MatTableModule, MatSortModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './lista-contas.html',
  styleUrl: './lista-contas.css',
})
export class ListaContas implements OnInit {
  private readonly service = inject(ContaService);
  private readonly dialog = inject(MatDialog);

  protected readonly contas = signal<Conta[]>([]);
  protected readonly ordem = signal<Sort>({ active: 'descricao', direction: 'asc' });
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  protected readonly colunas = ['descricao', 'saldoInicial', 'saldo', 'acoes'];

  protected readonly ordenadas = computed(() => {
    const { active, direction } = this.ordem();
    const lista = [...this.contas()];
    if (!direction) {
      return lista;
    }
    const sinal = direction === 'asc' ? 1 : -1;
    return lista.sort((a, b) => {
      const x = a[active as keyof Conta];
      const y = b[active as keyof Conta];
      return (typeof x === 'string' ? x.localeCompare(y as string, 'pt-BR') : (x as number) - (y as number)) * sinal;
    });
  });

  protected readonly saldoGeral = computed(() => this.contas().reduce((soma, c) => soma + c.saldo, 0));

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.contas.set(lista);
        this.erro.set('');
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  /** Sem conta: nova. Com conta: detalhar (editar / excluir). */
  protected abrir(conta?: Conta): void {
    this.dialog
      .open(ContaDialog, { data: conta ?? null, width: '460px' })
      .afterClosed()
      .subscribe((mudou) => mudou && this.carregar());
  }
}
