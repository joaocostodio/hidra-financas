import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Confirmacao } from '../../../../common/confirmacao/confirmacao';
import { escreverValor, lerValor } from '../../../../common/dinheiro';
import { mensagemDeErro } from '../../../../common/erros';
import { ICONES_CATEGORIA } from '../../../../common/icones';
import { Categoria } from '../../model/categoria.model';
import { CategoriaService } from '../../services/categoria.service';

/**
 * Nova categoria ou detalhe de uma categoria (salvar / excluir), com a escolha do ícone.
 * Fecha com true quando algo mudou.
 */
@Component({
  selector: 'app-categoria-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './categoria-dialog.html',
  styleUrl: './categoria-dialog.css',
})
export class CategoriaDialog {
  private readonly service = inject(CategoriaService);
  /** Fecha com a categoria salva, true se excluiu, ou nada se cancelou. */
  private readonly ref = inject(MatDialogRef<CategoriaDialog, Categoria | boolean>);
  private readonly dialog = inject(MatDialog);
  private readonly aviso = inject(MatSnackBar);
  protected readonly categoria = inject<Categoria | null>(MAT_DIALOG_DATA);

  protected readonly icones = ICONES_CATEGORIA;
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');

  protected readonly form = new FormGroup({
    descricao: new FormControl(this.categoria?.descricao ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    icone: new FormControl(this.categoria?.icone ?? 'sell', { nonNullable: true }),
    // Texto, para aceitar o jeito brasileiro ("800,00"); vazio = sem limite
    limite: new FormControl(this.categoria?.limiteMensal ? escreverValor(this.categoria.limiteMensal) : '', {
      nonNullable: true,
      validators: [(c) => (c.value === '' || lerValor(c.value) !== null ? null : { valor: true })],
    }),
  });

  /** Valores do form como signal: a prévia (ícone + nome) atualiza enquanto a pessoa digita/escolhe. */
  protected readonly previa = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected escolher(icone: string): void {
    this.form.controls.icone.setValue(icone);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.salvando.set(true);
    this.erro.set('');
    const limite = lerValor(v.limite);
    this.service.salvar({ descricao: v.descricao.trim(), icone: v.icone, limiteMensal: limite || null }, this.categoria?.id).subscribe({
      next: (salva) => {
        this.aviso.open(this.categoria ? 'Categoria atualizada' : 'Categoria criada', 'OK', { duration: 3000 });
        // Devolve a categoria salva (a janela de anotar já a deixa escolhida)
        this.ref.close(salva);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.salvando.set(false);
      },
    });
  }

  protected excluir(): void {
    const categoria = this.categoria;
    if (!categoria) {
      return;
    }
    this.dialog
      .open(Confirmacao, {
        data: { titulo: 'Excluir categoria?', mensagem: `A categoria "${categoria.descricao}" será excluída.` },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.excluir(categoria.id).subscribe({
          next: () => {
            this.aviso.open('Categoria excluída', 'OK', { duration: 3000 });
            this.ref.close(true);
          },
          error: (e) => this.erro.set(mensagemDeErro(e)),
        });
      });
  }
}
