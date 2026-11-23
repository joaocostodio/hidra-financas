import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DadosConfirmacao {
  titulo: string;
  mensagem: string;
  botao?: string;
}

/** Diálogo "tem certeza?" (antes de excluir). Fecha com true se confirmar. */
@Component({
  selector: 'app-confirmacao',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirmacao.html',
})
export class Confirmacao {
  protected readonly dados = inject<DadosConfirmacao>(MAT_DIALOG_DATA);
}
