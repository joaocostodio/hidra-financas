import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { mensagemDeErro } from '../../../../common/erros';
import { Conta } from '../../../contas/model/conta.model';
import { ContaService } from '../../../contas/services/conta.service';
import { paraDataApi } from '../../../transacoes/model/transacao.model';
import { TransacaoService } from '../../../transacoes/services/transacao.service';

/**
 * Transferência entre duas contas do usuário. A API grava uma saída (S) na origem e uma
 * entrada (E) no destino, na mesma transação do banco: ou grava as duas, ou nenhuma.
 */
@Component({
  selector: 'app-transferir',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './transferir.html',
  styleUrl: './transferir.css',
})
export class Transferir implements OnInit {
  private readonly contaService = inject(ContaService);
  private readonly service = inject(TransacaoService);
  private readonly aviso = inject(MatSnackBar);

  protected readonly contas = signal<Conta[]>([]);
  protected readonly carregado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  protected readonly form = new FormGroup({
    origemId: new FormControl<number | null>(null, Validators.required),
    destinoId: new FormControl<number | null>(null, Validators.required),
    valor: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    datatransacao: new FormControl<Date>(new Date(), { nonNullable: true, validators: [Validators.required] }),
    descricao: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly origem = computed(() => this.contas().find((c) => c.id === this.valores().origemId) ?? null);
  protected readonly destino = computed(() => this.contas().find((c) => c.id === this.valores().destinoId) ?? null);
  /** O destino não pode ser a própria origem. */
  protected readonly destinos = computed(() => this.contas().filter((c) => c.id !== this.valores().origemId));

  ngOnInit(): void {
    this.carregarContas();
    // Trocou a origem para a mesma conta do destino: limpa o destino
    this.form.controls.origemId.valueChanges.subscribe((id) => {
      if (id && id === this.form.controls.destinoId.value) {
        this.form.controls.destinoId.setValue(null);
      }
    });
  }

  private carregarContas(): void {
    this.contaService.listar().subscribe({
      next: (lista) => {
        this.contas.set(lista);
        this.carregado.set(true);
      },
      error: (e) => this.erro.set(mensagemDeErro(e)),
    });
  }

  protected transferir(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.erro.set('');
    this.service
      .transferir({
        origemId: v.origemId!,
        destinoId: v.destinoId!,
        valor: Number(v.valor),
        datatransacao: paraDataApi(v.datatransacao),
        descricao: v.descricao.trim(),
      })
      .subscribe({
        next: () => {
          this.aviso.open('Transferência feita', 'OK', { duration: 3000 });
          this.enviando.set(false);
          this.form.reset({ origemId: null, destinoId: null, valor: null, datatransacao: new Date(), descricao: '' });
          this.carregarContas(); // saldos atualizados
        },
        error: (e) => {
          this.erro.set(mensagemDeErro(e));
          this.enviando.set(false);
        },
      });
  }
}
