import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../common/auth/auth.service';
import { mensagemDeErro } from '../../../../common/erros';
import { IconeTransacaoPipe } from '../../../../common/formatos';
import { TipoTransacao, Transacao } from '../../../transacoes/model/transacao.model';
import { AnotarService } from '../../../transacoes/services/anotar.service';
import { Resumo, nomeDoMes, paraMesApi, somarMes } from '../../model/resumo.model';
import { ResumoService } from '../../services/resumo.service';
import { GastosCategoria } from '../gastos-categoria/gastos-categoria';

/**
 * Tela inicial. Em cima, o que a pessoa tem hoje (total e cada conta).
 * Embaixo, o resumo de um mês (‹ novembro ›): o que entrou, o que saiu, quanto sobrou e
 * para onde foi o dinheiro. Por último, as últimas movimentações.
 */
@Component({
  selector: 'app-inicio',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    IconeTransacaoPipe,
    GastosCategoria,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private readonly service = inject(ResumoService);
  private readonly anotar = inject(AnotarService);
  protected readonly auth = inject(AuthService);

  /** Mês que está sendo visto, "2026-11" (começa no atual). */
  protected readonly mes = signal(paraMesApi(new Date()));
  protected readonly mesAtual = paraMesApi(new Date());
  protected readonly nomeMes = computed(() => nomeDoMes(this.mes()));
  protected readonly nomeMesCurto = computed(() => nomeDoMes(this.mes(), false));
  protected readonly ehMesAtual = computed(() => this.mes() === this.mesAtual);

  protected readonly resumo = signal<Resumo | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');

  /** Quanto sobrou no mês: o que entrou − o que saiu. */
  protected readonly resultadoMes = computed(() => {
    const r = this.resumo();
    return r ? r.entradasMes - r.saidasMes : 0;
  });

  constructor() {
    // Carrega ao abrir, ao trocar de mês e sempre que algo for anotado/excluído (de qualquer tela)
    effect(() => {
      const mes = this.mes();
      this.anotar.versao();
      untracked(() => this.carregar(mes));
    });
  }

  protected carregar(mes = this.mes()): void {
    this.carregando.set(true);
    this.service.carregar(mes).subscribe({
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

  /** ‹ mês anterior / próximo mês › (não passa do mês atual). */
  protected trocarMes(quantos: number): void {
    const novo = somarMes(this.mes(), quantos);
    if (novo <= this.mesAtual) {
      this.mes.set(novo);
    }
  }

  protected voltarParaHoje(): void {
    this.mes.set(this.mesAtual);
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
