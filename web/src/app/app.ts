import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { TemaService } from './common/tema/tema.service';

/** Componente raiz: só tem o `<router-outlet>`, onde o Angular desenha a tela da URL atual. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  constructor() {
    // Os ícones vêm da fonte Material Symbols (carregada no index.html)
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    // Aplica o tema salvo (claro é o padrão)
    inject(TemaService);
  }
}
