import { Location } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { AuthService } from '../../../../common/auth/auth.service';
import { mensagemDeErro } from '../../../../common/erros';
import { Marca } from '../../../../common/marca/marca';
import { BotaoTema } from '../../../../common/tema/botao-tema';
import { RegrasSenha, SENHA_FORTE } from '../regras-senha/regras-senha';

type Aba = 'entrar' | 'cadastro';

/**
 * Tela de entrada: abas "Entrar" e "Criar conta" na mesma tela.
 * /entrar e /cadastro abrem a aba certa (a rota manda o "aba" no data).
 */
@Component({
  selector: 'app-acesso',
  imports: [
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    Marca,
    BotaoTema,
    RegrasSenha,
  ],
  templateUrl: './acesso.html',
  styleUrl: './acesso.css',
})
export class Acesso {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Vem do data da rota. */
  readonly aba = input<Aba>('entrar');
  /** ?motivo=expirou quando a sessão venceu. */
  readonly motivo = input<string>();

  /** Aba escolhida pelo clique (antes de clicar, vale a da rota). */
  private readonly abaClicada = signal<Aba | null>(null);
  protected readonly abaAtual = computed(() => this.abaClicada() ?? this.aba());
  protected readonly indice = computed(() => (this.abaAtual() === 'entrar' ? 0 : 1));

  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  protected readonly verSenha = signal(false);

  protected readonly login = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly cadastro = new FormGroup({
    nome: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(SENHA_FORTE)] }),
  });

  /** Senha do cadastro, para a lista de regras ir marcando enquanto digita. */
  protected readonly senhaNova = toSignal(this.cadastro.controls.senha.valueChanges, { initialValue: '' });

  /** Troca de aba sem recarregar a tela; só a URL muda (/entrar ou /cadastro). */
  protected trocarAba(indice: number): void {
    const aba: Aba = indice === 0 ? 'entrar' : 'cadastro';
    this.abaClicada.set(aba);
    this.erro.set('');
    this.location.replaceState(`/${aba}`);
  }

  protected entrar(): void {
    if (this.login.invalid) {
      this.login.markAllAsTouched();
      return;
    }
    const { email, senha } = this.login.getRawValue();
    this.enviar(this.auth.entrar(email, senha), '/');
  }

  protected criarConta(): void {
    if (this.cadastro.invalid) {
      this.cadastro.markAllAsTouched();
      return;
    }
    // Conta nova: vai para o passo a passo (cadastrar onde guarda o dinheiro)
    this.enviar(this.auth.cadastrar(this.cadastro.getRawValue()), '/boas-vindas');
  }

  private enviar(pedido: ReturnType<AuthService['entrar']>, destino: string): void {
    this.enviando.set(true);
    this.erro.set('');
    pedido.subscribe({
      next: () => this.router.navigateByUrl(destino),
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.enviando.set(false);
      },
    });
  }
}
