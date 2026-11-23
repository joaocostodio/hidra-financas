import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Confirmacao } from '../../../../common/confirmacao/confirmacao';
import { mensagemDeErro } from '../../../../common/erros';
import { IconeCategoriaPipe } from '../../../../common/formatos';
import { Categoria } from '../../../categorias/model/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { Conta } from '../../../contas/model/conta.model';
import { ContaService } from '../../../contas/services/conta.service';
import { TipoTransacao, Transacao, deDataApi, paraDataApi } from '../../model/transacao.model';
import { TransacaoService } from '../../services/transacao.service';

export interface DadosTransacaoDialog {
  /** Editando uma transação existente (sem ela, é um lançamento novo). */
  transacao?: Transacao;
  /** Tipo já escolhido ao abrir (botões "Receita" / "Despesa"). */
  tipo?: TipoTransacao;
  /** Conta já escolhida (quando a lista está filtrada por conta). */
  contaId?: number | null;
}

/**
 * Lançar, editar ou excluir uma receita/despesa. Fecha com true quando algo mudou.
 * Transferências só podem ser excluídas (as duas pontas juntas).
 */
@Component({
  selector: 'app-transacao-dialog',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    IconeCategoriaPipe,
  ],
  templateUrl: './transacao-dialog.html',
  styleUrl: './transacao-dialog.css',
})
export class TransacaoDialog implements OnInit {
  private readonly service = inject(TransacaoService);
  private readonly contaService = inject(ContaService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly ref = inject(MatDialogRef<TransacaoDialog, boolean>);
  private readonly dialog = inject(MatDialog);
  private readonly aviso = inject(MatSnackBar);
  protected readonly dados = inject<DadosTransacaoDialog>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  protected readonly existente = this.dados.transacao ?? null;
  protected readonly contas = signal<Conta[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');

  protected readonly form = new FormGroup({
    tipo: new FormControl<TipoTransacao>(this.existente?.tipo ?? this.dados.tipo ?? 'S', { nonNullable: true }),
    valor: new FormControl<number | null>(this.existente?.valor ?? null, [Validators.required, Validators.min(0.01)]),
    descricao: new FormControl(this.existente?.descricao ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    datatransacao: new FormControl<Date>(
      this.existente ? deDataApi(this.existente.datatransacao) : new Date(),
      { nonNullable: true, validators: [Validators.required] },
    ),
    contaId: new FormControl<number | null>(this.existente?.contaId ?? this.dados.contaId ?? null, Validators.required),
    categoriaId: new FormControl<number | null>(this.existente?.categoriaId ?? null, Validators.required),
  });

  ngOnInit(): void {
    if (this.existente?.transferencia) {
      return; // transferência: só mostra e permite excluir
    }
    forkJoin([this.contaService.listar(), this.categoriaService.listar()]).subscribe({
      next: ([contas, categorias]) => {
        this.contas.set(contas);
        this.categorias.set(categorias);
        // Só uma conta: já deixa escolhida
        if (!this.form.controls.contaId.value && contas.length === 1) {
          this.form.controls.contaId.setValue(contas[0].id);
        }
      },
      error: (e) => this.erro.set(mensagemDeErro(e)),
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.salvando.set(true);
    this.erro.set('');
    this.service
      .salvar(
        {
          tipo: v.tipo,
          valor: Number(v.valor),
          descricao: v.descricao.trim(),
          datatransacao: paraDataApi(v.datatransacao),
          contaId: v.contaId!,
          categoriaId: v.categoriaId!,
        },
        this.existente?.id,
      )
      .subscribe({
        next: () => {
          this.aviso.open(this.existente ? 'Transação atualizada' : 'Transação lançada', 'OK', { duration: 3000 });
          this.ref.close(true);
        },
        error: (e) => {
          this.erro.set(mensagemDeErro(e));
          this.salvando.set(false);
        },
      });
  }

  protected excluir(): void {
    const t = this.existente;
    if (!t) {
      return;
    }
    const mensagem = t.transferencia
      ? 'As duas partes da transferência (saída e entrada) serão excluídas.'
      : `"${t.descricao}" será excluída.`;
    this.dialog
      .open(Confirmacao, { data: { titulo: 'Excluir transação?', mensagem } })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.excluir(t.id).subscribe({
          next: () => {
            this.aviso.open('Transação excluída', 'OK', { duration: 3000 });
            this.ref.close(true);
          },
          error: (e) => this.erro.set(mensagemDeErro(e)),
        });
      });
  }
}
