import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../common/auth/auth.service';
import { mensagemDeErro } from '../../../../common/erros';
import { IconeTransacaoPipe } from '../../../../common/formatos';
import { TipoTransacao, Transacao } from '../../../transacoes/model/transacao.model';
import { AnotarService } from '../../../transacoes/services/anotar.service';
import { Resumo } from '../../model/resumo.model';
import { ResumoService } from '../../services/resumo.service';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, MatProgressBarModule, IconeTransacaoPipe],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private readonly service = inject(ResumoService);
  private readonly anotar = inject(AnotarService);
  protected readonly auth = inject(AuthService);

  protected readonly resumo = signal<Resumo | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');

  /** Nome do mês atual ("novembro"), para os cartões "Entrou em novembro"... */
  protected readonly mes = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  /** Quanto sobrou no mês: o que entrou − o que saiu. */
  protected readonly resultadoMes = computed(() => {
    const r = this.resumo();
    return r ? r.entradasMes - r.saidasMes : 0;
  });

  constructor() {
    // Carrega ao abrir e de novo sempre que algo for anotado/excluído (de qualquer tela)
    effect(() => {
      this.anotar.versao();
      untracked(() => this.carregar());
    });
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

  /** Anotar já com "Saiu" ou "Entrou" escolhido. */
  protected novaTransacao(tipo: TipoTransacao): void {
    this.anotar.abrir({ tipo });
  }

  /** Clique numa das últimas: abre para ver/editar. */
  protected abrir(transacao: Transacao): void {
    this.anotar.abrir({ transacao });
  }
}
