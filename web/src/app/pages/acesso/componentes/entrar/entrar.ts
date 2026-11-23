import { Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../common/auth/auth.service';
import { mensagemDeErro } from '../../../../common/erros';
import { Marca } from '../../../../common/marca/marca';

@Component({
  selector: 'app-entrar',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    Marca,
  ],
  templateUrl: './entrar.html',
  styleUrl: './entrar.css',
})
export class Entrar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** ?motivo=expirou quando a sessão venceu (vem da URL). */
  readonly motivo = input<string>();

  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  protected readonly verSenha = signal(false);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, senha } = this.form.getRawValue();
    this.enviando.set(true);
    this.erro.set('');
    this.auth.entrar(email, senha).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.enviando.set(false);
      },
    });
  }
}
