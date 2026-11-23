import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Confirmacao } from '../../../../common/confirmacao/confirmacao';
import { mensagemDeErro } from '../../../../common/erros';
import { Categoria } from '../../model/categoria.model';
import { CategoriaService } from '../../services/categoria.service';

/** Nova categoria ou detalhe de uma categoria (salvar / excluir). Fecha com true quando algo mudou. */
@Component({
  selector: 'app-categoria-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './categoria-dialog.html',
  styleUrl: '../../../contas/componentes/conta-dialog/conta-dialog.css',
})
export class CategoriaDialog {
  private readonly service = inject(CategoriaService);
  private readonly ref = inject(MatDialogRef<CategoriaDialog, boolean>);
  private readonly dialog = inject(MatDialog);
  private readonly aviso = inject(MatSnackBar);
  protected readonly categoria = inject<Categoria | null>(MAT_DIALOG_DATA);

  protected readonly salvando = signal(false);
  protected readonly erro = signal('');

  protected readonly form = new FormGroup({
    descricao: new FormControl(this.categoria?.descricao ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
  });

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    this.erro.set('');
    this.service.salvar({ descricao: this.form.getRawValue().descricao.trim() }, this.categoria?.id).subscribe({
      next: () => {
        this.aviso.open(this.categoria ? 'Categoria atualizada' : 'Categoria criada', 'OK', { duration: 3000 });
        this.ref.close(true);
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
