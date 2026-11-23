import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DadosTransacaoDialog, TransacaoDialog } from '../componentes/transacao-dialog/transacao-dialog';

/**
 * Abre a janela de anotar/editar uma movimentação, de qualquer tela (botão "+ Anotar", início, lista).
 *
 * Depois de salvar, oferece "Anotar outro" e aumenta {@link versao}: as telas que mostram saldos e
 * listas observam esse número e recarregam sozinhas.
 */
@Injectable({ providedIn: 'root' })
export class AnotarService {
  private readonly dialog = inject(MatDialog);
  private readonly aviso = inject(MatSnackBar);

  /** Muda toda vez que uma movimentação é salva ou excluída. */
  readonly versao = signal(0);

  abrir(dados: DadosTransacaoDialog = {}): void {
    this.dialog
      .open<TransacaoDialog, DadosTransacaoDialog, 'salvou' | 'excluiu' | undefined>(TransacaoDialog, {
        data: dados,
        width: '560px',
        maxWidth: '96vw',
        autoFocus: dados.transacao ? 'dialog' : 'first-tabbable',
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (!resultado) {
          return;
        }
        this.versao.update((v) => v + 1);
        if (resultado === 'excluiu') {
          this.aviso.open('Excluído', 'OK', { duration: 3000 });
          return;
        }
        const editando = !!dados.transacao;
        const ref = this.aviso.open(editando ? 'Alteração salva' : 'Anotado!', editando ? 'OK' : 'Anotar outro', {
          duration: 5000,
        });
        if (!editando) {
          // Mesmo tipo (saiu/entrou) do que acabou de anotar
          ref.onAction().subscribe(() => this.abrir({ tipo: dados.tipo, contaId: dados.contaId }));
        }
      });
  }
}
