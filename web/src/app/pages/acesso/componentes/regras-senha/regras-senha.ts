import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Mesma regra da API: 8 a 72 caracteres, com letras e números. */
export const SENHA_FORTE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

/** Lista que vai marcando, enquanto a pessoa digita, o que a senha já cumpre. */
@Component({
  selector: 'app-regras-senha',
  imports: [MatIconModule],
  templateUrl: './regras-senha.html',
  styleUrl: './regras-senha.css',
})
export class RegrasSenha {
  readonly senha = input('');

  protected readonly regras = computed(() => {
    const s = this.senha() ?? '';
    return [
      { texto: 'Pelo menos 8 caracteres', ok: s.length >= 8 },
      { texto: 'Uma letra', ok: /[A-Za-z]/.test(s) },
      { texto: 'Um número', ok: /\d/.test(s) },
    ];
  });
}
