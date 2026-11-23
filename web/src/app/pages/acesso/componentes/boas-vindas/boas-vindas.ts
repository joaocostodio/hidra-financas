import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../common/auth/auth.service';
import { mensagemDeErro } from '../../../../common/erros';
import { Marca } from '../../../../common/marca/marca';
import { BotaoTema } from '../../../../common/tema/botao-tema';
import { ContaService } from '../../../contas/services/conta.service';

/** Lugares mais comuns onde as pessoas guardam dinheiro (viram botões prontos). */
const SUGESTOES = ['Carteira', 'Nubank', 'Itaú', 'Bradesco', 'Banco do Brasil', 'Caixa', 'Inter', 'Santander', 'Poupança'];

type LinhaConta = FormGroup<{ descricao: FormControl<string>; saldo: FormControl<number | null> }>;

/**
 * Primeiro acesso: "Onde você guarda seu dinheiro?".
 * A pessoa marca os lugares (ou digita outro), diz quanto tem em cada um, e o sistema
 * cadastra essas contas com o saldo inicial. Assim ela já começa vendo os saldos.
 */
@Component({
  selector: 'app-boas-vindas',
  imports: [
    ReactiveFormsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    Marca,
    BotaoTema,
  ],
  templateUrl: './boas-vindas.html',
  styleUrl: './boas-vindas.css',
})
export class BoasVindas {
  private readonly contas = inject(ContaService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly sugestoes = SUGESTOES;
  protected readonly salvando = signal(false);
  protected readonly erro = signal('');

  /** Uma linha por lugar escolhido: nome + quanto tem hoje. */
  protected readonly linhas = new FormArray<LinhaConta>([]);
  protected readonly outra = new FormControl('', { nonNullable: true });

  private readonly valores = toSignal(this.linhas.valueChanges, { initialValue: [] });
  protected readonly escolhidas = computed(() => this.valores().map((l) => (l.descricao ?? '').toLowerCase()));

  protected marcada(nome: string): boolean {
    return this.escolhidas().includes(nome.toLowerCase());
  }

  /** Clique num botão pronto: marca ou desmarca (o "x" da lista também desmarca o botão). */
  protected alternar(nome: string): void {
    const i = this.linhas.controls.findIndex((l) => l.controls.descricao.value.toLowerCase() === nome.toLowerCase());
    if (i >= 0) {
      this.linhas.removeAt(i);
    } else {
      this.adicionar(nome);
    }
  }

  /** "Outro lugar": o que a pessoa digitou. */
  protected adicionarOutra(): void {
    const nome = this.outra.value.trim();
    if (nome && !this.marcada(nome)) {
      this.adicionar(nome);
    }
    this.outra.setValue('');
  }

  protected remover(indice: number): void {
    this.linhas.removeAt(indice);
  }

  protected comecar(): void {
    if (this.linhas.length === 0) {
      this.router.navigateByUrl('/');
      return;
    }
    if (this.linhas.invalid) {
      this.linhas.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    this.erro.set('');
    const pedidos = this.linhas.getRawValue().map((l) =>
      this.contas.salvar({ descricao: l.descricao, saldoInicial: Number(l.saldo) || 0 }),
    );
    forkJoin(pedidos).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.salvando.set(false);
      },
    });
  }

  private adicionar(nome: string): void {
    this.linhas.push(
      new FormGroup({
        descricao: new FormControl(nome, { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
        saldo: new FormControl<number | null>(null),
      }),
    );
  }
}
