import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Tema = 'claro' | 'escuro';

const CHAVE = 'hidra-financas.tema';

/**
 * Tema claro (padrão) ou escuro, escolhido pelo usuário.
 * Fica em <html data-tema="..."> (o styles.css troca as cores) e é lembrado neste navegador.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly html = inject(DOCUMENT).documentElement;

  readonly tema = signal<Tema>(lerTema());

  constructor() {
    effect(() => {
      const tema = this.tema();
      this.html.dataset['tema'] = tema;
      try {
        localStorage.setItem(CHAVE, tema);
      } catch {
        // navegador sem armazenamento: vale só nesta aba
      }
    });
  }

  alternar(): void {
    this.tema.update((t) => (t === 'claro' ? 'escuro' : 'claro'));
  }
}

function lerTema(): Tema {
  try {
    return localStorage.getItem(CHAVE) === 'escuro' ? 'escuro' : 'claro';
  } catch {
    return 'claro';
  }
}
