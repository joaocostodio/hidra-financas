import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Confirmacao } from '../../../../common/confirmacao/confirmacao';
import { escreverValor, lerValor, valorValido } from '../../../../common/dinheiro';
import { mensagemDeErro } from '../../../../common/erros';
import { CategoriaDialog } from '../../../categorias/componentes/categoria-dialog/categoria-dialog';
import { Categoria } from '../../../categorias/model/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { Conta } from '../../../contas/model/conta.model';
import { ContaService } from '../../../contas/services/conta.service';
import { TipoTransacao, Transacao, deDataApi, paraDataApi } from '../../model/transacao.model';
import { TransacaoService } from '../../services/transacao.service';

export interface DadosTransacaoDialog {
  /** Editando uma movimentação existente (sem ela, é uma nova). */
  transacao?: Transacao;
  /** Já abrir em "Saiu" (S) ou "Entrou" (E). */
  tipo?: TipoTransacao;
  /** Já abrir com essa conta escolhida (lista filtrada por conta). */
  contaId?: number | null;
}

type Quando = 'hoje' | 'ontem' | 'outro';

/** A última conta usada fica lembrada neste navegador (vem escolhida na próxima vez). */
const CHAVE_ULTIMA_CONTA = 'hidra-financas.ultima-conta';

/**
 * Anotar (ou editar) uma movimentação: o valor em destaque, a categoria com um toque,
 * e conta e data já preenchidas. Fecha com 'salvou' ou 'excluiu'.
 * Transferências só podem ser vistas e excluídas (as duas pontas juntas).
 */
@Component({
  selector: 'app-transacao-dialog',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
  ],
  templateUrl: './transacao-dialog.html',
  styleUrl: './transacao-dialog.css',
})
export class TransacaoDialog implements OnInit {
  private readonly service = inject(TransacaoService);
  private readonly contaService = inject(ContaService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly ref = inject(MatDialogRef<TransacaoDialog, 'salvou' | 'excluiu'>);
  private readonly dialog = inject(MatDialog);
  protected readonly dados = inject<DadosTransacaoDialog>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  protected readonly existente = this.dados.transacao ?? null;
  protected readonly contas = signal<Conta[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly carregado = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');

  protected readonly form = new FormGroup({
    tipo: new FormControl<TipoTransacao>(this.existente?.tipo ?? this.dados.tipo ?? 'S', { nonNullable: true }),
    valor: new FormControl(escreverValor(this.existente?.valor), { nonNullable: true, validators: [valorValido] }),
    categoriaId: new FormControl<number | null>(this.existente?.categoriaId ?? null, Validators.required),
    descricao: new FormControl(this.existente?.descricao ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    contaId: new FormControl<number | null>(this.existente?.contaId ?? this.dados.contaId ?? null, Validators.required),
    quando: new FormControl<Quando>(quandoInicial(this.existente?.datatransacao), { nonNullable: true }),
    data: new FormControl<Date>(this.existente ? deDataApi(this.existente.datatransacao) : new Date(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly saiu = computed(() => this.valores().tipo === 'S');
  protected readonly categoriaEscolhida = computed(() => this.valores().categoriaId);
  protected readonly quando = computed(() => this.valores().quando);

  ngOnInit(): void {
    if (this.existente?.transferencia) {
      return; // transferência: só mostra e permite excluir
    }
    forkJoin([this.contaService.listar(), this.categoriaService.listar()]).subscribe({
      next: ([contas, categorias]) => {
        this.contas.set(contas);
        this.categorias.set(categorias);
        this.escolherContaPadrao(contas);
        this.carregado.set(true);
      },
      error: (e) => this.erro.set(mensagemDeErro(e)),
    });
  }

  protected escolherCategoria(id: number): void {
    this.form.controls.categoriaId.setValue(id);
  }

  /** "+ Nova": cria a categoria ali mesmo e já deixa escolhida. */
  protected novaCategoria(): void {
    this.dialog
      .open(CategoriaDialog, { data: null, width: '500px', maxWidth: '94vw' })
      .afterClosed()
      .subscribe((criada?: Categoria | boolean) => {
        if (!criada || criada === true) {
          return;
        }
        this.categoriaService.listar().subscribe((lista) => {
          this.categorias.set(lista);
          this.escolherCategoria(criada.id);
        });
      });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.controls.categoriaId.invalid) {
        this.erro.set('Escolha com o quê foi (a categoria).');
      }
      return;
    }
    const v = this.form.getRawValue();
    this.salvando.set(true);
    this.erro.set('');
    this.service
      .salvar(
        {
          tipo: v.tipo,
          valor: lerValor(v.valor)!,
          descricao: v.descricao.trim(),
          datatransacao: paraDataApi(dataEscolhida(v.quando, v.data)),
          contaId: v.contaId!,
          categoriaId: v.categoriaId!,
        },
        this.existente?.id,
      )
      .subscribe({
        next: () => {
          lembrarConta(v.contaId!);
          this.ref.close('salvou');
        },
        error: (e) => {
          this.erro.set(mensagemDeErro(e));
          this.salvando.set(false);
        },
      });
  }

  protected excluir(): void {
    const t = this.existente;
    if (!t) {
      return;
    }
    const mensagem = t.transferencia
      ? 'Vai sair das duas contas (de onde saiu e para onde foi).'
      : `"${t.descricao}" será excluída.`;
    this.dialog
      .open(Confirmacao, { data: { titulo: 'Excluir?', mensagem } })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.service.excluir(t.id).subscribe({
          next: () => this.ref.close('excluiu'),
          error: (e) => this.erro.set(mensagemDeErro(e)),
        });
      });
  }

  /** Sem conta escolhida: a última usada; se não houver, a primeira da lista. */
  private escolherContaPadrao(contas: Conta[]): void {
    const controle = this.form.controls.contaId;
    if (controle.value || contas.length === 0) {
      return;
    }
    const ultima = lerUltimaConta();
    controle.setValue(contas.some((c) => c.id === ultima) ? ultima : contas[0].id);
  }
}

function quandoInicial(data?: string): Quando {
  if (!data) {
    return 'hoje';
  }
  if (data === paraDataApi(new Date())) {
    return 'hoje';
  }
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  return data === paraDataApi(ontem) ? 'ontem' : 'outro';
}

function dataEscolhida(quando: Quando, outra: Date): Date {
  const d = new Date();
  if (quando === 'ontem') {
    d.setDate(d.getDate() - 1);
  }
  return quando === 'outro' ? outra : d;
}

function lerUltimaConta(): number | null {
  try {
    const id = Number(localStorage.getItem(CHAVE_ULTIMA_CONTA));
    return id > 0 ? id : null;
  } catch {
    return null;
  }
}

function lembrarConta(id: number): void {
  try {
    localStorage.setItem(CHAVE_ULTIMA_CONTA, String(id));
  } catch {
    // sem armazenamento: só não lembra
  }
}
