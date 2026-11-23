import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Confirmacao } from '../../../../common/confirmacao/confirmacao';
import { mensagemDeErro } from '../../../../common/erros';
import { Fixa } from '../../model/transacao.model';
import { TransacaoService } from '../../services/transacao.service';

/**
 * Lista dos gastos e entradas fixos (repetem todo mês), com "Parar de repetir".
 * Fecha com true se alguma coisa mudou.
 */
@Component({
  selector: 'app-fixas-dialog',
  imports: [CurrencyPipe, DatePipe, MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './fixas-dialog.html',
  styleUrl: './fixas-dialog.css',
})
export class FixasDialog implements OnInit {
  private readonly service = inject(TransacaoService);
  private readonly dialog = inject(MatDialog);
  private readonly aviso = inject(MatSnackBar);
  private readonly ref = inject(MatDialogRef<FixasDialog, boolean>);

  protected readonly fixas = signal<Fixa[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  private mudou = false;

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.carregando.set(true);
    this.service.listarFixas().subscribe({
      next: (lista) => {
        this.fixas.set(lista);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  protected pararDeRepetir(fixa: Fixa): void {
    this.dialog
      .open(Confirmacao, {
        data: {
          titulo: 'Parar de repetir?',
          mensagem: `"${fixa.descricao}" não será mais lançado todo mês. O que já foi anotado continua.`,
          botao: 'Parar de repetir',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.pararDeRepetir(fixa.id).subscribe({
          next: () => {
            this.mudou = true;
            this.aviso.open('Não vai mais repetir', 'OK', { duration: 3000 });
            this.carregar();
          },
          error: (e) => this.erro.set(mensagemDeErro(e)),
        });
      });
  }

  protected fechar(): void {
    this.ref.close(this.mudou);
  }
}
