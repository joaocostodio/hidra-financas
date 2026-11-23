import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Confirmacao } from '../../../../common/confirmacao/confirmacao';
import { escreverValor, lerValor } from '../../../../common/dinheiro';
import { mensagemDeErro } from '../../../../common/erros';
import { Conta } from '../../model/conta.model';
import { ContaService } from '../../services/conta.service';

/** Nova conta ou detalhe de uma conta (salvar / excluir). Fecha com true quando algo mudou. */
@Component({
  selector: 'app-conta-dialog',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './conta-dialog.html',
  styleUrl: './conta-dialog.css',
})
export class ContaDialog {
  private readonly service = inject(ContaService);
  private readonly ref = inject(MatDialogRef<ContaDialog, boolean>);
  private readonly dialog = inject(MatDialog);
  private readonly aviso = inject(MatSnackBar);
  protected readonly conta = inject<Conta | null>(MAT_DIALOG_DATA);

  protected readonly salvando = signal(false);
  protected readonly erro = signal('');

  protected readonly form = new FormGroup({
    descricao: new FormControl(this.conta?.descricao ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    // Texto, para aceitar o jeito brasileiro ("1.200,50"); vazio vale 0
    saldoInicial: new FormControl(escreverValor(this.conta?.saldoInicial ?? 0), {
      nonNullable: true,
      validators: [(c) => (c.value === '' || lerValor(c.value) !== null ? null : { valor: true })],
    }),
  });

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.salvando.set(true);
    this.erro.set('');
    this.service
      .salvar({ descricao: v.descricao.trim(), saldoInicial: lerValor(v.saldoInicial) ?? 0 }, this.conta?.id)
      .subscribe({
        next: () => {
          this.aviso.open(this.conta ? 'Conta atualizada' : 'Conta cadastrada', 'OK', { duration: 3000 });
          this.ref.close(true);
        },
        error: (e) => {
          this.erro.set(mensagemDeErro(e));
          this.salvando.set(false);
        },
      });
  }

  protected excluir(): void {
    const conta = this.conta;
    if (!conta) {
      return;
    }
    this.dialog
      .open(Confirmacao, { data: { titulo: 'Excluir conta?', mensagem: `A conta "${conta.descricao}" será excluída.` } })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.excluir(conta.id).subscribe({
          next: () => {
            this.aviso.open('Conta excluída', 'OK', { duration: 3000 });
            this.ref.close(true);
          },
          error: (e) => this.erro.set(mensagemDeErro(e)),
        });
      });
  }
}
