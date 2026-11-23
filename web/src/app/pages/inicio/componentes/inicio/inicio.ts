import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../common/auth/auth.service';
import { mensagemDeErro } from '../../../../common/erros';
import { IconeTransacaoPipe } from '../../../../common/formatos';
import { TransacaoDialog } from '../../../transacoes/componentes/transacao-dialog/transacao-dialog';
import { Resumo } from '../../model/resumo.model';
import { ResumoService } from '../../services/resumo.service';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, MatProgressBarModule, IconeTransacaoPipe],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  private readonly service = inject(ResumoService);
  private readonly dialog = inject(MatDialog);
  protected readonly auth = inject(AuthService);

  protected readonly resumo = signal<Resumo | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');

  /** Resultado do mês: receitas − despesas. */
  protected readonly resultadoMes = computed(() => {
    const r = this.resumo();
    return r ? r.entradasMes - r.saidasMes : 0;
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.service.carregar().subscribe({
      next: (r) => {
        this.resumo.set(r);
        this.erro.set('');
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  /** Lança uma receita ou despesa direto da tela inicial. */
  protected novaTransacao(tipo: 'E' | 'S'): void {
    this.dialog
      .open(TransacaoDialog, { data: { tipo }, width: '520px' })
      .afterClosed()
      .subscribe((mudou) => mudou && this.carregar());
  }
}
